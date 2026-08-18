import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Card from '../common/Card';
import { colors } from '../../constants/colors';

export default function ProjectCard({ project }) {
  return (
    <Card>
      <Text style={styles.name}>{project.name}</Text>
      <Text style={styles.meta}>{project.status} · {project.ward}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.textPrimary, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
