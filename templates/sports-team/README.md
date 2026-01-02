# Sports Team / Fan Club App Template

A complete React Native + Expo mobile app template for sports teams and fan clubs, built for Mobigen.

## Features

### Core Functionality
- **Game Schedule**: View upcoming games, live scores, and past results
- **Team Roster**: Browse players by position with detailed stats
- **News Feed**: Latest team news, match reports, and announcements
- **League Standings**: Real-time league table with team statistics
- **Team Shop**: Official merchandise store
- **Fan Profile**: Personalized settings and notifications

### Screens

#### Tab Navigation
1. **Home** (`(tabs)/index.tsx`)
   - Next game preview
   - Recent results
   - League standings
   - Latest news highlights

2. **Schedule** (`(tabs)/schedule.tsx`)
   - Full game schedule
   - Filter by upcoming/completed
   - Game cards with scores and venue info

3. **Roster** (`(tabs)/roster.tsx`)
   - Team roster with player cards
   - Filter by position (Goalkeeper, Defender, Midfielder, Forward)
   - Player photos, stats, and jersey numbers

4. **News** (`(tabs)/news.tsx`)
   - News feed with articles
   - Filter by category (match reports, transfers, injuries, interviews)
   - Rich article previews with images

5. **Profile** (`(tabs)/profile.tsx`)
   - Fan profile and settings
   - Notification preferences
   - Quick links to shop and favorites

#### Detail Screens
- **Game Detail** (`games/[id].tsx`)
  - Full scoreboard with period breakdown
  - Match statistics
  - Broadcast information
  - Ticket purchasing

- **Player Profile** (`players/[id].tsx`)
  - Player biography
  - Season statistics
  - Physical attributes
  - Social media links

- **Team Shop** (`shop.tsx`)
  - Merchandise catalog
  - Featured products
  - Product details and pricing

### Components

- **GameCard**: Game preview with teams, scores, and status
- **PlayerCard**: Player card with photo, stats, and position
- **ScoreBoard**: Live/final score display with period breakdown
- **NewsItem**: News article preview (card or list variant)
- **StandingsTable**: League table with team standings
- **StatsGrid**: Flexible statistics display grid

### Mock Data

The template includes realistic mock data:
- **10 Games**: Mix of upcoming, live, and completed matches
- **15 Players**: Complete roster with varied positions and stats
- **8 News Articles**: Various categories and recent dates
- **6 Teams**: League standings with realistic records
- **8 Products**: Merchandise with images and pricing

### Customization

#### Team Branding
Edit `src/theme/colors.ts`:
```typescript
team: {
  primary: '#1e40af',    // Main team color
  secondary: '#ef4444',  // Secondary color
  accent: '#fbbf24',     // Accent color (gold/yellow)
}
```

#### Team Information
Update team data in `src/services/teams.ts`:
- Team name, logo, and city
- Team colors and abbreviation

#### Mock Data
Customize mock data in `src/services/`:
- `games.ts` - Game schedule and results
- `players.ts` - Team roster
- `news.ts` - News articles
- `standings.ts` - League table
- `shop.ts` - Merchandise

## Tech Stack

- **Framework**: React Native 0.76.5 + Expo 52
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: TanStack Query + Zustand
- **Type Safety**: TypeScript
- **Icons**: Lucide React Native
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

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
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### E2E Testing

The template includes Maestro E2E tests:

```bash
# Run view schedule flow
maestro test .maestro/view-schedule.yaml

# Run player profile flow
maestro test .maestro/player-profile.yaml
```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home
│   │   ├── schedule.tsx   # Schedule
│   │   ├── roster.tsx     # Roster
│   │   ├── news.tsx       # News
│   │   └── profile.tsx    # Profile
│   ├── games/[id].tsx     # Game detail
│   ├── players/[id].tsx   # Player profile
│   └── shop.tsx           # Team shop
├── components/            # Reusable components
├── hooks/                 # Custom React hooks
├── services/              # Mock data services
├── theme/                 # Theme configuration
├── types/                 # TypeScript definitions
└── global.css            # Global styles
```

## Backend Integration

To connect to a real backend:

1. Replace mock services in `src/services/` with API calls
2. Update hooks to use your API endpoints
3. Add authentication if needed
4. Configure environment variables for API URLs

Example API service structure:
```typescript
// src/services/api.ts
export async function getGames() {
  const response = await fetch('https://api.yourteam.com/games');
  return response.json();
}
```

## Deployment

### Build for Production

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

### EAS Build

Configure `eas.json` and run:
```bash
eas build --platform ios
eas build --platform android
```

## Customization Tips

1. **Change Team Colors**: Edit `tailwind.config.js` and `src/theme/colors.ts`
2. **Update Team Logo**: Replace images in mock data URLs
3. **Add More Stats**: Extend types in `src/types/index.ts` and update components
4. **Modify Positions**: Update `PlayerPosition` type for your sport
5. **Add Social Features**: Implement fan forums, polls, or fantasy features

## License

MIT

## Support

For questions or issues, please contact the Mobigen team.
