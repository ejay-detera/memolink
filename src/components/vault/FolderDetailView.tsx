import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  useColorScheme,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import type { Folder, FileItem } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded, MaxContentWidth, Shadows } from '@/constants/theme';
import { FAB } from '../ui/FAB';

interface FolderDetailViewProps {
  folder: Folder;
  files: FileItem[];
  onBack: () => void;
  onOpenFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onEditFolder: () => void;
  onDeleteFolder: () => void;
  onUploadFiles: (folderId: string, assets: Array<{ uri: string, name: string, mimeType?: string }>) => Promise<void>;
  uploadingFile: boolean;
  getCategoryName: (id: number) => string;
}

export function FolderDetailView({
  folder,
  files,
  onBack,
  onOpenFile,
  onRenameFile,
  onDeleteFile,
  onEditFolder,
  onDeleteFolder,
  onUploadFiles,
  uploadingFile,
  getCategoryName
}: FolderDetailViewProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [folderMenuVisible, setFolderMenuVisible] = useState(false);

  const selectFilesWeb = (): Promise<File[] | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      input.multiple = true;
      input.onchange = () => {
        if (input.files && input.files.length > 0) {
          resolve(Array.from(input.files));
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  };

  const handleUploadFilesClick = async () => {
    try {
      let pickedAssets: Array<{ uri: string, name: string, mimeType?: string }> = [];
      const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

      if (Platform.OS === 'web') {
        const webFiles = await selectFilesWeb();
        if (!webFiles || webFiles.length === 0) return;

        // Size check for Web
        const oversized = webFiles.filter(file => file.size > MAX_SIZE_BYTES);
        if (oversized.length > 0) {
          const names = oversized.map(f => f.name).join(', ');
          window.alert(`Upload Failed: The following file(s) exceed the 50MB limit:\n${names}`);
          return;
        }

        pickedAssets = webFiles.map(file => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          mimeType: file.type
        }));
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
          multiple: true
        });

        if (result.canceled || !result.assets) return;

        // Size check for Native
        const oversized = result.assets.filter(asset => asset.size && asset.size > MAX_SIZE_BYTES);
        if (oversized.length > 0) {
          const names = oversized.map(a => a.name).join(', ');
          Alert.alert(
            'Upload Failed',
            `The following file(s) exceed the 50MB size limit:\n${names}\n\nPlease choose files smaller than 50MB.`
          );
          return;
        }

        pickedAssets = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType
        }));
      }

      if (pickedAssets.length > 0) {
        // Debug: log URIs to help diagnose Android file access issues
        pickedAssets.forEach((a, i) => console.log(`[Vault Upload] Asset ${i}: uri=${a.uri}, name=${a.name}, mime=${a.mimeType}`));
        await onUploadFiles(folder.id, pickedAssets);
      }
    } catch (error: any) {
      console.error('File picker/upload failed:', error);
    }
  };

  const getFileIconName = (type: string) => {
    switch (type) {
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      default: return 'document-text-outline';
    }
  };

  return (
    <>
      {folderMenuVisible && (
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => setFolderMenuVisible(false)} 
        />
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={{ overflow: 'visible' }}
      >
        {/* Top row: Back arrow & ellipsis actions menu */}
        <View style={styles.detailHeaderMetaClean}>
          <Pressable style={[styles.backButtonOnlyArrow, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>Back</Text>
          </Pressable>

          <View style={styles.menuContainerClean}>
            <Pressable 
              onPress={() => setFolderMenuVisible(!folderMenuVisible)}
              style={({ pressed }) => [styles.iconActionClean, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={colors.primary} />
            </Pressable>
            
            {folderMenuVisible && (
              <View style={[styles.popoverMenuClean, { backgroundColor: colors.background, borderColor: colors.outline }]}>
                <Pressable 
                  style={styles.popoverItemClean} 
                  onPress={() => {
                    setFolderMenuVisible(false);
                    onEditFolder();
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                  <Text style={[styles.popoverTextClean, { color: colors.text }]}>Edit Folder</Text>
                </Pressable>
                <Pressable 
                  style={[styles.popoverItemClean, styles.popoverItemDeleteClean]} 
                  onPress={() => {
                    setFolderMenuVisible(false);
                    onDeleteFolder();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={[styles.popoverTextClean, { color: colors.error }]}>Delete Folder</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Folder Info */}
        <View style={styles.detailTextWrapperClean}>
          <Text style={[styles.detailCategoryClean, { color: colors.primary }]}>
            {folder.memory_categories?.category_name || getCategoryName(folder.category_id)}
          </Text>
          
          <Text style={[styles.detailTitleClean, { color: colors.text }]}>{folder.name}</Text>
          
          {!!folder.desc && (
            <Text style={[styles.detailDescClean, { color: colors.textSecondary }]}>{folder.desc}</Text>
          )}
        </View>

        {/* Files List */}
        <View style={styles.filesSection}>
          <View style={styles.filesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Files</Text>
            <Text style={{ fontFamily: 'AtkinsonHyperlegibleNext-Regular', fontSize: 13, color: colors.textSecondary }}>
              Maximum 50MB per file upload
            </Text>
          </View>

          {files.length === 0 ? (
            <View style={styles.emptyFilesStateCompact}>
              <Ionicons name="document-text-outline" size={36} color={colors.outline} />
              <Text style={[styles.emptyStateTextCompact, { color: colors.textSecondary }]}>This folder is empty</Text>
              <Text style={[styles.emptyStateSubCompact, { color: colors.outline }]}>Add images, videos, audio, or documents.</Text>
            </View>
          ) : (
            <View style={styles.filesGrid}>
              {files.map(file => (
                <View key={file.id} style={[styles.fileRow, { backgroundColor: colors.backgroundElement }]}>
                  <Pressable 
                    style={styles.fileMain}
                    onPress={() => onOpenFile(file)}
                  >
                    <View style={[styles.fileIconWrapper, { backgroundColor: colors.surfaceContainer }]}>
                      {file.file_type === 'image' ? (
                        <Image source={file.file_path} style={styles.fileThumbnail} />
                      ) : (
                        <Ionicons name={getFileIconName(file.file_type)} size={28} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.fileDetails}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>{file.name}</Text>
                      <Text style={[styles.fileMeta, { color: colors.textSecondary }]}>
                        {file.file_type.toUpperCase()} • {new Date(file.created_at).toLocaleDateString()}
                      </Text>
                      {file.uploader && file.uploaded_by !== folder.user_id && (
                        <Text style={[styles.fileUploaderText, { color: colors.textSecondary }]}>
                          Uploaded by: {file.uploader.first_name || 'Caregiver'}
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  <View style={styles.fileActions}>
                    <Pressable 
                      style={styles.fileActionBtn} 
                      onPress={() => onRenameFile(file)}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable 
                      style={styles.fileActionBtn} 
                      onPress={() => onDeleteFile(file)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB to Upload Files */}
      <FAB onPress={handleUploadFilesClick} iconName="plus" disableRotation={true} />

      {/* File Uploading Overlay Modal */}
      {uploadingFile && (
        <Modal transparent={true} visible={true} animationType="fade">
          <View style={styles.uploadOverlay}>
            <View style={[styles.uploadBox, { backgroundColor: colors.backgroundElement }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.uploadText, { color: colors.text }]}>Uploading your files...</Text>
              <Text style={[styles.uploadSubText, { color: colors.textSecondary }]}>
                Please wait, adding items to vault.
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 100,
  },
  detailHeaderMetaClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  backButtonOnlyArrow: {
    padding: Spacing.two,
    marginLeft: -Spacing.two,
  },
  menuContainerClean: {
    position: 'relative',
  },
  iconActionClean: {
    padding: Spacing.two,
    marginRight: -Spacing.two,
  },
  popoverMenuClean: {
    position: 'absolute',
    right: 0,
    top: 40,
    borderRadius: Rounded.md,
    borderWidth: 1.5,
    width: 160,
    zIndex: 9999,
    ...Shadows.card,
    elevation: 8,
  },
  popoverItemClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  popoverItemDeleteClean: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  popoverTextClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 15,
  },
  detailTextWrapperClean: {
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  detailCategoryClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  detailTitleClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 26,
    lineHeight: 32,
    marginBottom: Spacing.two,
  },
  detailDescClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  filesSection: {
    width: '100%',
  },
  filesHeader: {
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
  },
  emptyFilesStateCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five * 2,
    gap: Spacing.two,
  },
  emptyStateTextCompact: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 15,
  },
  emptyStateSubCompact: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  filesGrid: {
    gap: Spacing.three,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.md,
    padding: Spacing.two + 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  fileMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  fileIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Rounded.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fileThumbnail: {
    width: '100%',
    height: '100%',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 15,
  },
  fileMeta: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  fileUploaderText: {
    fontSize: 12,
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    marginTop: 2,
    opacity: 0.8,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  fileActionBtn: {
    padding: Spacing.two,
  },
  uploadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  uploadBox: {
    padding: Spacing.five,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    width: '80%',
    maxWidth: 300,
    ...Shadows.card,
  },
  uploadText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginTop: Spacing.two,
  },
  uploadSubText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});
