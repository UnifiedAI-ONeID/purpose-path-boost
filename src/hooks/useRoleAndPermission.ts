
import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

export type UserRole = 'owner' | 'admin' | 'coach' | 'sales' | 'finance' | 'support' | null;

export interface RolePermissions {
  [key: string]: boolean;
}

const fetchRolePermissions = async (role: UserRole): Promise<RolePermissions> => {
  if (!role) return {};
  try {
    const docRef = doc(db, 'roles', role);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().permissions as RolePermissions;
    }
    return {};
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return {};
  }
};

export function useRoleAndPermissions() {
  const [role, setRole] = useState<UserRole>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setRole(null);
        setPermissions({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const idTokenResult = await currentUser.getIdTokenResult();
        const userRole = (idTokenResult.claims.role as UserRole) || null;
        setRole(userRole);
        
        const perms = await fetchRolePermissions(userRole);
        setPermissions(perms);

      } catch (error) {
        console.error("Error fetching user role and permissions:", error);
        setRole(null);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (permission: string): boolean => {
    return permissions[permission] || false;
  };

  return { user, role, permissions, loading, hasPermission };
}
