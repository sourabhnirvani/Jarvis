import { ElevenLabsVoice } from '../types';

const API_BASE_URL = 'https://api.elevenlabs.io/v1';

export async function getElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
    if (!apiKey) {
        return [];
    }
    
    const response = await fetch(`${API_BASE_URL}/voices`, {
        headers: { 'xi-api-key': apiKey },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to fetch ElevenLabs voices');
    }

    const data = await response.json();
    return data.voices as ElevenLabsVoice[];
}

export async function generateElevenLabsAudio(
    text: string,
    apiKey: string,
    voiceId: string
): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to generate audio');
    }

    return response.blob();
}