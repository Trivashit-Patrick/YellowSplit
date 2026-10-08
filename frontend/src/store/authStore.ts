import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  incrementExpenseCount: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      }
    } catch (error) {
      console.error('Initialize error:', error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile();
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      set({ profile: data as Profile });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      set({ user: data.user });
      await get().fetchProfile();
    }

    set({ isLoading: false });
    return { error };
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        expense_count: 0,
        is_pro: false,
        pro_expires_at: null,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      set({ user: data.user });
      await get().fetchProfile();
    }

    set({ isLoading: false });
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await get().fetchProfile();
    }

    return { error };
  },

  incrementExpenseCount: async () => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ expense_count: profile.expense_count + 1 })
      .eq('id', user.id);

    if (!error) {
      set({ profile: { ...profile, expense_count: profile.expense_count + 1 } });
    }
  },

  upgradeToPro: async () => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        pro_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      set({
        profile: {
          ...profile,
          is_pro: true,
          pro_expires_at: expiresAt.toISOString(),
        },
      });
    }
  },
}));
