import { Stack } from 'expo-router';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SeniorTabBar } from '@/components/ui/senior-tab-bar';
import { SeniorHeader } from '@/components/ui/senior-header';
import { Colors } from '@/constants/theme';

export default function SeniorLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View style={styles.container}>
      <SeniorHeader />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      <SeniorTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
