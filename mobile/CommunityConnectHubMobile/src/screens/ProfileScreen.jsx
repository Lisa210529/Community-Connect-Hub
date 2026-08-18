import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { colors } from '../constants/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Card>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.fullName ?? user?.name}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={styles.label}>Ward</Text>
        <Text style={styles.value}>{user?.ward}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </Card>
      <Button title="Logout" onPress={logout} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  value: { color: colors.textPrimary },
});
