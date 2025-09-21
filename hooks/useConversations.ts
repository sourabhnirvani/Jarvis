
import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { useToast } from '../contexts/ToastContext';

const STORAGE_KEY = 'jarvis_conversations';

// Fix: Add model parameter to createNewConversation.
const createNewConversation = (model: string): Conversation => ({
    id: `convo_${Date.now()}`,
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    model,
});

export const useConversations = () => {
    const { addToast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>(() => {
        try {
            const storedConvos = window.localStorage.getItem(STORAGE_KEY);
            if (storedConvos) {
                const parsedConvos = JSON.parse(storedConvos);
                // Basic validation
                if (Array.isArray(parsedConvos) && parsedConvos.length > 0) {
                    // Migration for conversations saved without a model property.
                    return parsedConvos.map((c: any) => ({ ...c, model: c.model || 'gemini-2.5-flash' }));
                }
            }
        } catch (error) {
            console.error('Failed to parse conversations from localStorage', error);
        }
        // Fix: Pass a default model when creating the initial conversation.
        return [createNewConversation('gemini-2.5-flash')];
    });

    const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
        const lastActiveId = sessionStorage.getItem('active_conversation_id');
        const activeExists = conversations.some(c => c.id === lastActiveId);
        if (lastActiveId && activeExists) {
            return lastActiveId;
        }
        return conversations.length > 0 ? conversations[0].id : null;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
        } catch (error) {
            console.error('Failed to save conversations to localStorage', error);
        }
    }, [conversations]);
    
    useEffect(() => {
        if (activeConversationId) {
            sessionStorage.setItem('active_conversation_id', activeConversationId);
        } else {
            sessionStorage.removeItem('active_conversation_id');
        }
    }, [activeConversationId]);

    // Fix: Update addConversation to accept a model string.
    const addConversation = useCallback((model: string) => {
        const newConvo = createNewConversation(model);
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        addToast('New chat created', 'info');
        return newConvo;
    }, [addToast]);
    
    const deleteConversation = useCallback((id: string) => {
        setConversations(prev => {
            const newConvos = prev.filter(c => c.id !== id);
            if (newConvos.length === 0) {
                // Fix: Pass a default model when creating a new conversation after deletion.
                const newConvo = createNewConversation('gemini-2.5-flash');
                setActiveConversationId(newConvo.id);
                return [newConvo];
            }
            if (id === activeConversationId) {
                setActiveConversationId(newConvos[0].id);
            }
            return newConvos;
        });
        addToast('Conversation deleted', 'error');
    }, [activeConversationId, addToast]);

    const updateConversation = useCallback((id: string, updates: Partial<Conversation> | ((prevState: Conversation) => Conversation)) => {
        setConversations(prev =>
            prev.map(c => {
                if (c.id === id) {
                    if (typeof updates === 'function') {
                        return updates(c);
                    }
                    return { ...c, ...updates };
                }
                return c;
            })
        );
    }, []);

    useEffect(() => {
        if (!activeConversationId && conversations.length > 0) {
            setActiveConversationId(conversations[0].id);
        }
    }, [activeConversationId, conversations]);

    return { 
        conversations, 
        activeConversationId, 
        setActiveConversationId,
        addConversation,
        updateConversation,
        deleteConversation,
    };
};
