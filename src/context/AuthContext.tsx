import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut } from '../lib/firebase';
import { api, resolveAssetUrl } from '../services/apiClient';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  role?: 'admin' | 'user' | 'moderator';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getSocketToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SOCKET_TOKEN_KEY = 'quesale_socket_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const mapProfile = (uid: string, backendProfile: any): UserProfile => {
    const username = backendProfile?.username;
    const firebasePhoto = auth.currentUser?.photoURL || null;
    const backendPhoto = resolveAssetUrl(backendProfile?.photo_url) || firebasePhoto;
    return {
      uid,
      email: backendProfile?.email || auth.currentUser?.email || null,
      displayName: username || null,
      photoURL: backendPhoto,
      username,
      role: username?.toLowerCase() === 'santipingui58' ? 'admin' : 'user',
    };
  };

  const fetchProfile = async (uid: string) => {
    try {
      const backendProfile = await api.getProfile();
      setProfile(mapProfile(uid, backendProfile));
    } catch (err) {
      console.error('Error fetching profile:', err);
      const firebaseUser = auth.currentUser;
      const usernameFromDisplayName = firebaseUser?.displayName
        ? firebaseUser.displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 20)
        : undefined;
      setProfile({
        uid,
        email: firebaseUser?.email || null,
        displayName: usernameFromDisplayName || null,
        photoURL: firebaseUser?.photoURL || null,
        username: usernameFromDisplayName,
        role: usernameFromDisplayName?.toLowerCase() === 'santipingui58' ? 'admin' : 'user',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);
      if (newUser) {
        try {
          const idToken = await newUser.getIdToken();
          const result = await api.loginWithFirebase(idToken, newUser.photoURL);
          if (result.token) {
            localStorage.setItem(SOCKET_TOKEN_KEY, result.token);
          }
        } catch (error) {
          console.error('Backend login failed', error);
        }
        try {
          const backendProfile = await api.getProfile();
          setProfile(mapProfile(newUser.uid, backendProfile));
        } catch (err) {
          console.error('Error fetching profile:', err);
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
            role: usernameFromDisplayName?.toLowerCase() === 'santipingui58' ? 'admin' : 'user',
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(SOCKET_TOKEN_KEY);
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getSocketToken = () => localStorage.getItem(SOCKET_TOKEN_KEY);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithGoogle, 
      loginWithEmail, 
      logout,
      refreshProfile,
      getSocketToken
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
