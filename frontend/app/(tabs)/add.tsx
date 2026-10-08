import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/lib/theme';

export default function AddPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textPrimary,
  },
});
