import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="pets/[id]"
            options={{
              title: 'Pet Details',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="pets/add"
            options={{
              title: 'Add New Pet',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen
            name="book"
            options={{
              title: 'Book Appointment',
              headerBackTitle: 'Cancel',
            }}
          />
          <Stack.Screen
            name="articles"
            options={{
              title: 'Pet Care Articles',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
