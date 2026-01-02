import { Team } from '@/types';

// Our Team
export const OUR_TEAM: Team = {
  id: 'team-1',
  name: 'Thunder FC',
  logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200',
  city: 'Seattle',
  abbreviation: 'TFC',
  colors: {
    primary: '#1e40af',
    secondary: '#ef4444',
  },
};

// Opponent Teams
export const MOCK_TEAMS: Team[] = [
  OUR_TEAM,
  {
    id: 'team-2',
    name: 'Dynamo United',
    logo: 'https://images.unsplash.com/photo-1614632537197-38a17061e40f?w=200',
    city: 'Portland',
    abbreviation: 'DYN',
    colors: {
      primary: '#059669',
      secondary: '#000000',
    },
  },
  {
    id: 'team-3',
    name: 'Phoenix Warriors',
    logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200',
    city: 'Phoenix',
    abbreviation: 'PHX',
    colors: {
      primary: '#dc2626',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'team-4',
    name: 'Bay City Stars',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200',
    city: 'San Francisco',
    abbreviation: 'BCS',
    colors: {
      primary: '#2563eb',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'team-5',
    name: 'Mountain Lions',
    logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200',
    city: 'Denver',
    abbreviation: 'MTL',
    colors: {
      primary: '#ea580c',
      secondary: '#1f2937',
    },
  },
  {
    id: 'team-6',
    name: 'Coastal Rangers',
    logo: 'https://images.unsplash.com/photo-1614632537197-38a17061e40f?w=200',
    city: 'San Diego',
    abbreviation: 'CST',
    colors: {
      primary: '#0891b2',
      secondary: '#fbbf24',
    },
  },
];

export async function getTeam(id: string): Promise<Team | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_TEAMS.find((team) => team.id === id);
}

export async function getAllTeams(): Promise<Team[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_TEAMS;
}
