import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, useColorScheme, Alert, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import type { Folder } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded } from '@/constants/theme';

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  cardWidth: number;
  getCategoryName: (id: number) => string;
  onEdit?: () => void;
  onDelete?: () => void;
}
export function FolderCard({ folder, onPress, cardWidth, getCategoryName, onEdit, onDelete }: FolderCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const [menuVisible, setMenuVisible] = useState(false);

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: Spacing.two }}>
            <Text style={[styles.cardCategory, { color: colors.primary }]} numberOfLines={1}>
              {folder.memory_categories?.category_name || getCategoryName(folder.category_id)}
            </Text>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {folder.name}
            </Text>
          </View>
          {onEdit && onDelete && (
            <View style={{ position: 'relative', zIndex: 999 }}>
              <Pressable 
                onPress={(e) => {
                  e.stopPropagation();
                  setMenuVisible(!menuVisible);
                }}
                style={{ padding: 4, marginRight: -4, marginTop: -4 }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
              </Pressable>

              {menuVisible && (
                <>
                  <Pressable 
                    style={{ 
                      position: 'absolute', 
                      top: -1000, 
                      left: -1000, 
                      right: -1000, 
                      bottom: -1000, 
                      backgroundColor: 'transparent',
                      zIndex: 998
                    }} 
                    onPress={() => setMenuVisible(false)}
                  />
                  <View style={[styles.popoverMenu, { backgroundColor: colors.backgroundElement, borderColor: colors.outline }]}>
                    <Pressable 
                      style={styles.popoverItem} 
                      onPress={() => {
                        setMenuVisible(false);
                        onEdit();
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                      <Text style={[styles.popoverText, { color: colors.text }]}>Edit</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.popoverItem, { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]} 
                      onPress={() => {
                        setMenuVisible(false);
                        onDelete();
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                      <Text style={[styles.popoverText, { color: colors.error }]}>Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
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
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: Rounded.lg,
    borderTopRightRadius: Rounded.lg,
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
  popoverMenu: {
    position: 'absolute',
    right: 0,
    top: 24,
    width: 140,
    borderRadius: Rounded.md,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
    paddingVertical: 4,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  popoverText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
  },
});
