import { create } from 'zustand';
import { Conversation, Message } from '../types';

interface MessagesStore {
  conversations: Conversation[];
  selectedConversation: string | null;
  selectConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
}

export const useMessages = create<MessagesStore>((set) => ({
  conversations: [],
  selectedConversation: null,
  selectConversation: (id) => set({ selectedConversation: id }),
  sendMessage: (conversationId, content) => {
    // Mock implementation
    console.log('Sending message:', conversationId, content);
  },
}));
