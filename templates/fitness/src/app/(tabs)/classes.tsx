import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { ClassCard } from '@/components';
import { useClasses } from '@/hooks';
import { ClassCategory, ClassDifficulty } from '@/types';

export default function ClassesScreen() {
  const [category, setCategory] = useState<ClassCategory>('all');
  const [difficulty, setDifficulty] = useState<ClassDifficulty>('all');

  const { data: classes, isLoading } = useClasses(
    category === 'all' ? undefined : category,
    difficulty === 'all' ? undefined : difficulty
  );

  const categories: ClassCategory[] = [
    'all',
    'yoga',
    'hiit',
    'strength',
    'cardio',
    'pilates',
    'spin',
    'crossfit',
  ];

  const difficulties: ClassDifficulty[] = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Category Filter */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-sm font-medium text-gray-700 mb-3">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full ${
                  category === cat
                    ? 'bg-primary-500'
                    : 'bg-gray-100'
                }`}
                testID={`filter-category-${cat}`}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    category === cat ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Difficulty Filter */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-sm font-medium text-gray-700 mb-3">Difficulty</Text>
          <View className="flex-row gap-2">
            {difficulties.map((diff) => (
              <TouchableOpacity
                key={diff}
                onPress={() => setDifficulty(diff)}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  difficulty === diff
                    ? 'bg-secondary-500'
                    : 'bg-gray-100'
                }`}
                testID={`filter-difficulty-${diff}`}
              >
                <Text
                  className={`text-sm font-medium text-center capitalize ${
                    difficulty === diff ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {diff}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Classes List */}
        <View className="p-6">
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#10b981" />
              <Text className="text-gray-600 mt-4">Loading classes...</Text>
            </View>
          ) : classes && classes.length > 0 ? (
            <>
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                {classes.length} {classes.length === 1 ? 'Class' : 'Classes'} Available
              </Text>
              {classes.map((fitnessClass) => (
                <ClassCard
                  key={fitnessClass.id}
                  fitnessClass={fitnessClass}
                  onPress={() => router.push(`/classes/${fitnessClass.id}`)}
                  testID={`class-card-${fitnessClass.id}`}
                />
              ))}
            </>
          ) : (
            <View className="py-20 items-center">
              <Text className="text-gray-600 text-center">
                No classes found matching your filters
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCategory('all');
                  setDifficulty('all');
                }}
                className="mt-4 bg-primary-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
