import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  Linking,
  useColorScheme 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import type { FileItem } from '@/hooks/use-vault';
import { Colors, Spacing, Rounded, MaxContentWidth } from '@/constants/theme';

interface FilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export function FilePreviewModal({ visible, onClose, file }: FilePreviewModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  if (!file) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.previewOverlay}>
        <View style={[styles.previewContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.previewHeader, { borderBottomColor: colors.outline }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={1}>
              {file.name}
            </Text>
            <Pressable onPress={onClose} style={styles.previewCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Body */}
          <View style={styles.previewBody}>
            {/* Image Preview */}
            {file.file_type === 'image' && (
              <Image 
                source={file.file_path} 
                style={styles.previewImage} 
                contentFit="contain" 
              />
            )}

            {/* Video Player */}
            {file.file_type === 'video' && (
              Platform.OS === 'web' ? (
                <video 
                  src={file.file_path} 
                  controls 
                  style={styles.webVideo as any}
                />
              ) : (
                <View style={styles.mockPlayerContainer}>
                  <Ionicons name="videocam-outline" size={64} color={colors.primary} />
                  <Text style={[styles.mockPlayerText, { color: colors.text }]}>Video Preview</Text>
                  <Pressable 
                    style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(file.file_path)}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.mockPlayerBtnText}>Play Video</Text>
                  </Pressable>
                </View>
              )
            )}

            {/* Audio Player */}
            {file.file_type === 'audio' && (
              Platform.OS === 'web' ? (
                <View style={styles.audioWebWrapper}>
                  <audio 
                    src={file.file_path} 
                    controls 
                    style={{ width: '100%' }}
                  />
                </View>
              ) : (
                <View style={styles.mockPlayerContainer}>
                  <Ionicons name="musical-notes-outline" size={64} color={colors.primary} />
                  <Text style={[styles.mockPlayerText, { color: colors.text }]}>Audio Preview</Text>
                  <Pressable 
                    style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(file.file_path)}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.mockPlayerBtnText}>Play Audio</Text>
                  </Pressable>
                </View>
              )
            )}

            {/* Document Preview */}
            {file.file_type === 'document' && (
              Platform.OS === 'web' ? (
                <View style={styles.mockPlayerContainer}>
                  <Ionicons name="document-text-outline" size={64} color={colors.primary} />
                  <Text style={[styles.mockPlayerText, { color: colors.text }]}>Document File</Text>
                  <Text style={[styles.mockPlayerSub, { color: colors.textSecondary }]}>
                    Previewing is not supported directly for raw documents on Web.
                  </Text>
                  <Pressable 
                    style={[styles.mockPlayerBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(file.file_path)}
                  >
                    <Ionicons name="open-outline" size={20} color="#fff" />
                    <Text style={styles.mockPlayerBtnText}>Open Document</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.webviewWrapper}>
                  <WebView
                    source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(file.file_path)}` }}
                    style={{ flex: 1, width: '100%' }}
                    startInLoadingState={true}
                    renderLoading={() => <ActivityIndicator size="large" color={colors.primary} style={StyleSheet.absoluteFill} />}
                  />
                </View>
              )
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  webviewWrapper: {
    flex: 1,
    width: '100%',
    borderRadius: Rounded.md,
    overflow: 'hidden',
    minHeight: 400,
  },
});
