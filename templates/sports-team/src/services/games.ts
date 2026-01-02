import { Game, GameStatus } from '@/types';
import { MOCK_TEAMS, OUR_TEAM } from './teams';

const now = new Date();

export const MOCK_GAMES: Game[] = [
  {
    id: 'game-1',
    homeTeam: OUR_TEAM,
    awayTeam: MOCK_TEAMS[1],
    date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    time: '19:00',
    venue: 'Thunder Stadium',
    status: 'completed' as GameStatus,
    score: {
      home: 3,
      away: 1,
      periods: [
        { period: 1, home: 2, away: 0 },
        { period: 2, home: 1, away: 1 },
      ],
    },
    stats: {
      possession: { home: 58, away: 42 },
      shots: { home: 18, away: 9 },
      fouls: { home: 12, away: 15 },
      corners: { home: 7, away: 3 },
      yellowCards: { home: 2, away: 4 },
      redCards: { home: 0, away: 0 },
    },
    broadcast: {
      tv: 'ESPN',
      radio: 'FM 98.5',
      streaming: 'ESPN+',
    },
  },
  {
    id: 'game-2',
    homeTeam: MOCK_TEAMS[2],
    awayTeam: OUR_TEAM,
    date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    time: '15:30',
    venue: 'Phoenix Arena',
    status: 'completed' as GameStatus,
    score: {
      home: 1,
      away: 1,
      periods: [
        { period: 1, home: 0, away: 1 },
        { period: 2, home: 1, away: 0 },
      ],
    },
    stats: {
      possession: { home: 52, away: 48 },
      shots: { home: 14, away: 12 },
      fouls: { home: 10, away: 11 },
      corners: { home: 5, away: 6 },
      yellowCards: { home: 3, away: 2 },
      redCards: { home: 0, away: 0 },
    },
    broadcast: {
      tv: 'FOX Sports',
      streaming: 'Paramount+',
    },
  },
  {
    id: 'game-3',
    homeTeam: OUR_TEAM,
    awayTeam: MOCK_TEAMS[3],
    date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    time: '20:00',
    venue: 'Thunder Stadium',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-3',
      price: 'From $35',
    },
    broadcast: {
      tv: 'NBC Sports',
      radio: 'FM 98.5',
      streaming: 'Peacock',
    },
  },
  {
    id: 'game-4',
    homeTeam: MOCK_TEAMS[4],
    awayTeam: OUR_TEAM,
    date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    time: '18:00',
    venue: 'Mountain Stadium',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-4',
      price: 'From $40',
    },
    broadcast: {
      tv: 'ESPN2',
      streaming: 'ESPN+',
    },
  },
  {
    id: 'game-5',
    homeTeam: OUR_TEAM,
    awayTeam: MOCK_TEAMS[5],
    date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    time: '19:30',
    venue: 'Thunder Stadium',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-5',
      price: 'From $35',
    },
    broadcast: {
      tv: 'CBS Sports',
      streaming: 'Paramount+',
    },
  },
  {
    id: 'game-6',
    homeTeam: MOCK_TEAMS[1],
    awayTeam: OUR_TEAM,
    date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    time: '16:00',
    venue: 'Dynamo Field',
    status: 'completed' as GameStatus,
    score: {
      home: 0,
      away: 2,
      periods: [
        { period: 1, home: 0, away: 1 },
        { period: 2, home: 0, away: 1 },
      ],
    },
  },
  {
    id: 'game-7',
    homeTeam: OUR_TEAM,
    awayTeam: MOCK_TEAMS[4],
    date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
    time: '19:00',
    venue: 'Thunder Stadium',
    status: 'completed' as GameStatus,
    score: {
      home: 4,
      away: 2,
      periods: [
        { period: 1, home: 2, away: 1 },
        { period: 2, home: 2, away: 1 },
      ],
    },
  },
  {
    id: 'game-8',
    homeTeam: MOCK_TEAMS[3],
    awayTeam: OUR_TEAM,
    date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
    time: '17:00',
    venue: 'Bay Stadium',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-8',
      price: 'From $45',
    },
  },
  {
    id: 'game-9',
    homeTeam: OUR_TEAM,
    awayTeam: MOCK_TEAMS[2],
    date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
    time: '20:00',
    venue: 'Thunder Stadium',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-9',
      price: 'From $35',
    },
  },
  {
    id: 'game-10',
    homeTeam: MOCK_TEAMS[5],
    awayTeam: OUR_TEAM,
    date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
    time: '15:00',
    venue: 'Coastal Park',
    status: 'upcoming' as GameStatus,
    tickets: {
      available: true,
      url: 'https://tickets.example.com/game-10',
      price: 'From $40',
    },
  },
];

export async function getGames(): Promise<Game[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_GAMES.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getGame(id: string): Promise<Game | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_GAMES.find((game) => game.id === id);
}

export async function getUpcomingGames(): Promise<Game[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_GAMES.filter((game) => game.status === 'upcoming').sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

export async function getRecentGames(limit = 3): Promise<Game[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_GAMES.filter((game) => game.status === 'completed')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export async function getNextGame(): Promise<Game | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const upcoming = MOCK_GAMES.filter((game) => game.status === 'upcoming').sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  return upcoming[0];
}
