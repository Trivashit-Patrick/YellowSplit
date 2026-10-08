import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://fbspkcqkgvzcxdutflqn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3BrY3FrZ3Z6Y3hkdXRmbHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTg3MTUsImV4cCI6MjA4OTU5NDcxNX0.wnE8SIdHRLR5BWgzzcnoycHDLqb4wWCXcKI8gpvVn-8';

// Check if we're in a browser/client environment
const isBrowser = () => {
  return typeof window !== 'undefined';
};

// Custom storage adapter that handles SSR
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isBrowser()) {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isBrowser()) {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isBrowser()) {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

// Lazy initialization singleton
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: isBrowser(),
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

// For backward compatibility, create a proxy that lazily initializes
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default supabase;
