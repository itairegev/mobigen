/**
 * Sports API Service - Fetch real sports data from TheSportsDB
 *
 * Configuration:
 * - EXPO_PUBLIC_SPORTS_MODE: 'api' | 'demo' (default: 'demo')
 * - EXPO_PUBLIC_TEAM_NAME: Team name to search for
 * - EXPO_PUBLIC_SPORT_TYPE: 'soccer' | 'basketball' | 'football' | 'hockey' | 'baseball'
 *
 * TheSportsDB is a free community-maintained database of sports data.
 * https://www.thesportsdb.com/api.php
 */

import { Team, Game, Player, GameStatus, Standing, NewsArticle } from '@/types';
import { MOCK_GAMES, MOCK_TEAMS, OUR_TEAM } from './teams';
import { MOCK_PLAYERS } from './players';
import { MOCK_STANDINGS } from './standings';
import { MOCK_NEWS } from './news';

// Configuration
const SPORTS_MODE = process.env.EXPO_PUBLIC_SPORTS_MODE || 'demo';
const TEAM_NAME = process.env.EXPO_PUBLIC_TEAM_NAME || 'Thunder FC';
const SPORT_TYPE = process.env.EXPO_PUBLIC_SPORT_TYPE || 'soccer';

// TheSportsDB free API endpoint
const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Cache for API data
let cachedTeam: Team | null = null;
let cachedGames: Game[] | null = null;
let cachedPlayers: Player[] | null = null;
let cachedStandings: Standing[] | null = null;
let lastFetchTime: Record<string, number> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Check if cache is valid
 */
function isCacheValid(key: string): boolean {
  return Date.now() - (lastFetchTime[key] || 0) < CACHE_DURATION;
}

/**
 * Search for team by name using TheSportsDB
 */
