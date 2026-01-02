# Event/Conference Template

A complete event and conference management app built with React Native and Expo.

## Features

- 📅 **Full Schedule** - Browse all conference sessions by track and time
- 🎤 **Speaker Profiles** - Detailed information about all speakers
- 👥 **Networking** - Connect with other attendees
- 🏢 **Sponsors** - Showcase event sponsors by tier
- ⭐ **Personal Agenda** - Save sessions to your personalized agenda
- 🗺️ **Venue Map** - Navigate the conference venue
- 🔔 **Reminders** - Set reminders for your favorite sessions

## Template Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen with highlights
│   │   ├── schedule.tsx       # Full session schedule
│   │   ├── speakers.tsx       # Speaker directory
│   │   ├── attendees.tsx      # Attendee networking
│   │   └── profile.tsx        # User profile
│   ├── sessions/[id].tsx      # Session detail page
│   ├── speakers/[id].tsx      # Speaker profile page
│   ├── sponsors.tsx           # Sponsor showcase
│   ├── map.tsx                # Venue map
│   └── agenda.tsx             # Personal agenda
├── components/
│   ├── SessionCard.tsx        # Session preview card
│   ├── SpeakerCard.tsx        # Speaker card
│   ├── AttendeeCard.tsx       # Attendee card
│   ├── SponsorTile.tsx        # Sponsor tile
│   ├── AgendaItem.tsx         # Agenda list item
│   ├── TrackFilter.tsx        # Track filtering
│   └── VenueMap.tsx           # Venue floor plan
├── hooks/
│   ├── useSessions.ts         # Session data hooks
│   ├── useSpeakers.ts         # Speaker data hooks
│   ├── useAttendees.ts        # Attendee data hooks
│   └── useAgenda.ts           # Agenda management (Zustand)
├── services/
│   ├── sessions.ts            # Mock session data (20 sessions)
│   ├── speakers.ts            # Mock speaker data (15 speakers)
│   ├── attendees.ts           # Mock attendee data (10 attendees)
│   └── sponsors.ts            # Mock sponsor data (10 sponsors)
└── types/
    └── index.ts               # TypeScript interfaces
```

## Mock Data

The template includes realistic mock data:

- **20 Sessions** across 4 tracks (Technology, Design, Business, Keynote)
- **15 Speakers** with detailed bios and social links
- **10 Attendees** for networking features
- **10 Sponsors** across 4 tiers (Platinum, Gold, Silver, Bronze)

## Key Components

### SessionCard
Displays session information including:
- Track color coding
- Time and location
- Enrollment status
- Difficulty level and tags
- Agenda status indicator

### SpeakerCard
Shows speaker details:
- Profile photo
- Name, title, and company
- Bio preview

### AgendaItem
Personal agenda item with:
- Session details
- Reminder toggle
- Notes support
- Quick remove action

### TrackFilter
Horizontal scrolling filter for:
- All sessions
- Track-specific filtering
- Visual track color coding

## Color Theme

Professional conference theme:
- Primary: Navy Blue (#1e3a8a)
- Accent: Orange (#fb923c)
- Track Colors:
  - Technology: Blue
  - Design: Purple
  - Business: Green
  - Keynote: Orange

## State Management

- **TanStack Query**: Server state for sessions, speakers, attendees
- **Zustand**: Local state for personal agenda management

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## E2E Tests

Maestro test flows included:
- `view-schedule.yaml` - Browse and filter sessions
- `speaker-profile.yaml` - View speaker details
- `build-agenda.yaml` - Add sessions to agenda

## Customization

To customize for your event:

1. Update event details in `(tabs)/index.tsx`
2. Replace mock data in `services/` with your API calls
3. Customize colors in `theme/colors.ts`
4. Update venue map in `components/VenueMap.tsx`
5. Configure tracks in `services/sessions.ts`

## Backend Integration

This template uses mock data. To connect to a real backend:

1. Update `services/api.ts` with your API base URL
2. Replace mock data functions with real API calls
3. Configure authentication in profile screen
4. Set up push notifications for session reminders

## License

MIT
