'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { useAuthStore } from '@/store/auth-store';

interface MessageListProps {
  messages: ChatMessage[];
  typingUserIds: Set<string>;
}

export function MessageList({ messages, typingUserIds }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.userId === user?.id;
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                isOwn
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {!isOwn && (
                <div className="text-xs font-semibold mb-1 opacity-75">
                  User {message.userId.slice(0, 8)}
                </div>
              )}
              <div className="break-words">{message.message}</div>
              <div
                className={`text-xs mt-1 ${
                  isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        );
      })}
      
      {typingUserIds.size > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-200 rounded-lg px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
