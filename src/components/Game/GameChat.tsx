import React, { useRef, useEffect } from 'react';

export interface ChatMessageItem {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface GameChatProps {
  messages: ChatMessageItem[];
  onSend: (message: string) => void;
  disabled?: boolean;
  maxMessages?: number;
}

export default function GameChat({
  messages,
  onSend,
  disabled,
  maxMessages = 50,
}: GameChatProps) {
  const [input, setInput] = React.useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const displayMessages = messages.slice(-maxMessages);

  return (
    <div className="flex flex-col rounded-xl border border-gray-600/80 bg-gray-800/50 overflow-hidden transition-all duration-200">
      <h4 className="text-sm font-semibold text-gray-300 px-3 py-3 border-b border-gray-600/80">
        Chat
      </h4>
      <div
        ref={listRef}
        className="flex flex-col gap-1.5 p-3 min-h-[100px] max-h-[200px] overflow-y-auto scroll-smooth"
      >
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <span className="text-2xl text-gray-500/80 mb-2" aria-hidden>💬</span>
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className="text-gray-500">{msg.username}: </span>
              <span className="text-gray-300">{msg.message}</span>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex border-t border-gray-600/80">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={disabled}
          className="flex-1 bg-gray-900/80 text-gray-200 text-sm px-3 py-2.5 border-0 focus:ring-2 focus:ring-amber-500/50 outline-none disabled:opacity-50 transition-all duration-150"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-r hover:bg-amber-500 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
        >
          Send
        </button>
      </form>
    </div>
  );
}
