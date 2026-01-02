// Core Sports Team Types

export type GameStatus = 'upcoming' | 'live' | 'completed' | 'cancelled' | 'postponed';
export type GameLocation = 'home' | 'away';
export type PlayerPosition = 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper' | 'Guard' | 'Forward' | 'Center' | 'Quarterback' | 'Running Back' | 'Wide Receiver' | 'Defense';

export interface Team {
  id: string;
  name: string;
  logo: string;
  city: string;
  abbreviation: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface Score {
  home: number;
  away: number;
  periods?: {
    period: number;
    home: number;
    away: number;
  }[];
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: Date;
  time: string;
  venue: string;
  status: GameStatus;
  score?: Score;
  stats?: GameStats;
  tickets?: {
    available: boolean;
    url?: string;
    price?: string;
  };
  broadcast?: {
    tv?: string;
    radio?: string;
    streaming?: string;
  };
}

export interface GameStats {
  possession?: {
    home: number;
    away: number;
  };
  shots?: {
    home: number;
    away: number;
  };
  fouls?: {
    home: number;
    away: number;
  };
  corners?: {
    home: number;
    away: number;
  };
  yellowCards?: {
    home: number;
    away: number;
  };
  redCards?: {
    home: number;
    away: number;
  };
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  photo: string;
  age: number;
  height: string;
  weight: string;
  nationality: string;
  stats: PlayerStats;
  bio?: string;
  socialMedia?: {
    twitter?: string;
    instagram?: string;
  };
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesStarted: number;
  minutes: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  points?: number;
  rebounds?: number;
  steals?: number;
  blocks?: number;
  touchdowns?: number;
  yards?: number;
  tackles?: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: Date;
  image: string;
  category: 'match-report' | 'transfer' | 'injury' | 'interview' | 'announcement' | 'general';
  tags: string[];
}

export interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'jersey' | 'apparel' | 'accessories' | 'memorabilia';
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoritePlayer?: string;
  memberSince: Date;
  loyaltyPoints?: number;
  notifications: {
    gameReminders: boolean;
    news: boolean;
    promotions: boolean;
  };
}
