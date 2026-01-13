import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageCircle, Heart, Share2, ArrowLeft, Plus, 
  Sparkles, Trophy, Calendar, Clock, UserPlus, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Mock data for community content
const COMMUNITY_POSTS = [
  {
    id: '1',
    author: { name: 'Sarah Chen', avatar: '', role: 'Growth Champion' },
    content: 'Just completed my 30-day morning routine challenge! 🌅 The consistency has been transformational for my productivity.',
    likes: 24,
    comments: 8,
    time: '2 hours ago',
    tags: ['habits', 'morning-routine']
  },
  {
    id: '2',
    author: { name: 'Michael Wong', avatar: '', role: 'Coach' },
    content: 'Tip of the day: Start your goal-setting with "Why" before "What". Understanding your motivation is key to sustained progress.',
    likes: 42,
    comments: 15,
    time: '5 hours ago',
    tags: ['coaching', 'goals']
  },
  {
    id: '3',
    author: { name: 'Emily Liu', avatar: '', role: 'Member' },
    content: 'Looking for an accountability partner for my fitness journey. Anyone interested? 💪',
    likes: 18,
    comments: 12,
    time: '1 day ago',
    tags: ['fitness', 'accountability']
  }
];

const UPCOMING_EVENTS = [
  {
    id: '1',
    title: 'Weekly Goal Review',
    date: 'Saturday, 10:00 AM',
    participants: 23
  },
  {
    id: '2',
    title: 'Mindfulness Workshop',
    date: 'Next Monday, 7:00 PM',
    participants: 45
  }
];

const LEADERBOARD = [
  { rank: 1, name: 'Sarah Chen', points: 2450, streak: 30 },
  { rank: 2, name: 'Michael Wong', points: 2280, streak: 25 },
  { rank: 3, name: 'Emily Liu', points: 1950, streak: 18 }
];

const CommunityPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');

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
          <Button className="bg-gold-500 hover:bg-gold-600 text-jade-900 font-semibold">
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
              <div className="text-2xl font-bold text-white">1,234</div>
              <div className="text-xs text-white/60">Members</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <MessageCircle className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-2xl font-bold text-white">847</div>
              <div className="text-xs text-white/60">Posts Today</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-400" />
              <div className="text-2xl font-bold text-white">56</div>
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
            {COMMUNITY_POSTS.map((post) => (
              <Card key={post.id} className="bg-white border-none shadow-lg">
                <CardContent className="p-5">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-jade-100 text-jade-700">
                        {post.author.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{post.author.name}</span>
                        {post.author.role === 'Coach' && (
                          <Badge className="bg-gold-100 text-gold-700 text-xs">Coach</Badge>
                        )}
                        {post.author.role === 'Growth Champion' && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Champion</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{post.time}</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs text-jade-600 border-jade-200">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-rose-500 transition-colors">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-jade-600 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4 space-y-4">
            <div className="grid gap-4">
              {UPCOMING_EVENTS.map((event) => (
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
                <div className="space-y-3">
                  {LEADERBOARD.map((entry) => (
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
                        entry.rank === 3 && "bg-amber-600 text-white"
                      )}>
                        {entry.rank}
                      </div>
                      <Avatar className="h-10 w-10">
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
      </div>
    </div>
  );
};

export default CommunityPage;
