import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MotivationModalProps {
  visible: boolean;
  text: string;
  onDismiss: () => void;
}

export function MotivationModal({ visible, text, onDismiss }: MotivationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.label}>Today&apos;s motivation</Text>
          <Text style={styles.text}>{text}</Text>
          <TouchableOpacity onPress={onDismiss} style={styles.button}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
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
  label: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 26,
    marginBottom: 20,
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 16,
  },
});
