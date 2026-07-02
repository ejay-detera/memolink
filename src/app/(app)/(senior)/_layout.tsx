import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SeniorTabBar } from '@/components/ui/senior-tab-bar';
import { SeniorHeader } from '@/components/ui/senior-header';
import { Colors } from '@/constants/theme';

export default function SeniorLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const pathname = usePathname();

  const isMainTab = ['/', '/assistant', '/medications', '/vault', '/journal'].includes(pathname);

  return (
    <View style={styles.container}>
      {isMainTab && <SeniorHeader />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      {isMainTab && <SeniorTabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
