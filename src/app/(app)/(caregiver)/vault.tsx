<<<<<<< HEAD
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function CaregiverVaultScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>Vault</ThemedText>
          <ThemedText style={styles.subtitle}>Coming soon...</ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
=======
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function VaultPlaceholder() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.center}>
        <Ionicons name="images-outline" size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Vault</Text>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>Coming Soon</Text>
      </View>
    </SafeAreaView>
>>>>>>> origin/feat/smart-schedule-management
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
>>>>>>> origin/feat/smart-schedule-management
});
