import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="homework/[id]" options={{ headerShown: true, title: 'Assignment Details' }} />
        <Stack.Screen name="announcements" options={{ headerShown: true, title: 'All Announcements' }} />
        <Stack.Screen name="resources" options={{ headerShown: true, title: 'Study Resources' }} />
        <Stack.Screen name="messages" options={{ headerShown: true, title: 'Messages' }} />
      </Stack>
    </QueryClientProvider>
  );
}
