import { Conversation } from '../types';

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const exportConversationToJson = (conversation: Conversation) => {
    const jsonString = JSON.stringify(conversation, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const filename = `${conversation.title.replace(/\s+/g, '_')}_${conversation.id}.json`;
    triggerDownload(blob, filename);
};

export const exportConversationToMarkdown = (conversation: Conversation) => {
    let mdContent = `# ${conversation.title}\n\n`;
    mdContent += `**Conversation ID:** ${conversation.id}\n`;
    mdContent += `**Date:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
    // Fix: Correctly include the model from the conversation object.
    mdContent += `**Model:** ${conversation.model}\n\n---\n\n`;

    conversation.messages.forEach(message => {
        const sender = message.sender === 'user' ? 'You' : 'Jarvis';
        mdContent += `**${sender}:**\n\n`;
        mdContent += `${message.text}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const filename = `${conversation.title.replace(/\s+/g, '_')}_${conversation.id}.md`;
    triggerDownload(blob, filename);
};
