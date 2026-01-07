'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { ChatList } from './ChatList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { NewChatModal } from './NewChatModal';

interface ChatContainerProps {
  projectId: string;
}

export function ChatContainer({ projectId }: ChatContainerProps) {
  const { user } = useAuthStore();
  const {
    chats,
    currentChatId,
    messages,
    typingUsers,
    isLoading,
    isConnected,
    setCurrentChat,
    fetchChats,
    fetchMessages,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
  } = useChatStore();

  const [showCreateChat, setShowCreateChat] = useState(false);

  useEffect(() => {
    // Fetch chats when component mounts
    fetchChats(projectId);

    // Connect WebSocket
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (currentChatId) {
        leaveChat(currentChatId);
      }
      disconnectWebSocket();
    };
  }, [projectId]);

  useEffect(() => {
    // When a chat is selected, join it and fetch messages
    if (currentChatId) {
      joinChat(projectId, currentChatId);
      fetchMessages(projectId, currentChatId);

      // Leave the chat when switching to another
      return () => {
        leaveChat(currentChatId);
      };
    }
  }, [currentChatId, projectId]);

  const handleSelectChat = (chatId: string) => {
    setCurrentChat(chatId);
  };

  const handleSendMessage = (content: string) => {
    if (currentChatId) {
      sendMessage(projectId, currentChatId, content);
    }
  };

  const handleTypingStart = () => {
    if (currentChatId && user) {
      startTyping(currentChatId, user.name || user.email);
    }
  };

  const handleTypingStop = () => {
    if (currentChatId) {
      stopTyping(currentChatId);
    }
  };

  const currentMessages = currentChatId ? messages[currentChatId] || [] : [];
  const currentTypingUsers = currentChatId ? typingUsers[currentChatId] || new Set<string>() : new Set<string>();

  return (
    <div className="h-full flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chats</h2>
            <button
              onClick={() => setShowCreateChat(true)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              New Chat
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <ChatList
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {currentChatId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <h2 className="text-lg font-semibold">
                {chats.find((c) => c.id === currentChatId)?.name || 'Chat'}
              </h2>
            </div>

            {/* Messages */}
            <MessageList
              messages={currentMessages}
              typingUserIds={currentTypingUsers}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={!isConnected}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      {showCreateChat && (
        <NewChatModal
          projectId={projectId}
          onClose={() => setShowCreateChat(false)}
        />
      )}
    </div>
  );
}
