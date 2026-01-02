# Community Template

A membership community app template for Mobigen, similar to Discord/Patreon communities.

## Features

- **Feed**: Browse posts from community members with reactions and comments
- **Events**: Discover and RSVP to virtual and in-person community events
- **Members**: Search and connect with other community members
- **Direct Messages**: Chat with community members
- **Membership Tiers**: Support for Free, Supporter, Premium, and VIP tiers
- **Rich Interactions**: Multiple reaction types (like, heart, fire, celebrate, insightful)

## Screens

### Tabs
- **Home** (`(tabs)/index.tsx`): Community feed with posts
- **Events** (`(tabs)/events.tsx`): Upcoming community events
- **Members** (`(tabs)/members.tsx`): Member directory with search
- **Messages** (`(tabs)/messages.tsx`): Direct message conversations
- **Profile** (`(tabs)/profile.tsx`): User profile and settings

### Detail Screens
- **Post Detail** (`posts/[id].tsx`): Full post with comments and reactions
- **Create Post** (`posts/create.tsx`): Create new post with images
- **Event Detail** (`events/[id].tsx`): Event details with RSVP
- **Conversation** (`messages/[id].tsx`): Message thread

## Components

- `PostCard`: Post with author, content, images, and reactions
- `CommentThread`: Comments list with nested replies
- `EventCard`: Event preview with date, location, and attendee count
- `MemberCard`: Member profile card with tier badge
- `TierBadge`: Membership tier indicator
- `CreatePostForm`: Rich post creation form
- `ReactionBar`: Reaction selector with multiple types

## Mock Data

- **Posts**: 15 varied posts with realistic content
- **Members**: 20 members across different tiers
- **Events**: 5 upcoming events (virtual and in-person)
- **Comments**: Sample comments with reactions

## Membership Tiers

| Tier | Badge | Color |
|------|-------|-------|
| Free | CircleDot | Gray |
| Supporter | Heart | Blue |
| Premium | Star | Pink |
| VIP | Crown | Orange |

## Tech Stack

- React Native + Expo
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS)
- TanStack Query (data fetching)
- Zustand (state management for messages)
- TypeScript
- Lucide React Native (icons)

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

## Testing

End-to-end tests are located in `.maestro/`:

```bash
# View feed flow
maestro test .maestro/view-feed.yaml

# Create post flow
maestro test .maestro/create-post.yaml

# Join event flow
maestro test .maestro/join-event.yaml
```

## Customization

### Brand Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
primary: {
  500: '#ec4899',  // Pink
},
secondary: {
  500: '#3b82f6',  // Blue
},
```

### Membership Tiers
Modify tier definitions in `src/types/index.ts` and update tier colors in `src/utils/index.ts`.

### Mock Data
Update mock data in `src/services/`:
- `posts.ts`: Community posts and comments
- `members.ts`: Member profiles
- `events.ts`: Community events

## Bundle IDs

- iOS: `com.mobigen.community`
- Android: `com.mobigen.community`

## Version

1.0.0
