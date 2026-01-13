/**
 * @file Sessions PWA Screen - View and manage coaching sessions
 * Integrates with Firebase for booking data
 */

import { useState, useEffect } from 'react';
import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, Video, MapPin, User, CalendarPlus, 
  CheckCircle, XCircle, AlertCircle, ChevronRight, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  coachName: string;
  dateTime: string;
  duration: number;
  type: 'video' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
}

export default function Sessions() {
  const { isGuest } = usePWA();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch sessions from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('dateTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedSessions: Session[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Coaching Session',
            coachName: data.coachName || 'Coach',
            dateTime: data.dateTime?.toDate?.()?.toISOString() || data.dateTime,
            duration: data.duration || 60,
            type: data.type || 'video',
            status: data.status || 'upcoming',
            notes: data.notes,
            meetingLink: data.meetingLink
          };
        });
        setSessions(fetchedSessions);
        setLoading(false);
      },
      (error) => {
        console.error('[Sessions] Fetch error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Sessions" description="View and manage your coaching sessions." />
      </div>
    );
  }

  // Filter sessions by tab
  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'upcoming') return s.status === 'upcoming';
    if (activeTab === 'completed') return s.status === 'completed';
    return s.status === 'cancelled';
  });

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  // Get status badge
  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-emerald-100 text-emerald-700">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-jade-100 text-jade-700">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-rose-100 text-rose-700">Cancelled</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-gold-400" />
              My Sessions
            </h1>
            <p className="text-sm text-white/60 mt-1">Your coaching schedule</p>
          </div>
          <Button 
            className="bg-gold-500 hover:bg-gold-600 text-jade-900 font-semibold"
            onClick={() => window.location.href = '/coaching'}
          >
            <CalendarPlus className="h-4 w-4 mr-1" /> Book
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'upcoming').length}
              </div>
              <div className="text-xs text-white/60">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-white/60">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.reduce((acc, s) => s.status === 'completed' ? acc + s.duration : acc, 0)}
              </div>
              <div className="text-xs text-white/60">Total Mins</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/10 border border-white/20 w-full justify-start">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-white/20 text-white">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white/20 text-white">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-white/20 text-white">
              Cancelled
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredSessions.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-white/40" />
                  <p className="text-white/80 mb-4">
                    {activeTab === 'upcoming' 
                      ? 'No upcoming sessions' 
                      : activeTab === 'completed'
                        ? 'No completed sessions yet'
                        : 'No cancelled sessions'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <Button 
                      className="bg-gold-500 hover:bg-gold-600 text-jade-900"
                      onClick={() => window.location.href = '/coaching'}
                    >
                      <CalendarPlus className="h-4 w-4 mr-1" /> Book a Session
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Session List */}
            {!loading && filteredSessions.map((session) => (
              <Card key={session.id} className="bg-white border-none shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className="h-14 w-14 rounded-lg bg-jade-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-jade-600">
                        {new Date(session.dateTime).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-jade-800">
                        {new Date(session.dateTime).getDate()}
                      </span>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{session.title}</h3>
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(session.dateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          {session.type === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                          {session.type === 'video' ? 'Video Call' : 'In Person'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {session.coachName}
                        </span>
                      </div>

                      {/* Action Button */}
                      {session.status === 'upcoming' && session.meetingLink && (
                        <Button
                          size="sm"
                          className="mt-3 bg-jade-600 hover:bg-jade-700 text-white"
                          onClick={() => window.open(session.meetingLink, '_blank')}
                        >
                          <Video className="h-4 w-4 mr-1" /> Join Meeting
                        </Button>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                  </div>

                  {/* Notes */}
                  {session.notes && session.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {session.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
