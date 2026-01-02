export const templateConfig = {
  id: 'church',
  name: 'Church & Religious Organization',
  description: 'Complete church app with sermons, events, giving, prayer requests, and small groups',
  category: 'organizations',

  // Features for AI context
  features: [
    'sermon-library',
    'video-audio-sermons',
    'event-calendar',
    'online-giving',
    'prayer-requests',
    'small-groups',
    'announcements',
    'push-notifications',
  ],

  // Screens list for validation
  screens: [
    { name: 'Home', path: '(tabs)/index' },
    { name: 'Sermons', path: '(tabs)/sermons' },
    { name: 'Events', path: '(tabs)/events' },
    { name: 'Give', path: '(tabs)/give' },
    { name: 'Profile', path: '(tabs)/profile' },
    { name: 'Sermon Detail', path: 'sermons/[id]' },
    { name: 'Event Detail', path: 'events/[id]' },
    { name: 'Prayer Requests', path: 'prayer' },
    { name: 'Small Groups', path: 'groups' },
  ],

  // Components list
  components: [
    'SermonCard',
    'EventCard',
    'GroupCard',
    'PrayerCard',
    'GivingForm',
    'AnnouncementBanner',
  ],

  // Mock data requirements
  mockData: {
    series: 3,
    sermons: 12,
    events: 8,
    groups: 6,
    prayers: 5,
    givingFunds: 4,
    announcements: 4,
  },

  // Backend tables needed
  backendTables: [
    'sermons',
    'series',
    'events',
    'groups',
    'prayer_requests',
    'donations',
    'giving_funds',
    'announcements',
  ],

  // E2E test flows
  testFlows: ['view-sermons', 'donate', 'submit-prayer'],

  // Template-specific theme
  theme: {
    primaryColor: '#1e40af', // Deep blue
    secondaryColor: '#f59e0b', // Warm gold
    accent: '#7c3aed', // Purple
  },
};
