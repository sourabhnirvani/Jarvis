export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  image?: string; // base64 string
  mimeType?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    // Fix: Add model property to support different models per conversation.
    model: string;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}
