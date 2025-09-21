import React, { useState, useRef, useEffect } from 'react';
import { Menu, MoreVertical, Download, Video, VideoOff, Github } from './Icons';

interface HeaderProps {
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    conversationTitle: string;
    onExport: (format: 'json' | 'md') => void;
    isUserVideoOpen: boolean;
    onToggleUserVideo: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
    const { onToggleSidebar, conversationTitle, onExport, isUserVideoOpen, onToggleUserVideo } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-primary-light/80 dark:bg-primary-dark/80 backdrop-blur-sm border-b border-accent-light dark:border-accent-dark">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 rounded-md hover:bg-secondary-light dark:hover:bg-secondary-dark">
                    <Menu className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold truncate">{conversationTitle}</h2>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href="https://github.com/sourabhnirvani"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on GitHub"
                    title="View on GitHub"
                    className="p-2 rounded-full hover:bg-secondary-light dark:hover:bg-secondary-dark"
                >
                    <Github className="h-5 w-5" />
                </a>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-secondary-light dark:hover:bg-secondary-dark">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                    {menuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-secondary-light dark:bg-secondary-dark border border-accent-light dark:border-accent-dark rounded-lg shadow-xl">
                            <button onClick={() => { onExport('md'); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent-light dark:hover:bg-accent-dark">
                                <Download className="w-4 h-4" /> Export as Markdown
                            </button>
                             <button onClick={() => { onExport('json'); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent-light dark:hover:bg-accent-dark">
                                <Download className="w-4 h-4" /> Export as JSON
                            </button>
                            <button onClick={() => { onToggleUserVideo(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent-light dark:hover:bg-accent-dark">
                                {isUserVideoOpen ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                {isUserVideoOpen ? 'Hide Face' : 'Show Face'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};