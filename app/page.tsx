'use client';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Inter } from 'next/font/google';
import { useReducer, type FormEvent } from 'react';
import { ChatLine, type Message } from './message';
import styles from './page.module.css';
import { useLocalStorage } from './useLocalStorage';

const inter = Inter({ subsets: ['latin'] });

const systemMessage: Message = {
  role: 'system',
  content:
    'You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.',
};

interface State {
  input: string;
  messages: Message[];
  isLoading: boolean;
  currentMessage: string;
}

const defaultState: State = {
  input: '',
  isLoading: false,
  messages: [systemMessage],
  currentMessage: '',
};

type Action =
  | { type: 'setInput'; payload: string }
  | { type: 'sendingUserMessage'; payload: Message[] }
  | { type: 'startReceivingMessage' }
  | { type: 'receivedMessageChunk'; payload: string }
  | { type: 'receivedError'; payload: string }
  | { type: 'finishedReceivingMessage' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setInput':
      return { ...state, input: action.payload };

    case 'sendingUserMessage':
      return {
        ...state,
        input: '',
        isLoading: true,
        messages: [...action.payload],
      };

    case 'receivedMessageChunk':
      const newMessage = state.currentMessage + action.payload;

      // if previous currentMessage is empty, this is the first chunk
      // so we need to add a new message to the array. otherwise, we
      // need to replace the last message in the array with the new
      const newMessages =
        state.currentMessage === ''
          ? [...state.messages]
          : [...state.messages.slice(0, state.messages.length - 1)];

      return {
        ...state,
        currentMessage: newMessage,
        messages: [...newMessages, { role: 'assistant', content: newMessage }],
      };

    case 'finishedReceivingMessage':
      return {
        ...state,
        isLoading: false,
        currentMessage: '',
      };
    case 'receivedError':
      return {
        ...state,
        isLoading: false,
        currentMessage: '',
        messages: [
          ...state.messages,
          { role: 'error', content: action.payload },
        ],
      };
    default:
      return state;
  }
}

class APIError extends Error {}

export default function Home() {
  const [model, setModel] = useLocalStorage('chatgptui-model', 'gpt-3.5-turbo');
  const [apiKey, setApiKey] = useLocalStorage('chatgptui-apikey', '');

  const [{ input, messages, isLoading, currentMessage }, dispatch] = useReducer(
    reducer,
    defaultState,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!apiKey) {
      dispatch({ type: 'receivedError', payload: 'Please enter an API key' });
      return;
    }

    if (!model) {
      dispatch({ type: 'receivedError', payload: 'Please select a model' });
      return;
    }

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
    ] satisfies Message[];

    dispatch({ type: 'sendingUserMessage', payload: newMessages });

    try {
      await fetchEventSource('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: newMessages.filter((m) => m.role !== 'error'),
          stream: true,
        }),
        async onopen(response) {
          if (response.status >= 400) {
            const res = await response.json();
            const errMessage =
              res.error?.message || response.statusText || response.status;

            throw new APIError(errMessage);
          }
        },
        onmessage(ev) {
          if (ev.data === '[DONE]') {
            dispatch({ type: 'finishedReceivingMessage' });
            return;
          }

          const data = JSON.parse(ev.data);
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            dispatch({ type: 'receivedMessageChunk', payload: content });
          }
        },
        onerror(err) {
          throw err;
        },
      });
    } catch (err: any) {
      const errorPrefix =
        err instanceof APIError
          ? 'Error while calling OpenAI APIs: '
          : 'Unknown error: ';
      dispatch({ type: 'receivedError', payload: errorPrefix + err.message });
    }
  }

  return (
    <main className={inter.className}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>ChatGPT UI</h1>
          <menu>
            <div className={styles.group}>
              <label htmlFor="apiKey">API Key</label>
              <input
                type="password"
                name="apiKey"
                placeholder="*************"
                onChange={(e) => setApiKey(e.target.value)}
                value={apiKey}
              />
            </div>
            <div className={styles.group}>
              <label htmlFor="model">Model</label>
              <input
                type="text"
                name="model"
                placeholder="gpt-3.5-turbo"
                onChange={(e) => setModel(e.target.value)}
                value={model}
                list="chat-models"
              />
              <datalist id="chat-models">
                <option value="gpt-3.5-turbo" />
                <option value="gpt-4" />
                <option value="gpt-4-32k" />
              </datalist>
            </div>
          </menu>
        </header>
        <div className={styles.chatContainer}>
          <div>
            {messages.map((msg, i) => (
              <ChatLine key={i} msg={msg} />
            ))}
            {isLoading && currentMessage === '' && (
              <ChatLine msg={{ role: 'assistant', content: '...' }} />
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) =>
              dispatch({ type: 'setInput', payload: e.target.value })
            }
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </main>
  );
}
