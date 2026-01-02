import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="games/[id]" options={{ headerShown: true, title: 'Game Details' }} />
        <Stack.Screen name="players/[id]" options={{ headerShown: true, title: 'Player Profile' }} />
        <Stack.Screen name="shop" options={{ headerShown: true, title: 'Team Shop' }} />
      </Stack>
    </QueryClientProvider>
  );
}
