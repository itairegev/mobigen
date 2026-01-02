export const templateConfig = {
  id: 'event',
  name: 'Event & Conference',
  description: 'Complete event and conference app with schedules, speakers, networking, and personal agenda',
  category: 'organizations',

  // Features for AI context
  features: [
    'session-schedule',
    'speaker-profiles',
    'attendee-networking',
    'sponsor-showcase',
    'personal-agenda',
    'venue-map',
    'track-filtering',
    'session-reminders',
  ],

  // Screens list for validation
  screens: [
    { name: 'Home', path: '(tabs)/index' },
    { name: 'Schedule', path: '(tabs)/schedule' },
    { name: 'Speakers', path: '(tabs)/speakers' },
    { name: 'Attendees', path: '(tabs)/attendees' },
    { name: 'Profile', path: '(tabs)/profile' },
    { name: 'Session Detail', path: 'sessions/[id]' },
    { name: 'Speaker Profile', path: 'speakers/[id]' },
    { name: 'Sponsors', path: 'sponsors' },
    { name: 'Venue Map', path: 'map' },
    { name: 'My Agenda', path: 'agenda' },
  ],

  // Components list
  components: [
    'SessionCard',
    'SpeakerCard',
    'AttendeeCard',
    'SponsorTile',
    'AgendaItem',
    'TrackFilter',
    'VenueMap',
  ],

  // Mock data requirements
  mockData: {
    sessions: 20,
    speakers: 15,
    attendees: 10,
    sponsors: 10,
    tracks: 4,
  },

  // Backend tables needed
  backendTables: [
    'sessions',
    'speakers',
    'attendees',
    'sponsors',
    'tracks',
    'agenda_items',
  ],

  // E2E test flows
  testFlows: [
    'view-schedule',
    'speaker-profile',
    'build-agenda',
  ],

  // Theme colors
  theme: {
    primary: '#1e3a8a',
    secondary: '#fb923c',
    tracks: {
      tech: '#3b82f6',
      design: '#a855f7',
      business: '#22c55e',
      keynote: '#f59e0b',
    },
  },
};
