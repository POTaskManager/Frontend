import { create } from 'zustand';
import { Chat, ChatMessage } from '@/types';
import { chatService } from '@/lib/chat-service';
import { chatWs } from '@/lib/chat-websocket';

interface ChatStore {
  chats: Chat[];
  currentChatId: string | null;
  openChatId: string | null;
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, Set<string>>;
  unreadChats: Set<string>; // Set of chatIds with unread messages
  isLoading: boolean;
  isConnected: boolean;

  // Actions
  setCurrentChat: (chatId: string | null) => void;
  setOpenChat: (chatId: string | null) => void;
  fetchChats: (projectId: string) => Promise<void>;
  fetchMessages: (projectId: string, chatId: string) => Promise<void>;
  sendMessage: (projectId: string, chatId: string, content: string) => Promise<void>;
  updateMessage: (projectId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (projectId: string, messageId: string, chatId: string) => Promise<void>;
  createChat: (projectId: string, name: string, participantIds: string[]) => Promise<void>;
  markChatAsRead: (chatId: string) => void;
  
  // WebSocket actions
  connectWebSocket: (projectId?: string) => Promise<void>;
  disconnectWebSocket: (projectId?: string) => void;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinChat: (projectId: string, chatId: string) => void;
  leaveChat: (chatId: string) => void;
  startTyping: (chatId: string, userName: string) => void;
  stopTyping: (chatId: string) => void;
  markAsRead: (projectId: string, chatId: string, messageId: string) => void;

  // Internal handlers
  handleNewMessage: (data: any) => void;
  handleChatMessageNotification: (data: any) => void;
  handleMessageUpdated: (data: any) => void;
  handleMessageDeleted: (data: any) => void;
  handleUserTyping: (data: any) => void;
  handleUserStoppedTyping: (data: any) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  currentChatId: null,
  openChatId: null,
  messages: {},
  typingUsers: {},
  unreadChats: new Set(),
  isLoading: false,
  isConnected: false,

  setCurrentChat: (chatId) => set({ currentChatId: chatId }),

  setOpenChat: (chatId) => {
    set({ openChatId: chatId });
    // Mark chat as read when opened
    if (chatId) {
      get().markChatAsRead(chatId);
    }
  },

  markChatAsRead: (chatId) => {
    set((state) => {
      const newUnreadChats = new Set(state.unreadChats);
      newUnreadChats.delete(chatId);
      return { unreadChats: newUnreadChats };
    });
  },

  fetchChats: async (projectId: string) => {
    try {
      set({ isLoading: true });
      const chats = await chatService.getUserChats(projectId);
      set({ chats, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (projectId: string, chatId: string) => {
    try {
      set({ isLoading: true });
      const messages = await chatService.getChatHistory(projectId, chatId);
      set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: messages.reverse(), // Reverse to show oldest first
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  sendMessage: async (projectId: string, chatId: string, content: string) => {
    try {
      // Send via WebSocket for real-time delivery
      if (chatWs.isConnected()) {
        chatWs.sendMessage(projectId, chatId, content);
      } else {
        // Fallback to REST API
        await chatService.sendMessage(projectId, { chatId, message: content });
        // Refetch messages
        await get().fetchMessages(projectId, chatId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  updateMessage: async (projectId: string, messageId: string, content: string) => {
    try {
      if (chatWs.isConnected()) {
        chatWs.updateMessage(projectId, messageId, content);
      } else {
        await chatService.updateMessage(projectId, messageId, { content });
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  },

  deleteMessage: async (projectId: string, messageId: string, chatId: string) => {
    try {
      if (chatWs.isConnected()) {
        chatWs.deleteMessage(projectId, messageId, chatId);
      } else {
        await chatService.deleteMessage(projectId, messageId);
        // Remove from local state
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.filter((msg) => msg.id !== messageId) || [],
          },
        }));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  },

  createChat: async (projectId: string, chatName: string, memberIds: string[]) => {
    try {
      set({ isLoading: true });
      const chat = await chatService.createChat(projectId, { chatName, memberIds });
      set((state) => ({
        chats: [...state.chats, chat],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to create chat:', error);
      set({ isLoading: false });
    }
  },

  connectWebSocket: async (projectId?: string) => {
    try {
      // Fetch the WebSocket token from the backend
      const response = await fetch('/api/proxy/api/auth/ws-token', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch WebSocket token');
        return;
      }

      const { token } = await response.json();
      
      // Connect with the token
      chatWs.connect(token);
      
      // Set up event handlers
      chatWs.on('new_message', get().handleNewMessage);
      chatWs.on('chat_message_notification', get().handleChatMessageNotification);
      chatWs.on('message_updated', get().handleMessageUpdated);
      chatWs.on('message_deleted', get().handleMessageDeleted);
      chatWs.on('user_typing', get().handleUserTyping);
      chatWs.on('user_stopped_typing', get().handleUserStoppedTyping);
      
      set({ isConnected: true });

      // Join project room if projectId provided
      if (projectId) {
        get().joinProject(projectId);
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      set({ isConnected: false });
    }
  },

  disconnectWebSocket: (projectId?: string) => {
    // Leave project room if projectId provided
    if (projectId) {
      get().leaveProject(projectId);
    }

    // Remove event handlers
    chatWs.off('new_message', get().handleNewMessage);
    chatWs.off('chat_message_notification', get().handleChatMessageNotification);
    chatWs.off('message_updated', get().handleMessageUpdated);
    chatWs.off('message_deleted', get().handleMessageDeleted);
    chatWs.off('user_typing', get().handleUserTyping);
    chatWs.off('user_stopped_typing', get().handleUserStoppedTyping);
    
    chatWs.disconnect();
    set({ isConnected: false });
  },

  joinProject: (projectId: string) => {
    chatWs.joinProject(projectId);
  },

  leaveProject: (projectId: string) => {
    chatWs.leaveProject(projectId);
  },

  joinChat: (projectId: string, chatId: string) => {
    chatWs.joinChat(projectId, chatId);
  },

  leaveChat: (chatId: string) => {
    chatWs.leaveChat(chatId);
  },

  startTyping: (chatId: string, userName: string) => {
    chatWs.startTyping(chatId, userName);
  },

  stopTyping: (chatId: string) => {
    chatWs.stopTyping(chatId);
  },

  markAsRead: (projectId: string, chatId: string, messageId: string) => {
    chatWs.markAsRead(projectId, chatId, messageId);
  },

  handleNewMessage: (data: any) => {
    const { message, chatId } = data;
    set((state) => {
      // Auto-open chat if it's not currently open
      const updates: Partial<ChatStore> = {
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), message],
        },
      };

      // If no chat is currently open, automatically open this chat
      if (!state.openChatId) {
        updates.openChatId = chatId;
      }

      return updates;
    });
  },

  handleChatMessageNotification: (data: any) => {
    const { chatId } = data;
    const state = get();

    if (state.openChatId === chatId) {
      // Chat is open, user is viewing it
      return;
    }

    // Mark chat as unread only (don't add to messages array)
    // When user opens the chat, fetchMessages will get all messages in correct order
    set((state) => {
      const newUnreadChats = new Set(state.unreadChats);
      newUnreadChats.add(chatId);
      return { unreadChats: newUnreadChats };
    });
  },

  handleMessageUpdated: (data: any) => {
    const { message, chatId } = data;
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.map((msg) =>
          msg.id === message.id ? message : msg
        ) || [],
      },
    }));
  },

  handleMessageDeleted: (data: any) => {
    const { messageId, chatId } = data;
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: state.messages[chatId]?.filter((msg) => msg.id !== messageId) || [],
      },
    }));
  },

  handleUserTyping: (data: any) => {
    const { chatId, userId } = data;
    set((state) => {
      const typingSet = new Set(state.typingUsers[chatId] || []);
      typingSet.add(userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: typingSet,
        },
      };
    });
  },

  handleUserStoppedTyping: (data: any) => {
    const { chatId, userId } = data;
    set((state) => {
      const typingSet = new Set(state.typingUsers[chatId] || []);
      typingSet.delete(userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: typingSet,
        },
      };
    });
  },
}));
