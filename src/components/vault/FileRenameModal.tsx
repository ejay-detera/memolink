import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  useColorScheme 
} from 'react-native';

import type { FileItem } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded, Shadows } from '@/constants/theme';
import { FormButton } from '../ui/form-button';

interface FileRenameModalProps {
  visible: boolean;
  onClose: () => void;
  file: FileItem | null;
  onRename: (fileId: string, newName: string) => Promise<boolean>;
}

export function FileRenameModal({ visible, onClose, file, onRename }: FileRenameModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (file) {
      setNewName(file.name);
    }
  }, [file]);

  const handleSave = async () => {
    if (!file || !newName.trim()) return;
    setSaving(true);
    const ok = await onRename(file.id, newName.trim());
    setSaving(false);
    if (ok) {
      onClose();
    }
  };

  if (!file) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlaySmall}>
        <View style={[styles.modalContentSmall, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.modalTitleSmall, { color: colors.text }]}>Rename File</Text>
          
          <TextInput
            style={[styles.modalInput, { color: colors.text, borderColor: colors.outline }]}
            placeholder="Enter file name"
            placeholderTextColor={colors.outline}
            value={newName}
            onChangeText={setNewName}
            autoFocus={true}
          />

          <View style={styles.modalButtonsSmall}>
            <FormButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              disabled={saving}
              style={{ flex: 1 }}
            />
            <FormButton
              title="Save"
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalInput: {
    borderWidth: 1,
    borderRadius: Rounded.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
  },
  modalButtonsSmall: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
});
