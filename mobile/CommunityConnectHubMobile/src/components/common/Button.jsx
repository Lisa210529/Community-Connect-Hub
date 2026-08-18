import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';

export default function Button({ title, onPress, variant = 'primary', disabled, loading }) {
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      style={[styles.button, isSecondary && styles.secondary, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.background} />
      ) : (
        <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.6 },
  text: { color: colors.background, fontWeight: '600', fontSize: 16 },
  secondaryText: { color: colors.primary },
});
