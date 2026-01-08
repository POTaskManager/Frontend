'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { ChatList } from './ChatList';
import { NewChatModal } from './NewChatModal';

interface ChatSidebarProps {
  projectId: string;
  onChatSelect: (chatId: string) => void;
}

export function ChatSidebar({ projectId, onChatSelect }: ChatSidebarProps) {
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const {
    chats,
    currentChatId,
    isLoading,
    isConnected,
    fetchChats,
    connectWebSocket,
    disconnectWebSocket,
  } = useChatStore();

  useEffect(() => {
    // Fetch chats when component mounts
    fetchChats(projectId);

    // Connect WebSocket and join project room
    connectWebSocket(projectId).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Cleanup on unmount
    return () => {
      disconnectWebSocket(projectId);
    };
  }, [projectId, fetchChats, connectWebSocket, disconnectWebSocket]);

  return (
    <div className="w-80 border-l bg-white flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            title="New Chat"
          >
            + New
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Chat List */}
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading chats...</div>
      ) : (
        <ChatList
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={onChatSelect}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          projectId={projectId}
          onClose={() => setShowNewChatModal(false)}
        />
      )}
    </div>
  );
}
