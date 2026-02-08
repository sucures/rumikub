import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../../stores/authStore';
import { getMatch, reportMatchWinner } from '../../../api/tournaments';
import type { TournamentMatch } from '../../../api/tournaments';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { WEB_APP_URL } from '../../../constants';

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const [match, setMatch] = useState<TournamentMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);

  const fetchMatch = async () => {
    if (!matchId) return;
    try {
      const m = await getMatch(matchId);
      setMatch(m);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const handleReportWinner = async (winnerId: string) => {
    if (!matchId) return;
    setActionLoading(winnerId);
    try {
      const result = await reportMatchWinner(matchId, winnerId);
      setMatch(result.match);
      if (result.tournamentFinished) {
        Alert.alert('Tournament finished!', 'The tournament has ended.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to report');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlayMatch = () => {
    setShowWebView(true);
  };

  if (!matchId || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (showWebView) {
    const { width, height } = Dimensions.get('window');
    return (
      <View style={styles.webViewContainer}>
        <Button
          title="Back"
          variant="secondary"
          onPress={() => setShowWebView(false)}
          style={styles.backBtn}
        />
        <WebView
          source={{
            uri: match?.gameId
              ? `${WEB_APP_URL}/game/${match.gameId}`
              : `${WEB_APP_URL}/rooms`,
          }}
          style={{ width, height: height - 60 }}
        />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Match not found</Text>
      </View>
    );
  }

  const p1Name = match.player1Username ?? 'TBD';
  const p2Name = match.player2Username ?? 'Bye';
  const isBye = !match.player2Id;
  const canReport =
    match.status !== 'finished' &&
    (match.player1Id === userId || match.player2Id === userId);

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.round}>Round {match.roundNumber} · Match {match.tableNumber}</Text>
        <Text style={[styles.status, styles[`status_${match.status}` as keyof typeof styles]]}>
          {match.status}
        </Text>

        <View style={styles.players}>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>{p1Name}</Text>
            {match.winnerId === match.player1Id && (
              <Text style={styles.winnerBadge}>Winner</Text>
            )}
          </View>
          <Text style={styles.vs}>vs</Text>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>{p2Name}</Text>
            {match.winnerId === match.player2Id && (
              <Text style={styles.winnerBadge}>Winner</Text>
            )}
          </View>
        </View>

        {match.status !== 'finished' && !isBye && (
          <Button
            title="Play Match (WebView)"
            onPress={handlePlayMatch}
            style={styles.btn}
          />
        )}

        {canReport && !isBye && (
          <View style={styles.reportRow}>
            {match.player1Id && (
              <Button
                title={`${p1Name} wins`}
                variant="secondary"
                onPress={() => handleReportWinner(match.player1Id!)}
                loading={actionLoading === match.player1Id}
                style={styles.reportBtn}
              />
            )}
            {match.player2Id && (
              <Button
                title={`${p2Name} wins`}
                variant="secondary"
                onPress={() => handleReportWinner(match.player2Id!)}
                loading={actionLoading === match.player2Id}
                style={styles.reportBtn}
              />
            )}
          </View>
        )}

        {match.status === 'finished' && match.winnerUsername && (
          <Text style={styles.winner}>Winner: {match.winnerUsername}</Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    padding: 20,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#030712',
  },
  backBtn: {
    margin: 16,
  },
  loading: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 48,
  },
  round: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  status_pending: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    color: '#9ca3af',
  },
  status_in_progress: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
  },
  status_finished: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
  },
  players: {
    marginVertical: 16,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  winnerBadge: {
    fontSize: 12,
    color: '#f59e0b',
  },
  vs: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 4,
  },
  btn: {
    marginTop: 16,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  reportBtn: {
    flex: 1,
  },
  winner: {
    color: '#f59e0b',
    marginTop: 16,
  },
});
