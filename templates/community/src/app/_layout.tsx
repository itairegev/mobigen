import '../global.css';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="posts/[id]"
          options={{
            title: 'Post',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="posts/create"
          options={{
            title: 'Create Post',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="events/[id]"
          options={{
            title: 'Event',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="messages/[id]"
          options={{
            title: 'Messages',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
