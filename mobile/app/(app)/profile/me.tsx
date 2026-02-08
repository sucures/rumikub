import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../../stores/profileStore';
import { useWalletStore } from '../../../stores/walletStore';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function ProfileMeScreen() {
  const router = useRouter();
  const { profile, friends, isLoading, fetchProfile, fetchFriends } = useProfileStore();
  const { fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchProfile();
    fetchFriends();
    fetchWallet();
  }, [fetchProfile, fetchFriends, fetchWallet]);

  if (isLoading && !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  const avatarUrl = profile?.avatarUrl ?? profile?.avatar;
  const initials = (profile?.username ?? '?')[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.avatarRow}>
          {avatarUrl ? (
            <View style={styles.avatarPlaceholder} />
          ) : (
            <View style={styles.avatarInit}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.username}>{profile?.username ?? 'Unknown'}</Text>
            {profile?.country && (
              <Text style={styles.country}>{profile.country}</Text>
            )}
            {profile?.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
            <Button
              title="Edit profile"
              onPress={() => router.push('/(app)/profile/edit')}
              style={styles.editBtn}
            />
            {profile?.premium && (
              <Button
                title="Edit Motivation"
                onPress={() => router.push('/(app)/profile/editMotivation')}
                variant="secondary"
                style={styles.editBtn}
              />
            )}
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.stats?.gamesPlayed ?? 0}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.stats?.gamesWon ?? 0}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.stats?.tournamentsWon ?? 0}</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.walletHeader}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <Button
            title="View"
            variant="ghost"
            onPress={() => router.push('/(app)/wallet')}
          />
        </View>
        <Text style={styles.walletText}>🟡 Coins · 💎 Gems</Text>
      </Card>

      <Card>
        <View style={styles.walletHeader}>
          <Text style={styles.sectionTitle}>Rumi Wallet</Text>
          <Button
            title="View"
            variant="ghost"
            onPress={() => router.push('/(app)/rumi-wallet')}
          />
        </View>
        <Text style={styles.walletText}>Rumi tokens for payments & transfers</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Friends</Text>
        {friends.slice(0, 3).map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/profile/public',
                params: { username: f.friend?.username ?? '' },
              })
            }
          >
            <Text style={styles.friend}>{f.friend?.username ?? 'Unknown'}</Text>
          </TouchableOpacity>
        ))}
        {friends.length === 0 && (
          <Text style={styles.empty}>No friends yet</Text>
        )}
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
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#374151',
  },
  avatarInit: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  country: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
  },
  editBtn: {
    marginTop: 12,
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
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletText: {
    color: '#9ca3af',
    marginTop: 4,
  },
  friend: {
    color: '#e5e7eb',
    paddingVertical: 4,
  },
  empty: {
    color: '#6b7280',
  },
});
