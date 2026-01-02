import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sermons/[id]" options={{ headerShown: true, title: 'Sermon' }} />
        <Stack.Screen name="events/[id]" options={{ headerShown: true, title: 'Event' }} />
        <Stack.Screen name="prayer" options={{ headerShown: true, title: 'Prayer Requests' }} />
        <Stack.Screen name="groups" options={{ headerShown: true, title: 'Small Groups' }} />
      </Stack>
    </QueryClientProvider>
  );
}
