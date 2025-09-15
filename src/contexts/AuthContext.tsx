import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/booking';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem('isGuest') === 'true';
    } catch {
      return false;
    }
  });

  // Fetch user profile with role
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create default profile if none exists
        const now = new Date().toISOString();
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'customer',
            member_since: now,
            created_at: now,
            updated_at: now
          });
        
        if (!insertError) {
          const now = new Date().toISOString();
          setProfile({
            id: userId,
            full_name: undefined,
            phone_number: undefined,
            role: 'customer',
            member_since: now,
            created_at: now,
            updated_at: now
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // Leaving guest mode once authenticated
        setIsGuest(false);
        try { localStorage.removeItem('isGuest'); } catch {}
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsGuest(false);
    try { localStorage.removeItem('isGuest'); } catch {}
  };

  const signInWithGoogle = async () => {
    // Ensure we use the correct origin for production
    const origin = window.location.origin;
    const redirectUrl = `${origin}/auth/callback`;
    
    console.log('Google OAuth redirect URL:', redirectUrl); // Debug log
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'admin';
  
  // Debug logging for admin role detection
  useEffect(() => {
    if (user && profile) {
      console.log('AuthContext - User ID:', user.id);
      console.log('AuthContext - Profile role:', profile.role);
      console.log('AuthContext - isAdmin:', isAdmin);
    }
  }, [user, profile, isAdmin]);

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    loginAsGuest: () => {
      setIsGuest(true);
      try { localStorage.setItem('isGuest', 'true'); } catch {}
    },
    exitGuestMode: () => {
      setIsGuest(false);
      try { localStorage.removeItem('isGuest'); } catch {}
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 