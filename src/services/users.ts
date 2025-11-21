import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  roles: string[];
  preferences?: {
    language: string;
    timezone: string;
  };
}

export const userService = {
  async getUser(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  },

  async createUser(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      uid,
      ...data,
      createdAt: new Date().toISOString()
    }, { merge: true });
  },

  async updateUser(uid: string, data: Partial<UserProfile>) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  }
};
