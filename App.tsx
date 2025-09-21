import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { MessageInput } from './components/MessageInput';
import { Header } from './components/Header';
import { ContactModal } from './components/ContactModal';
import { UserVideo } from './components/UserVideo';
import { ImmersiveMode } from './components/ImmersiveMode';
import { useTheme } from './hooks/useTheme';
import { useConversations } from './hooks/useConversations';
import { useVoiceSettings } from './hooks/useVoiceSettings';
import { Message, Conversation } from './types';
import { streamChatResponse } from './services/geminiService';
import { speakText, cancelSpeech } from './services/ttsService';
import { fileToBase64 } from './utils/fileUtils';
import { exportConversationToJson, exportConversationToMarkdown } from './utils/exportUtils';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AlertTriangle } from './components/Icons';

const model = 'gemini-2.5-flash';

const AppContent: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const { apiKey, setApiKey, voiceId, setVoiceId } = useVoiceSettings();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId,
    addConversation,
    updateConversation,
    deleteConversation,
   } = useConversations();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isContactModalOpen, setContactModalOpen] = useState(false);
  const [isUserVideoOpen, setUserVideoOpen] = useState(false);
  const [isImmersiveModeActive, setImmersiveModeActive] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [immersiveText, setImmersiveText] = useState<string>('');
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  
  const { addToast } = useToast();

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);
  
  const handleNewChat = () => {
    addConversation(model);
  };
  
  useEffect(() => {
    if (activeConversation && activeConversation.messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'initial-1',
        text: "Well, hello there. I'm Jarvis. It's a pleasure to meet you. What's on your mind?",
        sender: 'ai'
      };
      if (activeConversationId) {
        updateConversation(activeConversationId, convo => ({...convo, messages: [welcomeMessage]}));
      }
    }
  }, [activeConversation, activeConversationId, updateConversation]);
  
  const handleInterrupt = useCallback(() => {
    cancelSpeech();
    setSpeechQueue([]);
    setIsSpeaking(false);
  }, []);

  // Effect to handle playing audio from the speech queue
  useEffect(() => {
    if (!isSpeaking && speechQueue.length > 0) {
      setIsSpeaking(true);
      const nextSentence = speechQueue[0];
      speakText(nextSentence, () => {
        // This callback is called when the utterance finishes
        setSpeechQueue(q => q.slice(1));
        setIsSpeaking(false);
      }, { apiKey, voiceId });
    } else if (speechQueue.length === 0 && isSpeaking) {
        // If queue becomes empty, ensure we are not in speaking state.
        // This can happen if interrupt is called.
        setIsSpeaking(false);
    }
  }, [speechQueue, isSpeaking, apiKey, voiceId]);

  const handleSend = async (text: string, imageFile?: File) => {
    if (!activeConversationId) return;
    setError(null);
    if (isImmersiveModeActive) {
      handleInterrupt();
      setImmersiveText('');
    }
    
    let image, mimeType;
    if (imageFile) {
        [image, mimeType] = await fileToBase64(imageFile);
    }
    
    const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', image, mimeType };
    
    const history = activeConversation?.messages ?? [];
    
    updateConversation(activeConversationId, convo => ({
        ...convo, 
        messages: [...convo.messages, userMessage],
        title: (convo.messages.length === 0 && text) ? text.substring(0, 30) : convo.title
    }));
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const stream = await streamChatResponse(history, text, activeConversation?.model || model, { mimeType: mimeType!, data: image! });
      const aiResponseId = `${Date.now()}-ai-stream`;
      
      updateConversation(activeConversationId, convo => ({
          ...convo, messages: [...convo.messages, { id: aiResponseId, text: '', sender: 'ai' }]
      }));

      let fullResponseText = '';
      let sentenceBuffer = '';
      
      const speakSentence = (sentence: string) => {
        if (!sentence.trim()) return;
        setImmersiveText(prev => (prev + ' ' + sentence.trim()).trim());
        setSpeechQueue(prev => [...prev, sentence.trim()]);
      };

      for await (const chunk of stream) {
        if (controller.signal.aborted) {
            addToast("Generation stopped", "info");
            break;
        }
        fullResponseText += chunk.text;

        if (isImmersiveModeActive) {
            sentenceBuffer += chunk.text;
            const sentences = sentenceBuffer.split(/(?<=[.!?])\s*/);
            if (sentences.length > 1) {
                for (let i = 0; i < sentences.length - 1; i++) {
                    speakSentence(sentences[i]);
                }
                sentenceBuffer = sentences[sentences.length - 1];
            }
        } else {
             if (activeConversationId) {
                updateConversation(activeConversationId, convo => ({
                    ...convo,
                    messages: convo.messages.map(msg => 
                        msg.id === aiResponseId ? { ...msg, text: fullResponseText } : msg
                    )
                }));
            }
        }
      }

      if (isImmersiveModeActive && sentenceBuffer.trim().length > 0) {
        speakSentence(sentenceBuffer);
      }
      
      if (activeConversationId) {
            updateConversation(activeConversationId, convo => ({
                ...convo,
                messages: convo.messages.map(msg => 
                    msg.id === aiResponseId ? { ...msg, text: fullResponseText } : msg
                )
            }));
      }

    } catch (err) {
      console.error(err);
      if ((err as Error).name !== 'AbortError' && activeConversationId) {
        const errorMessage = (err as Error).message.includes('quota') 
          ? "API rate limit reached. Please try again later."
          : "An error occurred. Please try again.";
        setError(errorMessage);
        updateConversation(activeConversationId, convo => ({
            ...convo, messages: [...convo.messages.slice(0, -1), { id: `${Date.now()}-err`, text: errorMessage, sender: 'ai' }]
        }));
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };
  
  const handleRegenerate = () => {
    if (!activeConversationId || isLoading) return;
    
    let lastUserMessage: Message | undefined;
    updateConversation(activeConversationId, convo => {
        const userMessages = convo.messages.filter(m => m.sender === 'user');
        lastUserMessage = userMessages[userMessages.length - 1];

        if (!lastUserMessage) return convo;

        let lastUserMessageIndex = -1;
        for (let i = convo.messages.length - 1; i >= 0; i--) {
            if (convo.messages[i].id === lastUserMessage!.id) {
                lastUserMessageIndex = i;
                break;
            }
        }
        return { ...convo, messages: convo.messages.slice(0, lastUserMessageIndex + 1) };
    });

    if (lastUserMessage) {
        handleSend(lastUserMessage.text, undefined);
    }
  };

  const handleEdit = (messageId: string, newText: string) => {
    if (!activeConversationId) return;

    updateConversation(activeConversationId, convo => {
        const messageIndex = convo.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return convo;

        const messagesUpToEdit = convo.messages.slice(0, messageIndex + 1)
            .map(m => m.id === messageId ? { ...m, text: newText } : m);
        
        return { ...convo, messages: messagesUpToEdit };
    });
    
    handleSend(newText, undefined);
  };

  const stopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  return (
    <div className={`${theme} transition-colors duration-300`}>
      <div className="flex h-screen w-full bg-primary-light dark:bg-primary-dark text-gray-800 dark:text-gray-200">
        <Sidebar 
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={setActiveConversationId}
          onDeleteConversation={deleteConversation}
          onRenameConversation={(id, title) => updateConversation(id, { title })}
          theme={theme} 
          setTheme={setTheme} 
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          onOpenContact={() => setContactModalOpen(true)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          voiceId={voiceId}
          setVoiceId={setVoiceId}
        />
        <main className={`flex flex-col flex-1 h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-20'}`}>
           <Header
             isSidebarOpen={isSidebarOpen}
             onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
             conversationTitle={activeConversation?.title ?? "New Chat"}
             onExport={(format) => activeConversation && (format === 'json' ? exportConversationToJson(activeConversation) : exportConversationToMarkdown(activeConversation))}
             isUserVideoOpen={isUserVideoOpen}
             onToggleUserVideo={() => setUserVideoOpen(!isUserVideoOpen)}
           />
          {error && (
            <div className="bg-red-500/20 text-red-500 dark:text-red-400 p-3 text-sm flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" /> {error}
            </div>
          )}
          <ChatArea 
            messages={activeConversation?.messages ?? []} 
            isLoading={isLoading && activeConversation?.messages[activeConversation.messages.length-1]?.sender !== 'user'} 
            onRegenerate={handleRegenerate}
            onEdit={handleEdit}
          />
          <MessageInput 
            onSend={handleSend} 
            isLoading={isLoading} 
            onStop={stopGenerating}
            onToggleImmersiveMode={() => setImmersiveModeActive(true)}
          />
        </main>
        <ContactModal isOpen={isContactModalOpen} onClose={() => setContactModalOpen(false)} />
        {isUserVideoOpen && <UserVideo />}
        <ImmersiveMode
            isOpen={isImmersiveModeActive}
            onClose={() => {
                setImmersiveModeActive(false);
                handleInterrupt();
            }}
            onSend={handleSend}
            isLoading={isLoading}
            isSpeaking={isSpeaking}
            activeConversation={activeConversation}
            onInterrupt={handleInterrupt}
            immersiveText={immersiveText}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
