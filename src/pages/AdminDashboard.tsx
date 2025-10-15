import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Session } from '@supabase/supabase-js';
import { LogOut, Mail, Calendar, Award, MessageSquare, Plus, Edit2, Trash2, Eye, BarChart3, Share2 } from 'lucide-react';
import { BlogEditor } from '@/components/BlogEditor';
import BlogComposer from '@/components/BlogComposer';
import CaptionBuilder from '@/components/CaptionBuilder';
import CoverComposer from '@/components/CoverComposer';
import { SocialConfigManager } from '@/components/SocialConfigManager';
import SocialAnalytics from '@/components/SocialAnalytics';
import ContentSuggestions from '@/components/ContentSuggestions';
import { MetricsSummary } from '@/components/MetricsSummary';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RealtimeMetrics } from '@/components/RealtimeMetrics';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { LeadSourceChart } from '@/components/LeadSourceChart';
import { SessionDurationChart } from '@/components/SessionDurationChart';
import LeadsOverview from '@/components/admin/LeadsOverview';
import LeadsTable from '@/components/admin/LeadsTable';
import FunnelTab from '@/components/admin/FunnelTab';
import AdminSecrets from '@/components/admin/AdminSecrets';

interface Lead {
  id: string;
  name: string;
  email: string;
  language: string;
  wechat?: string;
  clarity_score?: number;
  created_at: string;
  source: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url?: string;
  category: string;
  published: boolean;
  created_at: string;
  published_at: string | null;
}

interface AnalyticsEvent {
  id: string;
  event_name: string;
  properties: any;
  created_at: string;
  page_url: string;
  session_id: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | undefined>();
  const [sharingPost, setSharingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'blog' | 'analytics' | 'social' | 'metrics' | 'secrets'>('blog');
  const [leadsSubTab, setLeadsSubTab] = useState<'overview' | 'funnel'>('overview');

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        } else {
          // Check admin status
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status');
        toast.error('Access denied: Not an admin user');
        navigate('/');
        return;
      }

      if (!data) {
        toast.error('Access denied: Not an admin user');
        navigate('/');
        return;
      }

