import { io, Socket } from 'socket.io-client';

type ChatEventHandler = (data: any) => void;

export class ChatWebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<ChatEventHandler>> = new Map();
  private isConnecting = false;

  connect(token?: string) {
    // If already connecting or connected with the same auth state, return
    if (this.isConnecting) {
      return;
    }

    // If socket exists and is connected, but we have a new token, disconnect first
    if (this.socket?.connected && token) {
      this.disconnect();
    } else if (this.socket?.connected) {
      // Already connected without new token, no need to reconnect
      return;
    }

    this.isConnecting = true;

    // Connect to the /chat namespace
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4200';

    this.socket = io(`${wsUrl}/chat`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });

    this.socket.on('connect', () => {
      console.log('Chat WebSocket connected', {
        socketId: this.socket?.id,
        connected: this.socket?.connected,
      });
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Chat WebSocket disconnected', {
        reason,
        socketId: this.socket?.id,
      });
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat WebSocket connect_error:', {
        message: error.message,
        description: (error as any)['description'],
        context: (error as any)['context'],
      });
      this.isConnecting = false;
    });

    this.socket.on('error', (error) => {
      console.error('Chat WebSocket error:', error);
      this.emit('error', error);
    });

    // Listen to all chat events
    this.socket.on('joined_chat', (data) => this.emit('joined_chat', data));
    this.socket.on('joined_project', (data) => this.emit('joined_project', data));
    this.socket.on('left_chat', (data) => this.emit('left_chat', data));
    this.socket.on('left_project', (data) => this.emit('left_project', data));
    this.socket.on('new_message', (data) => this.emit('new_message', data));
    this.socket.on('chat_message_notification', (data) =>
      this.emit('chat_message_notification', data),
    );
    this.socket.on('message_updated', (data) => this.emit('message_updated', data));
    this.socket.on('message_deleted', (data) => this.emit('message_deleted', data));
    this.socket.on('user_typing', (data) => this.emit('user_typing', data));
    this.socket.on('user_stopped_typing', (data) => this.emit('user_stopped_typing', data));
    this.socket.on('message_read', (data) => this.emit('message_read', data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventHandlers.clear();
    }
  }

  joinProject(projectId: string) {
    this.socket?.emit('join_project', { projectId });
  }

  leaveProject(projectId: string) {
    this.socket?.emit('leave_project', { projectId });
  }

  joinChat(projectId: string, chatId: string) {
    this.socket?.emit('join_chat', { projectId, chatId });
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', { chatId });
  }

  sendMessage(projectId: string, chatId: string, message: string) {
    this.socket?.emit('send_message', {
      projectId,
      sendMessageDto: {
        chatId,
        message,
      },
    });
  }

  updateMessage(projectId: string, messageId: string, content: string) {
    this.socket?.emit('update_message', {
      projectId,
      messageId,
      updateMessageDto: {
        content,
      },
    });
  }

  deleteMessage(projectId: string, messageId: string, chatId: string) {
    this.socket?.emit('delete_message', {
      projectId,
      messageId,
      chatId,
    });
  }

  startTyping(chatId: string, userName: string) {
    this.socket?.emit('typing_start', { chatId, userName });
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing_stop', { chatId });
  }

  markAsRead(projectId: string, chatId: string, messageId: string) {
    this.socket?.emit('mark_as_read', {
      projectId,
      chatId,
      messageId,
    });
  }

  on(event: string, handler: ChatEventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: ChatEventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const chatWs = new ChatWebSocketService();
