import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const memoryStorage = new Map<string, string>();

function getWebStorage() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      const webStorage = getWebStorage();

      if (!webStorage) {
        return memoryStorage.get(key) ?? null;
      }

      return webStorage.getItem(key);
    }

    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      const webStorage = getWebStorage();

      if (!webStorage) {
        memoryStorage.set(key, value);
        return;
      }

      webStorage.setItem(key, value);
      return;
    }

    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      const webStorage = getWebStorage();

      if (!webStorage) {
        memoryStorage.delete(key);
        return;
      }

      webStorage.removeItem(key);
      return;
    }

    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