async function searchTeamByName(teamName: string): Promise<Team | null> {
  try {
    const response = await fetch(
      `${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const team = data.teams?.[0];

    if (!team) return null;

    return {
      id: team.idTeam,
      name: team.strTeam,
      logo: team.strBadge || team.strLogo || '',
      city: team.strStadiumLocation || '',
      abbreviation: team.strTeamShort || team.strTeam.substring(0, 3).toUpperCase(),
      colors: {
        primary: team.strColour1 || '#1e40af',
        secondary: team.strColour2 || '#ffffff',
      },
    };
  } catch (error) {
    console.error('Team search error:', error);
    return null;
  }
}

/**
 * Get team's upcoming and recent events/games
 */
async function fetchTeamEvents(teamId: string): Promise<Game[]> {
  const games: Game[] = [];

  try {
    // Fetch next 5 events
    const nextResponse = await fetch(
      `${SPORTSDB_BASE}/eventsnext.php?id=${teamId}`
    );

    if (nextResponse.ok) {
      const nextData = await nextResponse.json();
      const events = nextData.events || [];

      for (const event of events) {
        games.push(parseEvent(event, 'upcoming'));
      }
    }

    // Fetch last 5 events
    const lastResponse = await fetch(
      `${SPORTSDB_BASE}/eventslast.php?id=${teamId}`
    );

    if (lastResponse.ok) {
      const lastData = await lastResponse.json();
      const events = lastData.results || [];

      for (const event of events) {
        games.push(parseEvent(event, 'completed'));
      }
    }
  } catch (error) {
    console.error('Events fetch error:', error);
  }

  return games.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Parse TheSportsDB event into our Game type
 */
function parseEvent(event: Record<string, unknown>, status: GameStatus): Game {
  const homeTeam: Team = {
    id: event.idHomeTeam as string || '',
    name: event.strHomeTeam as string || 'Home Team',
    logo: event.strHomeTeamBadge as string || '',
    city: '',
    abbreviation: (event.strHomeTeam as string || '').substring(0, 3).toUpperCase(),
    colors: { primary: '#1e40af', secondary: '#ffffff' },
  };

  const awayTeam: Team = {
    id: event.idAwayTeam as string || '',
    name: event.strAwayTeam as string || 'Away Team',
    logo: event.strAwayTeamBadge as string || '',
    city: '',
    abbreviation: (event.strAwayTeam as string || '').substring(0, 3).toUpperCase(),
    colors: { primary: '#1e40af', secondary: '#ffffff' },
  };

  const eventDate = new Date(event.dateEvent as string || Date.now());
  const homeScore = parseInt(event.intHomeScore as string) || 0;
  const awayScore = parseInt(event.intAwayScore as string) || 0;

  return {
    id: event.idEvent as string || `event-${Date.now()}`,
    homeTeam,
    awayTeam,
    date: eventDate,
    time: event.strTime as string || '19:00',
    venue: event.strVenue as string || 'Stadium',
    status: event.strStatus === 'Match Finished' ? 'completed' : status,
    score: status === 'completed' ? {
      home: homeScore,
      away: awayScore,
    } : undefined,
    broadcast: {
      tv: event.strTVStation as string || undefined,
    },
  };
}

/**
 * Get team players from TheSportsDB
 */
async function fetchTeamPlayers(teamId: string): Promise<Player[]> {
  try {
    const response = await fetch(
      `${SPORTSDB_BASE}/lookup_all_players.php?id=${teamId}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const players = data.player || [];

    return players.slice(0, 25).map((p: Record<string, unknown>, index: number) => ({
      id: p.idPlayer as string || `player-${index}`,
      name: p.strPlayer as string || 'Unknown',
      number: parseInt(p.strNumber as string) || index + 1,
      position: (p.strPosition as string || 'Midfielder') as Player['position'],
      photo: p.strCutout as string || p.strThumb as string || '',
      age: p.strBirthLocation ? calculateAge(p.dateBorn as string) : 25,
      height: p.strHeight as string || "6'0\"",
      weight: p.strWeight as string || '180 lbs',
      nationality: p.strNationality as string || 'Unknown',
      bio: p.strDescriptionEN as string || undefined,
      stats: {
        gamesPlayed: 0,
        gamesStarted: 0,
        minutes: 0,
      },
      socialMedia: {
        twitter: p.strTwitter as string || undefined,
        instagram: p.strInstagram as string || undefined,
      },
    }));
  } catch (error) {
    console.error('Players fetch error:', error);
    return [];
  }
}

/**
 * Calculate age from birth date string
 */
function calculateAge(birthDate: string): number {
  if (!birthDate) return 25;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get league standings (if available)
 */
async function fetchLeagueStandings(leagueId: string): Promise<Standing[]> {
  try {
    // TheSportsDB free tier has limited standings support
    // For now, return mock standings
    return MOCK_STANDINGS;
  } catch (error) {
    console.error('Standings fetch error:', error);
    return MOCK_STANDINGS;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLIC API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get our team info
 */
export async function getOurTeam(): Promise<Team> {
  if (SPORTS_MODE !== 'api') {
    return OUR_TEAM;
  }

  if (cachedTeam && isCacheValid('team')) {
    return cachedTeam;
  }

  const team = await searchTeamByName(TEAM_NAME);
  if (team) {
    cachedTeam = team;
    lastFetchTime['team'] = Date.now();
    return team;
  }

  return OUR_TEAM;
}

/**
 * Get all games
 */
export async function getGames(): Promise<Game[]> {
  if (SPORTS_MODE !== 'api') {
    await new Promise(r => setTimeout(r, 500));
    return [...MOCK_GAMES].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  if (cachedGames && isCacheValid('games')) {
    return cachedGames;
  }

  const team = await getOurTeam();
  if (team.id) {
    const games = await fetchTeamEvents(team.id);
    if (games.length > 0) {
      cachedGames = games;
      lastFetchTime['games'] = Date.now();
      return games;
    }
  }

  return MOCK_GAMES;
}

/**
 * Get single game by ID
 */
export async function getGame(id: string): Promise<Game | undefined> {
  const games = await getGames();
  return games.find(g => g.id === id);
}

/**
 * Get upcoming games
 */
export async function getUpcomingGames(): Promise<Game[]> {
  const games = await getGames();
  return games
    .filter(g => g.status === 'upcoming')
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get recent completed games
 */
export async function getRecentGames(limit = 3): Promise<Game[]> {
  const games = await getGames();
  return games
    .filter(g => g.status === 'completed')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

/**
 * Get next game
 */
export async function getNextGame(): Promise<Game | undefined> {
  const upcoming = await getUpcomingGames();
  return upcoming[0];
}

/**
 * Get all players
 */
export async function getPlayers(): Promise<Player[]> {
  if (SPORTS_MODE !== 'api') {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_PLAYERS;
  }

  if (cachedPlayers && isCacheValid('players')) {
    return cachedPlayers;
  }

  const team = await getOurTeam();
  if (team.id) {
    const players = await fetchTeamPlayers(team.id);
    if (players.length > 0) {
      cachedPlayers = players;
      lastFetchTime['players'] = Date.now();
      return players;
    }
  }

  return MOCK_PLAYERS;
}

/**
 * Get single player by ID
 */
export async function getPlayer(id: string): Promise<Player | undefined> {
  const players = await getPlayers();
  return players.find(p => p.id === id);
}

/**
 * Get standings
 */
export async function getStandings(): Promise<Standing[]> {
  if (SPORTS_MODE !== 'api') {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_STANDINGS;
  }

  if (cachedStandings && isCacheValid('standings')) {
    return cachedStandings;
  }

  // Use mock standings for now (TheSportsDB free tier limitation)
  return MOCK_STANDINGS;
}

/**
 * Get news articles (uses mock data, can be enhanced with RSS feed)
 */
export async function getNews(): Promise<NewsArticle[]> {
  await new Promise(r => setTimeout(r, 300));
  return MOCK_NEWS;
}

/**
 * Get single news article
 */
export async function getNewsArticle(id: string): Promise<NewsArticle | undefined> {
  const news = await getNews();
  return news.find(n => n.id === id);
}

/**
 * Check if sports API is configured
 */
export function isSportsConfigured(): boolean {
  return SPORTS_MODE === 'api' && !!TEAM_NAME;
}

/**
 * Clear cached data
 */
export function clearSportsCache(): void {
  cachedTeam = null;
  cachedGames = null;
  cachedPlayers = null;
  cachedStandings = null;
  lastFetchTime = {};
}

// Re-export mock data for fallback
export { MOCK_GAMES, MOCK_TEAMS, OUR_TEAM } from './teams';
