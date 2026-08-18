import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { colors } from '../constants/colors';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      void rememberMe;
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Community Connect Hub</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@example.com" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
      <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.remember}>
        <Text style={styles.rememberText}>{rememberMe ? '☑' : '☐'} Remember Me</Text>
      </TouchableOpacity>
      <Button title="Login" onPress={handleLogin} loading={loading} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { color: colors.primary, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, marginTop: 8 },
  error: { color: colors.error, marginBottom: 12 },
  remember: { marginBottom: 16 },
  rememberText: { color: colors.textSecondary },
  linkWrap: { marginTop: 16, alignItems: 'center' },
  link: { color: colors.primary },
});
