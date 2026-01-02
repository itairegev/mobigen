export const templateConfig = {
  id: 'sports-team',
  name: 'Sports Team / Fan Club',
  description:
    'Complete fan club app with game schedule, team roster, news, standings, and merchandise shop',
  category: 'organizations',

  // Features for AI context
  features: [
    'game-schedule',
    'live-scores',
    'team-roster',
    'player-profiles',
    'news-feed',
    'league-standings',
    'team-shop',
    'push-notifications',
    'match-statistics',
  ],

  // Screens list for validation
  screens: [
    { name: 'Home', path: '(tabs)/index' },
    { name: 'Schedule', path: '(tabs)/schedule' },
    { name: 'Roster', path: '(tabs)/roster' },
    { name: 'News', path: '(tabs)/news' },
    { name: 'Profile', path: '(tabs)/profile' },
    { name: 'Game Detail', path: 'games/[id]' },
    { name: 'Player Profile', path: 'players/[id]' },
    { name: 'Team Shop', path: 'shop' },
  ],

  // Components list
  components: [
    'GameCard',
    'PlayerCard',
    'ScoreBoard',
    'NewsItem',
    'StandingsTable',
    'StatsGrid',
  ],

  // Mock data requirements
  mockData: {
    games: 10,
    players: 15,
    news: 8,
    standings: 6,
    products: 8,
  },

  // Backend tables needed
  backendTables: ['games', 'players', 'news', 'standings', 'teams', 'products', 'users'],

  // E2E test flows
  testFlows: ['view-schedule', 'player-profile'],
};
