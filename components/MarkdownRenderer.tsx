
import React from 'react';
// @ts-ignore
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
// @ts-ignore
import remarkGfm from 'https://esm.sh/remark-gfm@4';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15';
// @ts-ignore
import { oneDark } from 'https://esm.sh/react-syntax-highlighter@15/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      className="prose prose-sm dark:prose-invert max-w-none prose-p:before:content-none prose-p:after:content-none"
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="text-sm font-mono bg-accent-light dark:bg-accent-dark rounded px-1 py-0.5" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
