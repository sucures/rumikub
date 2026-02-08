import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPublicProfile } from '../../../api/profile';
import { sendFriendRequest } from '../../../api/friends';
import type { PublicProfile } from '../../../api/profile';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'sent'>('none');

  useEffect(() => {
    if (!username) return;
    getPublicProfile(username)
      .then((p) => {
        setProfile(p);
        setFriendStatus('none');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  const handleAddFriend = async () => {
    if (!profile) return;
    setSending(true);
    try {
      await sendFriendRequest(profile.id);
      setFriendStatus('sent');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (!username || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.username}>{profile.username}</Text>
        {profile.country && (
          <Text style={styles.country}>{profile.country}</Text>
        )}
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}
        {friendStatus === 'none' && (
          <Button
            title="Add friend"
            onPress={handleAddFriend}
            loading={sending}
            style={styles.btn}
          />
        )}
        {friendStatus === 'sent' && (
          <Text style={styles.sent}>Request sent</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stats?.gamesPlayed ?? 0}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stats?.gamesWon ?? 0}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.stats?.tournamentsWon ?? 0}</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
        </View>
      </Card>
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
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  country: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 8,
  },
  btn: {
    marginTop: 16,
  },
  sent: {
    color: '#22c55e',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});
