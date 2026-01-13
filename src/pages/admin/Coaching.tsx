
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { trackEvent } from '@/lib/trackEvent';

type Offer = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  description: string;
  duration: string;
  features: string[];
  isActive: boolean;
  calLink?: string;
  eventType?: string;
  sort: number;
  createdAt?: any;
  updatedAt?: any;
};

const emptyOffer: Omit<Offer, 'id'> = {
  title: '',
  slug: '',
  price: 0,
  currency: 'USD',
  description: '',
  duration: '60 minutes',
  features: [],
  isActive: true,
  calLink: '',
  eventType: '',
  sort: 0,
};

export default function Coaching() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<Omit<Offer, 'id'>>(emptyOffer);
  const [featuresText, setFeaturesText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  useEffect(() => {
    trackEvent('admin_coaching_view');
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      setLoading(true);
      const q = query(collection(db, 'coaching_offers'), orderBy('sort'));
      const querySnapshot = await getDocs(q);
      const offersData = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || data.title_en || data.name || '',
          slug: data.slug || '',
          price: data.price || (data.base_price_cents ? data.base_price_cents / 100 : 0),
          currency: data.currency || 'USD',
          description: data.description || data.summary || '',
          duration: data.duration || '60 minutes',
          features: data.features || [],
          isActive: data.isActive ?? data.active ?? true,
          calLink: data.calLink || data.cal_link || '',
          eventType: data.eventType || data.event_type || '',
          sort: data.sort ?? 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }) as Offer[];
      setOffers(offersData);
    } catch (error) {
      console.error("Failed to load coaching offers: ", error);
      toast.error("Failed to load coaching offers.");
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingOffer(null);
    setFormData({ ...emptyOffer, sort: offers.length });
    setFeaturesText('');
    setDialogOpen(true);
  }

  function openEditDialog(offer: Offer) {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      slug: offer.slug,
      price: offer.price,
      currency: offer.currency,
      description: offer.description,
      duration: offer.duration,
      features: offer.features,
      isActive: offer.isActive,
      calLink: offer.calLink || '',
      eventType: offer.eventType || '',
      sort: offer.sort,
    });
    setFeaturesText(offer.features.join('\n'));
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      setSaving(true);
      const features = featuresText.split('\n').map(f => f.trim()).filter(f => f);
      const dataToSave = {
        title: formData.title.trim(),
        slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        price: Number(formData.price) || 0,
        currency: formData.currency,
        description: formData.description.trim(),
        duration: formData.duration.trim(),
        features,
        isActive: formData.isActive,
        calLink: formData.calLink?.trim() || '',
        eventType: formData.eventType?.trim() || '',
        sort: formData.sort,
        updatedAt: serverTimestamp(),
      };

      if (editingOffer) {
        // Update existing
        const offerRef = doc(db, 'coaching_offers', editingOffer.id);
        await updateDoc(offerRef, dataToSave);
        trackEvent('admin_update', { resource: 'coaching_package', id: editingOffer.id });
        toast.success('Package updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'coaching_offers'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        trackEvent('admin_create', { resource: 'coaching_package' });
        toast.success('Package created successfully');
      }

      setDialogOpen(false);
      loadOffers();
    } catch (error) {
      console.error("Failed to save offer: ", error);
      toast.error('Failed to save package');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(offer: Offer) {
    try {
      const offerRef = doc(db, 'coaching_offers', offer.id);
      await updateDoc(offerRef, { isActive: !offer.isActive, updatedAt: serverTimestamp() });
      
      toast.success(`${offer.title} ${!offer.isActive ? 'activated' : 'deactivated'}`);
      
      setOffers(prevOffers => 
        prevOffers.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o)
      );
    } catch (error) {
      console.error("Failed to update offer: ", error);
      toast.error('Failed to update offer');
    }
  }

  function confirmDelete(offer: Offer) {
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!offerToDelete) return;
    try {
      await deleteDoc(doc(db, 'coaching_offers', offerToDelete.id));
      trackEvent('admin_delete', { resource: 'coaching_package', id: offerToDelete.id });
      toast.success('Package deleted successfully');
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
      loadOffers();
    } catch (error) {
      console.error("Failed to delete offer: ", error);
      toast.error('Failed to delete package');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Coaching Packages</h1>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
        
        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coaching packages found. Click "Add Package" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <Th>Title</Th>
                    <Th>Slug</Th>
                    <Th>Price</Th>
                    <Th>Duration</Th>
                    <Th>Active</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map(offer => (
                    <tr key={offer.id} className="border-b hover:bg-muted/50">
                      <Td className="font-medium">{offer.title}</Td>
                      <Td className="font-mono text-xs">{offer.slug}</Td>
                      <Td>${offer.price.toLocaleString()}</Td>
                      <Td>{offer.duration}</Td>
                      <Td>
                        <Switch
                          checked={offer.isActive}
                          onCheckedChange={() => toggleActive(offer)}
                        />
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(offer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(offer)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/coaching/${offer.slug}`, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      </Td>
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
              <DialogTitle>{editingOffer ? 'Edit Package' : 'Add New Package'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Career Coaching"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g., career-coaching"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 60 minutes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this coaching package..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="1:1 coaching session&#10;Action plan&#10;Follow-up support"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calLink">Cal.com Link</Label>
                  <Input
                    id="calLink"
                    value={formData.calLink}
                    onChange={(e) => setFormData({ ...formData, calLink: e.target.value })}
                    placeholder="e.g., zheng/coaching-call"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Input
                    id="eventType"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    placeholder="e.g., coaching-session"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort Order</Label>
                  <Input
                    id="sort"
                    type="number"
                    value={formData.sort}
                    onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingOffer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Package</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete "{offerToDelete?.title}"? This action cannot be undone.
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

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{children}</th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`py-3 px-4 ${className || ''}`}>{children}</td>
);
