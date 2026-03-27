import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' as const },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Clients' }} />
    </Stack>
  );
}
