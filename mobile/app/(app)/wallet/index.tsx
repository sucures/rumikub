import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useWalletStore } from '../../stores/walletStore';
import { Card } from '../../components/Card';

export default function WalletScreen() {
  const { coins, gems, transactions, isLoading, error, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.balances}>
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>🟡 Coins</Text>
            <Text style={styles.balanceValue}>{coins}</Text>
          </View>
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>💎 Gems</Text>
            <Text style={styles.balanceValue}>{gems}</Text>
          </View>
        </View>
      </Card>

      {error && (
        <Card>
          <Text style={styles.error}>{error}</Text>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>Transaction history</Text>
        {isLoading ? (
          <Text style={styles.loading}>Loading...</Text>
        ) : transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.txRow}>
                <View>
                  <Text style={styles.txDesc}>{item.description || item.type}</Text>
                  <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    item.amount > 0 ? styles.txPositive : styles.txNegative,
                  ]}
                >
                  {item.amount > 0 ? '+' : ''}
                  {item.amount} {item.currency}
                </Text>
              </View>
            )}
          />
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
  balances: {
    flexDirection: 'row',
    gap: 24,
  },
  balance: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 4,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  loading: {
    color: '#9ca3af',
  },
  empty: {
    color: '#6b7280',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.5)',
  },
  txDesc: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  txDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  txPositive: {
    color: '#22c55e',
  },
  txNegative: {
    color: '#ef4444',
  },
});
