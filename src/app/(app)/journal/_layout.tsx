/**
 * Journal sub-screen stack layout.
 * Wraps the create and detail screens in a stack navigator
 * accessible from both senior and caregiver tabs.
 */

import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function JournalLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Journal',
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: 'AtkinsonHyperlegibleNext-Bold',
          fontSize: 18,
        },
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
