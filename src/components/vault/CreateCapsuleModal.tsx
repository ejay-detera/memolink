import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { FormButton } from '../ui/form-button';
import { FileItem } from '@/hooks/use-vault';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';


interface CreateCapsuleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, message: string, triggerDate: string, fileIds: number[]) => Promise<any>;
  vaultFiles: FileItem[];
}

export function CreateCapsuleModal({ visible, onClose, onSave, vaultFiles }: CreateCapsuleModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when opened
  React.useEffect(() => {
    if (visible) {
      // Avoiding synchronous setState in effect, wait for a tick or rely on parent resetting state.
      // We can use setTimeout to defer it if needed, or better, reset state on 'onClose'.
      // For simplicity, we defer to avoid the React warning:
      setTimeout(() => {
        setStep(1);
        setTitle('');
        setMessage('');
        setDate(new Date());
        setSelectedFiles([]);
        setIsSaving(false);
      }, 0);
    }
  }, [visible]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleDismiss = () => {
    setShowDatePicker(Platform.OS === 'ios');
  };

  const toggleFileSelection = (id: number) => {
    setSelectedFiles(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    // Format date as YYYY-MM-DD
    const triggerDate = format(date, 'yyyy-MM-dd');
    
    await onSave(title, message, triggerDate, selectedFiles);
    
    setIsSaving(false);
    onClose();
  };

  // Only show image files for simplicity, or we can show all
  const mediaFiles = vaultFiles.filter(f => f.file_type === 'image');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {step === 1 ? 'New Memory Capsule' : 'Select Memories'}
            </Text>
            {step === 2 ? (
              <TouchableOpacity onPress={handleSave} disabled={isSaving || !title.trim()}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.headerAction, { color: title.trim() ? colors.primary : colors.outline }]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} /> // Placeholder for balance
            )}
          </View>

          {step === 1 ? (
            /* Step 1: Details */
            <ScrollView contentContainerStyle={styles.formContent}>
              <Text style={[styles.label, { color: colors.text }]}>Capsule Title</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                placeholder="e.g. Grandma's 80th Birthday"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.label, { color: colors.text }]}>Trigger Date</Text>
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                The date when this capsule will be revealed to the senior.
              </Text>
              
              {Platform.OS === 'web' ? (
                <View style={[styles.input, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer, justifyContent: 'center' }]}>
                  <Text style={{ color: colors.text }}>{format(date, 'MMM d, yyyy')}</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.dateInput, { borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.text} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {format(date, 'MMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onValueChange={handleDateChange}
                  onDismiss={handleDismiss}
                  minimumDate={new Date()}
                />
              )}

              <Text style={[styles.label, { color: colors.text, marginTop: Spacing.four }]}>Message (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.outline, backgroundColor: colors.surfaceContainer }]}
                placeholder="Write a sweet message to accompany the photos..."
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <FormButton 
                title="Next: Select Memories" 
                onPress={() => setStep(2)} 
                disabled={!title.trim()}
                style={styles.nextButton}
              />
            </ScrollView>
          ) : (
            /* Step 2: Select Files */
            <View style={styles.flex}>
              <View style={styles.selectionHeader}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={20} color={colors.primary} />
                  <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.selectionCount, { color: colors.textSecondary }]}>
                  {selectedFiles.length} selected
                </Text>
              </View>
              
              {mediaFiles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="images-outline" size={48} color={colors.outline} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No images in the vault.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.grid}>
                  {mediaFiles.map(file => {
                    const fileId = Number(file.id);
                    const isSelected = selectedFiles.includes(fileId);
                    return (
                      <TouchableOpacity 
                        key={file.id} 
                        style={styles.gridItem}
                        onPress={() => toggleFileSelection(fileId)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: file.file_path }} style={styles.image} />
                        <View style={[
                          styles.checkbox, 
                          { 
                            borderColor: isSelected ? colors.primary : '#fff',
                            backgroundColor: isSelected ? colors.primary : 'rgba(0,0,0,0.3)'
                          }
                        ]}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 18,
  },
  headerAction: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  formContent: {
    padding: Spacing.four,
  },
  label: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  helperText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
    marginBottom: Spacing.four,
  },
  textArea: {
    height: 120,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  dateText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
  },
  nextButton: {
    marginTop: Spacing.four,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Bold',
    fontSize: 16,
  },
  selectionCount: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.two,
  },
  gridItem: {
    width: '33.33%',
    padding: Spacing.one,
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  emptyText: {
    fontFamily: 'AtkinsonHyperlegibleNext-Regular',
    fontSize: 16,
  },
});
