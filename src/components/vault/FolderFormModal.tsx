import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View
} from 'react-native';

import { Colors, Rounded, Shadows, Spacing } from '@/constants/theme';
import type { Category, Folder } from '@/hooks/use-vault';
import { FormButton } from '../ui/form-button';



interface FolderFormModalProps {
  visible: boolean;
  onClose: () => void;
  editingFolder: Folder | null;
  onSave: (id: string | null, name: string, desc: string, categoryId: number, coverUrl: string | null, folderDate: string) => Promise<boolean>;
  categories: Category[];
  createCategory: (name: string) => Promise<number | null>;
  pickCoverImage: () => Promise<string | null>;
}

export function FolderFormModal({
  visible,
  onClose,
  editingFolder,
  onSave,
  categories,
  createCategory,
  pickCoverImage
}: FolderFormModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [folderCategoryId, setFolderCategoryId] = useState<number | null>(null);
  const [folderCoverUri, setFolderCoverUri] = useState<string | null>(null);

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoryCreateModalVisible, setCategoryCreateModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [folderDate, setFolderDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize fields on open or change of editingFolder
  useEffect(() => {
    if (visible) {
      if (editingFolder) {
        setFolderName(editingFolder.name);
        setFolderDesc(editingFolder.desc || '');
        setFolderCategoryId(editingFolder.category_id);
        setFolderCoverUri(editingFolder.image_path);
        setFolderDate(editingFolder.folder_date || new Date().toISOString().split('T')[0]);
      } else {
        setFolderName('');
        setFolderDesc('');
        setFolderCategoryId(categories.length > 0 ? categories[0].id : null);
        setFolderCoverUri(null);
        setFolderDate(new Date().toISOString().split('T')[0]);
      }
      setCategoryDropdownOpen(false);
      setCategoryCreateModalVisible(false);
      setNewCategoryName('');
    }
  }, [visible, editingFolder, categories]);

  const handleSelectCover = async () => {
    const url = await pickCoverImage();
    if (url) {
      setFolderCoverUri(url);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newId = await createCategory(newCategoryName);
    if (newId) {
      setFolderCategoryId(newId);
      setNewCategoryName('');
      setCategoryCreateModalVisible(false);
    }
  };

  const handleSave = async () => {
    if (!folderName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Error: Please enter a folder name');
      } else {
        Alert.alert('Error', 'Please enter a folder name');
      }
      return;
    }
    if (!folderCategoryId) {
      if (Platform.OS === 'web') {
        window.alert('Error: Please select a category');
      } else {
        Alert.alert('Error', 'Please select a category');
      }
      return;
    }

    if (folderDate) {
      const selected = new Date(folderDate + 'T00:00:00');
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selected > today) {
        if (Platform.OS === 'web') {
          window.alert('Error: Folder date cannot be in the future');
        } else {
          Alert.alert('Error', 'Folder date cannot be in the future');
        }
        return;
      }
    }

    setSaving(true);
    const ok = await onSave(
      editingFolder ? editingFolder.id : null,
      folderName,
      folderDesc,
      folderCategoryId,
      folderCoverUri,
      folderDate
    );
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  const getCategoryName = (catId: number) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.category_name : 'Select Category';
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.fullPageModal, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.previewHeader, { borderBottomColor: colors.outline }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {editingFolder ? 'Edit Folder' : 'Create Folder'}
          </Text>
          <Pressable onPress={onClose} style={styles.previewCloseBtn} disabled={saving}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Form Container */}
        <ScrollView
          contentContainerStyle={styles.fullPageScrollContentForm}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover Selector */}
          <Pressable
            style={[styles.modalCoverSelectFull, { backgroundColor: colors.surfaceContainer }]}
            onPress={handleSelectCover}
            disabled={saving}
          >
            {folderCoverUri ? (
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image source={folderCoverUri} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View style={{
                  position: 'absolute',
                  bottom: Spacing.two,
                  right: Spacing.two,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  paddingHorizontal: Spacing.three,
                  paddingVertical: Spacing.one,
                  borderRadius: Rounded.full
                }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'AtkinsonHyperlegibleNext-Bold' }}>
                    Change Cover
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: Spacing.two }}>
                <Ionicons name="image-outline" size={32} color={colors.primary} />
                <Text style={{ color: colors.primary, fontFamily: 'AtkinsonHyperlegibleNext-Bold', fontSize: 15 }}>
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
              editable={!saving}
            />
          </View>

          {/* Description */}
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
              editable={!saving}
            />
          </View>

          {/* Category Dropdown */}
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
                disabled={saving}
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

                  {/* Create Category Modal Switcher */}
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

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Date <Text style={{ color: colors.error }}>*</Text>
            </Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={folderDate}
                onChange={(e: any) => setFolderDate(e.target.value)}
                disabled={saving}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  fontFamily: 'AtkinsonHyperlegibleNext-Regular',
                  fontSize: 16,
                  color: colors.text,
                  borderColor: colors.outline,
                  backgroundColor: colors.surfaceContainer,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderRadius: Rounded.md,
                  padding: Spacing.two,
                  width: '100%',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              />
            ) : (
              <>
                <Pressable
                  style={[styles.dropdownTrigger, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={saving}
                >
                  <Text style={[styles.dropdownTriggerText, { color: colors.text }]}>
                    {folderDate ? new Date(folderDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={folderDate ? new Date(folderDate + 'T00:00:00') : new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onValueChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const y = selectedDate.getFullYear();
                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const d = String(selectedDate.getDate()).padStart(2, '0');
                        setFolderDate(`${y}-${m}-${d}`);
                      }
                    }}
                    onDismiss={() => setShowDatePicker(false)}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.modalButtons}>
            <FormButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              disabled={saving}
              style={{ flex: 1 }}
            />
            <FormButton
              title={editingFolder ? 'Save Changes' : 'Create Folder'}
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullPageModal: {
    flex: 1,
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
    marginTop: Spacing.two,
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
    alignItems: 'center',
  },
  dropdownAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  dropdownAddText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 14,
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
  // Dialog Style
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
});
