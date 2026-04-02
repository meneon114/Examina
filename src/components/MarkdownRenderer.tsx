"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Ensure links open in new tab
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#818cf8]" />
          ),
          // Style lists slightly for better readability in explanations
          ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-5 my-2 space-y-1" />,
          ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-5 my-2 space-y-1" />,
          p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
