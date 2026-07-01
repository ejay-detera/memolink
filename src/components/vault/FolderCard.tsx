import React from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import type { Folder } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded } from '@/constants/theme';

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  cardWidth: number;
  getCategoryName: (id: number) => string;
}

export function FolderCard({ folder, onPress, cardWidth, getCategoryName }: FolderCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const getFolderCover = (f: Folder) => {
    if (f.image_path) return f.image_path;
    if (f.memory_files && f.memory_files.length > 0) {
      const images = f.memory_files
        .filter(file => file.file_type === 'image')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (images.length > 0) {
        return images[0].file_path;
      }
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getUploaderLabel = () => {
    if (!folder.uploader) return null;
    if (folder.uploaded_by === folder.user_id) {
      // Uploaded by the vault owner themselves
      return null;
    }
    return folder.uploader.first_name || 'Caregiver';
  };

  const cover = getFolderCover(folder);
  const uploaderName = getUploaderLabel();

  return (
    <Pressable 
      style={[styles.card, { width: cardWidth, backgroundColor: colors.backgroundElement }]}
      onPress={onPress}
    >
      {cover ? (
        <Image source={cover} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="images-outline" size={40} color={colors.outline} />
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={[styles.cardCategory, { color: colors.primary }]}>
          {folder.memory_categories?.category_name || getCategoryName(folder.category_id)}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {folder.name}
        </Text>
        {!!folder.desc && (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {folder.desc}
          </Text>
        )}
        {/* Date & Uploader row */}
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
              {folder.folder_date ? formatDate(folder.folder_date) : formatDate(folder.created_at.split('T')[0])}
            </Text>
          </View>
          {uploaderName && (
            <View style={styles.cardMetaRow}>
              <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.cardMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                By {uploaderName}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: Spacing.three,
  },
  cardCategory: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  cardTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  cardDesc: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    lineHeight: 18,
  },
  cardMeta: {
    marginTop: Spacing.two,
    gap: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    flexShrink: 1,
  },
});
