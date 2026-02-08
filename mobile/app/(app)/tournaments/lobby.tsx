import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { getTournament, joinTournament, startTournament, getTournamentRounds } from '../../../api/tournaments';
import type { TournamentWithDetails, TournamentRound } from '../../../api/tournaments';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';

export default function LobbyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(null);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [t, r] = await Promise.all([
        getTournament(id),
        getTournamentRounds(id).catch(() => []),
      ]);
      setTournament(t);
      setRounds(r);
    } catch {
      setTournament(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await joinTournament(id);
      await fetchData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await startTournament(id);
      await fetchData();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  };

  if (!id || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Tournament not found</Text>
      </View>
    );
  }

  const isCreator = tournament.creatorUserId === userId;
  const hasJoined = tournament.participants.some((p) => p.userId === userId);
  const canJoin = tournament.status === 'open' && !hasJoined && tournament.participantCount < tournament.maxPlayers;
  const canStart = isCreator && tournament.status === 'open' && tournament.participantCount >= 2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{tournament.name}</Text>
        <Text style={styles.meta}>
          by {tournament.creatorUsername} · {tournament.participantCount}/{tournament.maxPlayers} ·{' '}
          {tournament.entryFee} coins
        </Text>
        <View style={styles.status}>
          <Text style={[styles.statusBadge, styles[`status_${tournament.status}` as keyof typeof styles]]}>
            {tournament.status}
          </Text>
        </View>
      </Card>

      {canJoin && (
        <Button title="Join Tournament" onPress={handleJoin} loading={actionLoading} style={styles.btn} />
      )}
      {canStart && (
        <Button
          title="Start Tournament"
          onPress={handleStart}
          loading={actionLoading}
          variant="secondary"
          style={styles.btn}
        />
      )}

      <Card>
        <Text style={styles.sectionTitle}>Players</Text>
        {tournament.participants.map((p) => (
          <Text key={p.userId} style={styles.player}>
            {p.username}
          </Text>
        ))}
      </Card>

      {rounds.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Matches</Text>
          {rounds.flatMap((r) =>
            r.matches.map((m) => (
              <Button
                key={m.id}
                title={`${m.player1Username ?? 'TBD'} vs ${m.player2Username ?? 'Bye'}`}
                variant="ghost"
                onPress={() =>
                  router.push({ pathname: '/(app)/tournaments/match', params: { matchId: m.id } })
                }
                style={styles.matchBtn}
              />
            ))
          )}
        </Card>
      )}
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
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  meta: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  status: {
    marginTop: 8,
  },
  statusBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  status_open: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
  },
  status_in_progress: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
  },
  status_finished: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    color: '#9ca3af',
  },
  btn: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  player: {
    color: '#e5e7eb',
    marginBottom: 4,
  },
  matchBtn: {
    marginBottom: 8,
  },
});
