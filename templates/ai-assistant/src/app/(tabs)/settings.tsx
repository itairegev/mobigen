import { View, Text, Switch, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Mic, Smartphone, Info, ChevronRight } from 'lucide-react-native';
import { useSettings } from '@/hooks';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ icon, title, subtitle, rightElement, onPress }: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100"
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-500">{subtitle}</Text>
        )}
      </View>
      {rightElement || <ChevronRight size={20} color="#9ca3af" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { settings, currentModel, availableModels, updateSettings } = useSettings();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <ScrollView className="flex-1">
        {/* AI Model Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            AI Model
          </Text>
          <SettingRow
            icon={<Bot size={20} color="#3b82f6" />}
            title={currentModel.name}
            subtitle={currentModel.description}
            onPress={() => {}}
          />
        </View>

        {/* Features Section */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            Features
          </Text>
          <SettingRow
            icon={<Mic size={20} color="#10b981" />}
            title="Voice Input"
            subtitle="Use microphone for input"
            rightElement={
              <Switch
                value={settings.voiceEnabled}
                onValueChange={(value) => updateSettings({ voiceEnabled: value })}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={settings.voiceEnabled ? '#3b82f6' : '#f4f4f5'}
              />
            }
          />
          <SettingRow
            icon={<Smartphone size={20} color="#8b5cf6" />}
            title="Haptic Feedback"
            subtitle="Vibrate on actions"
            rightElement={
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(value) => updateSettings({ hapticFeedback: value })}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={settings.hapticFeedback ? '#3b82f6' : '#f4f4f5'}
              />
            }
          />
        </View>

        {/* Model Parameters */}
        <View className="mt-6">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            Model Parameters
          </Text>
          <View className="bg-white px-4 py-3 border-b border-gray-100">
            <View className="flex-row justify-between mb-2">
              <Text className="text-base font-medium text-gray-900">Temperature</Text>
              <Text className="text-base text-blue-500">{settings.temperature}</Text>
            </View>
            <Text className="text-sm text-gray-500">
              Controls randomness. Lower is more focused, higher is more creative.
            </Text>
          </View>
          <View className="bg-white px-4 py-3 border-b border-gray-100">
            <View className="flex-row justify-between mb-2">
              <Text className="text-base font-medium text-gray-900">Max Tokens</Text>
              <Text className="text-base text-blue-500">{settings.maxTokens}</Text>
            </View>
            <Text className="text-sm text-gray-500">
              Maximum length of the response.
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View className="mt-6 mb-8">
          <Text className="text-sm font-medium text-gray-500 uppercase px-4 mb-2">
            About
          </Text>
          <SettingRow
            icon={<Info size={20} color="#6366f1" />}
            title="Version"
            subtitle="1.0.0"
            rightElement={null}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
