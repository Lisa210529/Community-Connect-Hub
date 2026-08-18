import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { colors } from '../../constants/colors';

export default function StatsCard({ label, value }) {
  return (
    <Card>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, fontSize: 12 },
  value: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 4 },
});
