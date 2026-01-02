import '@/global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="courses/[id]"
          options={{
            title: 'Course Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="lessons/[id]"
          options={{
            title: 'Lesson',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="quiz/[id]"
          options={{
            title: 'Quiz',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
