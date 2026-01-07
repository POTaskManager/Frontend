import { Chat, ChatMessage } from '@/types';

const API_BASE = '/api/proxy/api/projects';

export interface CreateChatDto {
  chatName: string;
  memberIds: string[];
}

export interface SendMessageDto {
  chatId: string;
  message: string;
  fileIds?: string[];
}

export interface UpdateMessageDto {
  content: string;
}

export const chatService = {
  async createChat(projectId: string, dto: CreateChatDto): Promise<Chat> {
    const res = await fetch(`${API_BASE}/${projectId}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      throw new Error('Failed to create chat');
    }

    return res.json();
  },

  async getUserChats(projectId: string): Promise<Chat[]> {
    const res = await fetch(`${API_BASE}/${projectId}/chats`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch chats');
    }

    return res.json();
  },

  async getChatHistory(
    projectId: string,
    chatId: string,
    limit = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(before && { before }),
    });

    const res = await fetch(
      `${API_BASE}/${projectId}/chats/${chatId}/messages?${params}`,
      {
        credentials: 'include',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch chat history');
    }

    return res.json();
  },

  async sendMessage(
    projectId: string,
    dto: SendMessageDto
  ): Promise<ChatMessage> {
    const res = await fetch(`${API_BASE}/${projectId}/chats/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      throw new Error('Failed to send message');
    }

    return res.json();
  },

  async updateMessage(
    projectId: string,
    messageId: string,
    dto: UpdateMessageDto
  ): Promise<ChatMessage> {
    const res = await fetch(
      `${API_BASE}/${projectId}/chats/messages/${messageId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dto),
      }
    );

    if (!res.ok) {
      throw new Error('Failed to update message');
    }

    return res.json();
  },

  async deleteMessage(projectId: string, messageId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/${projectId}/chats/messages/${messageId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to delete message');
    }
  },

  async markAsRead(
    projectId: string,
    chatId: string,
    messageId: string
  ): Promise<void> {
    const res = await fetch(
      `${API_BASE}/${projectId}/chats/${chatId}/read/${messageId}`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to mark as read');
    }
  },
};
