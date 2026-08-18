import React, { useEffect, useState } from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import { getProjects } from '../services/firebaseService';
import { colors } from '../constants/colors';

export default function ProjectsScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjects(user?.wardId).then(setProjects).catch(console.error);
  }, [user]);

  return (
    <FlatList
      style={styles.list}
      data={projects}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text style={styles.title}>Ward Projects</Text>}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.status} · K {Number(item.budget ?? 0).toLocaleString()}</Text>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.meta}>No projects found.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  name: { color: colors.textPrimary, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
