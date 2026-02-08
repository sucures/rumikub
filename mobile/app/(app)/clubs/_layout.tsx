import { Stack } from 'expo-router';

export default function ClubsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#f59e0b',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Clubs' }} />
      <Stack.Screen name="create" options={{ title: 'Create Club' }} />
      <Stack.Screen name="view" options={{ title: 'Club' }} />
    </Stack>
  );
}
