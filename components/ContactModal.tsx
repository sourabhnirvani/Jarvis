import React from 'react';
import { X, Mail, MapPin, Github, Linkedin } from './Icons';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactInfo = [
    { icon: Mail, text: 'sourabniwane944@gmail.com', href: 'mailto:sourabniwane944@gmail.com' },
    { icon: MapPin, text: 'Bengaluru', href: '#' },
    { icon: Github, text: 'github.com/sourabhnirvani', href: 'https://github.com/sourabhnirvani' },
    { icon: Linkedin, text: 'linkedin.com/in/sourabh-nirwane', href: 'https://linkedin.com/in/sourabh-nirwane' },
]

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
            onClick={onClose}
        >
            <div 
                className="bg-secondary-light dark:bg-secondary-dark rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent-dark">
                    <X className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 mb-4"></div>
                    <h2 className="text-2xl font-bold">Sourabh Nirwane</h2>
                    <p className="text-gray-500 dark:text-gray-400">Creator of Jarvis</p>
                </div>

                <div className="mt-8 space-y-4">
                    {ContactInfo.map(item => (
                        <a 
                            key={item.text}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-colors"
                        >
                            <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium">{item.text}</span>
                        </a>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
