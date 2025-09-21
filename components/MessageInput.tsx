import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Square, Paperclip, Mic, X } from './Icons';

interface MessageInputProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  onStop: () => void;
  onToggleImmersiveMode: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = (props) => {
  const { onSend, isLoading, onStop, onToggleImmersiveMode } = props;
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmedText = text.trim();
    if ((trimmedText || imageFile) && !isLoading) {
      onSend(trimmedText, imageFile || undefined);
      setText('');
      setImageFile(null);
      setImagePreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="px-6 pb-6 pt-4 bg-primary-light dark:bg-primary-dark">
      <div className="relative w-full max-w-4xl mx-auto">
        {imagePreview && (
            <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="preview" className="h-20 rounded-lg" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}
        <div className="relative flex items-end p-2 rounded-xl bg-secondary-light dark:bg-secondary-dark border border-accent-light dark:border-accent-dark shadow-sm">
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 disabled:opacity-50" disabled={isLoading}>
                <Paperclip className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            
            <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message Jarvis..."
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2.5 max-h-48"
            rows={1}
            disabled={isLoading}
            />
            <button onClick={onToggleImmersiveMode} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-500">
                <Mic className="w-5 h-5" />
            </button>
            {isLoading ? (
                <button
                    onClick={onStop}
                    className="p-2 rounded-lg bg-red-500 text-white transition-colors"
                    aria-label="Stop generation"
                >
                    <Square className="w-5 h-5" />
                </button>
            ) : (
                <button
                onClick={handleSend}
                disabled={!text.trim() && !imageFile}
                className="p-2 rounded-lg bg-blue-500 text-white disabled:bg-gray-400 disabled:dark:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
                >
                <Send className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>
       <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
        Jarvis can make mistakes. Consider checking important information.
      </p>
    </div>
  );
};