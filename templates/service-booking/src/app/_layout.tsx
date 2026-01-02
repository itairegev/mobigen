import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="services/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="book/staff" />
        <Stack.Screen name="book/datetime" />
        <Stack.Screen name="book/confirm" />
        <Stack.Screen name="appointments/[id]" />
      </Stack>
    </QueryClientProvider>
  );
}
