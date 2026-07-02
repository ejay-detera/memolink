import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useVault, type FileItem, type Folder } from '@/hooks/use-vault';
import { FAB } from '../ui/FAB';
import { FormButton } from '../ui/form-button';

// Subcomponents
import { useCapsules } from '@/hooks/use-capsules';
import { CapsuleList } from './CapsuleList';
import { CreateCapsuleModal } from './CreateCapsuleModal';
import { FilePreviewModal } from './FilePreviewModal';
import { FileRenameModal } from './FileRenameModal';
import { FolderCard } from './FolderCard';
import { FolderDetailView } from './FolderDetailView';
import { FolderFormModal } from './FolderFormModal';
import { VaultHeader } from './VaultHeader';

export function VaultManager() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { userRole } = useAuth();

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
    connectedSeniors,
    activeVaultOwnerId,
    setActiveVaultOwnerId,
    refreshData
  } = useVault();

  // Capsules Logic
  const {
    capsules,
    loading: capsulesLoading,
    fetchCapsules,
    createCapsule
  } = useCapsules(activeVaultOwnerId);

  // Reset to folder list view whenever the vault tab gains focus
  // (e.g., user taps the vault tab while inside a folder detail view)
  useFocusEffect(
    useCallback(() => {
      setSelectedFolder(null);
      fetchCapsules();
    }, [activeVaultOwnerId])
  );

  // Tabs state
  const [activeTab, setActiveTab] = useState<'memories' | 'capsules'>('memories');

  // Search & Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals visibility
  const [folderFormVisible, setFolderFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [capsuleFormVisible, setCapsuleFormVisible] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const [renameFileModalVisible, setRenameFileModalVisible] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        fetchCapsules()
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData, fetchCapsules]);

  // Helper dialogs
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) onConfirm();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onConfirm }
      ]);
    }
  };

  const handleOpenFile = (file: FileItem) => {
    if (Platform.OS === 'web') {
      window.open(file.file_path, '_blank');
      return;
    }
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  const handleRenameFile = (file: FileItem) => {
    setRenamingFile(file);
    setRenameFileModalVisible(true);
  };

  const handleDeleteFile = (file: FileItem) => {
    showConfirm('Delete File', `Are you sure you want to delete "${file.name}"?`, async () => {
      await deleteFile(file);
    });
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderFormVisible(true);
  };

  const handleDeleteFolder = (folder: Folder) => {
    showConfirm('Delete Folder', `Are you sure you want to delete "${folder.name}" and all its files?`, async () => {
      setSelectedFolder(null);
      await deleteFolder(folder);
    });
  };

  // Filtering Folders logic
  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (folder.desc && folder.desc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategoryFilter === 'all' ||
      folder.category_id.toString() === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.category_name : 'General';
  };

  const cardWidth = Math.min((width - Spacing.four * 2 - Spacing.three) / 2, (MaxContentWidth - Spacing.three) / 2);

  const allVaultFiles = React.useMemo(() => folders.flatMap(f => f.memory_files || []), [folders]);

  // Loading indicator on first fetch
  if (loading && folders.length === 0 && activeTab === 'memories') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Memory Vault...</ThemedText>
      </View>
    );
  }

  // Caregiver view empty state: Caregiver must be connected to a senior citizen to view a vault
  if (userRole === 'caregiver' && connectedSeniors.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={72} color={colors.outline} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Connected Seniors</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            As a caregiver, you can view and add memories to the vaults of seniors who accept your connection requests.
          </ThemedText>
          <FormButton
            title="Invite Senior Citizen"
            onPress={() => navigation.navigate('seniors' as never)}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {!selectedFolder ? (
        // Folder List View
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <VaultHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeCategoryFilter={activeCategoryFilter}
              setActiveCategoryFilter={setActiveCategoryFilter}
              categories={categories}
              connectedSeniors={connectedSeniors}
              activeVaultOwnerId={activeVaultOwnerId}
              setActiveVaultOwnerId={setActiveVaultOwnerId}
            />

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'memories' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('memories')}
              >
                <ThemedText style={[styles.tabText, { color: activeTab === 'memories' ? colors.primary : colors.textSecondary }]}>All Memories</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'capsules' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab('capsules')}
              >
                <ThemedText style={[styles.tabText, { color: activeTab === 'capsules' ? colors.primary : colors.textSecondary }]}>Capsules</ThemedText>
              </TouchableOpacity>
            </View>

            {activeTab === 'memories' ? (
              filteredFolders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-open-outline" size={64} color={colors.outline} />
                  <ThemedText style={[styles.emptyStateText, { color: colors.textSecondary }]}>No folders found</ThemedText>
                  <ThemedText style={[styles.emptyStateSub, { color: colors.outline }]}>Create a new folder to get started!</ThemedText>
                </View>
              ) : (
                // Folders Grid
                <View style={styles.grid}>
                  {filteredFolders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onPress={() => setSelectedFolder(folder)}
                      cardWidth={cardWidth}
                      getCategoryName={getCategoryName}
                    />
                  ))}
                </View>
              )
            ) : (
              // Capsules List
              <CapsuleList capsules={capsules} loading={capsulesLoading} />
            )}
          </ScrollView>

          {activeTab === 'memories' ? (
            <FAB
              onPress={() => {
                setEditingFolder(null);
                setFolderFormVisible(true);
              }}
              iconName="plus"
              disableRotation={true}
            />
          ) : (
            userRole === 'caregiver' && (
              <FAB
                onPress={() => {
                  setCapsuleFormVisible(true);
                }}
                iconName="gift"
                disableRotation={true}
              />
            )
          )}
        </>
      ) : (
        // Folder Detail View
        <FolderDetailView
          folder={selectedFolder}
          files={files}
          onBack={() => setSelectedFolder(null)}
          onOpenFile={handleOpenFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onEditFolder={() => handleEditFolder(selectedFolder)}
          onDeleteFolder={() => handleDeleteFolder(selectedFolder)}
          onUploadFiles={uploadFiles}
          uploadingFile={uploadingFile}
          getCategoryName={getCategoryName}
        />
      )}

      {/* RENAME FILE MODAL */}
      <FileRenameModal
        visible={renameFileModalVisible}
        onClose={() => {
          setRenameFileModalVisible(false);
          setRenamingFile(null);
        }}
        file={renamingFile}
        onRename={renameFile}
      />

      {/* FILE PREVIEW MODAL */}
      <FilePreviewModal
        visible={previewVisible}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewFile(null);
        }}
        file={previewFile}
      />

      {/* CREATE/EDIT FOLDER MODAL */}
      <FolderFormModal
        visible={folderFormVisible}
        onClose={() => {
          setFolderFormVisible(false);
          setEditingFolder(null);
        }}
        editingFolder={editingFolder}
        categories={categories}
        createCategory={createCategory}
        onSave={saveFolder}
        pickCoverImage={pickCoverImage}
      />

      {/* CREATE CAPSULE MODAL */}
      <CreateCapsuleModal
        visible={capsuleFormVisible}
        onClose={() => setCapsuleFormVisible(false)}
        vaultFiles={allVaultFiles}
        onSave={(title, message, date, fileIds) => createCapsule(title, message, date, fileIds, activeVaultOwnerId!)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  loadingText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginTop: Spacing.three,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: 100,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five * 2,
    gap: Spacing.two,
  },
  emptyStateText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  emptyStateSub: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  // Caregiver Empty State styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 22,
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing.four,
  },
  emptyButton: {
    minWidth: 200,
  },
});
