import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f59e0b',
      }}
    >
      <Stack.Screen name="me" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="editMotivation" options={{ title: 'Edit Motivation' }} />
      <Stack.Screen name="public" options={{ title: 'Profile' }} />
    </Stack>
  );
}
