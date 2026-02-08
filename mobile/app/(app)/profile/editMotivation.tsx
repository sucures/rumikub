import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getTodayMotivation, setUserMotivation } from '../../../api/motivation';
import { Button } from '../../../components/Button';

export default function EditMotivationScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTodayMotivation()
      .then(({ text: t }) => {
        if (!cancelled) setText(t);
      })
      .catch(() => {
        if (!cancelled) setText('');
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a motivational phrase');
      return;
    }
    setLoading(true);
    try {
      await setUserMotivation(trimmed);
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Your custom motivational phrase</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter your personal motivation..."
        placeholderTextColor="#6b7280"
        value={text}
        onChangeText={setText}
        multiline
      />
      <Button title="Save" onPress={handleSave} loading={loading} style={styles.button} />
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
  loading: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 48,
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
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
  },
});
