/// <reference types="nativewind/types" />

// NativeWind v4 type augmentation for React Native components
// This adds the `className` prop to all React Native components

import 'react-native';
import { SvgProps } from 'react-native-svg';

// Lucide React Native type augmentation
declare module 'lucide-react-native' {
  import { FC } from 'react';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    fill?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = FC<LucideProps>;
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface ModalProps {
    className?: string;
  }
}

// SafeAreaView from react-native-safe-area-context
declare module 'react-native-safe-area-context' {
  interface SafeAreaViewProps {
    className?: string;
  }
}
