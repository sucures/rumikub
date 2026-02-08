import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../components/Card';

export default function CreateClubScreen() {
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>Clubs coming soon</Text>
        <Text style={styles.subtitle}>Create clubs in a future update.</Text>
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
  },
});
