import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, useColorScheme, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, Rounded } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { format, parseISO } from 'date-fns';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

type Capsule = any; // We'll type this properly if needed
type FileItem = any;

export default function CapsuleViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userRole } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { width } = useWindowDimensions();

  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCapsule = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Fetch capsule
        const { data: cap, error: capErr } = await supabase
          .from('memory_capsules')
          .select('*')
          .eq('id', id)
          .single();
        
        if (capErr) throw capErr;
        setCapsule(cap);

        // Fetch items
        const { data: items, error: itemsErr } = await supabase
          .from('memory_capsule_items')
          .select('*, memory_files(*)')
          .eq('capsule_id', id);

        if (itemsErr) throw itemsErr;
        if (items) {
          setFiles(items.map(item => item.memory_files).filter(Boolean));
        }

        // Mark as viewed (only if viewed by senior)
        if (!cap.is_viewed && userRole !== 'caregiver') {
          await supabase
            .from('memory_capsules')
            .update({ is_viewed: true })
            .eq('id', id);
        }

      } catch (err: any) {
        console.error(err);
        setError('Failed to load memory capsule.');
      } finally {
        setLoading(false);
      }
    };
    fetchCapsule();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (error || !capsule) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={{ color: colors.error }}>{error || 'Capsule not found'}</ThemedText>
        <PrimaryButton title="Go Back" onPress={() => router.back()} style={{ marginTop: Spacing.four }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Memory Capsule', 
        headerShown: true,
        headerBackTitle: 'Home',
        headerTintColor: colors.primary
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.titleRow}>
            <SymbolView name="gift.fill" tintColor={colors.primary} size={40} />
            <View style={{ marginLeft: Spacing.three, flex: 1 }}>
              <ThemedText type="title" style={{ fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                {capsule.title}
              </ThemedText>
              <ThemedText style={{ color: colors.textSecondary }}>
                Revealed on {format(parseISO(capsule.trigger_date), 'MMMM d, yyyy')}
              </ThemedText>
            </View>
          </View>
          
          {capsule.message ? (
            <View style={[styles.messageCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outline }]}>
              <ThemedText style={{ fontSize: 18, fontStyle: 'italic', color: colors.textSecondary, lineHeight: 28 }}>
                "{capsule.message}"
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.gallery}>
          <ThemedText type="subtitle" style={{ marginBottom: Spacing.three }}>Memories</ThemedText>
          <View style={styles.grid}>
            {files.map((file, index) => {
              const itemWidth = Math.min((width - Spacing.four * 2 - Spacing.three) / 2, (MaxContentWidth - Spacing.three) / 2);
              return (
                <View key={file.id} style={[styles.imageContainer, { width: itemWidth, height: itemWidth }]}>
                  <Image source={{ uri: file.file_path }} style={styles.image} resizeMode="cover" />
                </View>
              );
            })}
          </View>
          {files.length === 0 && (
            <ThemedText style={{ color: colors.textSecondary }}>No photos attached to this capsule.</ThemedText>
          )}
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.five,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  messageCard: {
    padding: Spacing.four,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  gallery: {
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  imageContainer: {
    borderRadius: Rounded.md,
    overflow: 'hidden',
    backgroundColor: '#eee', // placeholder
  },
  image: {
    width: '100%',
    height: '100%',
  }
});
