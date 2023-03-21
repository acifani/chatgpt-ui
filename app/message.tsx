import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './message.module.css';

export interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export function ChatLine({ msg }: { msg: Message }) {
  return (
    <div className={styles.message + ' ' + styles[msg.role]}>
      <p className={styles.role}>{msg.role}</p>
      <p>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              if (inline) {
                return <code>{children}</code>;
              }

              const match = /language-(\w+)/.exec(className || '');

              return (
                <SyntaxHighlighter
                  // @ts-expect-error
                  style={oneLight}
                  language={match?.[1] || undefined}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </p>
    </div>
  );
}
