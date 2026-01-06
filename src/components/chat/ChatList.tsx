'use client';

import { Chat } from '@/types';
import { useChatStore } from '@/store/chat-store';

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, currentChatId, onSelectChat }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No chats available. Create a new chat to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`p-4 border-b hover:bg-gray-50 text-left transition-colors ${
            currentChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {chat.name}
              </h3>
            </div>
            {chat.lastMessageAt && (
              <span className="text-xs text-gray-400 ml-2">
                {new Date(chat.lastMessageAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
