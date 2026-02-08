import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import { useWalletStore } from '../../stores/walletStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { WEB_APP_URL } from '../../constants';

export default function HomeScreen() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const { coins, gems, fetchWallet } = useWalletStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchWallet();
    }
  }, [token, fetchProfile, fetchWallet]);

  const referralLink = profile?.referralCode
    ? `${WEB_APP_URL}/invite/${profile.referralCode}`
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>RumiMind</Text>
        <Text style={styles.subtitle}>Cognitive Strategy Platform</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actions}>
          <Button
            title="Tournaments"
            onPress={() => router.push('/(app)/tournaments')}
            style={styles.actionBtn}
          />
          <Button
            title="Profile"
            onPress={() => router.push('/(app)/profile/me')}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            title="Store"
            onPress={() => router.push('/(app)/store')}
            variant="secondary"
            style={styles.actionBtn}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Wallet</Text>
        <View style={styles.walletRow}>
          <Text style={styles.walletLabel}>🟡 Coins</Text>
          <Text style={styles.walletValue}>{coins}</Text>
        </View>
        <View style={styles.walletRow}>
          <Text style={styles.walletLabel}>💎 Gems</Text>
          <Text style={styles.walletValue}>{gems}</Text>
        </View>
        <Button
          title="View Wallet"
          onPress={() => router.push('/(app)/wallet')}
          variant="secondary"
          style={styles.actionBtn}
        />
      </Card>

      {referralLink && (
        <Card>
          <Text style={styles.sectionTitle}>Referral</Text>
          <Text style={styles.referralText} numberOfLines={2}>
            {referralLink}
          </Text>
          <Button
            title="Copy link"
            onPress={async () => {
              const Clipboard = (await import('expo-clipboard')).default;
              await Clipboard.setStringAsync(referralLink);
            }}
            variant="secondary"
            style={styles.actionBtn}
          />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Play on web</Text>
        <Button
          title="Open web game"
          onPress={() => Linking.openURL(WEB_APP_URL)}
          variant="ghost"
          style={styles.actionBtn}
        />
      </Card>

      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    marginBottom: 8,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletLabel: {
    color: '#9ca3af',
  },
  walletValue: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  referralText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 12,
  },
  logout: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
  },
});
