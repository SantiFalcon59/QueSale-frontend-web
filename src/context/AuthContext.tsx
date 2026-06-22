import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut } from '../lib/firebase';
import { api, resolveAssetUrl } from '../services/apiClient';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { initPushNotifications, unregisterPushNotifications } from '../services/pushNotificationService';
import { toastError } from '../lib/swal';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  role?: 'admin' | 'user' | 'moderator';
  id_user?: string;
  is_premium?: boolean;
  premium_until?: string | null;
  usernameLastChangedAt?: string | null;
  interests?: { id: string; name: string }[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isNewUser: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getSocketToken: () => string | null;
  savedEvents: Record<string, boolean>;
  toggleSaveEvent: (eventId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SOCKET_TOKEN_KEY = 'quesale_socket_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [savedEvents, setSavedEvents] = useState<Record<string, boolean>>({});

  const mapProfile = (uid: string, backendProfile: any): UserProfile => {
    const username = backendProfile?.username;
    const firebasePhoto = auth.currentUser?.photoURL || null;
    const backendPhoto = resolveAssetUrl(backendProfile?.photo_url) || firebasePhoto;

    // If user has Google photo but no backend photo, save it to DB
    if (firebasePhoto && !backendProfile?.photo_url && backendProfile?.id_user) {
      api.updateProfile({ photo_url: firebasePhoto }).catch(() => {});
    }

    return {
      uid,
      id_user: backendProfile?.id_user || backendProfile?.id || uid,
      email: backendProfile?.email || auth.currentUser?.email || null,
      displayName: username || null,
      photoURL: backendPhoto,
      username,
      role: backendProfile?.global_role || 'user',
      is_premium: !!backendProfile?.is_premium,
      premium_until: backendProfile?.premium_until,
      usernameLastChangedAt: backendProfile?.usernameLastChangedAt,
      interests: backendProfile?.interests || [],
    };
  };

  const fetchProfile = async (uid: string) => {
    try {
      const backendProfile = await api.getProfile();
      setProfile(mapProfile(uid, backendProfile));
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);
      if (newUser) {
        let isBanned = false;
        try {
          const idToken = await newUser.getIdToken();
          const result = await api.loginWithFirebase(idToken, newUser.photoURL);
          if (result.token) {
            localStorage.setItem(SOCKET_TOKEN_KEY, result.token);
          }
          if (result.isNew) {
            setIsNewUser(true);
          }

          const backendProfile = await api.getProfile();
          setProfile(mapProfile(newUser.uid, backendProfile));
        } catch (error: any) {
          console.error('Backend login failed', error);
          const isSuspended = error?.status === 403 || error?.message?.includes('suspendida');
          if (isSuspended) {
            isBanned = true;
            try {
              localStorage.removeItem(SOCKET_TOKEN_KEY);
              await signOut(auth);
            } catch (signOutErr) {
              console.error('Sign out failed', signOutErr);
            }
            setProfile(null);
            setUser(null);
            toastError("Tu cuenta ha sido suspendida. Se ha cerrado la sesión.");
          } else {
            const firebaseUser = auth.currentUser;
            const usernameFromDisplayName = firebaseUser?.displayName
              ? firebaseUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20)
              : undefined;
            setProfile({
              uid: newUser.uid,
              email: firebaseUser?.email || null,
              displayName: usernameFromDisplayName || null,
              photoURL: firebaseUser?.photoURL || null,
              username: usernameFromDisplayName,
              role: 'user', // Default to user if backend fails
            });
          }
        }

        if (!isBanned) {
          try {
            const result: any = await api.getSavedEvents(1, 500);
            const saved = Array.isArray(result) ? result : [];
            const map: Record<string, boolean> = {};
            saved.forEach((e: any) => { map[e.id_event] = true; });
            setSavedEvents(map);
          } catch (err) {
            console.error('Error fetching saved events:', err);
          }
          // Initialize Capacitor Push Notifications for native app
          initPushNotifications().catch((err) => console.error('Error initializing push notifications:', err));
        }
      } else {
        setProfile(null);
        setIsNewUser(false);
        setSavedEvents({});
        // Clean up Capacitor Push Notifications when logged out
        unregisterPushNotifications().catch((err) => console.error('Error unregistering push notifications:', err));
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      let userCredential;
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize();
        const result = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(result.authentication.idToken);
        userCredential = await signInWithCredential(auth, credential);
      } else {
        userCredential = await signInWithPopup(auth, googleProvider);
      }
      
      const idToken = await userCredential.user.getIdToken();
      try {
        const result = await api.loginWithFirebase(idToken, userCredential.user.photoURL);
        if (result.token) {
          localStorage.setItem(SOCKET_TOKEN_KEY, result.token);
        }
      } catch (backendError: any) {
        await signOut(auth);
        throw backendError;
      }
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await userCredential.user.getIdToken();
      try {
        const result = await api.loginWithFirebase(idToken, userCredential.user.photoURL);
        if (result.token) {
          localStorage.setItem(SOCKET_TOKEN_KEY, result.token);
        }
      } catch (backendError: any) {
        await signOut(auth);
        throw backendError;
      }
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(SOCKET_TOKEN_KEY);
      await unregisterPushNotifications().catch(() => {});
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getSocketToken = () => localStorage.getItem(SOCKET_TOKEN_KEY);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  const toggleSaveEvent = async (eventId: string) => {
    if (!user) return;
    const isCurrentlySaved = !!savedEvents[eventId];
    setSavedEvents(prev => ({ ...prev, [eventId]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await api.unsaveEvent(eventId);
      } else {
        await api.saveEvent(eventId);
      }
    } catch (err) {
      console.error('Error toggling event save:', err);
      // rollback
      setSavedEvents(prev => ({ ...prev, [eventId]: isCurrentlySaved }));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isNewUser,
      loginWithGoogle, 
      loginWithEmail, 
      logout,
      refreshProfile,
      getSocketToken,
      savedEvents,
      toggleSaveEvent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
