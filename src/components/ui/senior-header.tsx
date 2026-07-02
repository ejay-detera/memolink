import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Modal, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Shadows, Rounded } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export function SeniorHeader() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Try to get initials for the avatar fallback
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'M';

  return (
    <View style={[styles.header, { paddingTop: insets.top || Spacing.four }]}>
      <View style={styles.headerLeft}>
        <Image source={require('../../../assets/public/memolink-icon.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          MemoLink
        </ThemedText>
      </View>
      <View style={styles.headerRight}>
        <Pressable style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.light.textSecondary} />
        </Pressable>
        
        <Pressable 
          style={styles.avatarContainer} 
          onPress={() => setMenuVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Profile Menu"
        >
          <View style={styles.avatarFallback}>
            <ThemedText style={{ color: Colors.light.background, fontWeight: 'bold' }}>{initials}</ThemedText>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} 
          onPress={() => setMenuVisible(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.dropdownMenu, Shadows.card]}>
              
              <Pressable
                style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? Colors.light.surfaceContainer : 'transparent' }]}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(app)/profile' as any);
                }}
              >
                <Ionicons name="person-circle-outline" size={20} color={Colors.light.text} />
                <ThemedText style={styles.menuItemText}>View Profile</ThemedText>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                style={({ pressed }) => [styles.menuItem, { backgroundColor: pressed ? Colors.light.surfaceContainer : 'transparent' }]}
                onPress={() => {
                  setMenuVisible(false);
                  signOut();
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.light.error} />
                <ThemedText style={[styles.menuItemText, { color: Colors.light.error }]}>Log Out</ThemedText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    backgroundColor: '#ffffff',
    ...(Platform.select({
      ios: Shadows.card,
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
    }) as any),
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
    color: Colors.light.primary,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1b4d89', // primary-container
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any),
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: Spacing.four,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Rounded.md,
    padding: Spacing.one,
    minWidth: 180,
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Rounded.sm,
    gap: Spacing.two,
  },
  menuItemText: {
    color: Colors.light.text, 
    fontFamily: 'AtkinsonHyperlegibleNext-Bold', 
    fontSize: 16 
  },
  menuDivider: {
    height: 1, 
    backgroundColor: Colors.light.outline, 
    marginVertical: 4 
  }
});
