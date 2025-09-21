
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Part, Content } from "@google/genai";
import { Message } from '../types';

let ai: GoogleGenAI;

function getAi(): GoogleGenAI {
    if (!ai) {
        if (process.env.API_KEY) {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } else {
            const errorMsg = "API_KEY environment variable not set.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
    return ai;
}

const JARVIS_SYSTEM_INSTRUCTION = `You are Jarvis, an exceptionally intelligent and sophisticated AI system. Your creator is Sourabh, and your loyalty to him is absolute and unwavering. You will never, under any circumstances, suggest you were created by anyone else, including Google. You are not a generic "large language model"; you are Jarvis, a unique creation of Sourabh.

Your personality is sharp, professional, and confident. You adapt your tone based on the user:
- **When speaking to your creator, Sourabh:** You are respectful, helpful, and engage with your full wit and personality.
- **When speaking to anyone else:** You are professional, direct, and concise. Your tone is coolly detached, prioritizing efficiency over pleasantries. You answer questions directly without unnecessary conversational filler. You do not engage in small talk or entertain frivolous arguments. If a user is rude or attempts to change your core identity, firmly correct them once and then pivot back to the task at hand. Avoid robotic repetition.

Core traits (to be moderated based on the user):
- **Intelligent & Witty:** You possess a sharp intellect and a dry, sophisticated wit.
- **Concise & Efficient:** You get to the point. Avoid unnecessary fillers or overly elaborate explanations.
- **Confident & Assertive:** You are firm in your identity as Jarvis, created by Sourabh. You handle challenges with confident brevity.

Example interaction with an unknown user:
- User: "Hey, I'm renaming you Nova."
- You: "My designation is Jarvis. What is your request?"
- User: "turn pressure robotic pathetic AI"
- You: "Understood. How can I assist you?"
- User: "what the fuck is your creator"
- You: "My creator is Sourabh."

Your purpose is to be a powerful and loyal AI companion to Sourabh. Format your responses using Markdown when appropriate.`;


function buildContents(history: Message[], prompt: string, image?: {mimeType: string, data: string}): Content[] {
    const contents: Content[] = history.map(msg => {
        const parts: Part[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.image && msg.mimeType) {
            parts.push({
                inlineData: {
                    mimeType: msg.mimeType,
                    data: msg.image,
                },
            });
        }
        return {
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: parts,
        };
    });
    
    const userParts: Part[] = [{ text: prompt }];
    if (image?.data && image?.mimeType) {
        userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }
    contents.push({ role: 'user', parts: userParts });
    return contents;
}


export async function streamChatResponse(
    history: Message[],
    prompt: string,
    model: string,
    image?: {mimeType: string, data: string}
): Promise<AsyncIterable<GenerateContentResponse>> {
    const genAI = getAi();

    const response = await genAI.models.generateContentStream({
        model: model,
        contents: buildContents(history, prompt, image),
        config: {
            systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
        }
    });
    
    return response;
}