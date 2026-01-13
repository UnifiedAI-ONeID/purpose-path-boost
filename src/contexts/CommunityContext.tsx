/**
 * @file CommunityContext - Manages community posts, comments, and likes with Firebase
 * Provides real-time updates for the community feed
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db, auth } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  onSnapshot,
  limit,
  increment,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { toast } from 'sonner';

// --- Type Definitions ---

export type UserRole = 'client' | 'coach' | 'admin';

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: UserRole;
  content: string;
  topic: string;
  tags: string[];
  isPinned: boolean;
  isDeleted: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
  hasLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
}

interface CommunityContextValue {
  posts: CommunityPost[];
  loading: boolean;
  error: string | null;
  userRole: UserRole;
  createPost: (content: string, topic: string, tags: string[]) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  pinPost: (postId: string, pinned: boolean) => Promise<void>;
  getComments: (postId: string) => Promise<CommunityComment[]>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  getPostsByTopic: (topic: string) => CommunityPost[];
  getPostsByTag: (tag: string) => CommunityPost[];
  getPinnedPosts: () => CommunityPost[];
  refreshPosts: () => Promise<void>;
}

// --- Context ---

const CommunityContext = createContext<CommunityContextValue | undefined>(undefined);

const POSTS_COLLECTION = 'community_posts';

// --- Topic Options ---

export const COMMUNITY_TOPICS = [
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'mindset', label: 'Mindset', emoji: '🧠' },
  { value: 'health', label: 'Health & Wellness', emoji: '🏃' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'goals', label: 'Goals & Progress', emoji: '🎯' },
  { value: 'wins', label: 'Wins & Gratitude', emoji: '🏆' }
];

export const COMMUNITY_TAGS = [
  'win', 'question', 'accountability', 'gratitude', 'tip', 'challenge', 'motivation'
];

// --- Provider Component ---

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'client');
          }
        } catch (err) {
          console.error('[Community] Failed to fetch user role:', err);
        }
      } else {
        setUserRole('client');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch posts with real-time updates
  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('isDeleted', '==', false),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        const fetchedPosts: CommunityPost[] = [];
        const likeChecks: Promise<void>[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const post: CommunityPost = {
            id: docSnap.id,
            authorId: data.authorId,
            authorName: data.authorName || 'Anonymous',
            authorAvatar: data.authorAvatar,
            authorRole: data.authorRole || 'client',
            content: data.content,
            topic: data.topic || 'general',
            tags: data.tags || [],
            isPinned: data.isPinned || false,
            isDeleted: data.isDeleted || false,
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
            hasLiked: false
          };
          fetchedPosts.push(post);

          // Check if user has liked this post
          if (user) {
            likeChecks.push(
              getDoc(doc(db, POSTS_COLLECTION, docSnap.id, 'likes', user.uid))
                .then((likeDoc) => {
                  if (likeDoc.exists()) {
                    post.hasLiked = true;
                    setUserLikes(prev => new Set(prev).add(docSnap.id));
                  }
                })
                .catch(() => {})
            );
          }
        });

        await Promise.all(likeChecks);
        setPosts(fetchedPosts);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[Community] Fetch error:', err);
        setError('Failed to load community posts');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refreshPosts = useCallback(async () => {
    // The real-time listener handles this automatically
  }, []);

  const createPost = useCallback(async (content: string, topic: string, tags: string[]) => {
    if (!user) {
      toast.error('Please sign in to post');
      return;
    }

    try {
      // Get user display name
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      await addDoc(collection(db, POSTS_COLLECTION), {
        authorId: user.uid,
        authorName: userData?.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: userData?.avatarUrl || '',
        authorRole: userRole,
        content,
        topic,
        tags,
        isPinned: false,
        isDeleted: false,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: null
      });
      toast.success('Post created!');
    } catch (err) {
      console.error('[Community] Create post error:', err);
      toast.error('Failed to create post');
      throw err;
    }
  }, [user, userRole]);

  const updatePost = useCallback(async (postId: string, content: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        content,
        updatedAt: serverTimestamp()
      });
      toast.success('Post updated!');
    } catch (err) {
      console.error('[Community] Update post error:', err);
      toast.error('Failed to update post');
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
      toast.success('Post deleted');
    } catch (err) {
      console.error('[Community] Delete post error:', err);
      toast.error('Failed to delete post');
      throw err;
    }
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', user.uid);
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const hasLiked = userLikes.has(postId);

    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(postRef, { likesCount: increment(1) });
        setUserLikes(prev => new Set(prev).add(postId));
      }
    } catch (err) {
      console.error('[Community] Like error:', err);
      toast.error('Failed to update like');
    }
  }, [user, userLikes]);

  const pinPost = useCallback(async (postId: string, pinned: boolean) => {
    if (userRole !== 'coach' && userRole !== 'admin') {
      toast.error('Only coaches can pin posts');
      return;
    }

    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        isPinned: pinned,
        updatedAt: serverTimestamp()
      });
      toast.success(pinned ? 'Post pinned!' : 'Post unpinned');
    } catch (err) {
      console.error('[Community] Pin error:', err);
      toast.error('Failed to pin post');
    }
  }, [userRole]);

  const getComments = useCallback(async (postId: string): Promise<CommunityComment[]> => {
    try {
      const q = query(
        collection(db, POSTS_COLLECTION, postId, 'comments'),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          postId,
          authorId: data.authorId,
          authorName: data.authorName || 'Anonymous',
          authorAvatar: data.authorAvatar,
          content: data.content,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isDeleted: false
        };
      });
    } catch (err) {
      console.error('[Community] Get comments error:', err);
      return [];
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, POSTS_COLLECTION, postId, 'comments'), {
        authorId: user.uid,
        authorName: userData?.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorAvatar: userData?.avatarUrl || '',
        content,
        createdAt: serverTimestamp(),
        isDeleted: false
      });

      // Update comment count
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        commentsCount: increment(1)
      });

      toast.success('Comment added!');
    } catch (err) {
      console.error('[Community] Add comment error:', err);
      toast.error('Failed to add comment');
      throw err;
    }
  }, [user]);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId, 'comments', commentId), {
        isDeleted: true
      });
      await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        commentsCount: increment(-1)
      });
      toast.success('Comment deleted');
    } catch (err) {
      console.error('[Community] Delete comment error:', err);
      toast.error('Failed to delete comment');
    }
  }, []);

  const getPostsByTopic = useCallback((topic: string) => {
    return posts.filter(p => p.topic === topic);
  }, [posts]);

  const getPostsByTag = useCallback((tag: string) => {
    return posts.filter(p => p.tags.includes(tag));
  }, [posts]);

  const getPinnedPosts = useCallback(() => {
    return posts.filter(p => p.isPinned);
  }, [posts]);

  const value: CommunityContextValue = {
    posts,
    loading,
    error,
    userRole,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    pinPost,
    getComments,
    addComment,
    deleteComment,
    getPostsByTopic,
    getPostsByTag,
    getPinnedPosts,
    refreshPosts
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

// --- Hook ---

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}

// --- Helper: Format time ago ---

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
