import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut } from '../lib/firebase';
import { api } from '../services/apiClient';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  role?: 'admin' | 'user' | 'moderator';
  isNewUser?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const mapProfile = (uid: string, backendProfile: any): UserProfile => {
    const username = backendProfile?.username;
    return {
      uid,
      email: backendProfile?.email || auth.currentUser?.email || null,
      displayName: auth.currentUser?.displayName || username || null,
      photoURL: backendProfile?.photo_url || auth.currentUser?.photoURL || null,
      username,
      role: username === 'santipingui58' ? 'admin' : 'user',
    };
  };

  const fetchProfile = async (uid: string) => {
    try {
      const backendProfile = await api.getProfile();
      setProfile(mapProfile(uid, backendProfile));
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile({
        uid,
        email: auth.currentUser?.email || null,
        displayName: auth.currentUser?.displayName || null,
        photoURL: auth.currentUser?.photoURL || null,
        isNewUser: true,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);
      if (newUser) {
        try {
          const idToken = await newUser.getIdToken();
          await api.loginWithFirebase(idToken, newUser.photoURL);
        } catch (error) {
          console.error('Backend login failed', error);
        }
        await fetchProfile(newUser.uid);
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

  const registerWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email registration failed", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

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
      registerWithEmail, 
      logout,
      refreshProfile 
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
