import React, { useState, useEffect } from 'react';
import { Theme, Conversation, ElevenLabsVoice } from '../types';
import { PlusSquare, Sun, Moon, Edit3, Trash2, Check, X, User, Menu, ChevronsLeft, Settings } from './Icons';
import { getElevenLabsVoices } from '../services/elevenLabsService';
import { useToast } from '../contexts/ToastContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onOpenContact: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  voiceId: string;
  setVoiceId: (id: string) => void;
}

const DEFAULT_ELEVENLABS_VOICES: ElevenLabsVoice[] = [
    { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    { voice_id: '29vD33N1CtxCmqQRPO9i', name: 'Drew' },
    { voice_id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde' },
    { voice_id: '5Q0t7uMcjvnagumLfvZi', name: 'Paul' },
    { voice_id: 'A0AU23D6y50vB92Bvj2I', name: 'Domi' },
    { voice_id: 'JBFqnCBco6iPZ_iQ_LgI', name: 'Dave' },
    { voice_id: 'D38z5RcWu1voky8WS1ja', name: 'Fin' },
    { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
    { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    { voice_id: 'JpV35S5hP32tQGpfAVaF', name: 'Thomas' },
    { voice_id: 'LcfcDJNUP1GQjkzn1xUU', name: 'Charlie' },
    { voice_id: 'JUTT8aP2Xz2f22LzboHS', name: 'George' },
    { voice_id: 'LjioG22IeyY6wL4zYk1y', name: 'Emily' },
    { voice_id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    { voice_id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
    { voice_id: 'ODq5zpo4RknoBGYN1sRp', name: 'Patrick' },
    { voice_id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry' },
    { voice_id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
    { voice_id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy' },
    { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
    { voice_id: 'VR6AewLTigWG4xSOhOim', name: 'Arnold' },
    { voice_id: 'YoT52AIifVMjoE_hXwJj', name: 'Bella' },
    { voice_id: 'ZQe5CZNOzRz5RkgtoADf', name: 'Adam' },
    { voice_id: 'bVMeCyTHy58xNoL34h3p', name: 'Bill' },
    { voice_id: 'jsCqWAovK2LkecY7zXl4', name: 'Jessie' },
    { voice_id: 'yoZ06aMmMolZp6A2LcpB', name: 'Sam' },
];

const ConversationItem: React.FC<{
    conversation: Conversation;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
    isSidebarOpen: boolean;
}> = ({ conversation, isActive, onSelect, onDelete, onRename, isSidebarOpen }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(conversation.title);

    const handleRename = () => {
        if (title.trim()) {
            onRename(title.trim());
            setIsEditing(false);
        }
    };

    return (
        <div 
            className={`flex items-center group w-full px-3 py-2 text-left text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-accent-light dark:bg-accent-dark' : 'hover:bg-accent-light dark:hover:bg-accent-dark'
            }`}
            onClick={() => !isEditing && onSelect()}
            title={isSidebarOpen ? undefined : conversation.title}
        >
            {isEditing ? (
                <>
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="flex-grow bg-transparent outline-none ring-1 ring-blue-500 rounded px-1"
                        autoFocus
                    />
                    <button onClick={handleRename} className="p-1 hover:text-green-500"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setIsEditing(false)} className="p-1 hover:text-red-500"><X className="w-4 h-4" /></button>
                </>
            ) : (
                <>
                    <span className={`flex-grow truncate ${!isSidebarOpen && 'hidden'}`} title={conversation.title}>{conversation.title}</span>
                     {isSidebarOpen && (
                        <div className="hidden group-hover:flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:text-blue-500"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const VoiceSettings: React.FC<{
    apiKey: string;
    setApiKey: (key: string) => void;
    voiceId: string;
    setVoiceId: (id: string) => void;
    isOpen: boolean;
}> = ({ apiKey, setApiKey, voiceId, setVoiceId, isOpen }) => {
    const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!apiKey) {
                setVoices([]);
                setError('');
                return;
            };
            
            const fetchVoices = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const fetchedVoices = await getElevenLabsVoices(apiKey);
                    if (fetchedVoices.length > 0) {
                        setVoices(fetchedVoices);
                        addToast("ElevenLabs voices loaded", "success");
                    } else {
                        setVoices(DEFAULT_ELEVENLABS_VOICES);
                        addToast("No custom voices found. Loaded public voices.", "info");
                    }
                } catch (err) {
                    const errorMessage = (err as Error).message || "Invalid API key or network error.";
                    if (errorMessage.toLowerCase().includes('permission')) {
                        setError('Key lacks permissions. Using public voices.');
                        setVoices(DEFAULT_ELEVENLABS_VOICES);
                        addToast("Loaded public voices due to API key permissions.", "info");
                    } else {
                        setError(errorMessage);
                        setVoices([]);
                        addToast("Failed to load ElevenLabs voices", "error");
                    }
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVoices();
        }, 500); // Debounce API calls

        return () => clearTimeout(timer);
    }, [apiKey, addToast]);
    
    if (!isOpen) {
        return (
             <button
                className="flex items-center w-full px-4 py-3 justify-center text-left text-sm font-medium rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-colors"
                title="Voice Settings"
             >
                <Settings className="w-5 h-5" />
            </button>
        );
    }
    
    return (
        <div className="text-sm p-3 rounded-lg bg-secondary-light/50 dark:bg-secondary-dark/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Voice (ElevenLabs)
            </h3>
            <div className="space-y-3">
                 <div>
                    <label htmlFor="apiKey" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">API Key</label>
                    <input 
                        type="password"
                        id="apiKey"
                        placeholder="Enter your API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-md bg-primary-light dark:bg-accent-dark border border-accent-light dark:border-accent-dark focus:ring-1 focus:ring-blue-500"
                    />
                 </div>
                 <div>
                    <label htmlFor="voiceId" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Voice</label>
                    <select
                        id="voiceId"
                        value={voiceId}
                        onChange={(e) => setVoiceId(e.target.value)}
                        disabled={isLoading || !apiKey || voices.length === 0}
                        className="w-full text-xs px-2 py-1.5 rounded-md bg-primary-light dark:bg-accent-dark border border-accent-light dark:border-accent-dark focus:ring-1 focus:ring-blue-500"
                    >
                        {isLoading ? (
                            <option>Loading voices...</option>
                        ) : voices.length === 0 ? (
                            <option>Enter valid API key</option>
                        ) : (
                            voices.map(v => (
                                <option key={v.voice_id} value={v.voice_id}>
                                    {v.name}
                                </option>
                            ))
                        )}
                    </select>
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                 </div>
            </div>
        </div>
    );
};


export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { 
    conversations, 
    activeConversationId, 
    onNewChat, 
    onSelectConversation, 
    onDeleteConversation, 
    onRenameConversation, 
    theme, 
    setTheme,
    isOpen,
    setIsOpen,
    onOpenContact,
    apiKey,
    setApiKey,
    voiceId,
    setVoiceId,
  } = props;
  
  const toggleTheme = () => {
    setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  return (
    <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col bg-secondary-light dark:bg-secondary-dark p-4 border-r border-accent-light dark:border-accent-dark transform md:transform-none transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20'}`}>
      <div className="flex items-center justify-between mb-6">
        {isOpen && (
            <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 mr-3"></div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Jarvis</h1>
            </div>
        )}
        <button onClick={() => setIsOpen(false)} className={`p-1 ${!isOpen ? 'mx-auto' : ''}`}>
             <ChevronsLeft className="w-5 h-5" />
        </button>
      </div>
      
      <button 
        onClick={onNewChat}
        className={`flex items-center w-full px-4 py-2 text-left text-sm font-medium rounded-lg bg-accent-light dark:bg-accent-dark hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${!isOpen && 'justify-center'}`}
      >
        <PlusSquare className={`w-5 h-5 ${isOpen && 'mr-3'}`} />
        <span className={!isOpen ? 'hidden' : ''}>New Chat</span>
      </button>

      <div className="flex-grow mt-4 space-y-1 overflow-y-auto">
        {conversations.sort((a, b) => b.createdAt - a.createdAt).map(convo => (
            <ConversationItem 
                key={convo.id}
                conversation={convo}
                isActive={convo.id === activeConversationId}
                onSelect={() => onSelectConversation(convo.id)}
                onDelete={() => onDeleteConversation(convo.id)}
                onRename={(newTitle) => onRenameConversation(convo.id, newTitle)}
                isSidebarOpen={isOpen}
            />
        ))}
      </div>

      <div className="mt-auto space-y-2">
         <VoiceSettings 
            apiKey={apiKey}
            setApiKey={setApiKey}
            voiceId={voiceId}
            setVoiceId={setVoiceId}
            isOpen={isOpen}
        />
        <div className={`flex items-center p-2 rounded-lg bg-accent-light dark:bg-accent-dark ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <span className={`text-sm font-medium ${!isOpen && 'hidden'}`}>Theme</span>
          <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
            {theme === Theme.LIGHT ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
        <button
          onClick={onOpenContact}
          className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-colors ${!isOpen && 'justify-center'}`}
        >
          <User className={`w-5 h-5 ${isOpen && 'mr-3'}`} />
          <span className={!isOpen ? 'hidden' : ''}>By Sourabh</span>
        </button>
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-colors ${!isOpen && 'justify-center'}`}
        >
            {isOpen ? <ChevronsLeft className="w-5 h-5 mr-3" /> : <Menu className="w-5 h-5" />}
            <span className={!isOpen ? 'hidden' : ''}>{isOpen ? 'Collapse Sidebar' : ''}</span>
        </button>
      </div>
    </aside>
  );
};