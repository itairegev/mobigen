import { View, Text } from 'react-native';
import { ReactNode } from 'react';

export interface CartSummaryProps {
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  deliveryFee?: number;
  tip?: number;
  actions?: ReactNode;
  testID?: string;
}

export function CartSummary({
  subtotal,
  tax,
  taxRate = 0,
  discount = 0,
  deliveryFee = 0,
  tip = 0,
  actions,
  testID,
}: CartSummaryProps) {
  const calculatedTax = tax !== undefined ? tax : subtotal * taxRate;
  const total = subtotal + calculatedTax + deliveryFee + tip - discount;

  const SummaryRow = ({
    label,
    value,
    bold = false,
  }: {
    label: string;
    value: number;
    bold?: boolean;
  }) => (
    <View className="flex-row justify-between py-2">
      <Text
        className={`${
          bold ? 'font-semibold text-gray-900' : 'text-gray-600'
        } text-base`}
      >
        {label}
      </Text>
      <Text
        className={`${
          bold ? 'font-semibold text-gray-900' : 'text-gray-900'
        } text-base`}
      >
        ${value.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200" testID={testID}>
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Order Summary
      </Text>

      <View className="border-t border-gray-200 pt-2">
        <SummaryRow label="Subtotal" value={subtotal} />

        {discount > 0 && (
          <SummaryRow label="Discount" value={-discount} />
        )}

        {deliveryFee > 0 && (
          <SummaryRow label="Delivery Fee" value={deliveryFee} />
        )}

        {tip > 0 && <SummaryRow label="Tip" value={tip} />}

        {(calculatedTax > 0 || taxRate > 0) && (
          <SummaryRow
            label={`Tax${taxRate > 0 ? ` (${(taxRate * 100).toFixed(0)}%)` : ''}`}
            value={calculatedTax}
          />
        )}

        <View className="border-t border-gray-200 mt-2 pt-2">
          <SummaryRow label="Total" value={total} bold />
        </View>
      </View>

      {actions && <View className="mt-4">{actions}</View>}
    </View>
  );
}
