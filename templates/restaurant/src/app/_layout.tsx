import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="menu/[id]"
          options={{
            headerShown: true,
            title: 'Item Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: true,
            title: 'Checkout',
            headerBackTitle: 'Cart',
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{
            headerShown: true,
            title: 'Order Details',
            headerBackTitle: 'Orders',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
