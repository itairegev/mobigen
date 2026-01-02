import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sessions/[id]" options={{ headerShown: true, title: 'Session Details' }} />
        <Stack.Screen name="speakers/[id]" options={{ headerShown: true, title: 'Speaker Profile' }} />
        <Stack.Screen name="sponsors" options={{ headerShown: true, title: 'Our Sponsors' }} />
        <Stack.Screen name="map" options={{ headerShown: true, title: 'Venue Map' }} />
        <Stack.Screen name="agenda" options={{ headerShown: true, title: 'My Agenda' }} />
      </Stack>
    </QueryClientProvider>
  );
}
