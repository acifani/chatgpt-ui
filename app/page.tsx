'use client';

import { Inter } from 'next/font/google';
import { type FormEvent, useState } from 'react';
import styles from './page.module.css';

const inter = Inter({ subsets: ['latin'] });

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
    ] satisfies Message[];

    setMessages(newMessages);
    setInput('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages }),
    });
    const { message } = await response.json();
    setMessages([...newMessages, message]);
  }

  return (
    <main className={inter.className}>
      <div className={styles.container}>
        <h1>ChatGPT UI</h1>
        <div className={styles.chat}>
          {messages.map((msg, i) => (
            <p key={i} className={styles.message}>
              <b>{msg.role}:</b> {msg.content}
            </p>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </main>
  );
}
