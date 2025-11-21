import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  image_url?: string; // image field in schema
  category: string;
  author: string; // authorId in schema, map to name if needed
  read_time: number;
  published_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
}

export const blogService = {
  async getPostBySlug(slug: string) {
    // Assuming ID is slug based on schema, try getDoc first
    const docRef = doc(db, 'blog_posts', slug);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { id: docSnap.id, ...data } as any;
    }
    
    // Fallback query by slug field if ID is UUID
    const q = query(collection(db, 'blog_posts'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return { id: snap.docs[0].id, ...data } as any;
    }
    
    return null;
  },

  async getRelatedPosts(category: string, excludeSlug: string) {
    const q = query(
      collection(db, 'blog_posts'), 
      where('category', '==', category),
      // Firestore doesn't support neq well with other filters sometimes, let's filter client side or limit
      limit(4) 
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(p => p.slug !== excludeSlug)
      .slice(0, 3);
  }
};
