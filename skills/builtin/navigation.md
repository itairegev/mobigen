---
id: navigation
name: Navigation Setup
description: Configure React Navigation with proper TypeScript support and patterns
category: Development
capabilities:
  - navigation
  - routing
  - screen-management
tools:
  - Read
  - Write
  - Edit
compatibleAgents:
  - developer
  - technical-architect
  - lead-developer
parallelizable: false
priority: 9
inputs:
  - name: navigationType
    description: Type of navigation (stack, tabs, drawer)
    type: string
    required: true
  - name: screens
    description: List of screens to include
    type: array
    required: true
outputs:
  - name: navigationPath
    description: Path to navigation configuration
    type: file
---

# Navigation Setup Skill

When setting up navigation, follow these patterns:

## Required Packages

```json
{
  "@react-navigation/native": "^6.x",
  "@react-navigation/native-stack": "^6.x",
  "@react-navigation/bottom-tabs": "^6.x",
  "react-native-screens": "^3.x",
  "react-native-safe-area-context": "^4.x"
}
```

## Type-Safe Navigation

```typescript
// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string };
};

// Main Tabs
export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Declare global navigation type
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

## Navigation Setup

```typescript
// src/navigation/index.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from './types';

// Screens
import { LoginScreen } from '@/screens/Auth/Login';
import { HomeScreen } from '@/screens/Home';
import { ProfileScreen } from '@/screens/Profile';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

export function Navigation() {
  const isAuthenticated = useAuth();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

## Navigation Hook

```typescript
// src/hooks/useTypedNavigation.ts
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';

export function useTypedNavigation<T extends keyof RootStackParamList>() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList, T>>();
}

export function useTypedRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>();
}
```

## Common Patterns

### Deep Linking

```typescript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Profile: 'profile/:userId',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

### Protected Routes

```typescript
function ProtectedScreen({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

## Best Practices

1. **Type Safety**
   - Define param lists for all navigators
   - Use typed hooks for navigation
   - Export screen prop types

2. **Performance**
   - Use native stack navigator
   - Enable screens package
   - Lazy load heavy screens

3. **UX**
   - Configure deep linking
   - Handle authentication state
   - Persist navigation state

4. **Accessibility**
   - Set meaningful screen names
   - Configure header accessibility
   - Support screen reader announcements
