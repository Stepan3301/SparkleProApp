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
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        console.log('Profile found:', data);
        setProfile(data);
      } else {
        console.log('No profile found, creating default customer profile');
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
          const defaultProfile = {
            id: userId,
            full_name: undefined,
            phone_number: undefined,
            role: 'customer' as const,
            member_since: now,
            created_at: now,
            updated_at: now
          };
          console.log('Created default profile:', defaultProfile);
          setProfile(defaultProfile);
        } else {
          console.error('Error creating default profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('Initial session found, clearing guest mode and setting user');
        setUser(session.user);
        fetchProfile(session.user.id);
        // Clear guest mode if user is already authenticated
        setIsGuest(false);
        try { 
          localStorage.removeItem('isGuest');
          console.log('Cleared isGuest from localStorage on initial load');
        } catch {}
      } else {
        setUser(null);
        setProfile(null);
        // Check if we should be in guest mode
        const isGuestMode = localStorage.getItem('isGuest') === 'true';
        if (isGuestMode) {
          console.log('No initial session but guest mode active');
          setIsGuest(true);
        } else {
          setIsGuest(false);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', _event, session?.user?.id);
      
      // If there's a session (user logged in), always process it regardless of guest mode
      if (session?.user) {
        console.log('User authenticated, clearing guest mode and setting user');
        setUser(session.user);
        fetchProfile(session.user.id);
        // Clear guest mode when user authenticates
        setIsGuest(false);
        try { 
          localStorage.removeItem('isGuest');
          console.log('Cleared isGuest from localStorage');
        } catch {}
      } else {
        // No session - check if we should be in guest mode
        const isGuestMode = localStorage.getItem('isGuest') === 'true';
        if (isGuestMode) {
          console.log('No session but guest mode active, keeping guest state');
          // Keep guest mode active
        } else {
          console.log('No session and not guest mode, clearing user');
          setUser(null);
          setProfile(null);
          setIsGuest(false);
        }
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
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log('AuthContext - User ID:', user?.id || 'null');
    console.log('AuthContext - Profile role:', profile?.role || 'null');
    console.log('AuthContext - isAdmin:', isAdmin);
    console.log('AuthContext - isGuest:', isGuest);
    console.log('AuthContext - Loading:', loading);
  }, [user, profile, isAdmin, isGuest, loading]);

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
      console.log('loginAsGuest: Starting guest mode activation');
      console.log('loginAsGuest: Current user before:', user?.id);
      console.log('loginAsGuest: Current isGuest before:', isGuest);
      
      // Clear existing user session and profile
      setUser(null);
      setProfile(null);
      setIsGuest(true);
      
      try { 
        localStorage.setItem('isGuest', 'true');
        // Clear any existing auth session
        localStorage.removeItem('sb-rpvohieuafewgivonjgr-auth-token');
        console.log('loginAsGuest: Guest mode activated, localStorage cleared');
      } catch (error) {
        console.error('loginAsGuest: Error clearing localStorage:', error);
      }
    },
    exitGuestMode: () => {
      setIsGuest(false);
      setUser(null);
      setProfile(null);
      try { 
        localStorage.removeItem('isGuest');
        // Clear any existing auth session
        localStorage.removeItem('sb-rpvohieuafewgivonjgr-auth-token');
      } catch {}
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 