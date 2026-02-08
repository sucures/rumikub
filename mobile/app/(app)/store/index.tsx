import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { listStoreItems, purchaseItem } from '../../api/store';
import type { StoreItem } from '../../api/store';
import { useWalletStore } from '../../stores/walletStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export default function StoreScreen() {
  const router = useRouter();
  const { fetchWallet } = useWalletStore();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    listStoreItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (item: StoreItem) => {
    setPurchasing(item.id);
    try {
      await purchaseItem(item.id);
      await fetchWallet();
      Alert.alert('Success', 'Purchase complete!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const renderItem = ({ item }: { item: StoreItem }) => {
    const price =
      item.priceCoins != null
        ? `${item.priceCoins} coins`
        : item.priceGems != null
        ? `${item.priceGems} gems`
        : 'Free';

    return (
      <Card>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemType}>{item.type}</Text>
        <Text style={styles.itemPrice}>{price}</Text>
        <Button
          title="Purchase"
          onPress={() => handlePurchase(item)}
          loading={purchasing === item.id}
          style={styles.purchaseBtn}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : (
            <Text style={styles.empty}>No items available</Text>
          )
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
  list: {
    padding: 20,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  itemType: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#f59e0b',
    marginTop: 8,
  },
  purchaseBtn: {
    marginTop: 12,
  },
  empty: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 48,
  },
});
