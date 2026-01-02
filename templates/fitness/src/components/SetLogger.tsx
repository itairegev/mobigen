import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { SetLog } from '@/types';
import { Card } from './Card';

interface SetLoggerProps {
  setLog: SetLog;
  onChange: (setLog: SetLog) => void;
  showWeight?: boolean;
  showDuration?: boolean;
  testID?: string;
}

export function SetLogger({
  setLog,
  onChange,
  showWeight = true,
  showDuration = false,
  testID,
}: SetLoggerProps) {
  return (
    <Card className="mb-2 p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-700 w-16">
          Set {setLog.setNumber}
        </Text>

        {!showDuration && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-2">Reps</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 w-16 text-center"
              value={setLog.reps.toString()}
              onChangeText={(text) => {
                const reps = parseInt(text) || 0;
                onChange({ ...setLog, reps });
              }}
              keyboardType="number-pad"
              testID={`${testID}-reps`}
            />
          </View>
        )}

        {showWeight && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-2">Weight</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 w-20 text-center"
              value={setLog.weight?.toString() || ''}
              onChangeText={(text) => {
                const weight = parseFloat(text) || undefined;
                onChange({ ...setLog, weight });
              }}
              keyboardType="decimal-pad"
              placeholder="kg"
              testID={`${testID}-weight`}
            />
          </View>
        )}

        {showDuration && (
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-2">Time</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 w-20 text-center"
              value={setLog.duration?.toString() || ''}
              onChangeText={(text) => {
                const duration = parseInt(text) || undefined;
                onChange({ ...setLog, duration });
              }}
              keyboardType="number-pad"
              placeholder="sec"
              testID={`${testID}-duration`}
            />
          </View>
        )}

        <TouchableOpacity
          onPress={() => onChange({ ...setLog, completed: !setLog.completed })}
          className={`w-8 h-8 rounded-full items-center justify-center ${
            setLog.completed ? 'bg-primary-500' : 'bg-gray-200'
          }`}
          testID={`${testID}-complete`}
        >
          {setLog.completed ? (
            <Check size={18} color="#ffffff" />
          ) : (
            <X size={18} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}
