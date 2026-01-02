import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="listings/[id]"
          options={{
            headerShown: true,
            title: 'Listing Details',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="listings/create"
          options={{
            headerShown: true,
            title: 'Create Listing',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="messages/[id]"
          options={{
            headerShown: true,
            title: 'Chat',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="my-listings"
          options={{
            headerShown: true,
            title: 'My Listings',
            presentation: 'card',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
