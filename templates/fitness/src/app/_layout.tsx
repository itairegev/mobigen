import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="classes/[id]"
          options={{
            title: 'Class Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="workouts/[id]"
          options={{
            title: 'Workout Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="exercises/[id]"
          options={{
            title: 'Exercise Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="log-workout"
          options={{
            title: 'Log Workout',
            presentation: 'modal',
            headerBackTitle: 'Cancel',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
