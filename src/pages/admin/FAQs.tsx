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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GripVertical, HelpCircle } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  published: boolean;
  order: number;
  createdAt?: any;
  updatedAt?: any;
};

const CATEGORIES = ['Getting Started', 'Coaching', 'App Features', 'Account', 'Payments'];

const emptyFAQ: Omit<FAQ, 'id'> = {
  question: '',
  answer: '',
  category: 'Getting Started',
  published: true,
  order: 0,
};

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<Omit<FAQ, 'id'>>(emptyFAQ);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  useEffect(() => {
    trackEvent('admin_faqs_view');
    loadFAQs();
  }, []);

  async function loadFAQs() {
    try {
      setLoading(true);
      const q = query(collection(db, 'faqs'), orderBy('order'));
      const querySnapshot = await getDocs(q);
      const faqsData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          question: data.question || '',
          answer: data.answer || '',
          category: data.category || 'Getting Started',
          published: data.published ?? true,
          order: data.order ?? 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }) as FAQ[];
      setFaqs(faqsData);
    } catch (error) {
      console.error("Failed to load FAQs: ", error);
      toast.error("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingFAQ(null);
    setFormData({ ...emptyFAQ, order: faqs.length });
    setDialogOpen(true);
  }

  function openEditDialog(faq: FAQ) {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      published: faq.published,
      order: faq.order,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      setSaving(true);
      const dataToSave = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category,
        published: formData.published,
        order: formData.order,
        updatedAt: serverTimestamp(),
      };

      if (editingFAQ) {
        // Update existing
        const faqRef = doc(db, 'faqs', editingFAQ.id);
        await updateDoc(faqRef, dataToSave);
        trackEvent('admin_update', { resource: 'faq', id: editingFAQ.id });
        toast.success('FAQ updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'faqs'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        trackEvent('admin_create', { resource: 'faq' });
        toast.success('FAQ created successfully');
      }

      setDialogOpen(false);
      loadFAQs();
    } catch (error) {
      console.error("Failed to save FAQ: ", error);
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(faq: FAQ) {
    try {
      const faqRef = doc(db, 'faqs', faq.id);
      await updateDoc(faqRef, { published: !faq.published, updatedAt: serverTimestamp() });
      
      toast.success(`FAQ ${!faq.published ? 'published' : 'unpublished'}`);
      
      setFaqs(prevFaqs => 
        prevFaqs.map(f => f.id === faq.id ? { ...f, published: !f.published } : f)
      );
    } catch (error) {
      console.error("Failed to update FAQ: ", error);
      toast.error('Failed to update FAQ');
    }
  }

  function confirmDelete(faq: FAQ) {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!faqToDelete) return;
    try {
      await deleteDoc(doc(db, 'faqs', faqToDelete.id));
      trackEvent('admin_delete', { resource: 'faq', id: faqToDelete.id });
      toast.success('FAQ deleted successfully');
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
      loadFAQs();
    } catch (error) {
      console.error("Failed to delete FAQ: ", error);
      toast.error('Failed to delete FAQ');
    }
  }

  const filteredFaqs = filterCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

  const categoryStats = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = faqs.filter(f => f.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              FAQ Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage frequently asked questions displayed on the Help page
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATEGORIES.map(cat => (
            <Card 
              key={cat} 
              className={`p-4 cursor-pointer transition-colors ${
                filterCategory === cat ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setFilterCategory(filterCategory === cat ? 'All' : cat)}
            >
              <div className="text-sm font-medium">{cat}</div>
              <div className="text-2xl font-bold">{categoryStats[cat] || 0}</div>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Label>Filter by category:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {filteredFaqs.length} of {faqs.length} FAQs
          </span>
        </div>
        
        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {faqs.length === 0 
                ? 'No FAQs found. Click "Add FAQ" to create one.'
                : 'No FAQs in this category.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map(faq => (
                <div 
                  key={faq.id} 
                  className={`border rounded-lg p-4 ${!faq.published ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {faq.category}
                        </span>
                        {!faq.published && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Draft
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Order: {faq.order}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {faq.answer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={faq.published}
                        onCheckedChange={() => togglePublished(faq)}
                        title={faq.published ? 'Unpublish' : 'Publish'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(faq)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(faq)}
                        className="text-destructive hover:text-destructive"
                      >
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
              <DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g., How do I book a coaching session?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a clear and helpful answer..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Published (visible on Help page)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingFAQ ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete FAQ</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground italic">
              "{faqToDelete?.question}"
            </p>
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
