import dynamic from 'next/dynamic';
import { Suspense, lazy } from 'react';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './message.module.css';

const SyntaxHighlighter = dynamic(() =>
  import('react-syntax-highlighter').then((m) => m.Prism),
);

const ReactMarkdown = lazy(() => import('react-markdown'));

export interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export function ChatLine({ msg }: { msg: Message }) {
  if (msg.role === 'system') return null;

  return (
    <div className={styles.message + ' ' + styles[msg.role]}>
      <p className={styles.role}>{msg.role}</p>
      <div>
        <Suspense>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                if (inline) {
                  return <code>{children}</code>;
                }

                const match = /language-(\w+)/.exec(className || '');

                return (
                  <Suspense>
                    <SyntaxHighlighter
                      // @ts-expect-error
                      style={oneLight}
                      language={match?.[1] || undefined}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </Suspense>
                );
              },
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </Suspense>
      </div>
    </div>
  );
}
