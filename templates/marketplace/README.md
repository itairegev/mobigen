# Marketplace Template

A complete local marketplace app template for buying and selling items locally.

## Features

- **Browse Listings**: Grid view of all listings with search and category filtering
- **Categories**: 8 categories for organizing items (Electronics, Furniture, Fashion, Sports, Home & Garden, etc.)
- **Listing Details**: Full listing view with image carousel, seller information, and contact options
- **Create Listing**: Multi-step form with image upload, pricing, categorization, and condition selection
- **Favorites**: Save listings for later viewing
- **Messaging**: In-app chat with sellers about listings
- **Seller Profiles**: View seller ratings and active listings
- **My Listings**: Manage your active listings

## Screens

### Tab Navigation
- **Home** - Recent listings grid with search and quick category filters
- **Categories** - Browse by category with filtering
- **Messages** - Conversations with other users
- **Favorites** - Saved listings
- **Profile** - User profile and account settings

### Detail Screens
- **Listing Detail** - Full listing with images, description, and seller info
- **Create Listing** - Form to create a new listing
- **Conversation** - Chat thread with another user
- **My Listings** - Manage your active listings

## Components

- `ListingCard` - Listing preview with image, price, location, and condition badge
- `CategoryGrid` - Grid of category tiles with icons
- `SellerCard` - Seller information with avatar, rating, and stats
- `ChatBubble` - Message bubble for conversations
- `ImageUploader` - Multi-image upload with preview
- `PriceInput` - Currency input with dollar sign
- `ConditionBadge` - Visual badge for item condition

## Mock Data

- **20 realistic listings** across multiple categories
- **8 categories** with icons and colors
- **4 sellers** with profiles and ratings
- **3 conversations** with message history

## Technology Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **NativeWind** (Tailwind CSS) for styling
- **Zustand** for favorites state management
- **TanStack Query** for data fetching
- **TypeScript** for type safety
- **Expo Image Picker** for photo uploads
- **Lucide Icons** for UI icons

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

## E2E Tests

Three critical user flows with Maestro:

1. **browse-listings.yaml** - Browse and search listings, navigate categories
2. **create-listing.yaml** - Create a new listing with details
3. **contact-seller.yaml** - Contact seller and manage favorites

Run tests:
```bash
maestro test .maestro/
```

## Customization Points

### Theme Colors
Edit `src/theme/colors.ts`:
- Primary: Teal (#14b8a6) - Main brand color
- Secondary: Orange (#f97316) - Accent color

### Categories
Modify `src/services/categories.ts` to add/remove/customize categories

### Listing Fields
Extend the `Listing` type in `src/types/index.ts` to add custom fields

### Mock Data
Update `src/services/listings.ts` to customize sample listings

## Backend Integration

To connect to a real backend:

1. Update `src/services/api.ts` with your API URL
2. Replace mock functions in `src/services/listings.ts` with real API calls
3. Configure authentication in the Profile screen
4. Set up image upload to cloud storage (S3, Cloudinary, etc.)
5. Implement real-time messaging with WebSockets or Firebase

## White-Label Configuration

This template supports full white-labeling:

- Update `app.json` for app name, bundle ID, and branding
- Replace assets in `/assets` folder
- Customize colors in `tailwind.config.js` and `src/theme/colors.ts`

## License

MIT
