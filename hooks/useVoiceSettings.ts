import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'elevenlabs_api_key';
const VOICE_ID_STORAGE_KEY = 'elevenlabs_voice_id';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

export const useVoiceSettings = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  });

  const [voiceId, setVoiceId] = useState<string>(() => {
    return localStorage.getItem(VOICE_ID_STORAGE_KEY) || DEFAULT_VOICE_ID;
  });

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, [apiKey]);

  useEffect(() => {
    if (voiceId) {
      localStorage.setItem(VOICE_ID_STORAGE_KEY, voiceId);
    } else {
      localStorage.removeItem(VOICE_ID_STORAGE_KEY);
    }
  }, [voiceId]);

  return { apiKey, setApiKey, voiceId, setVoiceId };
};
