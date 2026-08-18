import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Card from '../components/common/Card';
import { colors } from '../constants/colors';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.label}>Push notifications</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.textPrimary },
});
