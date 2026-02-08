import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const router = useRouter();
  const { isHydrated, token } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (token) {
      router.replace('/(app)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isHydrated, token, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
