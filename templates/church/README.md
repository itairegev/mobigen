# Church & Religious Organization Template

A complete mobile app template for churches and religious organizations, built with React Native and Expo.

## Features

### 📖 Sermon Library
- Browse sermons by series
- Watch video sermons
- Listen to audio sermons
- View sermon notes and scripture references
- Recent sermons on home screen

### 📅 Event Calendar
- Upcoming and past events
- Event categories (service, youth, community, outreach, etc.)
- Event registration
- Event details with location and time

### 💝 Online Giving
- Multiple giving funds
- One-time or recurring donations
- Fund progress tracking
- Secure payment processing
- Donation history

### 🙏 Prayer Requests
- Submit prayer requests
- Pray for others
- Public and private requests
- Prayer categories
- Prayer count tracking

### 👥 Small Groups
- Browse available groups
- Group categories (Bible study, youth, men, women, etc.)
- Meeting details (day, time, location)
- Member count and capacity
- Leader contact information

### 📢 Announcements
- Priority-based announcements
- Rich media support
- Call-to-action buttons
- Expiration dates

## Tech Stack

- **Framework**: React Native + Expo 52
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: TanStack Query + Zustand
- **Icons**: Lucide React Native
- **Media**: Expo AV for video/audio playback

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
src/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/            # Tab screens
│   ├── sermons/[id].tsx   # Sermon detail
│   ├── events/[id].tsx    # Event detail
│   ├── prayer.tsx         # Prayer requests
│   └── groups.tsx         # Small groups
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── services/             # API and data services
├── types/                # TypeScript types
├── theme/                # Theme configuration
└── utils/                # Utility functions
```

## Customization

### Theme Colors

Edit `src/theme/colors.ts` to customize the color scheme:

```typescript
export const colors = {
  light: {
    primary: '#1e40af',    // Deep blue
    gold: '#f59e0b',       // Warm gold accent
    // ... other colors
  },
};
```

### Mock Data

All mock data is in `src/services/`:
- `sermons.ts` - Sermon and series data
- `events.ts` - Event data
- `groups.ts` - Small group data
- `prayers.ts` - Prayer request data
- `giving.ts` - Giving fund data

## Backend Integration

This template uses mock data by default. To connect to a real backend:

1. Update the API client in `src/services/api.ts`
2. Replace mock functions with real API calls
3. Configure the API URL in `app.json` or environment variables

## Testing

E2E tests are written in Maestro:

```bash
# Run all tests
maestro test .maestro/

# Run specific test
maestro test .maestro/view-sermons.yaml
```

## Deployment

### Build for iOS

```bash
eas build --platform ios
```

### Build for Android

```bash
eas build --platform android
```

## License

MIT License - Built with Mobigen
