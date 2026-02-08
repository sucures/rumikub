import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotivationModal } from '../../components/MotivationModal';
import { getTodayMotivation } from '../../api/motivation';

export default function AppLayout() {
  const [motivationText, setMotivationText] = useState<string | null>(null);
  const [showMotivation, setShowMotivation] = useState(false);

  useEffect(() => {
    getTodayMotivation()
      .then(({ text }) => {
        setMotivationText(text);
        setShowMotivation(true);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <MotivationModal
        visible={showMotivation && motivationText !== null}
        text={motivationText ?? ''}
        onDismiss={() => setShowMotivation(false)}
      />
      <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f59e0b',
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#374151' },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rumi-wallet"
        options={{
          title: 'Rumi Wallet',
          headerShown: true,
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}
