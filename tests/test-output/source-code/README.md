# TechNews Daily

A modern React Native news reader app built with Expo SDK 52.

## Features

- 📰 Browse latest tech news articles
- 🔍 Discover articles by category
- 🔖 Bookmark articles for later reading
- 👤 User profile and preferences
- 🎨 Modern UI with NativeWind (Tailwind CSS)
- 📱 Responsive design for mobile devices

## Technology Stack

- **React Native** (0.76.0)
- **Expo SDK** (52.0.0)
- **TypeScript** for type safety
- **Expo Router** for navigation
- **NativeWind** for styling (Tailwind CSS)
- **React Query** for server state management
- **Zustand** for client state management
- **Jest** for testing

## Project Structure

```
src/
├── app/                 # App routes (Expo Router)
│   ├── (tabs)/         # Tab navigation
│   └── article/        # Article detail pages
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API and storage services
├── theme/              # Theme configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on specific platform:
   ```bash
   npm run ios
   npm run android
   npm run web
   ```

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Configuration

The app is configured with:
- **Bundle ID**: com.technews.daily.e2e
- **Primary Color**: #2563eb (Blue)
- **Secondary Color**: #059669 (Green)
- **EAS Project ID**: eas-e1390986-d4a0-42e6-a767-1ea5d505b8ae

## Building for Production

Use EAS Build for creating production builds:

```bash
npx eas build --platform all
```