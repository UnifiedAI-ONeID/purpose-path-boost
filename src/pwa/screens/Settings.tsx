/**
 * @file Settings PWA Screen - Account preferences and app settings
 * Uses Jade & Gold design system
 */

import { useState, useEffect } from 'react';
import { GuestPrompt } from '../core/GuestPrompt';
import { usePWA } from '../core/PWAProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, 
  LogOut, ChevronRight, Moon, Sun, Smartphone, Mail, Lock,
  HelpCircle, FileText, Trash2, ExternalLink, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db } from '@/firebase/config';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sessionReminders: boolean;
    weeklyDigest: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'zh-CN';
  };
}

const DEFAULT_PREFS: UserPreferences = {
  notifications: {
    email: true,
    push: true,
    sessionReminders: true,
    weeklyDigest: false
  },
  display: {
    theme: 'light',
    language: 'en'
  }
};

export default function Settings() {
  const { isGuest } = usePWA();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadPrefs = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.preferences) {
            setPrefs({ ...DEFAULT_PREFS, ...data.preferences });
          }
        }
      } catch (err) {
        console.error('[Settings] Load prefs error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrefs();
  }, [user]);

  // Save preferences
  const savePrefs = async (newPrefs: UserPreferences) => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferences: newPrefs
      });
      setPrefs(newPrefs);
      toast.success('Settings saved');
    } catch (err) {
      console.error('[Settings] Save error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Toggle notification preference
  const toggleNotification = (key: keyof UserPreferences['notifications']) => {
    const newPrefs = {
      ...prefs,
      notifications: {
        ...prefs.notifications,
        [key]: !prefs.notifications[key]
      }
    };
    savePrefs(newPrefs);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('[Settings] Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error('[Settings] Sign out error:', err);
      toast.error('Failed to sign out');
    }
  };

  if (isGuest) {
    return (
      <div className="p-4">
        <GuestPrompt feature="Settings" description="Manage your account preferences and settings." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-jade-900 via-jade-800 to-jade-700">
      {/* Header */}
      <div className="bg-jade-900/50 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gold-400" />
            Settings
          </h1>
          <p className="text-sm text-white/60 mt-1">Manage your preferences</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white border-none shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="bg-jade-100 text-jade-700 text-xl">
                  {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-800">
                  {user?.displayName || 'User'}
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifs">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch
                id="email-notifs"
                checked={prefs.notifications.email}
                onCheckedChange={() => toggleNotification('email')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifs">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive push notifications</p>
              </div>
              <Switch
                id="push-notifs"
                checked={prefs.notifications.push}
                onCheckedChange={() => toggleNotification('push')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="session-reminders">Session Reminders</Label>
                <p className="text-sm text-gray-500">Get reminded before sessions</p>
              </div>
              <Switch
                id="session-reminders"
                checked={prefs.notifications.sessionReminders}
                onCheckedChange={() => toggleNotification('sessionReminders')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-gray-500">Receive weekly progress summary</p>
              </div>
              <Switch
                id="weekly-digest"
                checked={prefs.notifications.weeklyDigest}
                onCheckedChange={() => toggleNotification('weeklyDigest')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold-500" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700">Change Password</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword}
                    className="bg-jade-600 hover:bg-jade-700"
                  >
                    {changingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-jade-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gold-500" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/help" 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Help Center</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </a>
            <a 
              href="/privacy" 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Privacy Policy</span>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </a>
            <a 
              href="/terms" 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Terms of Service</span>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </a>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-white/40">
          Purpose Path v1.0.0
        </p>
      </div>
    </div>
  );
}
