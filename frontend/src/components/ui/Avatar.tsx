import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../lib/theme';

interface AvatarProps {
  name: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showOnline?: boolean;
  color?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'medium',
  showOnline = false,
  color = colors.primary,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'medium': return 44;
      case 'large': return 56;
      case 'xlarge': return 80;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 16;
      case 'large': return 20;
      case 'xlarge': return 28;
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarSize = getSize();
  const dotSize = avatarSize * 0.25;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      <View
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Text
          style={[
            styles.initials,
            { fontSize: getFontSize(), color: colors.textOnYellow },
          ]}
        >
          {getInitials()}
        </Text>
      </View>
      {showOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              right: 0,
              top: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
