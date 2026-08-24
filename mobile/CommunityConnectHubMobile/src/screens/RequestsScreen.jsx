import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getRequests, createRequest } from '../services/firebaseService';
import { colors } from '../constants/colors';

const CATEGORIES = ['Water Supply', 'Road Construction', 'Street Light', 'Health Center', 'Education', 'General'];

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (user?.uid) {
      const list = await getRequests(user.uid);
      setRequests(list);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, [user]);

  async function submitRequest() {
    if (!description.trim()) {
      Alert.alert('Request', 'Please enter a description.');
      return;
    }
    setSaving(true);
    try {
      await createRequest({
        requestType: 'project',
        category,
        description: description.trim(),
        residentId: user.uid,
        residentName: user.name ?? user.fullName,
        ward: user.ward,
        wardId: user.wardId,
        zone: 'All Ward',
      });
      setModal(false);
      setDescription('');
      await load();
      Alert.alert('Success', 'Request submitted.');
    } catch (err) {
      Alert.alert('Error', err.message ?? 'Could not submit request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <FlatList
        style={styles.list}
        data={requests}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>My Requests</Text>
            <Button title="New Request" onPress={() => setModal(true)} />
          </>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.category ?? item.requestType}</Text>
            <Text style={styles.meta}>{item.status} · {item.description?.slice(0, 80)}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.meta}>No requests yet.</Text>}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text style={styles.title}>Submit Request</Text>
            <Text style={styles.label}>Category</Text>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={styles.chip} onPress={() => setCategory(c)}>
                <Text style={[styles.chipText, category === c && styles.chipOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your community need…"
              placeholderTextColor={colors.textSecondary}
            />
            <Button title={saving ? 'Submitting…' : 'Submit'} onPress={submitRequest} disabled={saving} />
            <Button title="Cancel" onPress={() => setModal(false)} variant="secondary" />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  name: { color: colors.textPrimary, fontWeight: '600' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  label: { color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  chip: { marginBottom: 6 },
  chipText: { color: colors.textSecondary },
  chipOn: { color: colors.primary, fontWeight: '600' },
});
