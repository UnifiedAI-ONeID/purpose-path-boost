import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageCircle, Heart, Share2, ArrowLeft, Plus, 
  Sparkles, Trophy, Calendar, Clock, UserPlus, CheckCircle,
  Send, X, Loader2, Pin, MoreHorizontal, Edit, Trash2
} from 'lucide-react';
import { db } from '@/firebase/config';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useCommunity, 
  CommunityPost, 
  CommunityComment, 
  COMMUNITY_TOPICS, 
  COMMUNITY_TAGS,
  formatTimeAgo 
} from '@/contexts/CommunityContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types for live data
interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  participants: number;
  startTime?: Timestamp;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  streak: number;
  avatarUrl?: string;
}

interface CommunityStats {
  memberCount: number;
  postsToday: number;
  activeChallenges: number;
}

const CommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    error, 
    userRole,
    createPost, 
    deletePost, 
    toggleLike, 
    pinPost,
    getComments,
    addComment 
  } = useCommunity();
  
  const [activeTab, setActiveTab] = useState('feed');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTopic, setNewPostTopic] = useState('general');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState<Record<string, CommunityComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  
  // Live data state
  const [upcomingEvents, setUpcomingEvents] = useState<CommunityEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    memberCount: 0,
    postsToday: 0,
    activeChallenges: 0,
  });

  // Fetch community stats from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get member count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const memberCount = usersSnapshot.size;
        
        // Get posts count for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const postsRef = collection(db, 'community_posts');
        const postsQuery = query(
          postsRef,
          where('createdAt', '>=', Timestamp.fromDate(today))
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsToday = postsSnapshot.size;
        
        // Get active challenges count
        const challengesRef = collection(db, 'challenges');
        const challengesQuery = query(
          challengesRef,
          where('status', '==', 'active')
        );
        const challengesSnapshot = await getDocs(challengesQuery);
        const activeChallenges = challengesSnapshot.size;
        
        setCommunityStats({
          memberCount,
          postsToday,
          activeChallenges,
        });
      } catch (error) {
        console.error('Failed to fetch community stats:', error);
      }
    };
    
    fetchStats();
  }, []);

  // Fetch upcoming events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const now = new Date();
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(
          eventsRef,
          where('published', '==', true),
          where('startTime', '>=', Timestamp.fromDate(now)),
          orderBy('startTime', 'asc'),
          limit(5)
        );
        
        const snapshot = await getDocs(eventsQuery);
        const events: CommunityEvent[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const startTime = data.startTime?.toDate();
          return {
            id: doc.id,
            title: data.title || 'Untitled Event',
            date: startTime ? formatEventDate(startTime) : 'Date TBD',
            participants: data.participantCount || 0,
            startTime: data.startTime,
          };
        });
        
        setUpcomingEvents(events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setEventsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Fetch leaderboard from Firestore
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const usersRef = collection(db, 'users');
        const leaderboardQuery = query(
          usersRef,
          orderBy('stats.totalPoints', 'desc'),
          limit(10)
        );
        
        const snapshot = await getDocs(leaderboardQuery);
        const entries: LeaderboardEntry[] = snapshot.docs
          .filter(doc => doc.data().stats?.totalPoints > 0)
          .map((doc, index) => {
            const data = doc.data();
            return {
              rank: index + 1,
              name: data.displayName || data.name || 'Anonymous',
              points: data.stats?.totalPoints || 0,
              streak: data.stats?.currentStreak || 0,
              avatarUrl: data.photoURL,
            };
          });
        
        setLeaderboard(entries);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  // Helper to format event date
  const formatEventDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (diffDays === 0) {
      return `Today, ${time}`;
    } else if (diffDays === 1) {
      return `Tomorrow, ${time}`;
    } else if (diffDays < 7) {
      return `${dayName}, ${time}`;
    } else {
      return `Next ${dayName}, ${time}`;
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    setSubmitting(true);
    try {
      await createPost(newPostContent, newPostTopic, selectedTags);
      setNewPostContent('');
      setNewPostTopic('general');
      setSelectedTags([]);
      setShowNewPostDialog(false);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Load comments for a post
  const handleExpandComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    
    setExpandedComments(postId);
    setLoadingComments(postId);
    
    try {
      const comments = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(null);
    }
  };

  // Submit a comment
  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    
    try {
      await addComment(postId, commentText);
      setCommentText('');
      // Refresh comments
      const comments = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-gold-400" />
                Community
              </h1>
              <p className="text-sm text-white/60">Connect • Inspire • Grow</p>
            </div>
          </div>
          <Button 
            className="bg-gold-500 hover:bg-gold-600 text-jade-900 font-semibold"
            onClick={() => setShowNewPostDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Post
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-jade-600 to-jade-500 border-none text-white overflow-hidden relative">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Welcome to the Community!</h2>
                <p className="text-white/80">
                  Connect with fellow growth seekers and share your journey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-gold-400" />
              <div className="text-2xl font-bold text-white">{communityStats.memberCount.toLocaleString()}</div>
              <div className="text-xs text-white/60">Members</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <MessageCircle className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-2xl font-bold text-white">{communityStats.postsToday.toLocaleString()}</div>
              <div className="text-xs text-white/60">Posts Today</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <div className="text-2xl font-bold text-white">{communityStats.activeChallenges.toLocaleString()}</div>
              <div className="text-xs text-white/60">Active Challenges</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/10 border border-white/20 w-full justify-start">
            <TabsTrigger value="feed" className="data-[state=active]:bg-white/20 text-white">
              Feed
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-white/20 text-white">
              Events
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white/20 text-white">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-4 space-y-4">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="bg-rose-100 border-rose-200">
                <CardContent className="py-4 text-center text-rose-700">
                  {error}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="py-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-white/40" />
                  <p className="text-white/80">No posts yet. Be the first to share!</p>
                  <Button 
                    className="mt-4 bg-gold-500 hover:bg-gold-600 text-jade-900"
                    onClick={() => setShowNewPostDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Create Post
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Posts List */}
            {!loading && posts.map((post) => (
              <Card key={post.id} className="bg-white border-none shadow-lg">
                <CardContent className="p-5">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.authorAvatar} />
                      <AvatarFallback className="bg-jade-100 text-jade-700">
                        {post.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{post.authorName}</span>
                        {post.authorRole === 'coach' && (
                          <Badge className="bg-gold-100 text-gold-700 text-xs">Coach</Badge>
                        )}
                        {post.authorRole === 'admin' && (
                          <Badge className="bg-jade-100 text-jade-700 text-xs">Admin</Badge>
                        )}
                        {post.isPinned && (
                          <Pin className="h-4 w-4 text-gold-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                    
                    {/* Post Actions Menu */}
                    {(user?.uid === post.authorId || userRole === 'admin' || userRole === 'coach') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(userRole === 'admin' || userRole === 'coach') && (
                            <DropdownMenuItem onClick={() => pinPost(post.id, !post.isPinned)}>
                              <Pin className="h-4 w-4 mr-2" />
                              {post.isPinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                          )}
                          {user?.uid === post.authorId && (
                            <DropdownMenuItem 
                              onClick={() => deletePost(post.id)}
                              className="text-rose-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Topic Badge */}
                  {post.topic && (
                    <Badge className="mb-2 bg-jade-100 text-jade-700">
                      {COMMUNITY_TOPICS.find(t => t.value === post.topic)?.emoji}{' '}
                      {COMMUNITY_TOPICS.find(t => t.value === post.topic)?.label || post.topic}
                    </Badge>
                  )}
                  
                  {/* Content */}
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs text-jade-600 border-jade-200">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <button 
                      onClick={() => toggleLike(post.id)}
                      className={cn(
                        "flex items-center gap-1 transition-colors",
                        post.hasLiked 
                          ? "text-rose-500" 
                          : "text-gray-500 hover:text-rose-500"
                      )}
                    >
                      <Heart className={cn("h-4 w-4", post.hasLiked && "fill-current")} />
                      <span className="text-sm">{post.likesCount}</span>
                    </button>
                    <button 
                      onClick={() => handleExpandComments(post.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-jade-600 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.commentsCount}</span>
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href + '?post=' + post.id);
                        toast.success('Link copied!');
                      }}
                      className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments === post.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Loading Comments */}
                      {loadingComments === post.id && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-jade-600" />
                        </div>
                      )}

                      {/* Comments List */}
                      {postComments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.authorAvatar} />
                            <AvatarFallback className="bg-jade-100 text-jade-700 text-xs">
                              {comment.authorName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">
                                {comment.authorName}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Add Comment */}
                      {user && (
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button 
                            size="icon"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentText.trim()}
                            className="bg-jade-600 hover:bg-jade-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 space-y-4">
            {eventsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
              </div>
            )}
            
            {!eventsLoading && upcomingEvents.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-white/40" />
                  <p className="text-white/80">No upcoming events at the moment.</p>
                  <p className="text-white/60 text-sm mt-1">Check back soon for new community events!</p>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-4">
              {!eventsLoading && upcomingEvents.map((event) => (
                <Card key={event.id} className="bg-white border-none shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-lg bg-jade-100 flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-jade-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.participants} attending
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" className="border-jade-200 text-jade-600 hover:bg-jade-50">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <Card className="bg-white border-none shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-jade-800 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold-500" />
                  This Week's Top Achievers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-jade-600" />
                  </div>
                )}
                
                {!leaderboardLoading && leaderboard.length === 0 && (
                  <div className="py-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No leaderboard data yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Start completing goals to appear here!</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {!leaderboardLoading && leaderboard.map((entry) => (
                    <div 
                      key={entry.rank}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg",
                        entry.rank === 1 && "bg-gradient-to-r from-gold-100 to-gold-50",
                        entry.rank === 2 && "bg-gray-100",
                        entry.rank === 3 && "bg-amber-50"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                        entry.rank === 1 && "bg-gold-500 text-white",
                        entry.rank === 2 && "bg-gray-400 text-white",
                        entry.rank === 3 && "bg-amber-600 text-white",
                        entry.rank > 3 && "bg-jade-200 text-jade-700"
                      )}>
                        {entry.rank}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatarUrl} />
                        <AvatarFallback className="bg-jade-100 text-jade-700">
                          {entry.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{entry.name}</div>
                        <div className="text-xs text-gray-500">{entry.streak} day streak</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-jade-600">{entry.points.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Post Dialog */}
        <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-jade-800">
                <Plus className="h-5 w-5" />
                Create New Post
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Topic Select */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Topic</label>
                <Select value={newPostTopic} onValueChange={setNewPostTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMUNITY_TOPICS.map((topic) => (
                      <SelectItem key={topic.value} value={topic.value}>
                        {topic.emoji} {topic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
                <Textarea
                  placeholder="Share your thoughts, wins, or questions..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tags (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITY_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-jade-600 text-white hover:bg-jade-700"
                          : "text-jade-600 border-jade-300 hover:bg-jade-50"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewPostDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-jade-600 hover:bg-jade-700 text-white"
                  onClick={handleCreatePost}
                  disabled={submitting || !newPostContent.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CommunityPage;
