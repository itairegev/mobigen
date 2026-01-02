import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recipes/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Recipe Details',
            headerStyle: {
              backgroundColor: '#FF6B35',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            headerShown: true,
            headerTitle: 'Favorite Recipes',
            headerStyle: {
              backgroundColor: '#FF6B35',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack>
    </>
  );
}
