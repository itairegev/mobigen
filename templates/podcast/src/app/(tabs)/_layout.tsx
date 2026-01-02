import { Tabs } from 'expo-router';
import { Home, Mic, Lock, MessageCircle, User } from 'lucide-react-native';
import { View } from 'react-native';
import { MiniPlayer } from '../../components';
import { usePlayer } from '../../hooks';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const router = useRouter();
  const { currentEpisode, isPlaying, play, pause } = usePlayer();

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#8b5cf6',
          headerShown: true,
          tabBarStyle: {
            paddingBottom: currentEpisode ? 60 : 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="episodes"
          options={{
            title: 'Episodes',
            tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="exclusives"
          options={{
            title: 'Exclusives',
            tabBarIcon: ({ color, size }) => <Lock color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>

      {/* Mini Player */}
      {currentEpisode && (
        <View className="absolute bottom-0 left-0 right-0">
          <MiniPlayer
            episode={currentEpisode}
            isPlaying={isPlaying}
            onPress={() => router.push('/player')}
            onPlayPause={() => (isPlaying ? pause() : play())}
            testID="mini-player"
          />
        </View>
      )}
    </View>
  );
}
