import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/Card';

export default function ClubsScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>Clubs coming soon</Text>
        <Text style={styles.subtitle}>
          Join clubs, chat with members, and participate in club tournaments. This feature will be
          available in a future update.
        </Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
});
