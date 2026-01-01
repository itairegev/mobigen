import type { SuggestedPrompt } from '@/types';

const suggestions: SuggestedPrompt[] = [
  {
    id: '1',
    title: 'Write Code',
    prompt: 'Help me write a function that',
    icon: '💻',
  },
  {
    id: '2',
    title: 'Explain Concept',
    prompt: 'Explain to me how',
    icon: '📚',
  },
  {
    id: '3',
    title: 'Brainstorm Ideas',
    prompt: 'Help me brainstorm ideas for',
    icon: '💡',
  },
  {
    id: '4',
    title: 'Debug Issue',
    prompt: 'Help me debug this error:',
    icon: '🐛',
  },
];

export function useSuggestions() {
  return {
    suggestions,
  };
}
