import { View, TouchableOpacity, Text } from 'react-native';
import { Heart, Flame, Sparkles, Lightbulb } from 'lucide-react-native';
import { ReactionType } from '../types';

interface ReactionBarProps {
  onReaction: (type: ReactionType) => void;
  selectedReactions?: ReactionType[];
  testID?: string;
}

export function ReactionBar({ onReaction, selectedReactions = [], testID }: ReactionBarProps) {
  const reactions: { type: ReactionType; icon: any; label: string }[] = [
    { type: 'like', icon: Heart, label: 'Like' },
    { type: 'heart', icon: Heart, label: 'Love' },
    { type: 'fire', icon: Flame, label: 'Fire' },
    { type: 'celebrate', icon: Sparkles, label: 'Celebrate' },
    { type: 'insightful', icon: Lightbulb, label: 'Insightful' },
  ];

  return (
    <View testID={testID} className="flex-row gap-3 py-2">
      {reactions.map(({ type, icon: Icon, label }) => {
        const isSelected = selectedReactions.includes(type);
        return (
          <TouchableOpacity
            key={type}
            testID={`reaction-${type}`}
            className={`flex-row items-center gap-1 px-3 py-2 rounded-full ${
              isSelected
                ? 'bg-primary-100 dark:bg-primary-900'
                : 'bg-gray-100 dark:bg-slate-700'
            }`}
            onPress={() => onReaction(type)}
          >
            <Icon
              size={18}
              color={isSelected ? '#ec4899' : '#64748b'}
            />
            <Text
              className={`text-xs ${
                isSelected
                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
