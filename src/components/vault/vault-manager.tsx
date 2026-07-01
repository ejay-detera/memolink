import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  useWindowDimensions, 
  useColorScheme, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Platform,
  Linking,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useVault, type Folder, type FileItem } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded, Typography, MaxContentWidth, Shadows } from '@/constants/theme';
import { FormButton } from '../ui/form-button';
import { FAB } from '../ui/FAB';

export function VaultManager() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  // Load Logic from Custom Hook
  const {
    folders,
    files,
    categories,
    loading,
    uploadingFile,
    uploadingCover,
    selectedFolder,
    setSelectedFolder,
    pickCoverImage,
    saveFolder,
    deleteFolder,
    createCategory,
    uploadFiles,
    renameFile,
    deleteFile,
  } = useVault();

  // Search & Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderCategoryId, setFolderCategoryId] = useState<number | null>(null);
  const [folderCoverUri, setFolderCoverUri] = useState<string | null>(null);

  // Dropdown for Category inside modal
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Category addition inside dropdown
  const [categoryCreateModalVisible, setCategoryCreateModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Three dots folder menu
  const [folderMenuVisible, setFolderMenuVisible] = useState(false);

  // File Rename state
  const [renameFileModalVisible, setRenameFileModalVisible] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [savingFileRename, setSavingFileRename] = useState(false);

  // File Preview Modal State
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Close menus and dropdowns when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setCategoryDropdownOpen(false);
      setFolderMenuVisible(false);
      setPreviewVisible(false);
      setCategoryCreateModalVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

  // Compute folder cover image (with fallback to latest folder image)
  const getFolderCover = (folder: Folder) => {
    if (folder.image_path) return folder.image_path;
    if (folder.memory_files && folder.memory_files.length > 0) {
      const images = folder.memory_files.filter(f => f.file_type === 'image');
      if (images.length > 0) {
        const sorted = [...images].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return sorted[0].file_path;
      }
    }
    return null;
  };

  // Error Alert Dialog Polyfill
  const showError = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const showConfirm = (title: string, msg: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${msg}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        title,
        msg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: onConfirm }
        ]
      );
    }
  };

  // Pick Cover image action
  const handleSelectCover = async () => {
    const url = await pickCoverImage();
    if (url) {
      setFolderCoverUri(url);
    }
  };

  // Inline Category Addition
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = await createCategory(newCategoryName);
    if (newId) {
      setFolderCategoryId(newId);
      setNewCategoryName('');
      setCategoryCreateModalVisible(false);
    }
  };

  // Folder actions
  const openCreateFolderModal = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDesc('');
    setFolderCoverUri(null);
    setFolderCategoryId(categories.length > 0 ? categories[0].id : null);
    setCategoryDropdownOpen(false);
    setFolderModalVisible(true);
  };

  const openEditFolderModal = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDesc(folder.desc || '');
    setFolderCoverUri(folder.image_path);
    setFolderCategoryId(folder.category_id);
    setCategoryDropdownOpen(false);
    setFolderMenuVisible(false);
    setFolderModalVisible(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      showError('Required Field', 'Please enter a folder name.');
      return;
    }
    if (!folderCategoryId) {
      showError('Required Field', 'Please select a category.');
      return;
    }

    const success = await saveFolder(
      editingFolder ? editingFolder.id : null,
      folderName,
      folderDesc,
      folderCategoryId,
      folderCoverUri
    );

    if (success) {
      setFolderModalVisible(false);
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    setFolderMenuVisible(false);
    showConfirm('Delete Folder', `Are you sure you want to delete "${folder.name}" and all its files?`, async () => {
      await deleteFolder(folder);
    });
  };

  // Upload multiple files action
  const handleUploadFiles = async () => {
    if (!selectedFolder) return;

    try {
      let pickedAssets: Array<{ uri: string, name: string, mimeType?: string }> = [];

      if (Platform.OS === 'web') {
        const files = await selectFilesWeb();
        if (!files || files.length === 0) return;
        pickedAssets = files.map(file => ({
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
        pickedAssets = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType
        }));
      }

      if (pickedAssets.length > 0) {
        await uploadFiles(selectedFolder.id, pickedAssets);
      }
    } catch (error: any) {
      showError('File upload failed', error.message);
    }
  };

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

  // File CRUD
  const handleRenameFile = async () => {
    if (!renamingFile || !newFileName.trim()) return;
    setSavingFileRename(true);
    const success = await renameFile(renamingFile.id, newFileName);
    setSavingFileRename(false);
    if (success) {
      setRenameFileModalVisible(false);
      setRenamingFile(null);
    }
  };

  const handleDeleteFile = (file: FileItem) => {
    showConfirm('Delete File', `Are you sure you want to delete "${file.name}"?`, async () => {
      await deleteFile(file);
    });
  };

  // Open Preview Modal instead of redirecting
  const handleOpenFile = async (file: FileItem) => {
    if (Platform.OS === 'web') {
      window.open(file.file_path, '_blank');
      return;
    }

    try {
      const nameLower = file.name.toLowerCase();
      const isDoc = nameLower.endsWith('.pdf') || 
                    nameLower.endsWith('.docx') || 
                    nameLower.endsWith('.doc') || 
                    file.file_type === 'document';

      if (isDoc) {
        let url = file.file_path;
        if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) {
          url = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(file.file_path)}`;
        }
        await WebBrowser.openBrowserAsync(url);
      } else {
        setPreviewFile(file);
        setPreviewVisible(true);
      }
    } catch (error: any) {
      showError('Open error', error.message);
    }
  };

  // Filtering Folders logic
  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (folder.desc && folder.desc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategoryFilter === 'all' || 
      folder.category_id.toString() === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getFileIconName = (type: string) => {
    switch (type) {
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      default: return 'document-text-outline';
    }
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.category_name : 'General';
  };

  const cardWidth = Math.min((width - Spacing.four * 2 - Spacing.three) / 2, (MaxContentWidth - Spacing.three) / 2);

  if (loading && folders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Memory Vault...</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {!selectedFolder ? (
        // Folder List View
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Memory Vault</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Store and share memories, folders, and documents
                </Text>
              </View>
            </View>

            {/* Search bar */}
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

            {/* Categories Filters */}
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

            {filteredFolders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={64} color={colors.outline} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No folders found</Text>
                <Text style={[styles.emptyStateSub, { color: colors.outline }]}>Create a new folder to get started!</Text>
              </View>
            ) : (
              // Folders Grid
              <View style={styles.grid}>
                {filteredFolders.map(folder => {
                  const cover = getFolderCover(folder);
                  return (
                    <Pressable 
                      key={folder.id} 
                      style={[styles.card, { width: cardWidth, backgroundColor: colors.backgroundElement }]}
                      onPress={() => setSelectedFolder(folder)}
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
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
          <FAB onPress={openCreateFolderModal} iconName="plus" disableRotation={true} />
        </>
      ) : (
        // Folder Detail View (Clean, direct texts, no box container, no shadow, no cover image)
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
            {/* Top row: Back arrow & 3-dots actions menu */}
            <View style={styles.detailHeaderMetaClean}>
              <Pressable style={styles.backButtonOnlyArrow} onPress={() => setSelectedFolder(null)}>
                <Ionicons name="arrow-back" size={28} color={colors.primary} />
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
                      onPress={() => openEditFolderModal(selectedFolder)}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.text} />
                      <Text style={[styles.popoverTextClean, { color: colors.text }]}>Edit Folder</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.popoverItemClean, styles.popoverItemDeleteClean]} 
                      onPress={() => handleDeleteFolder(selectedFolder)}
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
                {selectedFolder.memory_categories?.category_name || getCategoryName(selectedFolder.category_id)}
              </Text>
              
              <Text style={[styles.detailTitleClean, { color: colors.text }]}>{selectedFolder.name}</Text>
              
              {!!selectedFolder.desc && (
                <Text style={[styles.detailDescClean, { color: colors.textSecondary }]}>{selectedFolder.desc}</Text>
              )}
            </View>

            {/* Files List */}
            <View style={styles.filesSection}>
              <View style={styles.filesHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Files</Text>
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
                        onPress={() => handleOpenFile(file)}
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
                        </View>
                      </Pressable>

                      <View style={styles.fileActions}>
                        <Pressable 
                          style={styles.fileActionBtn} 
                          onPress={() => {
                            setRenamingFile(file);
                            setNewFileName(file.name);
                            setRenameFileModalVisible(true);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                        </Pressable>
                        <Pressable 
                          style={styles.fileActionBtn} 
                          onPress={() => handleDeleteFile(file)}
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
          <FAB onPress={handleUploadFiles} iconName="plus" disableRotation={true} />
        </>
      )}

      {/* CREATE/EDIT FOLDER MODAL (Full-Screen) */}
      <Modal
        visible={folderModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <View style={[styles.fullPageModal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.previewHeader, { borderBottomColor: colors.outline }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>
              {editingFolder ? 'Edit Folder' : 'New Folder'}
            </Text>
            <Pressable onPress={() => setFolderModalVisible(false)} style={styles.previewCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            contentContainerStyle={styles.fullPageScrollContentForm}
            showsVerticalScrollIndicator={false}
          >
            {/* Folder cover image selector */}
            <Pressable 
              style={[styles.modalCoverSelectFull, { backgroundColor: colors.surfaceContainer }]}
              onPress={handleSelectCover}
              disabled={uploadingCover}
            >
              {uploadingCover ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : folderCoverUri ? (
                <>
                  <Image source={folderCoverUri} style={styles.modalCoverImage} />
                  <View style={styles.modalCoverChangeOverlay}>
                    <Text style={styles.modalCoverChangeText}>Change Cover</Text>
                  </View>
                </>
              ) : (
                <View style={styles.modalCoverSelectInner}>
                  <Ionicons name="image-outline" size={24} color={colors.outline} />
                  <Text style={[styles.modalCoverSelectText, { color: colors.textSecondary }]}>
                    Add Cover Image (Optional)
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Folder Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Folder Name <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.outline }]}
                placeholder="Enter folder name"
                placeholderTextColor={colors.outline}
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>

            {/* Folder Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea, { color: colors.text, borderColor: colors.outline }]}
                placeholder="Enter folder description"
                placeholderTextColor={colors.outline}
                multiline={true}
                numberOfLines={3}
                value={folderDesc}
                onChangeText={setFolderDesc}
              />
            </View>

            {/* Folder Category Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Category <Text style={{ color: colors.error }}>*</Text>
              </Text>
              
              <View style={styles.dropdownContainer}>
                {categoryDropdownOpen && (
                  <Pressable 
                    style={styles.dropdownBackdrop} 
                    onPress={() => setCategoryDropdownOpen(false)} 
                  />
                )}
                <Pressable 
                  style={[styles.dropdownTrigger, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer, zIndex: 1002 }]}
                  onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.text }]}>
                    {folderCategoryId ? getCategoryName(folderCategoryId) : 'Select Category'}
                  </Text>
                  <Ionicons 
                    name={categoryDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} 
                    size={20} 
                    color={colors.text} 
                  />
                </Pressable>

                {categoryDropdownOpen && (
                  <View style={[styles.dropdownMenu, { backgroundColor: colors.background, borderColor: colors.outline, zIndex: 1001 }]}>
                    <View style={styles.dropdownListContainer}>
                      {categories.map(cat => (
                        <Pressable
                          key={cat.id}
                          style={[
                            styles.dropdownItem,
                            { backgroundColor: folderCategoryId === cat.id ? colors.surfaceContainer : 'transparent' }
                          ]}
                          onPress={() => {
                            setFolderCategoryId(cat.id);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText, 
                            { 
                              color: folderCategoryId === cat.id ? colors.primary : colors.text,
                              fontFamily: folderCategoryId === cat.id ? 'AtkinsonHyperlegibleNext-Bold' : 'AtkinsonHyperlegibleNext-Regular'
                            }
                          ]}>
                            {cat.category_name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Button to open category modal popup */}
                    <View style={[styles.dropdownAddSection, { borderTopColor: colors.outline }]}>
                      <Pressable 
                        style={styles.dropdownAddBtn}
                        onPress={() => {
                          setCategoryCreateModalVisible(true);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <Ionicons name="add" size={18} color={colors.primary} />
                        <Text style={[styles.dropdownAddText, { color: colors.primary }]}>Create Category</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <FormButton
                title="Cancel"
                onPress={() => setFolderModalVisible(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <FormButton
                title={editingFolder ? 'Save Changes' : 'Create Folder'}
                onPress={handleSaveFolder}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* FILE UPLOADING OVERLAY MODAL */}
      <Modal
        visible={uploadingFile}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.loadingModalContent, { backgroundColor: colors.backgroundElement }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingModalText, { color: colors.text }]}>Uploading files...</Text>
            <Text style={[styles.loadingModalSubText, { color: colors.textSecondary }]}>Your files are uploading</Text>
          </View>
        </View>
      </Modal>

      {/* CATEGORY CREATION POPUP MODAL */}
      <Modal
        visible={categoryCreateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setCategoryCreateModalVisible(false);
          setNewCategoryName('');
        }}
      >
        <View style={styles.modalOverlaySmall}>
          <View style={[styles.modalContentSmall, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.modalTitleSmall, { color: colors.text }]}>Add New Category</Text>
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.outline }]}
              placeholder="e.g. Vacation, Medical"
              placeholderTextColor={colors.outline}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus={true}
            />

            <View style={styles.modalButtonsSmall}>
              <FormButton
                title="Cancel"
                onPress={() => {
                  setCategoryCreateModalVisible(false);
                  setNewCategoryName('');
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <FormButton
                title="Add"
                onPress={handleCreateCategory}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* FILE PREVIEW MODAL */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setPreviewVisible(false);
          setPreviewFile(null);
        }}
      >
        <View style={styles.previewOverlay}>
          <View style={[styles.previewContent, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.previewHeader, { borderBottomColor: colors.outline }]}>
              <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
                {previewFile?.name || 'File Preview'}
              </Text>
              <Pressable 
                onPress={() => {
                  setPreviewVisible(false);
                  setPreviewFile(null);
                }}
                style={styles.previewCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Media Content */}
            <View style={styles.previewBody}>
              {previewFile?.file_type === 'image' && (
                <Image 
                  source={previewFile.file_path} 
                  style={styles.previewImage} 
                  contentFit="contain" 
                />
              )}

              {previewFile?.file_type === 'video' && (
                Platform.OS === 'web' ? (
                  <video 
                    src={previewFile.file_path} 
                    controls 
                    style={styles.webVideo}
                  />
                ) : (
                  // Native Mock Video Player
                  <View style={styles.mockPlayerContainer}>
                    <Ionicons name="videocam-outline" size={64} color={colors.primary} />
                    <Text style={[styles.mockPlayerText, { color: colors.text }]}>Video Preview</Text>
                    <Pressable 
                      style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                      onPress={() => Linking.openURL(previewFile.file_path)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.mockPlayerBtnText}>Play in System Player</Text>
                    </Pressable>
                  </View>
                )
              )}

              {previewFile?.file_type === 'audio' && (
                Platform.OS === 'web' ? (
                  <View style={styles.audioWebWrapper}>
                    <Ionicons name="musical-notes-outline" size={48} color={colors.primary} />
                    <audio 
                      src={previewFile.file_path} 
                      controls 
                      style={{ width: '100%', marginTop: Spacing.three }}
                    />
                  </View>
                ) : (
                  // Native Mock Audio Player
                  <View style={styles.mockPlayerContainer}>
                    <Ionicons name="musical-notes-outline" size={64} color={colors.primary} />
                    <Text style={[styles.mockPlayerText, { color: colors.text }]}>Audio Preview</Text>
                    <Pressable 
                      style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                      onPress={() => Linking.openURL(previewFile.file_path)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                      <Text style={styles.mockPlayerBtnText}>Play Audio</Text>
                    </Pressable>
                  </View>
                )
              )}

              {previewFile?.file_type === 'document' && (
                <View style={styles.mockPlayerContainer}>
                  <Ionicons name="document-text-outline" size={64} color={colors.primary} />
                  <Text style={[styles.mockPlayerText, { color: colors.text }]}>Document File</Text>
                  <Text style={[styles.mockPlayerSub, { color: colors.textSecondary }]}>
                    Previewing is not supported directly for raw documents.
                  </Text>
                  <Pressable 
                    style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(previewFile.file_path)}
                  >
                    <Ionicons name="open-outline" size={20} color="#fff" />
                    <Text style={styles.mockPlayerBtnText}>Open Document</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* RENAME FILE MODAL */}
      <Modal
        visible={renameFileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setRenameFileModalVisible(false);
          setRenamingFile(null);
        }}
      >
        <View style={styles.modalOverlaySmall}>
          <View style={[styles.modalContentSmall, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.modalTitleSmall, { color: colors.text }]}>Rename File</Text>
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.outline }]}
              placeholder="Enter new filename"
              placeholderTextColor={colors.outline}
              value={newFileName}
              onChangeText={setNewFileName}
              autoFocus={true}
            />

            <View style={styles.modalButtonsSmall}>
              <FormButton
                title="Cancel"
                onPress={() => {
                  setRenameFileModalVisible(false);
                  setRenamingFile(null);
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <FormButton
                title="Rename"
                onPress={handleRenameFile}
                loading={savingFileRename}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  loadingText: { marginTop: Spacing.three, ...Typography.bodyMd },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six + 60,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    overflow: 'visible',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  headerTitle: {
    ...Typography.headlineLg,
  },
  headerSubtitle: {
    ...Typography.bodyMd,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    paddingVertical: 4,
  },
  filterScroll: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    borderRadius: Rounded.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Shadows.card,
    marginBottom: Spacing.two,
  },
  cardImage: {
    height: 120,
    width: '100%',
  },
  cardImagePlaceholder: {
    height: 120,
    width: '100%',
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
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  cardDesc: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.one,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyStateText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 20,
    marginTop: Spacing.two,
  },
  emptyStateSub: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
  },

  // Folder Detail Screen Clean Layout (No Card boundaries, no cover image)
  detailHeaderMetaClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    overflow: 'visible',
  },
  backButtonOnlyArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  menuContainerClean: {
    position: 'relative',
    zIndex: 9999,
    overflow: 'visible',
  },
  iconActionClean: {
    padding: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverMenuClean: {
    position: 'absolute',
    top: 44,
    right: 0,
    borderRadius: Rounded.md,
    borderWidth: 1,
    minWidth: 155,
    padding: 6,
    ...Shadows.card,
    zIndex: 10000,
    elevation: 10,
  },
  popoverItemClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Rounded.sm,
  },
  popoverItemDeleteClean: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  popoverTextClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 15,
  },
  detailTextWrapperClean: {
    marginBottom: Spacing.four,
  },
  detailCategoryClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  detailTitleClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  detailDescClean: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginTop: Spacing.two,
  },
  filesSection: {
    marginTop: Spacing.two,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
  },
  emptyFilesStateCompact: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyStateTextCompact: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginTop: 4,
  },
  emptyStateSubCompact: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 13,
  },
  filesGrid: {
    gap: Spacing.two,
  },
  fileRow: {
    flexDirection: 'row',
    borderRadius: Rounded.md,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
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
    fontSize: 16,
  },
  fileMeta: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fileActionBtn: {
    padding: Spacing.two,
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 400,
  },
  modalContent: {
    borderTopLeftRadius: Rounded.xl,
    borderTopRightRadius: Rounded.xl,
    padding: Spacing.four,
    maxHeight: '90%',
    zIndex: 450,
  },
  modalTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  modalCoverSelect: {
    height: 90,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  modalCoverSelectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modalCoverSelectText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
  },
  modalCoverChangeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCoverChangeText: {
    color: '#fff',
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginBottom: Spacing.one,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },

  // Dropdown category style
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dropdownTriggerText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: Rounded.md,
    ...Shadows.card,
    zIndex: 1001,
    elevation: 8,
  },
  dropdownListContainer: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  dropdownAddSection: {
    borderTopWidth: 1.5,
    padding: Spacing.two,
  },
  dropdownAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  dropdownAddText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
  },
  dropdownAddInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dropdownAddInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Rounded.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    fontSize: 14,
  },
  dropdownAddBtnConfirm: {
    padding: 4,
  },

  // Uploading Modal Center overlay style
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500,
  },
  loadingModalContent: {
    borderRadius: Rounded.lg,
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    ...Shadows.card,
    width: 240,
  },
  loadingModalText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    marginTop: Spacing.two,
  },
  loadingModalSubText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
  },

  // Smaller dialogs (e.g. rename file)
  modalOverlaySmall: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.four,
    zIndex: 400,
  },
  modalContentSmall: {
    borderRadius: Rounded.lg,
    padding: Spacing.four,
    ...Shadows.card,
  },
  modalTitleSmall: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    marginBottom: Spacing.three,
  },
  modalButtonsSmall: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },

  // File Preview Modal Styles
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '100%',
    height: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
    flex: 1,
    marginRight: Spacing.three,
  },
  previewCloseBtn: {
    padding: Spacing.two,
  },
  previewBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  webVideo: {
    width: '100%',
    height: '100%',
    maxHeight: 450,
    borderRadius: Rounded.md,
  },
  audioWebWrapper: {
    width: '100%',
    alignItems: 'center',
    padding: Spacing.four,
  },
  mockPlayerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  mockPlayerText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 20,
    marginTop: Spacing.two,
  },
  mockPlayerSub: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  mockPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Rounded.full,
    minHeight: 48,
  },
  mockPlayerBtnText: {
    color: '#fff',
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },

  // Full-page Modal styles (Category & Folder Modals)
  fullPageModal: {
    flex: 1,
  },
  fullPageScrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  fullPageScrollContentForm: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  modalCoverSelectFull: {
    height: 160,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  fullPageCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  fullPageCategoryText: {
    fontSize: 18,
  },
  fullPageAddSection: {
    borderTopWidth: 1.5,
    padding: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? Spacing.five : Spacing.four,
  },
  fullPageAddTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  fullPageAddInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  fullPageAddInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  fullPageAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    height: 48,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
});
