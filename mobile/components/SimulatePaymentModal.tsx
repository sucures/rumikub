import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button } from './Button';

interface SimulatePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (balance: number) => void;
}

export function SimulatePaymentModal({
  visible,
  onClose,
  onSuccess,
}: SimulatePaymentModalProps) {
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const merchant = merchantName.trim();
    const amt = parseInt(amount, 10);
    if (!merchant) {
      Alert.alert('Error', 'Merchant name is required');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }
    setLoading(true);
    try {
      const rumiWallet = await import('../api/rumiWallet');
      const result = await rumiWallet.simulateCardPayment(amt, merchant);
      onSuccess(result.balance);
      setMerchantName('');
      setAmount('');
      onClose();
    } catch (err) {
      const rumiWallet = await import('../api/rumiWallet');
      Alert.alert('Error', rumiWallet.mapWalletErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Simulate Payment</Text>
          <Text style={styles.label}>Merchant name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Coffee Shop"
            placeholderTextColor="#6b7280"
            value={merchantName}
            onChangeText={setMerchantName}
          />
          <Text style={styles.label}>Amount (tokens)</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            placeholderTextColor="#6b7280"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.btn} />
            <Button title="Pay" onPress={handleSubmit} loading={loading} style={styles.btn} />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
  },
});
