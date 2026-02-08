import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createTournament } from '../../api/tournaments';
import { Button } from '../../components/Button';

export default function CreateTournamentScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<'4'>('4');
  const [entryFee, setEntryFee] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Enter tournament name');
      return;
    }
    const fee = parseInt(entryFee || '0', 10);
    if (isNaN(fee) || fee < 0) {
      Alert.alert('Error', 'Enter valid entry fee');
      return;
    }
    setLoading(true);
    try {
      const t = await createTournament({
        name: name.trim(),
        maxPlayers: parseInt(maxPlayers, 10) as 2 | 4 | 6 | 8,
        entryFee: fee,
      });
      router.replace({ pathname: '/(app)/tournaments/lobby', params: { id: t.id } });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Tournament name"
        placeholderTextColor="#6b7280"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Max players</Text>
      <View style={styles.row}>
        {(['2', '4', '6', '8'] as const).map((n) => (
          <Button
            key={n}
            title={n}
            variant={maxPlayers === n ? 'primary' : 'secondary'}
            onPress={() => setMaxPlayers(n)}
            style={styles.option}
          />
        ))}
      </View>
      <Text style={styles.label}>Entry fee (coins)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor="#6b7280"
        value={entryFee}
        onChangeText={setEntryFee}
        keyboardType="number-pad"
      />
      <Button title="Create" onPress={handleCreate} loading={loading} style={styles.button} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  option: {
    flex: 1,
  },
  button: {
    marginTop: 8,
  },
});
