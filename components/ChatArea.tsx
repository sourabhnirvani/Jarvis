import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate: () => void;
  onEdit: (messageId: string, newText: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, onRegenerate, onEdit }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Fix: Corrected typo 'scrollref' to 'scrollRef'.
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pt-24 space-y-6">
      {messages.map((msg, index) => (
        <MessageBubble 
            key={msg.id || index} 
            message={msg}
            isLastMessage={index === messages.length - 1}
            isLoading={isLoading}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
        />
      ))}
      {isLoading && messages[messages.length-1]?.sender === 'user' && <MessageBubble message={{ id: 'typing', text: '', sender: 'ai' }} isTyping />}
    </div>
  );
};
