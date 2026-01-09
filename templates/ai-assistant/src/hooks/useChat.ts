import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message, Conversation } from '@/types';
import { sendChatMessage, isAIConfigured } from '@/services/ai';
import { useSettings } from './useSettings';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isTyping: boolean;
  error: string | null;

  // Actions
  createConversation: () => string;
  selectConversation: (id: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;
  setTyping: (isTyping: boolean) => void;
  setError: (error: string | null) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial welcome conversation
const getInitialConversation = (): Conversation => ({
  id: '1',
  title: 'Getting Started',
  messages: [
    {
      id: 'm1',
      role: 'assistant',
      content: isAIConfigured()
        ? "Hello! I'm your AI assistant powered by Claude. How can I help you today?"
        : "Hello! I'm your AI assistant. To enable real AI responses, please configure your API key in the app settings.",
      timestamp: new Date(),
      status: 'sent',
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [getInitialConversation()],
      currentConversationId: '1',
      isTyping: false,
      error: null,

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

  setError: (error) => {
    set({ error });
  },
    }),
    {
      name: 'ai-assistant-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);

export function useChat() {
  const store = useChatStore();
  const { settings } = useSettings();

  const currentConversation = store.conversations.find(
    (c) => c.id === store.currentConversationId
  );

  const sendMessage = async (content: string) => {
    // Clear any previous error
    store.setError(null);

    // Add user message
    store.addMessage({ role: 'user', content, status: 'sent' });

    // Show typing indicator
    store.setTyping(true);

    try {
      // Check if AI is configured
      if (!isAIConfigured()) {
        // Fallback to helpful mock response
        await new Promise((resolve) => setTimeout(resolve, 500));
        store.addMessage({
          role: 'assistant',
          content: "I'm currently running in demo mode. To enable real AI responses:\n\n1. Go to Settings\n2. Configure your API key (Claude or OpenAI)\n3. Come back and chat!\n\nIn the meantime, I can still help you test the interface.",
          status: 'sent',
        });
        return;
      }

      // Get current conversation messages for context
      const conversationMessages = currentConversation?.messages || [];
      const allMessages: Message[] = [
        ...conversationMessages,
        {
          id: 'temp',
          role: 'user',
          content,
          timestamp: new Date(),
          status: 'sent',
        },
      ];

      // Call the real AI API
      const response = await sendChatMessage(allMessages, settings);

      // Add AI response
      store.addMessage({
        role: 'assistant',
        content: response.content,
        status: 'sent',
      });

    } catch (error) {
      console.error('AI Error:', error);

      // Set error state
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.setError(errorMessage);

      // Add error message as assistant response
      store.addMessage({
        role: 'assistant',
        content: `I encountered an error: ${errorMessage}\n\nPlease check your API configuration in Settings and try again.`,
        status: 'error',
      });
    } finally {
      store.setTyping(false);
    }
  };

  return {
    conversations: store.conversations,
    currentConversation,
    isTyping: store.isTyping,
    error: store.error,
    isConfigured: isAIConfigured(),
    createConversation: store.createConversation,
    selectConversation: store.selectConversation,
    sendMessage,
    deleteConversation: store.deleteConversation,
    clearAllConversations: store.clearAllConversations,
    clearError: () => store.setError(null),
  };
}
