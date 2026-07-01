import { Stack, useRouter } from 'expo-router';
import { useColorScheme, Pressable, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RoutinesLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
          ) : null,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Daily Routines',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Routine',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
