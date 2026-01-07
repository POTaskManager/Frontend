'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatPopupProps {
  projectId: string;
  chatId: string;
  onClose: () => void;
}

export function ChatPopup({ projectId, chatId, onClose }: ChatPopupProps) {
  const { user } = useAuthStore();
  const {
    chats,
    messages,
    typingUsers,
    isConnected,
    fetchMessages,
    sendMessage,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
  } = useChatStore();

  const [isMinimized, setIsMinimized] = useState(false);

  const chat = chats.find((c) => c.id === chatId);
  const currentMessages = messages[chatId] || [];
  const currentTypingUsers = typingUsers[chatId] || new Set<string>();

  useEffect(() => {
    // Join chat and fetch messages
    joinChat(projectId, chatId);
    fetchMessages(projectId, chatId);

    // Cleanup: leave chat when unmounting
    return () => {
      leaveChat(chatId);
    };
  }, [projectId, chatId, joinChat, leaveChat, fetchMessages]);

  const handleSendMessage = (content: string) => {
    sendMessage(projectId, chatId, content);
  };

  const handleTypingStart = () => {
    if (user) {
      startTyping(chatId, user.name || user.email);
    }
  };

  const handleTypingStop = () => {
    stopTyping(chatId);
  };

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-300 rounded-t-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-3 bg-blue-500 text-white rounded-t-lg flex items-center justify-between cursor-pointer">
        <div
          className="flex-1 flex items-center gap-2"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <h3 className="font-semibold truncate">
            {chat?.name || 'Chat'}
          </h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="hover:bg-blue-600 rounded p-1 transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="hover:bg-blue-600 rounded p-1 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Body - Only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Messages - Fixed height for popup */}
          <div className="h-96 overflow-hidden">
            <MessageList
              messages={currentMessages}
              typingUserIds={currentTypingUsers}
            />
          </div>

          {/* Message Input */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={!isConnected}
          />
        </>
      )}
    </div>
  );
}
