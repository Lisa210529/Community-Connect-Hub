import React, { useEffect, useState } from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import { getAnnouncements } from '../services/firebaseService';
import { colors } from '../constants/colors';

export default function AnnouncementsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    getAnnouncements(user?.wardId).then(setItems).catch(console.error);
  }, [user]);

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text style={styles.title}>Announcements</Text>}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.name}>{item.title}</Text>
          <Text style={styles.meta}>{item.content}</Text>
        </Card>
      )}
      ListEmptyComponent={<Text style={styles.meta}>No announcements.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  name: { color: colors.textPrimary, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
});
