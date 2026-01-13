import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Trophy, Users } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type Challenge = {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  participantCount: number;
  isActive: boolean;
  prize?: string;
  rules?: string;
  createdAt?: Timestamp;
};

const emptyChallenge: Omit<Challenge, 'id'> = {
  title: '',
  description: '',
  startDate: null,
  endDate: null,
  participantCount: 0,
  isActive: true,
  prize: '',
  rules: '',
};

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<Omit<Challenge, 'id'>>(emptyChallenge);
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);

  useEffect(() => {
    trackEvent('admin_challenges_view');
    loadChallenges();
  }, []);

  async function loadChallenges() {
    try {
      setLoading(true);
      const q = query(collection(db, 'challenges'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Challenge[];
      setChallenges(data);
    } catch (error) {
      console.error("Failed to load challenges:", error);
      toast.error("Failed to load challenges.");
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingChallenge(null);
    setFormData({ ...emptyChallenge });
    setStartDateStr('');
    setEndDateStr('');
    setDialogOpen(true);
  }

  function openEditDialog(challenge: Challenge) {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      participantCount: challenge.participantCount || 0,
      isActive: challenge.isActive,
      prize: challenge.prize || '',
      rules: challenge.rules || '',
    });
    setStartDateStr(challenge.startDate ? challenge.startDate.toDate().toISOString().split('T')[0] : '');
    setEndDateStr(challenge.endDate ? challenge.endDate.toDate().toISOString().split('T')[0] : '');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setSaving(true);
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: startDateStr ? Timestamp.fromDate(new Date(startDateStr)) : null,
        endDate: endDateStr ? Timestamp.fromDate(new Date(endDateStr)) : null,
        participantCount: formData.participantCount || 0,
        isActive: formData.isActive,
        prize: formData.prize?.trim() || '',
        rules: formData.rules?.trim() || '',
        updatedAt: serverTimestamp(),
      };

      if (editingChallenge) {
        await updateDoc(doc(db, 'challenges', editingChallenge.id), dataToSave);
        trackEvent('admin_update', { resource: 'challenge', id: editingChallenge.id });
        toast.success('Challenge updated');
      } else {
        await addDoc(collection(db, 'challenges'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        trackEvent('admin_create', { resource: 'challenge' });
        toast.success('Challenge created');
      }

      setDialogOpen(false);
      loadChallenges();
    } catch (error) {
      console.error("Failed to save challenge:", error);
      toast.error('Failed to save challenge');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(challenge: Challenge) {
    try {
      await updateDoc(doc(db, 'challenges', challenge.id), { 
        isActive: !challenge.isActive, 
        updatedAt: serverTimestamp() 
      });
      toast.success(`Challenge ${!challenge.isActive ? 'activated' : 'deactivated'}`);
      setChallenges(prev => prev.map(c => c.id === challenge.id ? { ...c, isActive: !c.isActive } : c));
    } catch (error) {
      toast.error('Failed to update challenge');
    }
  }

  function confirmDelete(challenge: Challenge) {
    setChallengeToDelete(challenge);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!challengeToDelete) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeToDelete.id));
      trackEvent('admin_delete', { resource: 'challenge', id: challengeToDelete.id });
      toast.success('Challenge deleted');
      setDeleteDialogOpen(false);
      loadChallenges();
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
  }

  function formatDate(ts: Timestamp | null): string {
    if (!ts) return '—';
    return ts.toDate().toLocaleDateString();
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Community Challenges
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage community challenges
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Challenge
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No challenges found. Click "Add Challenge" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.map(challenge => (
                <div 
                  key={challenge.id} 
                  className={`border rounded-lg p-4 ${!challenge.isActive ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {challenge.isActive ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Inactive</span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {challenge.participantCount || 0} participants
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
                      </div>
                      {challenge.prize && (
                        <div className="text-xs mt-1 text-primary">🎁 Prize: {challenge.prize}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={challenge.isActive} onCheckedChange={() => toggleActive(challenge)} />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(challenge)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(challenge)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChallenge ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 30-Day Mindset Challenge"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this challenge is about..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prize">Prize (optional)</Label>
                <Input
                  id="prize"
                  value={formData.prize}
                  onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  placeholder="e.g., Free coaching session"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules (optional)</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Challenge rules and guidelines..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingChallenge ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Challenge</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete "{challengeToDelete?.title}"?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
