import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  TextInput, 
  useColorScheme 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Category } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded } from '@/constants/theme';

interface VaultHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategoryFilter: string;
  setActiveCategoryFilter: (filter: string) => void;
  categories: Category[];
  connectedSeniors: Array<{ id: string; name: string }>;
  activeVaultOwnerId: string | null;
  setActiveVaultOwnerId: (id: string | null) => void;
}

export function VaultHeader({
  searchQuery,
  setSearchQuery,
  activeCategoryFilter,
  setActiveCategoryFilter,
  categories,
  connectedSeniors,
  activeVaultOwnerId,
  setActiveVaultOwnerId,
}: VaultHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const currentSeniorName = connectedSeniors.find(s => s.id === activeVaultOwnerId)?.name || 'Senior';

  return (
    <View style={styles.container}>
      {/* Title block */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {activeVaultOwnerId ? `${currentSeniorName}'s Vault` : 'Memory Vault'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {activeVaultOwnerId 
              ? `Viewing memory folders for ${currentSeniorName}`
              : 'Store and share memories, folders, and documents'
            }
          </Text>
        </View>
      </View>

      {/* Switcher bar: only show if caregiver has more than 1 connected senior */}
      {connectedSeniors.length > 1 && (
        <View style={styles.vaultSwitcherSection}>
          <Text style={[styles.vaultSwitcherLabel, { color: colors.textSecondary }]}>
            Select Senior Citizen:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vaultSwitcherScroll}>
            {connectedSeniors.map(senior => {
              const isSelected = activeVaultOwnerId === senior.id;
              return (
                <Pressable
                  key={senior.id}
                  style={[
                    styles.vaultSwitcherChip,
                    { 
                      backgroundColor: isSelected ? colors.secondary : colors.surfaceContainer,
                      borderColor: isSelected ? colors.secondary : colors.outline
                    }
                  ]}
                  onPress={() => setActiveVaultOwnerId(senior.id)}
                >
                  <Ionicons 
                    name="heart-outline" 
                    size={18} 
                    color={isSelected ? '#fff' : colors.text} 
                  />
                  <Text style={{ 
                    color: isSelected ? '#fff' : colors.text,
                    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
                    fontSize: 14
                  }}>
                    {senior.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceContainer }]}>
        <Ionicons name="search" size={20} color={colors.outline} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search folders..."
          placeholderTextColor={colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.outline} />
          </Pressable>
        )}
      </View>

      {/* Categories Filter list */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <Pressable 
          style={[
            styles.filterChip, 
            { backgroundColor: activeCategoryFilter === 'all' ? colors.primary : colors.backgroundElement }
          ]}
          onPress={() => setActiveCategoryFilter('all')}
        >
          <Text style={{ 
            color: activeCategoryFilter === 'all' ? '#fff' : colors.text,
            fontFamily: 'AtkinsonHyperlegibleNext-Bold' 
          }}>
            All
          </Text>
        </Pressable>

        {categories.map(category => (
          <Pressable 
            key={category.id}
            style={[
              styles.filterChip, 
              { backgroundColor: activeCategoryFilter === category.id.toString() ? colors.primary : colors.backgroundElement }
            ]}
            onPress={() => setActiveCategoryFilter(category.id.toString())}
          >
            <Text style={{ 
              color: activeCategoryFilter === category.id.toString() ? '#fff' : colors.text,
              fontFamily: 'AtkinsonHyperlegibleNext-Bold' 
            }}>
              {category.category_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    marginBottom: Spacing.four,
  },
  headerTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 15,
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  vaultSwitcherSection: {
    marginBottom: Spacing.four,
    paddingHorizontal: 2,
  },
  vaultSwitcherLabel: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  vaultSwitcherScroll: {
    gap: Spacing.two,
  },
  vaultSwitcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
    borderRadius: Rounded.full,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Rounded.md,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  filterScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.four,
  },
  filterChip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two - 2,
    borderRadius: Rounded.full,
  },
});
