import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../../stores/profileStore';
import { updateProfile } from '../../../api/profile';
import { Button } from '../../../components/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setCountry(profile.country ?? '');
      setAvatarUrl(profile.avatarUrl ?? profile.avatar ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      await fetchProfile();
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#6b7280"
        value={username}
        onChangeText={setUsername}
      />
      <Text style={styles.label}>Avatar URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor="#6b7280"
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Bio"
        placeholderTextColor="#6b7280"
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <Text style={styles.label}>Country</Text>
      <TextInput
        style={styles.input}
        placeholder="Country"
        placeholderTextColor="#6b7280"
        value={country}
        onChangeText={setCountry}
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
  },
});