      setIsAdmin(true);
      loadData();
    } catch (error) {
      console.error('Admin check failed');
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Failed to fetch leads');
      toast.error('Failed to load leads');
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, image_url, category, published, created_at, published_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error: any) {
      console.error('Failed to fetch blog posts');
      toast.error('Failed to load blog posts');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get last 30 days of analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyticsEvents(data || []);
    } catch (error: any) {
      console.error('Failed to fetch analytics');
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchLeads(), fetchBlogPosts(), fetchAnalytics()]);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Blog post deleted');
      fetchBlogPosts();
    } catch (error) {
      console.error('Failed to delete blog post');
      toast.error('Failed to delete blog post');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Sign out failed');
      toast.error('Failed to sign out');
    }
  };

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b">
            <button
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'leads'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('leads')}
            >
              Leads Management
            </button>
            <button
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'blog'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('blog')}
            >
              Blog Management
            </button>
            <button
              className={`pb-2 px-4 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            <button
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'social'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('social')}
            >
              Social Media
            </button>
            <button
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'metrics'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('metrics')}
            >
              Metrics
            </button>
            <button
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'secrets'
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('secrets')}
            >
              Secrets
            </button>
          </div>

          {activeTab === 'leads' ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold">Leads Management</h2>
                <p className="text-muted-foreground">
                  Track and manage your leads with real-time updates
                </p>
              </div>
              
              {/* Leads Sub-tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant={leadsSubTab === 'overview' ? 'default' : 'outline'}
                  onClick={() => setLeadsSubTab('overview')}
                >
                  Overview
                </Button>
                <Button
                  variant={leadsSubTab === 'funnel' ? 'default' : 'outline'}
                  onClick={() => setLeadsSubTab('funnel')}
                >
                  Funnel
                </Button>
              </div>

              {leadsSubTab === 'overview' ? (
                <>
                  <LeadsOverview />
                  <LeadsTable />
                </>
              ) : (
                <FunnelTab />
              )}
            </div>
          ) : activeTab === 'analytics' ? (
            <>
              {/* Analytics Dashboard */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Real-time Analytics</h2>
                  <p className="text-muted-foreground">
                    Live tracking of user behavior and engagement
                  </p>
                </div>

                <RealtimeMetrics />

                <div className="grid md:grid-cols-2 gap-6">
                  <LeadSourceChart leads={leads} />
                  <SessionDurationChart events={analyticsEvents} />
                </div>

                <AnalyticsCharts events={analyticsEvents} />

                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Events</CardTitle>
                    <CardDescription>Latest user activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analyticsEvents.slice(0, 10).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{event.event_name}</span>
                            {event.page_url && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {new URL(event.page_url).pathname}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : activeTab === 'social' ? (
            <SocialConfigManager />
          ) : activeTab === 'metrics' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold">Event Metrics</h2>
                <p className="text-muted-foreground">
                  Detailed event tracking and conversion analytics
                </p>
              </div>
              <MetricsSummary />
            </div>
          ) : activeTab === 'secrets' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold">Secrets Management</h2>
                <p className="text-muted-foreground">
                  Securely manage encrypted API keys and tokens
                </p>
              </div>
              <AdminSecrets />
            </div>
          ) : (
            <>
              {/* Blog Management */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Blog Posts</h2>
                  <p className="text-muted-foreground">
                    Manage your blog content and social media cross-posting
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingBlogId(undefined);
                    setShowBlogEditor(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {blogPosts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No blog posts yet. Create your first post to get started!
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                {post.category}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  post.published
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {post.published ? 'Published' : 'Draft'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(post.published_at || post.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {post.published && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setSharingPost(post)}
                                      title="Share to social media"
                                    >
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      asChild
                                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                    >
                                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingBlogId(post.id);
                                    setShowBlogEditor(true);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBlog(post.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Social Media Actions */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.functions.invoke('social-worker');
                      if (error) throw error;
                      toast.success('Social posts dispatched successfully');
                    } catch (error: any) {
                      toast.error(`Failed to dispatch: ${error.message}`);
                    }
                  }}
                >
                  🚀 Dispatch Queued Posts
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('social-metrics-collect');
                      if (error) throw error;
                      toast.success(`Collected metrics for ${data.count} posts`);
                    } catch (error: any) {
                      toast.error(`Failed to collect: ${error.message}`);
                    }
                  }}
                >
                  📊 Collect Metrics
                </Button>
              </div>

              {/* Social Analytics */}
              <div className="pt-6">
                <SocialAnalytics />
              </div>

              {/* AI Content Suggestions */}
              <div className="pt-6">
                <ContentSuggestions />
              </div>
            </>
          )}
        </motion.div>

        {/* Blog Editor Dialog */}
        <Dialog open={showBlogEditor} onOpenChange={setShowBlogEditor}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <BlogEditor
              blogId={editingBlogId}
              onClose={() => {
                setShowBlogEditor(false);
                setEditingBlogId(undefined);
              }}
              onSave={() => {
                setShowBlogEditor(false);
                setEditingBlogId(undefined);
                fetchBlogPosts();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Social Media Share Dialog */}
        <Dialog open={!!sharingPost} onOpenChange={(open) => !open && setSharingPost(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {sharingPost && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{sharingPost.title}</h2>
                  <p className="text-sm text-muted-foreground">Cross-post to social media platforms</p>
                </div>
                
                {/* Cover Image Generator */}
                <CoverComposer
                  post={{
                    title: sharingPost.title,
                    slug: sharingPost.slug,
                    excerpt: sharingPost.excerpt,
                  }}
                />
                
                {/* Advanced Caption Builder */}
                <CaptionBuilder
                  post={{
                    title: sharingPost.title,
                    slug: sharingPost.slug,
                    excerpt: sharingPost.excerpt,
                    tags: [],
                    cover: sharingPost.image_url,
                  }}
                />
                
                {/* Simple Quick Share Option */}
                <BlogComposer
                  post={{
                    title: sharingPost.title,
                    slug: sharingPost.slug,
                    excerpt: sharingPost.excerpt,
                    image_url: sharingPost.image_url,
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
