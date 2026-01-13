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
import { Plus, Pencil, Trash2, Loader2, Star, Quote } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type Testimonial = {
  id: string;
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating: number;
  photoUrl?: string;
  isActive: boolean;
  order: number;
  createdAt?: Timestamp;
};

const emptyTestimonial: Omit<Testimonial, 'id'> = {
  name: '',
  role: '',
  company: '',
  content: '',
  rating: 5,
  photoUrl: '',
  isActive: true,
  order: 0,
};

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<Omit<Testimonial, 'id'>>(emptyTestimonial);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);

  useEffect(() => {
    trackEvent('admin_testimonials_view');
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    try {
      setLoading(true);
      const q = query(collection(db, 'testimonials'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Testimonial[];
      setTestimonials(data);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      toast.error("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingTestimonial(null);
    setFormData({ ...emptyTestimonial, order: testimonials.length });
    setDialogOpen(true);
  }

  function openEditDialog(testimonial: Testimonial) {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role || '',
      company: testimonial.company || '',
      content: testimonial.content,
      rating: testimonial.rating || 5,
      photoUrl: testimonial.photoUrl || '',
      isActive: testimonial.isActive,
      order: testimonial.order,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Name and content are required');
      return;
    }

    try {
      setSaving(true);
      const dataToSave = {
        name: formData.name.trim(),
        role: formData.role?.trim() || '',
        company: formData.company?.trim() || '',
        content: formData.content.trim(),
        rating: formData.rating,
        photoUrl: formData.photoUrl?.trim() || '',
        isActive: formData.isActive,
        order: formData.order,
        updatedAt: serverTimestamp(),
      };

      if (editingTestimonial) {
        await updateDoc(doc(db, 'testimonials', editingTestimonial.id), dataToSave);
        trackEvent('admin_update', { resource: 'testimonial', id: editingTestimonial.id });
        toast.success('Testimonial updated');
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        trackEvent('admin_create', { resource: 'testimonial' });
        toast.success('Testimonial created');
      }

      setDialogOpen(false);
      loadTestimonials();
    } catch (error) {
      console.error("Failed to save testimonial:", error);
      toast.error('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(testimonial: Testimonial) {
    try {
      await updateDoc(doc(db, 'testimonials', testimonial.id), { 
        isActive: !testimonial.isActive, 
        updatedAt: serverTimestamp() 
      });
      toast.success(`Testimonial ${!testimonial.isActive ? 'shown' : 'hidden'}`);
      setTestimonials(prev => prev.map(t => t.id === testimonial.id ? { ...t, isActive: !t.isActive } : t));
    } catch (error) {
      toast.error('Failed to update testimonial');
    }
  }

  function confirmDelete(testimonial: Testimonial) {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!testimonialToDelete) return;
    try {
      await deleteDoc(doc(db, 'testimonials', testimonialToDelete.id));
      trackEvent('admin_delete', { resource: 'testimonial', id: testimonialToDelete.id });
      toast.success('Testimonial deleted');
      setDeleteDialogOpen(false);
      loadTestimonials();
    } catch (error) {
      toast.error('Failed to delete testimonial');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Quote className="h-6 w-6" />
              Testimonials
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage customer testimonials and reviews
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No testimonials found. Click "Add Testimonial" to create one.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {testimonials.map(testimonial => (
                <div 
                  key={testimonial.id} 
                  className={`border rounded-lg p-4 ${!testimonial.isActive ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        {!testimonial.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Hidden</span>
                        )}
                      </div>
                      <p className="text-sm italic mb-3">"{testimonial.content}"</p>
                      <div className="flex items-center gap-2">
                        {testimonial.photoUrl && (
                          <img 
                            src={testimonial.photoUrl} 
                            alt={testimonial.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">{testimonial.name}</div>
                          {(testimonial.role || testimonial.company) && (
                            <div className="text-xs text-muted-foreground">
                              {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <Switch checked={testimonial.isActive} onCheckedChange={() => toggleActive(testimonial)} />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(testimonial)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(testimonial)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="content">Testimonial *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="What the customer said..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah L."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Marketing Director"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., Acme Inc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="p-1"
                    >
                      <Star 
                        className={`h-6 w-6 transition-colors ${
                          rating <= formData.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Visible</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTestimonial ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Testimonial</DialogTitle>
            </DialogHeader>
            <p className="py-4">Are you sure you want to delete this testimonial from {testimonialToDelete?.name}?</p>
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
