import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGivingFunds, useSubmitDonation } from '../../hooks/useGiving';
import { GivingForm } from '../../components';
import { ActivityIndicator } from 'react-native';

export default function GiveScreen() {
  const { data: funds, isLoading } = useGivingFunds();
  const submitDonation = useSubmitDonation();

  const handleSubmit = async (
    amount: number,
    frequency: 'one-time' | 'weekly' | 'monthly',
    fundId: string
  ) => {
    try {
      await submitDonation.mutateAsync({
        amount,
        frequency,
        fundId,
        method: 'credit-card',
      });

      Alert.alert(
        'Thank You!',
        `Your ${frequency} donation of $${amount} has been received. May God bless your generosity!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'There was a problem processing your donation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      ) : funds ? (
        <GivingForm
          funds={funds}
          onSubmit={handleSubmit}
          isLoading={submitDonation.isPending}
          testID="giving-form"
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center">
            Unable to load giving options. Please try again later.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
