import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getProjects, getAnnouncements } from '../services/firebaseService';
import { colors } from '../constants/colors';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const wardId = user?.wardId;
    const [p, a] = await Promise.all([getProjects(wardId), getAnnouncements(wardId)]);
    setProjects(p.slice(0, 5));
    setAnnouncements(a.filter((x) => x.isActive !== false).slice(0, 3));
  }

  useEffect(() => {
    load().catch(console.error);
  }, [user]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
    >
      <Text style={styles.greeting}>Welcome, {user?.name ?? user?.fullName ?? 'Resident'}</Text>
      <Text style={styles.sub}>{user?.ward}</Text>

      <Text style={styles.section}>Quick Stats</Text>
      <Card>
        <Text style={styles.stat}>Projects in ward: {projects.length}</Text>
        <Text style={styles.stat}>Announcements: {announcements.length}</Text>
      </Card>

      <Text style={styles.section}>Latest Projects</Text>
      {projects.length === 0 ? (
        <Text style={styles.muted}>No projects yet.</Text>
      ) : (
        projects.map((p) => (
          <Card key={p.id}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.muted}>{p.status} · {p.ward}</Text>
          </Card>
        ))
      )}

      <Text style={styles.section}>Announcements</Text>
      {announcements.map((a) => (
        <Card key={a.id}>
          <Text style={styles.cardTitle}>{a.title}</Text>
          <Text style={styles.muted} numberOfLines={2}>{a.content}</Text>
        </Card>
      ))}

      <Button title="Logout" onPress={logout} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  greeting: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textSecondary, marginBottom: 16 },
  section: { color: colors.primary, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  stat: { color: colors.textPrimary, marginBottom: 4 },
  cardTitle: { color: colors.textPrimary, fontWeight: '600' },
  muted: { color: colors.textSecondary, fontSize: 13 },
});
