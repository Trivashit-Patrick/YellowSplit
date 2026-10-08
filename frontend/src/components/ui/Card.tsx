import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlight' | 'yellow';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'yellow': return colors.primary;
      case 'highlight': return colors.card;
      default: return colors.card;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'highlight': return colors.primary;
      default: return colors.divider;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        variant === 'highlight' && styles.highlight,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.sm,
  },
  highlight: {
    borderWidth: 1.5,
  },
});
