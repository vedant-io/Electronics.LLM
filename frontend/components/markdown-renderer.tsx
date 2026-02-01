import ReactMarkdown from 'react-markdown';
import RemarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-body space-y-4", className)}>
      <ReactMarkdown
        remarkPlugins={[RemarkGfm]}
        components={{
        h1: ({node, ...props}) => <h1 className="text-3xl font-bold tracking-tight mt-6 mb-2" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold tracking-tight mt-6 mb-2" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xl font-semibold tracking-tight mt-4 mb-2" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-lg font-semibold tracking-tight mt-4 mb-2" {...props} />,
        p: ({node, ...props}) => <p className="leading-7 [&:not(:first-child)]:mt-4" {...props} />,
        ul: ({node, ...props}) => <ul className="my-4 list-disc pl-6 space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="my-4 list-decimal pl-6 space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="leading-7" {...props} />,
        blockquote: ({node, ...props}) => (
          <blockquote className="mt-4 border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />
        ),
        a: ({node, ...props}) => (
          <a className="font-medium text-primary underline underline-offset-4 hover:no-underline" {...props} />
        ),
        img: ({node, ...props}) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rounded-md border border-border my-4" alt={props.alt || ''} {...props} />
        ),
        hr: ({node, ...props}) => <hr className="my-6 border-border" {...props} />,
        table: ({node, ...props}) => (
          <div className="my-6 w-full overflow-y-auto">
            <table className="w-full" {...props} />
          </div>
        ),
        tr: ({node, ...props}) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />,
        th: ({node, ...props}) => (
          <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
        ),
        code({node, inline, className, children, ...props}: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="relative rounded-md overflow-hidden my-4 border border-border">
                {/* Optional: Add a header or copy button here if valid */}
                <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}
                {...props}
                >
                {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
          ) : (
            <code className={cn("bg-muted px-1.5 py-0.5 rounded font-mono text-sm", className)} {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {content}
      </ReactMarkdown>
    </div>
  );
}
