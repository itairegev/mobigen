import { create } from 'zustand';
import type { UserSettings, AIModel } from '@/types';

const availableModels: AIModel[] = [
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Best balance of speed and intelligence',
    contextWindow: 200000,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most capable for complex tasks',
    contextWindow: 200000,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fastest for simple tasks',
    contextWindow: 200000,
  },
];

interface SettingsState extends UserSettings {
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: UserSettings = {
  selectedModel: 'claude-3-sonnet',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'You are a helpful AI assistant.',
  voiceEnabled: false,
  hapticFeedback: true,
};

const useSettingsStore = create<SettingsState>((set) => ({
  ...defaultSettings,

  updateSettings: (updates) => {
    set((state) => ({ ...state, ...updates }));
  },

  resetToDefaults: () => {
    set(defaultSettings);
  },
}));

export function useSettings() {
  const store = useSettingsStore();

  const currentModel = availableModels.find(
    (m) => m.id === store.selectedModel
  ) || availableModels[0];

  return {
    settings: {
      selectedModel: store.selectedModel,
      temperature: store.temperature,
      maxTokens: store.maxTokens,
      systemPrompt: store.systemPrompt,
      voiceEnabled: store.voiceEnabled,
      hapticFeedback: store.hapticFeedback,
    },
    currentModel,
    availableModels,
    updateSettings: store.updateSettings,
    resetToDefaults: store.resetToDefaults,
  };
}
