import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function EventsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTintColor: colors.text,
      headerShadowVisible: false,
    }}>
      <Stack.Screen name="index" options={{ title: 'Personal Events' }} />
      <Stack.Screen name="add" options={{ title: 'New Event', presentation: 'modal' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Event', presentation: 'modal' }} />
      {/* [id].tsx dynamically manages its own options */}
    </Stack>
  );
}
