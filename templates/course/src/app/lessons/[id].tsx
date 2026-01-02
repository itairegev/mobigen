import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLesson } from '@/hooks/useLessons';
import { useProgress } from '@/hooks/useProgress';
import { VideoPlayer, NotesEditor } from '@/components';
import { CheckCircle, FileText, Download, PlayCircle } from 'lucide-react-native';
import { LessonNote } from '@/types';

export default function LessonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lesson, isLoading } = useLesson(id);
  const { completeLesson } = useProgress();
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [videoProgress, setVideoProgress] = useState(0);

  const handleVideoComplete = () => {
    if (lesson) {
      completeLesson(lesson.courseId, lesson.id);
      Alert.alert(
        'Lesson Complete!',
        'Great job! Ready for the next lesson?',
        [
          { text: 'Take Quiz', onPress: () => router.push(`/quiz/${lesson.id}`) },
          { text: 'Next Lesson', onPress: () => {} },
        ]
      );
    }
  };

  const handleAddNote = (content: string, timestamp: number) => {
    const newNote: LessonNote = {
      id: Date.now().toString(),
      lessonId: id,
      userId: 'user-1',
      content,
      timestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes([...notes, newNote]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId));
  };

  if (isLoading || !lesson) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView className="flex-1">
        {/* Video Player */}
        <VideoPlayer
          source={lesson.videoUrl}
          onProgress={setVideoProgress}
          onComplete={handleVideoComplete}
          testID="lesson-video"
        />

        {/* Lesson Info */}
        <View className="p-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase">
              Lesson {lesson.order}
            </Text>
            <View className="flex-1 mx-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-600"
                style={{ width: `${videoProgress}%` }}
              />
            </View>
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(videoProgress)}%
            </Text>
          </View>

          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {lesson.title}
          </Text>

          <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
            {lesson.description}
          </Text>

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Resources
              </Text>
              {lesson.resources.map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  className="flex-row items-center p-4 mb-2 bg-gray-50 dark:bg-slate-800 rounded-xl"
                  testID={`resource-${resource.id}`}
                >
                  {resource.type === 'pdf' ? (
                    <FileText size={20} color="#6366f1" />
                  ) : resource.type === 'link' ? (
                    <PlayCircle size={20} color="#6366f1" />
                  ) : (
                    <Download size={20} color="#6366f1" />
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">
                      {resource.title}
                    </Text>
                    <Text className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                      {resource.type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notes */}
          <NotesEditor
            notes={notes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            currentTimestamp={Math.floor((videoProgress / 100) * lesson.duration * 60)}
            testID="lesson-notes"
          />
        </View>
      </ScrollView>

      {/* Complete Lesson Button */}
      <View className="p-6 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={handleVideoComplete}
          className="bg-green-600 p-4 rounded-xl flex-row items-center justify-center"
          testID="complete-lesson-button"
        >
          <CheckCircle size={24} color="#fff" />
          <Text className="text-white text-lg font-bold ml-2">
            Mark as Complete
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
