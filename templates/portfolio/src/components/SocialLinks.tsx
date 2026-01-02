import React from 'react';
import { View, TouchableOpacity, Linking, type ViewStyle } from 'react-native';
import { Github, Linkedin, Twitter, Globe } from 'lucide-react-native';
import { useTheme } from '@/hooks';
import type { SocialLink } from '@/types';

interface SocialLinksProps {
  links: SocialLink[];
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export function SocialLinks({ links, size = 24, style, testID }: SocialLinksProps) {
  const { colors } = useTheme();

  const getIcon = (platform: SocialLink['platform']) => {
    const iconProps = { size, color: colors.text };
    switch (platform) {
      case 'github':
        return <Github {...iconProps} />;
      case 'linkedin':
        return <Linkedin {...iconProps} />;
      case 'twitter':
        return <Twitter {...iconProps} />;
      case 'website':
        return <Globe {...iconProps} />;
      default:
        return <Globe {...iconProps} />;
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View className="flex-row" style={style} testID={testID}>
      {links.map((link) => (
        <TouchableOpacity
          key={link.id}
          className="mr-4 p-2"
          onPress={() => openLink(link.url)}
          testID={`social-link-${link.platform}`}
        >
          {getIcon(link.platform)}
        </TouchableOpacity>
      ))}
    </View>
  );
}
