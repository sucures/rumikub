import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getRumiWalletBalance,
  getRumiWalletTransactions,
  mapWalletErrorMessage,
  type RumiWalletTransaction,
} from '../../api/rumiWallet';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SimulatePaymentModal } from '../../components/SimulatePaymentModal';
import { TransferTokensModal } from '../../components/TransferTokensModal';

export default function RumiWalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<RumiWalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const fetchWallet = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    const maxRetries = 1;
    try {
      const [bal, txs] = await Promise.all([
        getRumiWalletBalance(),
        getRumiWalletTransactions(50, 0),
      ]);
      setBalance(bal);
      setTransactions(txs);
    } catch (err) {
      const message = mapWalletErrorMessage(err);
      if (retryCount < maxRetries) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchWallet(retryCount + 1);
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  const getTxLabel = (tx: RumiWalletTransaction) => {
    const meta = tx.metadata ?? {};
    if (tx.type === 'spend' && meta.merchantName) return String(meta.merchantName);
    if (tx.type === 'transfer_in' && meta.fromUserId) return `From user`;
    if (tx.type === 'transfer_out' && meta.toUserId) return `To user`;
    return tx.type;
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.balanceLabel}>Rumi tokens</Text>
        <Text style={styles.balanceValue}>{balance}</Text>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Simulate Payment"
          onPress={() => setShowSimulate(true)}
          variant="primary"
          style={styles.actionBtn}
        />
        <Button
          title="Transfer Tokens"
          onPress={() => setShowTransfer(true)}
          variant="secondary"
          style={styles.actionBtn}
        />
      </View>

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
                  <Text style={styles.txDesc}>{getTxLabel(item)}</Text>
                  <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    item.amount > 0 ? styles.txPositive : styles.txNegative,
                  ]}
                >
                  {item.amount > 0 ? '+' : ''}
                  {item.amount} tokens
                </Text>
              </View>
            )}
          />
        )}
      </Card>

      <SimulatePaymentModal
        visible={showSimulate}
        onClose={() => setShowSimulate(false)}
        onSuccess={(bal) => {
          setBalance(bal);
          fetchWallet();
        }}
      />
      <TransferTokensModal
        visible={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSuccess={(bal) => {
          setBalance(bal);
          fetchWallet();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    padding: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
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
