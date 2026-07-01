import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export type Category = {
  id: number;
  category_name: string;
  user_id: string | null;
};

export type FileItem = {
  id: string;
  created_at: string;
  folder_id: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_path: string;
  name: string;
};

export type Folder = {
  id: string;
  created_at: string;
  name: string;
  desc: string | null;
  image_path: string | null;
  category_id: number;
  user_id: string;
  memory_categories?: Category | null;
  memory_files?: FileItem[];
};

export function useVault() {
  const { user } = useAuth();

  // Data state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Active folder selection
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  // Load Categories & Folders
  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('memory_categories')
      .select('*')
      .order('category_name', { ascending: true });

    if (error) throw error;
    setCategories(data || []);
  }, []);

  const loadFolders = useCallback(async () => {
    // Select folders, categories and all files to compute cover fallback
    const { data, error } = await supabase
      .from('memory_folders')
      .select('*, memory_categories(*), memory_files(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setFolders(data || []);
  }, []);

  const loadFiles = useCallback(async (folderId: string) => {
    const { data, error } = await supabase
      .from('memory_files')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setFiles(data || []);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadFolders(), loadCategories()]);
      if (selectedFolder) {
        await loadFiles(selectedFolder.id);
      }
    } catch (error: any) {
      showError('Error refreshing data', error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, loadFolders, loadCategories, loadFiles]);

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // Sync files when folder selection changes
  useEffect(() => {
    if (selectedFolder) {
      loadFiles(selectedFolder.id).catch((err) => 
        showError('Error loading files', err.message)
      );
    } else {
      setFiles([]);
    }
  }, [selectedFolder, loadFiles]);

  const showError = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  // Upload utility
  const uploadToStorage = async (uri: string, path: string, mimeType?: string): Promise<string> => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { data, error } = await supabase.storage
        .from('memory-vault')
        .upload(path, blob, { contentType: mimeType || blob.type, upsert: true });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('memory-vault').getPublicUrl(path);
      return publicUrl;
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const { data, error } = await supabase.storage
        .from('memory-vault')
        .upload(path, decode(base64), { contentType: mimeType, upsert: true });
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('memory-vault').getPublicUrl(path);
      return publicUrl;
    }
  };

  // Pick Cover image
  const pickCoverImage = async (): Promise<string | null> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError('Permission Denied', 'Please grant photo library permissions.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setUploadingCover(true);
        const fileExt = uri.split('.').pop() || 'jpg';
        const storagePath = `covers/${user?.id}-${Date.now()}.${fileExt}`;
        const publicUrl = await uploadToStorage(uri, storagePath, `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`);
        return publicUrl;
      }
    } catch (error: any) {
      showError('Upload failed', error.message);
    } finally {
      setUploadingCover(false);
    }
    return null;
  };

  // Create or Update Folder
  const saveFolder = async (
    id: string | null,
    name: string,
    desc: string,
    categoryId: number,
    coverUrl: string | null
  ): Promise<boolean> => {
    try {
      setLoading(true);
      if (id) {
        // Update
        const { error } = await supabase
          .from('memory_folders')
          .update({
            name: name.trim(),
            desc: desc.trim() || null,
            category_id: categoryId,
            image_path: coverUrl
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('memory_folders')
          .insert({
            name: name.trim(),
            desc: desc.trim() || null,
            category_id: categoryId,
            image_path: coverUrl,
            user_id: user?.id
          });

        if (error) throw error;
      }

      await loadFolders();
      // If we are editing the current active folder, refresh selectedFolder
      if (id && selectedFolder && selectedFolder.id === id) {
        const updated = folders.find(f => f.id === id);
        if (updated) {
          setSelectedFolder({ 
            ...updated, 
            name, 
            desc: desc.trim() || null, 
            image_path: coverUrl, 
            category_id: categoryId 
          });
        }
      }
      return true;
    } catch (error: any) {
      showError('Folder save failed', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete Folder
  const deleteFolder = async (folder: Folder): Promise<boolean> => {
    try {
      setLoading(true);
      // Delete files from storage
      const { data: folderFiles, error: fetchError } = await supabase
        .from('memory_files')
        .select('file_path')
        .eq('folder_id', folder.id);

      if (fetchError) throw fetchError;

      if (folderFiles && folderFiles.length > 0) {
        const relativePaths = folderFiles.map(f => {
          const parts = f.file_path.split('/memory-vault/');
          return parts.length > 1 ? parts[1] : f.file_path;
        });
        await supabase.storage.from('memory-vault').remove(relativePaths);
      }

      // Delete cover image
      if (folder.image_path) {
        const parts = folder.image_path.split('/memory-vault/');
        if (parts.length > 1) {
          await supabase.storage.from('memory-vault').remove([parts[1]]);
        }
      }

      // Delete db entries
      await supabase.from('memory_files').delete().eq('folder_id', folder.id);
      const { error } = await supabase.from('memory_folders').delete().eq('id', folder.id);

      if (error) throw error;

      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
      await loadFolders();
      return true;
    } catch (error: any) {
      showError('Delete failed', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create Category
  const createCategory = async (name: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('memory_categories')
        .insert({
          category_name: name.trim(),
          user_id: user?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.category_name.localeCompare(b.category_name)));
      return data.id;
    } catch (error: any) {
      showError('Failed to create category', error.message);
      return null;
    }
  };

  // Upload Multiple Files
  const uploadFiles = async (folderId: string, pickedAssets: Array<{ uri: string, name: string, mimeType?: string }>) => {
    try {
      setUploadingFile(true);

      const uploadPromises = pickedAssets.map(async (asset) => {
        const storagePath = `files/${folderId}/${Date.now()}-${asset.name}`;

        // Determine file type
        let fileType: 'image' | 'video' | 'audio' | 'document' = 'document';
        const mime = asset.mimeType || '';
        if (mime.startsWith('image/')) fileType = 'image';
        else if (mime.startsWith('video/')) fileType = 'video';
        else if (mime.startsWith('audio/')) fileType = 'audio';

        // Upload to storage
        const publicUrl = await uploadToStorage(asset.uri, storagePath, asset.mimeType);

        // Save to DB
        const { error: dbError } = await supabase
          .from('memory_files')
          .insert({
            folder_id: folderId,
            name: asset.name,
            file_type: fileType,
            file_path: publicUrl
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);
      await loadFiles(folderId);
      await loadFolders(); // Refresh folders to compute fallback cover if necessary
    } catch (error: any) {
      showError('File upload failed', error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  // Rename File
  const renameFile = async (fileId: string, newName: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('memory_files')
        .update({ name: newName.trim() })
        .eq('id', fileId);

      if (error) throw error;

      if (selectedFolder) await loadFiles(selectedFolder.id);
      return true;
    } catch (error: any) {
      showError('Rename failed', error.message);
      return false;
    }
  };

  // Delete File
  const deleteFile = async (file: FileItem): Promise<boolean> => {
    try {
      const parts = file.file_path.split('/memory-vault/');
      if (parts.length > 1) {
        await supabase.storage.from('memory-vault').remove([parts[1]]);
      }

      const { error } = await supabase
        .from('memory_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      if (selectedFolder) {
        await loadFiles(selectedFolder.id);
        await loadFolders(); // Refresh folders to update cover fallback if this was the latest image
      }
      return true;
    } catch (error: any) {
      showError('Delete failed', error.message);
      return false;
    }
  };

  return {
    folders,
    files,
    categories,
    loading,
    uploadingFile,
    uploadingCover,
    selectedFolder,
    setSelectedFolder,
    refreshData,
    pickCoverImage,
    saveFolder,
    deleteFolder,
    createCategory,
    uploadFiles,
    renameFile,
    deleteFile,
  };
}
