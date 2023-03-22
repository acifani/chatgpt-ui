'use client';

import { Inter } from 'next/font/google';
import { type FormEvent, useState } from 'react';
import { ChatLine, type Message } from './message';
import styles from './page.module.css';

const inter = Inter({ subsets: ['latin'] });

const systemMessage: Message = {
  role: 'system',
  content:
    'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.',
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([systemMessage]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
    ] satisfies Message[];

    setMessages(newMessages);
    setInput('');

    setTimeout(() => setIsLoading(true), 500);
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages }),
    });
    const { message } = await response.json();
    setMessages([...newMessages, message]);
    setIsLoading(false);
  }

  return (
    <main className={inter.className}>
      <div className={styles.container}>
        <h1>ChatGPT UI</h1>
        <div className={styles.chatContainer}>
          <div>
            {messages.map((msg, i) => (
              <ChatLine key={i} msg={msg} />
            ))}
            {isLoading && (
              <ChatLine msg={{ role: 'assistant', content: '...' }} />
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </main>
  );
}
