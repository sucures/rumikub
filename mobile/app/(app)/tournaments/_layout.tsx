import { Stack } from 'expo-router';

export default function TournamentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f59e0b',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tournaments' }} />
      <Stack.Screen name="create" options={{ title: 'Create Tournament' }} />
      <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
      <Stack.Screen name="match" options={{ title: 'Match' }} />
    </Stack>
  );
}
