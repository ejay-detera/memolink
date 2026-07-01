import { View, Pressable, useColorScheme, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Colors, Spacing, Rounded, Shadows } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { ThemedText } from '@/components/themed-text';

export function HeaderActions() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user, signOut } = useAuth();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: Spacing.two }}>
      <Pressable 
        onPress={() => setMenuVisible(true)}
        style={{ width: 40, height: 40, borderRadius: Rounded.full, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        accessibilityLabel="Profile Menu"
        accessibilityRole="button"
      >
        {avatarUrl ? (
          <Image source={avatarUrl} style={{ width: 40, height: 40 }} contentFit="cover" />
        ) : (
          <SymbolView name="person.circle.fill" tintColor={colors.primary} size={28} />
        )}
      </Pressable>

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
            <View style={[{
              position: 'absolute',
              top: 70,
              right: Spacing.four,
              backgroundColor: colors.backgroundElement,
              borderRadius: Rounded.md,
              padding: Spacing.one,
              minWidth: 180,
              borderWidth: 1,
              borderColor: colors.outline,
            }, Shadows.card]}>
              
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.three,
                  borderRadius: Rounded.sm,
                  backgroundColor: pressed ? colors.surfaceContainer : 'transparent',
                  gap: Spacing.two,
                  marginBottom: 2
                }]}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(app)/profile' as any);
                }}
              >
                <SymbolView name="person.crop.circle" tintColor={colors.text} size={20} />
                <ThemedText style={{ color: colors.text, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 16 }}>View Profile</ThemedText>
              </Pressable>

              <View style={{ height: 1, backgroundColor: colors.outline, marginVertical: 4 }} />

              <Pressable
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.three,
                  borderRadius: Rounded.sm,
                  backgroundColor: pressed ? colors.surfaceContainer : 'transparent',
                  gap: Spacing.two
                }]}
                onPress={() => {
                  setMenuVisible(false);
                  signOut();
                }}
              >
                <SymbolView name="rectangle.portrait.and.arrow.right" tintColor={colors.error} size={20} />
                <ThemedText style={{ color: colors.error, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 16 }}>Log Out</ThemedText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}


