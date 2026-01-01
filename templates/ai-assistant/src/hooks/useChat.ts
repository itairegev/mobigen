import { create } from 'zustand';
import type { Message, Conversation } from '@/types';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isTyping: boolean;

  // Actions
  createConversation: () => string;
  selectConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  setTyping: (isTyping: boolean) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const useChatStore = create<ChatState>((set, get) => ({
  conversations: [
    {
      id: '1',
      title: 'Getting Started',
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date(),
          status: 'sent',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  currentConversationId: '1',
  isTyping: false,

  createConversation: () => {
    const id = generateId();
    const newConversation: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: id,
    }));
    return id;
  },

  selectConversation: (id) => {
    set({ currentConversationId: id });
  },

  addMessage: (message) => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return;

    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };

    set({
      conversations: conversations.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              updatedAt: new Date(),
              title:
                conv.messages.length === 0 && message.role === 'user'
                  ? message.content.substring(0, 30) + '...'
                  : conv.title,
            }
          : conv
      ),
    });
  },

  updateMessage: (id, updates) => {
    const { currentConversationId, conversations } = get();
    if (!currentConversationId) return;

    set({
      conversations: conversations.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === id ? { ...msg, ...updates } : msg
              ),
            }
          : conv
      ),
    });
  },

  deleteConversation: (id) => {
    set((state) => {
      const remaining = state.conversations.filter((c) => c.id !== id);
      return {
        conversations: remaining,
        currentConversationId:
          state.currentConversationId === id
            ? remaining[0]?.id || null
            : state.currentConversationId,
      };
    });
  },

  clearAllConversations: () => {
    set({ conversations: [], currentConversationId: null });
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },
}));

export function useChat() {
  const store = useChatStore();

  const currentConversation = store.conversations.find(
    (c) => c.id === store.currentConversationId
  );

  const sendMessage = async (content: string) => {
    // Add user message
    store.addMessage({ role: 'user', content, status: 'sent' });

    // Simulate AI response
    store.setTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Mock AI response
    const responses = [
      "That's a great question! Let me think about that...",
      "I understand what you're asking. Here's my perspective:",
      "Interesting! Based on my knowledge, I would say:",
      "Thanks for sharing that with me. Here's what I think:",
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];

    store.addMessage({
      role: 'assistant',
      content: `${response}\n\nThis is a mock response. In a real implementation, this would connect to an AI API like Claude or GPT to generate intelligent responses based on your message: "${content}"`,
      status: 'sent',
    });

    store.setTyping(false);
  };

  return {
    conversations: store.conversations,
    currentConversation,
    isTyping: store.isTyping,
    createConversation: store.createConversation,
    selectConversation: store.selectConversation,
    sendMessage,
    deleteConversation: store.deleteConversation,
    clearAllConversations: store.clearAllConversations,
  };
}
