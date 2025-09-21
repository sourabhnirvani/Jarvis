import React, { useState } from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, Check, Edit3, Save, X, RefreshCw } from './Icons';
import { useToast } from '../contexts/ToastContext';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newText: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = (props) => {
  const { message, isTyping = false, isLastMessage, isLoading, onRegenerate, onEdit } = props;
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    addToast("Copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
        onEdit(message.id, editText.trim());
        setIsEditing(false);
    }
  };

  const isUser = message.sender === 'user';
  const isAi = message.sender === 'ai';

  if (isTyping) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center space-x-1 p-3 rounded-lg bg-secondary-light dark:bg-secondary-dark">
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-${isUser ? 'end' : 'start'}`}>
        <div className={`group relative max-w-xl lg:max-w-3xl px-5 py-3 rounded-2xl shadow-md ${isUser ? 'bg-blue-500 text-white' : 'bg-secondary-light dark:bg-secondary-dark'}`}>
            {message.image && (
                <img src={`data:${message.mimeType};base64,${message.image}`} alt="uploaded content" className="rounded-lg mb-2 max-h-64" />
            )}
            {isEditing ? (
                <div>
                    <textarea 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-transparent text-white outline-none resize-y"
                        rows={3}
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-600 rounded-full"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setIsEditing(false)} className="p-1.5 bg-red-600 rounded-full"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            ) : (
                <MarkdownRenderer content={message.text} />
            )}

            <div className="absolute -top-3 right-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUser && !isEditing && onEdit && (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 bg-accent-light dark:bg-accent-dark rounded-full text-gray-500 dark:text-gray-400">
                        <Edit3 className="w-4 h-4" />
                    </button>
                )}
                {isAi && message.text && (
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-accent-light dark:bg-accent-dark rounded-full text-gray-500 dark:text-gray-400"
                    aria-label="Copy message"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                )}
            </div>
        </div>
        {isLastMessage && isAi && !isLoading && onRegenerate && (
            <button onClick={onRegenerate} className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-2">
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
            </button>
        )}
    </div>
  );
};
