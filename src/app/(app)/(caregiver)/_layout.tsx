import { CaregiverHeader } from '@/components/ui/caregiver-header';
import { CaregiverTabBar } from '@/components/ui/caregiver-tab-bar';
import { useAuth } from '@/hooks/use-auth';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function CaregiverLayout() {
  const { userRole, isLoading } = useAuth();
  const pathname = usePathname();

  // Protect the entire caregiver section so only caregivers can access it
  if (!isLoading && userRole !== 'caregiver') {
    return <Redirect href="/(app)/(senior)" />;
  }

  const isMainTab = ['/', '/medications', '/journal', '/vault'].includes(pathname);

  return (
    <View style={styles.container}>
      {isMainTab && <CaregiverHeader />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fbf9f8' } }} />
      {isMainTab && <CaregiverTabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
