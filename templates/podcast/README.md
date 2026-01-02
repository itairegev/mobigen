# Podcast & Creator Hub Template

A complete podcast app with audio player, exclusive content, and community features.

## Features

### Core Features
- **Episode Browser**: Search and filter through all episodes
- **Audio Player**: Full-featured audio player with background playback
- **Playback Controls**: Play/pause, skip forward/backward, speed control (0.5x - 2x)
- **Progress Tracking**: Visual progress slider with time display
- **Exclusive Content**: Subscriber-only episodes with access control
- **Community**: Discussion feed with comments and engagement
- **Show Notes**: Detailed episode notes with timestamps and resources
- **Mini Player**: Persistent player across all screens

### Player Features
- Background audio playback
- Customizable skip intervals (15s backward, 30s forward)
- Variable playback speed (0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x)
- Progress slider for seeking
- Episode artwork display
- Full-screen player view

### Screens
- **Home**: Latest and featured episodes
- **Episodes**: Complete episode library with search
- **Exclusives**: Subscriber-only content
- **Community**: User discussions and engagement
- **Profile**: Settings and preferences
- **Episode Detail**: Full episode information with show notes
- **Player**: Full-screen audio player

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Audio**: Expo AV
- **Storage**: Expo Secure Store

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Expo Go app (for testing)

### Installation

```bash
npm install
```

### Development

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# E2E tests (Maestro)
maestro test .maestro/
```

## Project Structure

```
podcast/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Home
│   │   │   ├── episodes.tsx   # All episodes
│   │   │   ├── exclusives.tsx # Subscriber content
│   │   │   ├── community.tsx  # Community feed
│   │   │   └── profile.tsx    # User profile
│   │   ├── episodes/
│   │   │   └── [id].tsx       # Episode detail
│   │   └── player.tsx         # Full player
│   │
│   ├── components/            # Reusable components
│   │   ├── EpisodeCard.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── MiniPlayer.tsx
│   │   ├── PlaybackControls.tsx
│   │   ├── ProgressSlider.tsx
│   │   ├── PlaybackSpeed.tsx
│   │   └── ShowNotes.tsx
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useEpisodes.ts
│   │   ├── usePlayer.ts
│   │   ├── usePlayback.ts
│   │   ├── useDownloads.ts
│   │   └── useTheme.ts
│   │
│   ├── services/              # Data & API services
│   │   ├── episodes.ts        # Episode data
│   │   ├── player.ts          # Audio playback
│   │   ├── api.ts
│   │   └── storage.ts
│   │
│   ├── types/                 # TypeScript types
│   ├── theme/                 # Theme configuration
│   └── utils/                 # Utility functions
│
├── .maestro/                  # E2E tests
│   ├── browse-episodes.yaml
│   └── play-episode.yaml
│
├── app.json
├── package.json
└── tailwind.config.js
```

## Mock Data

The template includes 14 realistic podcast episodes across 3 series:
- **Tech Talks Daily** (6 episodes): AI, quantum computing, scalability, security, WebAssembly, mobile dev
- **Creative Minds** (5 episodes): Accessibility, typography, color theory, motion design, design systems
- **Business Insights** (3 episodes): Startup journey, remote work, sustainability

Each episode includes:
- Title and description
- Duration (35-55 minutes)
- Detailed show notes with timestamps
- Resources and links
- Guest information
- Season and episode numbers

## Customization

### Colors
Edit `src/theme/colors.ts` to customize the color scheme:
- Primary: Purple (#8b5cf6)
- Secondary: Pink (#ec4899)
- Player background: Dark indigo (#1e1b4b)

### Playback Settings
Default settings in `usePlayer` hook:
- Speed: 1x
- Skip forward: 30s
- Skip backward: 15s

### Bundle ID
Update in `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.podcast"
  },
  "android": {
    "package": "com.yourcompany.podcast"
  }
}
```

## Features to Implement

The template is designed to work with mock data. To connect to a real backend:

1. **Update API Service**: Replace mock calls in `src/services/episodes.ts`
2. **Add Authentication**: Implement user login for exclusive content
3. **Add Downloads**: Implement actual episode downloading with Expo FileSystem
4. **Add Comments**: Connect community features to backend
5. **Add Analytics**: Track plays, favorites, and user behavior

## Building for Production

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

## License

MIT

## Credits

Built with [Mobigen](https://mobigen.io) - Mobile apps made easy.
