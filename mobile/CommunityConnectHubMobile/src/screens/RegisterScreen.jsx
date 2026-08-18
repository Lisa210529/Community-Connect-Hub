import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { colors } from '../constants/colors';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    nid: '',
    email: '',
    phone: '',
    ward: 'Ward 5 Nabasa',
    wardId: 'ward_5',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister() {
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigation.navigate('Login');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Resident Account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Input label="Full Name" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
      <Input label="NID (10 digits)" value={form.nid} onChangeText={(v) => update('nid', v)} keyboardType="number-pad" />
      <Input label="Email" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" />
      <Input label="Phone" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
      <Input label="Ward" value={form.ward} onChangeText={(v) => update('ward', v)} />
      <Input label="Password" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />
      <Input label="Confirm Password" value={form.confirm} onChangeText={(v) => update('confirm', v)} secureTextEntry />
      <Button title="Register" onPress={handleRegister} loading={loading} />
      <Button title="Back to Login" onPress={() => navigation.navigate('Login')} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 24, paddingTop: 48 },
  title: { color: colors.primary, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  error: { color: colors.error, marginBottom: 12 },
});
