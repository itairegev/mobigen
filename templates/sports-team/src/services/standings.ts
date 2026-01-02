import { Standing } from '@/types';
import { MOCK_TEAMS, OUR_TEAM } from './teams';

export const MOCK_STANDINGS: Standing[] = [
  {
    position: 1,
    team: MOCK_TEAMS[2], // Phoenix Warriors
    played: 30,
    won: 20,
    drawn: 6,
    lost: 4,
    goalsFor: 62,
    goalsAgainst: 28,
    goalDifference: 34,
    points: 66,
    form: ['W', 'W', 'D', 'W', 'W'],
  },
  {
    position: 2,
    team: MOCK_TEAMS[3], // Bay City Stars
    played: 30,
    won: 19,
    drawn: 7,
    lost: 4,
    goalsFor: 58,
    goalsAgainst: 25,
    goalDifference: 33,
    points: 64,
    form: ['W', 'D', 'W', 'W', 'D'],
  },
  {
    position: 3,
    team: OUR_TEAM, // Thunder FC
    played: 30,
    won: 18,
    drawn: 8,
    lost: 4,
    goalsFor: 54,
    goalsAgainst: 26,
    goalDifference: 28,
    points: 62,
    form: ['W', 'D', 'W', 'W', 'W'],
  },
  {
    position: 4,
    team: MOCK_TEAMS[1], // Dynamo United
    played: 30,
    won: 16,
    drawn: 9,
    lost: 5,
    goalsFor: 50,
    goalsAgainst: 30,
    goalDifference: 20,
    points: 57,
    form: ['L', 'W', 'D', 'W', 'D'],
  },
  {
    position: 5,
    team: MOCK_TEAMS[4], // Mountain Lions
    played: 30,
    won: 15,
    drawn: 8,
    lost: 7,
    goalsFor: 48,
    goalsAgainst: 35,
    goalDifference: 13,
    points: 53,
    form: ['L', 'W', 'W', 'D', 'L'],
  },
  {
    position: 6,
    team: MOCK_TEAMS[5], // Coastal Rangers
    played: 30,
    won: 14,
    drawn: 9,
    lost: 7,
    goalsFor: 45,
    goalsAgainst: 34,
    goalDifference: 11,
    points: 51,
    form: ['D', 'D', 'W', 'L', 'W'],
  },
];

export async function getStandings(): Promise<Standing[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_STANDINGS.sort((a, b) => a.position - b.position);
}

export async function getTeamStanding(teamId: string): Promise<Standing | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_STANDINGS.find((standing) => standing.team.id === teamId);
}
