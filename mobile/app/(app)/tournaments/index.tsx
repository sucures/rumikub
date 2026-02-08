import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { listTournaments } from '../../api/tournaments';
import type { TournamentWithDetails } from '../../api/tournaments';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export default function TournamentsScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournaments = async () => {
    try {
      const list = await listTournaments({ status: 'open' });
      setTournaments(list);
    } catch {
      setTournaments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
  };

  const renderItem = ({ item }: { item: TournamentWithDetails }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(app)/tournaments/lobby', params: { id: item.id } })}
    >
      <Card>
        <Text style={styles.tournamentName}>{item.name}</Text>
        <Text style={styles.tournamentMeta}>
          by {item.creatorUsername} · {item.participantCount}/{item.maxPlayers} · {item.entryFee} coins
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          title="Create Tournament"
          onPress={() => router.push('/(app)/tournaments/create')}
          style={styles.createBtn}
        />
      </View>
      <FlatList
        data={tournaments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : (
            <Text style={styles.empty}>No tournaments yet</Text>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    padding: 16,
  },
  createBtn: {
    marginBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  tournamentMeta: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 32,
  },
});
