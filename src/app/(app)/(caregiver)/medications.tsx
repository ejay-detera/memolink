import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function CaregiverMedicationsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>Medications</ThemedText>
          <ThemedText style={styles.subtitle}>Coming soon...</ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 24,
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  }
});
