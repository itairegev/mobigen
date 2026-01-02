import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step } from '../types';
import { useState } from 'react';

interface StepByStepProps {
  steps: Step[];
  testID?: string;
}

export function StepByStep({ steps, testID }: StepByStepProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    setCheckedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <View className="mt-6" testID={testID}>
      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        Instructions
      </Text>

      {steps.map((step, index) => {
        const isChecked = checkedSteps.has(step.id);

        return (
          <TouchableOpacity
            key={step.id}
            onPress={() => toggleStep(step.id)}
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            testID={`${testID}-step-${index}`}
          >
            <View className="flex-row items-start">
              <View className="mr-3">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isChecked ? 'bg-secondary-500' : 'bg-primary-500'
                  }`}
                >
                  {isChecked ? (
                    <Ionicons name="checkmark" size={20} color="white" />
                  ) : (
                    <Text className="text-white font-bold">{step.stepNumber}</Text>
                  )}
                </View>
              </View>

              <View className="flex-1">
                <Text
                  className={`text-base leading-6 ${
                    isChecked
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {step.instruction}
                </Text>

                {step.duration && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="timer-outline" size={16} color="#FF6B35" />
                    <Text className="text-sm text-primary-500 ml-1 font-semibold">
                      {step.duration} min
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
