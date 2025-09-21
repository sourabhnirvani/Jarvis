// A service to generate audio from text using the browser's Web Speech API or ElevenLabs.
import { generateElevenLabsAudio } from './elevenLabsService';


// --- Browser Speech Synthesis (Fallback) ---
let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
}

if (typeof window.speechSynthesis !== 'undefined') {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function selectVoice(): SpeechSynthesisVoice | null {
    if (voices.length === 0) loadVoices();
    if (voices.length === 0) return null;

    const preferredVoices = [
        "Google US English", "Samantha", "Alex", "Daniel",
        "Microsoft David - English (United States)", "Microsoft Zira - English (United States)",
    ];

    for (const name of preferredVoices) {
        const found = voices.find(voice => voice.name === name && voice.lang.startsWith('en-US'));
        if (found) return found;
    }
    const googleVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.name.includes('Google'));
    if (googleVoice) return googleVoice;
    const localVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.localService);
    if (localVoice) return localVoice;
    return voices.find(voice => voice.lang.startsWith('en-US')) || null;
}

function cleanTextForSpeech(text: string): string {
    return text.replace(/\.{3,}/g, ', ').replace(/[()]/g, '');
}

function speakWithBrowserAPI(text: string, onEndCallback: () => void): void {
    if (typeof window.speechSynthesis === 'undefined' || !text.trim()) {
        if (onEndCallback) onEndCallback();
        return;
    }
    window.speechSynthesis.cancel();
    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const selectedVoice = selectVoice();
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 1.05;
    utterance.rate = 1.1;
    utterance.onend = onEndCallback;
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        if (onEndCallback) onEndCallback();
    };
    window.speechSynthesis.speak(utterance);
}

// --- ElevenLabs Integration ---
let currentAudio: HTMLAudioElement | null = null;

async function speakWithElevenLabs(text: string, apiKey: string, voiceId: string, onEndCallback: () => void): Promise<void> {
    try {
        const audioBlob = await generateElevenLabsAudio(text, apiKey, voiceId);
        const audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        currentAudio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            onEndCallback();
        };
        currentAudio.onerror = (e) => {
            console.error("Error playing ElevenLabs audio", e);
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            onEndCallback();
        }
    } catch (error) {
        console.error("Failed to play ElevenLabs audio:", error);
        onEndCallback(); // Ensure callback is called on error
    }
}

// --- Main Service Exports ---
interface SpeakTextOptions {
    apiKey?: string | null;
    voiceId?: string | null;
}

export function speakText(text: string, onEndCallback: () => void, options?: SpeakTextOptions): void {
    cancelSpeech(); // Ensure any previous audio is stopped before starting new audio
    if (options?.apiKey && options?.voiceId && text.trim()) {
        speakWithElevenLabs(text, options.apiKey, options.voiceId, onEndCallback);
    } else {
        speakWithBrowserAPI(text, onEndCallback);
    }
}

export function cancelSpeech(): void {
     if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.cancel();
     }
     if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
}
