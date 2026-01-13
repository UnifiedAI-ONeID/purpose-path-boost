import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Video, Play, ExternalLink } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type Lesson = {
  id: string;
  title: string;
  slug: string;
  description: string;
  moduleId: string;
  contentUrl: string;
  ytId: string;
  durationSec: number;
  order: number;
  tags: string[];
  published: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const emptyLesson: Omit<Lesson, 'id'> = {
  title: '',
  slug: '',
  description: '',
  moduleId: 'default',
  contentUrl: '',
  ytId: '',
  durationSec: 0,
  order: 0,
  tags: [],
  published: true,
};

export default function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<Omit<Lesson, 'id'>>(emptyLesson);
  const [tagsText, setTagsText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  useEffect(() => {
    trackEvent('admin_lessons_view');
    loadLessons();
  }, []);

  async function loadLessons() {
    try {
      setLoading(true);
      const q = query(collection(db, 'lessons'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Lesson[];
      setLessons(data);
    } catch (error) {
      console.error("Failed to load lessons:", error);
      toast.error("Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingLesson(null);
    setFormData({ ...emptyLesson, order: lessons.length });
    setTagsText('');
    setDialogOpen(true);
  }

  function openEditDialog(lesson: Lesson) {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description || '',
      moduleId: lesson.moduleId || 'default',
      contentUrl: lesson.contentUrl || '',
      ytId: lesson.ytId || '',
      durationSec: lesson.durationSec || 0,
      order: lesson.order,
      tags: lesson.tags || [],
      published: lesson.published,
    });
    setTagsText((lesson.tags || []).join(', '));
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      setSaving(true);
      const tags = tagsText.split(',').map(t => t.trim()).filter(t => t);
      const dataToSave = {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        moduleId: formData.moduleId || 'default',
        contentUrl: formData.contentUrl.trim(),
        ytId: formData.ytId.trim(),
        durationSec: Number(formData.durationSec) || 0,
        order: formData.order,
        tags,
        published: formData.published,
        updatedAt: serverTimestamp(),
      };

      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), dataToSave);
        trackEvent('admin_update', { resource: 'lesson', id: editingLesson.id });
        toast.success('Lesson updated successfully');
      } else {
        await addDoc(collection(db, 'lessons'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        trackEvent('admin_create', { resource: 'lesson' });
        toast.success('Lesson created successfully');
      }

      setDialogOpen(false);
      loadLessons();
    } catch (error) {
      console.error("Failed to save lesson:", error);
      toast.error('Failed to save lesson');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(lesson: Lesson) {
    try {
      await updateDoc(doc(db, 'lessons', lesson.id), { 
        published: !lesson.published, 
        updatedAt: serverTimestamp() 
      });
      toast.success(`Lesson ${!lesson.published ? 'published' : 'unpublished'}`);
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, published: !l.published } : l));
    } catch (error) {
      toast.error('Failed to update lesson');
    }
  }

  function confirmDelete(lesson: Lesson) {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!lessonToDelete) return;
    try {
      await deleteDoc(doc(db, 'lessons', lessonToDelete.id));
      trackEvent('admin_delete', { resource: 'lesson', id: lessonToDelete.id });
      toast.success('Lesson deleted');
      setDeleteDialogOpen(false);
      loadLessons();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Video className="h-6 w-6" />
              Lessons
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage learning content and video lessons
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No lessons found. Click "Add Lesson" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Published</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map(lesson => (
                    <tr key={lesson.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{lesson.order}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground">{lesson.slug}</div>
                      </td>
                      <td className="py-3 px-4">{formatDuration(lesson.durationSec || 0)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(lesson.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Switch checked={lesson.published} onCheckedChange={() => togglePublished(lesson)} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {lesson.ytId && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`https://youtube.com/watch?v=${lesson.ytId}`} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(lesson)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Coaching"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g., intro-coaching"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What this lesson covers..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ytId">YouTube Video ID</Label>
                  <Input
                    id="ytId"
                    value={formData.ytId}
                    onChange={(e) => setFormData({ ...formData, ytId: e.target.value })}
                    placeholder="e.g., dQw4w9WgXcQ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentUrl">Content URL (optional)</Label>
                  <Input
                    id="contentUrl"
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationSec">Duration (seconds)</Label>
                  <Input
                    id="durationSec"
                    type="number"
                    value={formData.durationSec}
                    onChange={(e) => setFormData({ ...formData, durationSec: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moduleId">Module</Label>
                  <Input
                    id="moduleId"
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                    placeholder="default"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="mindset, leadership, career"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLesson ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lesson</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete "{lessonToDelete?.title}"?</p>
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
