import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ViewStyle,
} from 'react-native';
import { ReactNode } from 'react';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  testID?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  testID,
}: ModalProps) {
  const sizeClasses = {
    sm: 'w-11/12 max-w-sm',
    md: 'w-11/12 max-w-md',
    lg: 'w-11/12 max-w-lg',
    full: 'w-full h-full',
  };

  const positionClasses = {
    center: 'justify-center items-center',
    bottom: 'justify-end',
  };

  const contentClasses = {
    center: 'rounded-2xl',
    bottom: 'rounded-t-2xl',
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={position === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      testID={testID}
    >
      <View className={`flex-1 bg-black/50 ${positionClasses[position]}`}>
        <Pressable
          className="absolute inset-0"
          onPress={closeOnBackdrop ? onClose : undefined}
        />

        <View
          className={`bg-white ${sizeClasses[size]} ${contentClasses[position]} ${
            size === 'full' ? '' : 'mx-4'
          }`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              {title && (
                <Text className="text-xl font-semibold text-gray-900 flex-1">
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  className="ml-4 p-1"
                  testID={`${testID}-close-button`}
                >
                  <Text className="text-gray-500 text-2xl">×</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View className="p-4">{children}</View>

          {/* Footer */}
          {footer && (
            <View className="p-4 border-t border-gray-200">{footer}</View>
          )}
        </View>
      </View>
    </RNModal>
  );
}
