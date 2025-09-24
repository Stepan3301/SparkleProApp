import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
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

  // Memoize admin check to prevent unnecessary re-renders
  const isAdmin = useMemo(() => {
    return profile?.role === 'admin';
  }, [profile?.role]);

  // Optimized profile fetching with caching
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Create default profile if none exists
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              role: 'customer' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Don't throw error, just log it and continue
    }
  }, []);

  // Optimized authentication functions with error handling
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Sign out error (non-critical):', error);
        // Don't throw error, just clear local state
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Always clear local state regardless of API response
      setUser(null);
      setProfile(null);
      setIsGuest(false);
      try {
        localStorage.removeItem('isGuest');
        // Clear any stored tokens
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
      } catch {}
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsGuest(true);
    try {
      localStorage.setItem('isGuest', 'true');
    } catch {}
  }, []);

  const exitGuestMode = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    try {
      localStorage.removeItem('isGuest');
    } catch {}
  }, []);

  // Token cleanup function
  const clearAuthTokens = useCallback(() => {
    try {
      console.log('Clearing all Supabase auth tokens...');
      
      // Clear known Supabase token keys
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear all Supabase-related keys (including the specific format we see in screenshot)
      const keysToRemove: string[] = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || 
            key.includes('supabase') || 
            key.includes('auth-token') ||
            key.includes('sb-rpvohieuafewgivonjgr')) {
          keysToRemove.push(key);
        }
      });
      
      keysToRemove.forEach(key => {
        console.log('Removing token key:', key);
        localStorage.removeItem(key);
      });
      
      console.log(`Cleared ${keysToRemove.length} auth token(s)`);
    } catch (error) {
      console.warn('Error clearing auth tokens:', error);
    }
  }, []);

  // Comprehensive cache cleanup for development environment
  const clearAppCache = useCallback(() => {
    try {
      console.log('Clearing app cache for fresh start...');
      
      // Clear all Supabase auth tokens
      clearAuthTokens();
      
      // Clear app-specific storage
      localStorage.removeItem('isGuest');
      localStorage.removeItem('orderAgainData');
      localStorage.removeItem('guestBookingProgress');
      localStorage.removeItem('notifications_declined_at');
      localStorage.removeItem('notification_subscription');
      localStorage.removeItem('test_notifications');
      localStorage.removeItem('i18nextLng');
      
      // Clear any other app-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sparkle') || key.includes('booking') || key.includes('guest')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('App cache cleared successfully');
    } catch (error) {
      console.warn('Error clearing app cache:', error);
    }
  }, [clearAuthTokens]);

  // Check if we need to clear cache (development environment or version mismatch)
  const checkAndClearCacheIfNeeded = useCallback(() => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const lastCleared = localStorage.getItem('lastCacheClear');
      const currentTime = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // In development mode, be more aggressive about clearing cache
      // Clear cache if:
      // 1. In development mode and cache is older than 5 minutes
      // 2. No previous clear timestamp exists
      // 3. We have Supabase tokens but no valid session (stale tokens)
      const hasSupabaseTokens = Object.keys(localStorage).some(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      const shouldClearCache = isDevelopment && (
        !lastCleared || 
        (currentTime - parseInt(lastCleared)) > fiveMinutes ||
        hasSupabaseTokens // Always clear if we have Supabase tokens in dev mode
      );
      
      if (shouldClearCache) {
        console.log('Development environment detected - clearing cache for fresh start');
        console.log('Reason:', !lastCleared ? 'No previous clear' : 
                   (currentTime - parseInt(lastCleared)) > fiveMinutes ? 'Cache older than 5 minutes' : 
                   'Supabase tokens detected');
        clearAppCache();
        localStorage.setItem('lastCacheClear', currentTime.toString());
      } else {
        console.log('Cache check passed - no clearing needed');
      }
    } catch (error) {
      console.warn('Error checking cache status:', error);
      // If there's any error, clear cache to be safe
      clearAppCache();
    }
  }, [clearAppCache]);

  // Expose cache clear function to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearAppCache = clearAppCache;
      (window as any).clearAuthTokens = clearAuthTokens;
    }
  }, [clearAppCache, clearAuthTokens]);

  // Optimized auth state change listener with error handling
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.id);

      try {
        if (session?.user) {
          console.log('User authenticated, clearing guest mode and setting user');
          setUser(session.user);
          await fetchProfile(session.user.id);
          setIsGuest(false);
          try {
            localStorage.removeItem('isGuest');
          } catch {}
        } else {
          const isGuestMode = localStorage.getItem('isGuest') === 'true';
          if (isGuestMode) {
            console.log('No session but guest mode active, keeping guest state');
            setIsGuest(true);
            setUser(null);
            setProfile(null);
          } else {
            console.log('No session and not guest mode, clearing user');
            setUser(null);
            setProfile(null);
            setIsGuest(false);
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // On error, clear tokens and fall back to guest mode to prevent app crash
        if (mounted) {
          clearAuthTokens();
          setUser(null);
          setProfile(null);
          setIsGuest(true);
          try {
            localStorage.setItem('isGuest', 'true');
          } catch {}
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove fetchProfile dependency to prevent infinite re-renders

  // Token validation function
  const validateStoredTokens = useCallback(async () => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Check if we have any Supabase tokens in localStorage
      const hasTokens = Object.keys(localStorage).some(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      if (!hasTokens) {
        console.log('No stored tokens found, starting fresh');
        return false;
      }
      
      // In development mode, be more aggressive about clearing tokens
      if (isDevelopment) {
        console.log('Development mode: clearing all tokens for fresh start');
        clearAuthTokens();
        return false;
      }
      
      // Try to get session to validate tokens
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Token validation failed:', error);
        clearAuthTokens();
        return false;
      }
      
      if (!session?.user) {
        console.log('No valid session found, clearing tokens');
        clearAuthTokens();
        return false;
      }
      
      console.log('Valid session found');
      return true;
    } catch (error) {
      console.error('Error validating tokens:', error);
      clearAuthTokens();
      return false;
    }
  }, [clearAuthTokens]);

  // Initial session check with optimization and error handling
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // First, check and clear cache if needed (development environment)
        checkAndClearCacheIfNeeded();
        
        // Validate stored tokens before using them
        const hasValidTokens = await validateStoredTokens();
        
        if (hasValidTokens) {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!mounted) return;

          if (error) {
            console.warn('Session check error (non-critical):', error.message);
            // Clear invalid tokens and fall back to guest mode
            clearAuthTokens();
            setUser(null);
            setProfile(null);
            setIsGuest(true);
            try {
              localStorage.setItem('isGuest', 'true');
            } catch {}
            setLoading(false);
            return;
          }

          if (session?.user) {
            console.log('Initial session found, clearing guest mode and setting user');
            setUser(session.user);
            await fetchProfile(session.user.id);
            setIsGuest(false);
            try {
              localStorage.removeItem('isGuest');
            } catch {}
          } else {
            setUser(null);
            setProfile(null);
            const isGuestMode = localStorage.getItem('isGuest') === 'true';
            if (isGuestMode) {
              console.log('No initial session but guest mode active');
              setIsGuest(true);
            } else {
              setIsGuest(false);
            }
          }
        } else {
          // No valid tokens, start fresh
          if (mounted) {
            console.log('No valid tokens, starting fresh');
            setUser(null);
            setProfile(null);
            setIsGuest(true);
            try {
              localStorage.setItem('isGuest', 'true');
            } catch {}
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // On any error, clear tokens and fall back to guest mode to prevent app crash
        if (mounted) {
          clearAuthTokens();
          setUser(null);
          setProfile(null);
          setIsGuest(true);
          try {
            localStorage.setItem('isGuest', 'true');
          } catch {}
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [checkAndClearCacheIfNeeded, validateStoredTokens, clearAuthTokens, fetchProfile]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    loading,
    isAdmin,
    isGuest,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    loginAsGuest,
    exitGuestMode
  }), [user, profile, loading, isAdmin, isGuest, signIn, signUp, signInWithGoogle, signOut, loginAsGuest, exitGuestMode]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
