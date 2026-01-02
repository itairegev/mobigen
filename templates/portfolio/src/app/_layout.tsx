import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="projects/[id]"
          options={{
            headerShown: true,
            title: 'Project Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="services"
          options={{
            headerShown: true,
            title: 'Services',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="testimonials"
          options={{
            headerShown: true,
            title: 'Testimonials',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
