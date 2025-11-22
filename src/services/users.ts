import { collection, doc, getDoc, setDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  roles: string[]; // ['admin', 'coach', 'client']
  createdAt: string;
  preferences?: {
    language: string;
    timezone: string;
  };
  metadata?: {
    migrationSource?: string;
    originalId?: string;
    [key: string]: any;
  };
}

const COLLECTION = 'users';

export const userService = {
  /**
   * Get full user profile by UID
   */
  async getUser(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  },

  /**
   * Create or overwrite a user profile
   */
  async createUser(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, COLLECTION, uid);
    const now = new Date().toISOString();
    
    const payload = {
      uid,
      roles: ['client'], // default role
      createdAt: now,
      ...data
    };
    
    // Merge true to avoid blowing away existing fields if called multiple times
    await setDoc(docRef, payload, { merge: true });
  },

  /**
   * Update specific fields
   */
  async updateUser(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, COLLECTION, uid);
    await updateDoc(docRef, data);
  },

  /**
   * Check if user has a specific role
   * Note: In production, rely on Custom Claims in ID token for security.
   * This is for UI logic only.
   */
  async hasRole(uid: string, role: string): Promise<boolean> {
    const user = await this.getUser(uid);
    return user?.roles?.includes(role) || false;
  }
};
