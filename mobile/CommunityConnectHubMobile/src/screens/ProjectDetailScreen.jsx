import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import {
  getProject,
  hasResidentRatedProject,
  createRating,
} from '../services/firebaseService';
import { colors } from '../constants/colors';
import { canResidentRateProject, getRatingEligibility } from '../constants/ratings';

const CATEGORIES = [
  { key: 'category1Score', label: 'Quality of Work' },
  { key: 'category2Score', label: 'Timeliness' },
  { key: 'category3Score', label: 'Community Benefit' },
  { key: 'category4Score', label: 'Communication' },
  { key: 'category5Score', label: 'Overall Satisfaction' },
];

function StarRow({ value, onChange }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text
          key={n}
          style={[styles.star, n <= value && styles.starOn]}
          onPress={() => onChange(n)}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

export default function ProjectDetailScreen({ route, navigation }) {
  const { projectId } = route.params;
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getProject(projectId);
      setProject(p);
      if (user?.uid) {
        const rated = await hasResidentRatedProject(user.uid, projectId);
        setAlreadyRated(rated);
      }
    }
    load().catch(console.error);
  }, [projectId, user]);

  const eligibility = project ? getRatingEligibility(project, { alreadyRated }) : null;
  const canRate = project && canResidentRateProject(project, { alreadyRated });

  async function submitRating() {
    const missing = CATEGORIES.find((c) => !scores[c.key] || scores[c.key] < 1);
    if (missing) {
      Alert.alert('Rating', `Please rate: ${missing.label}`);
      return;
    }
    const values = CATEGORIES.map((c) => Number(scores[c.key]));
    const overallScore = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));

    setSaving(true);
    try {
      await createRating({
        projectId,
        projectName: project.name,
        residentId: user.uid,
        residentName: user.name ?? user.fullName,
        wardId: user.wardId,
        ...scores,
        overallScore,
      });
      setAlreadyRated(true);
      Alert.alert('Success', 'Thank you for your feedback.');
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Could not submit rating.');
    } finally {
      setSaving(false);
    }
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading project…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <Text style={styles.meta}>{project.status} · K {Number(project.budget ?? 0).toLocaleString()}</Text>
      {project.category ? <Text style={styles.body}>Category: {project.category}</Text> : null}
      {project.location ? <Text style={styles.body}>Location: {project.location}</Text> : null}
      {project.description ? <Text style={styles.body}>{project.description}</Text> : null}

      {project.startDate && project.endDate ? (
        <Text style={styles.body}>
          Timeline: {project.startDate} – {project.endDate}
        </Text>
      ) : null}

      {eligibility?.reason === 'before_mid_date' && !alreadyRated ? (
        <Text style={styles.muted}>
          Rating opens{' '}
          {eligibility.midDate
            ? eligibility.midDate.toLocaleDateString('en-PG')
            : 'at the project mid-date'}
          .
        </Text>
      ) : null}

      {canRate ? (
        <Card>
          <Text style={styles.section}>Rate this project</Text>
          {CATEGORIES.map((c) => (
            <View key={c.key} style={styles.row}>
              <Text style={styles.label}>{c.label}</Text>
              <StarRow
                value={scores[c.key] ?? 0}
                onChange={(n) => setScores((prev) => ({ ...prev, [c.key]: n }))}
              />
            </View>
          ))}
          <Button title={saving ? 'Submitting…' : 'Submit Rating'} onPress={submitRating} disabled={saving} />
        </Card>
      ) : null}

      {alreadyRated ? <Text style={styles.muted}>You have already rated this project.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  meta: { color: colors.textSecondary, marginBottom: 12 },
  body: { color: colors.textPrimary, marginBottom: 8 },
  section: { color: colors.textPrimary, fontWeight: '600', marginBottom: 12 },
  row: { marginBottom: 10 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  stars: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 28, color: colors.border },
  starOn: { color: colors.primary },
  muted: { color: colors.textSecondary, marginTop: 12 },
});
