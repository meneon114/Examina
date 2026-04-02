"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

// Fallback email, user should override this in .env.local
const TEACHER_EMAIL = process.env.NEXT_PUBLIC_TEACHER_EMAIL || "teacher@example.com";

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  role: "teacher" | "student" | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Please configure your .env.local file.");
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!auth) {
      alert("Firebase is not configured. Please add keys to .env.local");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error signing in", error);
      alert("Auth failed: " + error.message);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const role = user ? (user.email === TEACHER_EMAIL ? "teacher" : "student") : null;

  return (
    <AuthContext.Provider value={{ user, loading, role, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
