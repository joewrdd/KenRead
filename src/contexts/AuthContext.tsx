"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { initializeUserData } from "@/services/firebase/userService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Initialize user data in Firestore when user logs in
        try {
          await initializeUserData(user.uid);
        } catch (error) {
          console.error("Error initializing user data:", error);
        }
      }

      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, username: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Set the display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username,
        });

        // Initialize user data in Firestore
        await initializeUserData(userCredential.user.uid);

        // Force refresh the user
        setUser({ ...userCredential.user });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Ensure user document exists in Firestore
    if (userCredential.user) {
      await initializeUserData(userCredential.user.uid);
    }

    return userCredential;
  }

  function logout() {
    // Clear local storage for bookmarks and reading history
    localStorage.removeItem("kenread-bookmarks");
    localStorage.removeItem("kenread-reading-history");
    return signOut(auth);
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
