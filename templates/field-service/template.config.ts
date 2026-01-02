export const templateConfig = {
  id: 'field-service',
  name: 'Field Service & Jobs',
  description: 'Complete job management app for contractors, technicians, and field service workers',
  category: 'niche',

  // Features for AI context
  features: [
    'job-management',
    'time-tracking',
    'client-messaging',
    'photo-documentation',
    'location-mapping',
    'status-updates',
    'daily-schedule',
    'performance-stats',
  ],

  // Screens list for validation
  screens: [
    { name: 'Home', path: '(tabs)/index' },
    { name: 'Jobs', path: '(tabs)/jobs' },
    { name: 'Time Log', path: '(tabs)/timelog' },
    { name: 'Messages', path: '(tabs)/messages' },
    { name: 'Profile', path: '(tabs)/profile' },
    { name: 'Job Detail', path: 'jobs/[id]' },
    { name: 'Update Status', path: 'jobs/[id]/status' },
    { name: 'Job Photos', path: 'jobs/[id]/photos' },
  ],

  // Components list
  components: [
    'JobCard',
    'StatusSelector',
    'TimeTracker',
    'PhotoCapture',
    'ClientCard',
    'MapView',
    'JobStats',
  ],

  // Mock data requirements
  mockData: {
    jobs: 10,
    clients: 5,
    timeEntries: 3,
    conversations: 3,
  },

  // Backend tables needed
  backendTables: [
    'jobs',
    'clients',
    'time_entries',
    'photos',
    'messages',
  ],

  // E2E test flows
  testFlows: [
    'view-jobs',
    'update-status',
    'clock-time',
  ],

  // Keywords for semantic search
  keywords: [
    'field service',
    'contractor',
    'technician',
    'HVAC',
    'plumbing',
    'electrical',
    'repair',
    'maintenance',
    'work order',
    'job tracking',
    'time tracking',
    'service calls',
    'route planning',
    'photo documentation',
  ],
};
