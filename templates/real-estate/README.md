# Real Estate App Template

A comprehensive real estate mobile app built with React Native, Expo, and NativeWind. Features property listings, advanced search, tour scheduling, and mortgage calculator.

## Features

- **Property Listings**: Browse beautiful property listings with high-quality images
- **Advanced Search**: Filter by type, price, bedrooms, bathrooms, and location
- **Saved Properties**: Save your favorite properties for later viewing
- **Property Details**: View detailed information, features, and amenities
- **Image Gallery**: Full-screen image viewer with swipe navigation
- **Tour Scheduling**: Schedule property viewings with date and time selection
- **Mortgage Calculator**: Calculate monthly payments with customizable parameters
- **Agent Contact**: Connect with listing agents via phone or email
- **Map Integration**: View property locations and get directions
- **Responsive Design**: Professional UI with green/navy color scheme

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand for local state, TanStack Query for server state
- **Storage**: Expo SecureStore for saved properties and tours
- **Icons**: Lucide React Native
- **TypeScript**: Full type safety

## Project Structure

```
real-estate/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Home screen
│   │   │   ├── search.tsx     # Search & filters
│   │   │   ├── saved.tsx      # Saved properties
│   │   │   └── profile.tsx    # User profile
│   │   ├── properties/
│   │   │   └── [id].tsx       # Property detail
│   │   ├── schedule-tour.tsx  # Tour scheduling
│   │   ├── calculator.tsx     # Mortgage calculator
│   │   └── contact.tsx        # Contact agent
│   │
│   ├── components/            # Reusable components
│   │   ├── PropertyCard.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── MortgageCalc.tsx
│   │   ├── TourScheduler.tsx
│   │   ├── AgentCard.tsx
│   │   ├── PropertyDetails.tsx
│   │   └── MapView.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useProperties.ts
│   │   ├── useSaved.ts
│   │   ├── useSearch.ts
│   │   └── useTours.ts
│   │
│   ├── services/              # Mock data & API
│   │   ├── properties.ts      # 15 realistic properties
│   │   ├── api.ts
│   │   └── storage.ts
│   │
│   ├── types/                 # TypeScript definitions
│   ├── theme/                 # Colors and styling
│   └── utils/                 # Helper functions
│
└── .maestro/                  # E2E tests
    ├── search-properties.yaml
    ├── view-property.yaml
    ├── schedule-tour.yaml
    └── mortgage-calculator.yaml
```

## Mock Data

The template includes 15 realistic property listings with:
- Varied property types (house, apartment, condo, townhouse, commercial)
- Different price ranges ($485K - $4.5M)
- Multiple locations (Seattle, Portland, Bellevue, etc.)
- High-quality Unsplash images
- Detailed descriptions and features

## Key Components

### PropertyCard
Displays property information in a card format with image, price, location, and key stats (beds, baths, sqft).

### ImageGallery
Full-screen image viewer with horizontal scrolling and modal view.

### FilterPanel
Advanced filtering UI for property type, status, price range, bedrooms, and bathrooms.

### MortgageCalc
Interactive mortgage calculator with real-time calculations for monthly payments, total interest, and loan details.

### TourScheduler
Date and time selection interface for scheduling property tours with contact form.

### AgentCard
Agent profile card with contact information, ratings, and call/email actions.

## Customization

### Colors
Edit `src/theme/colors.ts` to change the color scheme:
- Primary: Green (#22c55e)
- Secondary: Navy (#0ea5e9)

### Mock Data
Update `src/services/properties.ts` to modify property listings and agent information.

### Features
Add or remove property features in the Property type definition in `src/types/index.ts`.

## Testing

Run E2E tests with Maestro:

```bash
maestro test .maestro/search-properties.yaml
maestro test .maestro/view-property.yaml
maestro test .maestro/schedule-tour.yaml
maestro test .maestro/mortgage-calculator.yaml
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npm run typecheck

# Lint
npm run lint
```

## Backend Integration

To connect to a real backend:

1. Update `src/services/api.ts` with your API endpoint
2. Replace mock data functions in `src/services/properties.ts` with real API calls
3. Update the query keys in `src/hooks/useProperties.ts` for cache invalidation
4. Add authentication in `src/hooks/useAuth.ts` (create if needed)

## Future Enhancements

- Map integration with react-native-maps
- User authentication and profiles
- Real-time chat with agents
- Virtual tours with 360° images
- Neighborhood insights and statistics
- Home value estimator
- Notification system for price drops
- Integration with MLS listings

## License

MIT
