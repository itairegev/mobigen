import { View, Text, ScrollView, Image } from 'react-native';
import { Standing } from '@/types';

interface StandingsTableProps {
  standings: Standing[];
  highlightTeamId?: string;
  testID?: string;
}

export function StandingsTable({ standings, highlightTeamId, testID }: StandingsTableProps) {
  return (
    <View className="bg-white rounded-xl shadow-md overflow-hidden" testID={testID}>
      {/* Header */}
      <View className="bg-team-primary p-3">
        <Text className="text-white font-bold text-lg">League Standings</Text>
      </View>

      {/* Table Header */}
      <View className="flex-row bg-gray-100 border-b border-gray-200 p-3">
        <Text className="w-10 text-xs font-semibold text-gray-600">#</Text>
        <Text className="flex-1 text-xs font-semibold text-gray-600">Team</Text>
        <Text className="w-10 text-center text-xs font-semibold text-gray-600">P</Text>
        <Text className="w-10 text-center text-xs font-semibold text-gray-600">W</Text>
        <Text className="w-10 text-center text-xs font-semibold text-gray-600">D</Text>
        <Text className="w-10 text-center text-xs font-semibold text-gray-600">L</Text>
        <Text className="w-12 text-center text-xs font-semibold text-gray-600">GD</Text>
        <Text className="w-12 text-center text-xs font-semibold text-gray-600">Pts</Text>
      </View>

      {/* Table Body */}
      <ScrollView>
        {standings.map((standing) => {
          const isHighlighted = standing.team.id === highlightTeamId;
          return (
            <View
              key={standing.team.id}
              className={`flex-row items-center p-3 border-b border-gray-100 ${
                isHighlighted ? 'bg-blue-50' : ''
              }`}
            >
              {/* Position */}
              <Text
                className={`w-10 font-bold ${
                  isHighlighted ? 'text-team-primary' : 'text-gray-900'
                }`}
              >
                {standing.position}
              </Text>

              {/* Team */}
              <View className="flex-1 flex-row items-center">
                <Image
                  source={{ uri: standing.team.logo }}
                  className="w-6 h-6 mr-2"
                  resizeMode="contain"
                />
                <Text
                  className={`font-semibold ${
                    isHighlighted ? 'text-team-primary' : 'text-gray-900'
                  }`}
                  numberOfLines={1}
                >
                  {standing.team.abbreviation}
                </Text>
              </View>

              {/* Stats */}
              <Text className="w-10 text-center text-sm text-gray-600">
                {standing.played}
              </Text>
              <Text className="w-10 text-center text-sm text-gray-600">
                {standing.won}
              </Text>
              <Text className="w-10 text-center text-sm text-gray-600">
                {standing.drawn}
              </Text>
              <Text className="w-10 text-center text-sm text-gray-600">
                {standing.lost}
              </Text>
              <Text
                className={`w-12 text-center text-sm font-semibold ${
                  standing.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {standing.goalDifference > 0 ? '+' : ''}
                {standing.goalDifference}
              </Text>
              <Text className="w-12 text-center text-sm font-bold text-gray-900">
                {standing.points}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Form Legend (optional) */}
      <View className="bg-gray-50 p-3 border-t border-gray-200">
        <Text className="text-xs text-gray-500 text-center">
          P: Played • W: Won • D: Drawn • L: Lost • GD: Goal Difference • Pts: Points
        </Text>
      </View>
    </View>
  );
}
