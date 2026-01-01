export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
}

export interface UserSettings {
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  voiceEnabled: boolean;
  hapticFeedback: boolean;
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  prompt: string;
  icon: string;
}
