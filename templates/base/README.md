# Base Template

Minimal React Native starter template for Mobigen.

## Overview

The base template provides a minimal starting point for mobile app generation. It includes essential navigation, theming, and core components without domain-specific features.

## Features

- Tab navigation (Home, Settings)
- Theme system with dark mode
- Core UI components
- TypeScript configuration
- NativeWind styling

## Structure

```
base/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Tab navigator
│   │   ├── index.tsx      # Home tab
│   │   └── settings.tsx   # Settings tab
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry redirect
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Text.tsx
│   └── layout/
│       └── Container.tsx
├── hooks/
│   ├── useTheme.ts
│   └── useColorScheme.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   └── index.ts
├── utils/
│   └── cn.ts
├── app.json
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## Screens

### Home Screen

Basic home screen with welcome message and navigation examples.

### Settings Screen

Settings screen with theme toggle and app information.

## Components

### Button

```tsx
<Button variant="primary" onPress={handlePress}>
  Click Me
</Button>

<Button variant="secondary" size="sm">
  Small Button
</Button>
```

### Card

```tsx
<Card>
  <Text>Card content</Text>
</Card>

<Card variant="elevated">
  <Text>Elevated card</Text>
</Card>
```

### Input

```tsx
<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
/>
```

## Theme

### Colors

```typescript
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6B7280',
};
```

### Dark Mode

The theme automatically switches based on system preference:

```typescript
const { isDark } = useTheme();
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## Customization

### Adding Screens

1. Create screen file in `app/` or `app/(tabs)/`
2. Expo Router automatically handles routing

### Adding Components

1. Create component in `components/`
2. Export from `components/index.ts`

### Modifying Theme

1. Update colors in `theme/colors.ts`
2. Update typography in `theme/typography.ts`

## Use Cases

This template is ideal for:

- Simple utility apps
- Internal tools
- Prototypes
- Apps with custom requirements

## Related Templates

- [ecommerce](../ecommerce/) - For shopping apps
- [loyalty](../loyalty/) - For loyalty programs
- [news](../news/) - For content apps
- [ai-assistant](../ai-assistant/) - For AI chat apps
