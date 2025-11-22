import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  name?: string;
  percent_off: number;
  valid_from?: string;
  valid_to?: string;
  redeemed: number;
  max_redemptions?: number;
  applies_to_slug?: string;
  notes?: string;
  active: boolean;
}

export default function CouponsManager() {
  const [tab, setTab] = useState<'active' | 'scheduled' | 'expired' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, [tab, search]);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const couponsRef = collection(db, 'coupons');
      // Simple query for now, client side filtering for tab complexity might be easier given FS limitations
      // or we build specific indexes. 
      // Let's fetch all (usually not too many coupons) and filter.
      const q = query(couponsRef, orderBy('code')); 
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));

      if (search) {
        const s = search.toLowerCase();
        data = data.filter(c => c.code.toLowerCase().includes(s) || c.name?.toLowerCase().includes(s));
      }

      const now = new Date();
      if (tab === 'active') {
        data = data.filter(c => c.active && (!c.valid_to || new Date(c.valid_to) > now));
      } else if (tab === 'expired') {
        data = data.filter(c => c.valid_to && new Date(c.valid_to) < now);
      } else if (tab === 'scheduled') {
        data = data.filter(c => c.valid_from && new Date(c.valid_from) > now);
      }

      setCoupons(data);
    } catch (error) {
      console.error('[CouponsManager] Fetch failed:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(couponId: string) {
    try {
      await updateDoc(doc(db, 'coupons', couponId), {
        active: false,
        notes: 'Disabled via admin' // Should append ideally
      });
      
      toast.success('Coupon disabled');
      fetchCoupons();
    } catch (error) {
      console.error('[CouponsManager] Disable failed:', error);
      toast.error('Failed to disable coupon');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Coupons</h1>
          <div className="ml-auto flex gap-2">
            <Input
              placeholder="Search code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <CouponDialog onSaved={fetchCoupons} />
          </div>
        </header>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <Card className="p-6">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Window</TableHead>
                        <TableHead>Redemptions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                          <TableCell>{c.name || '-'}</TableCell>
                          <TableCell>{c.percent_off}%</TableCell>
                          <TableCell className="text-sm">
                            {c.valid_from ? new Date(c.valid_from).toLocaleDateString() : 'now'} →{' '}
                            {c.valid_to ? new Date(c.valid_to).toLocaleDateString() : 'open'}
                          </TableCell>
                          <TableCell>
                            {c.redeemed || 0}
                            {c.max_redemptions ? `/${c.max_redemptions}` : ''}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <CouponDialog initial={c} onSaved={fetchCoupons} trigger="Edit" />
                            {c.active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisable(c.id)}
                              >
                                Disable
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function CouponDialog({ initial, onSaved, trigger = 'New Coupon' }: { 
  initial?: Coupon; 
  onSaved: () => void; 
  trigger?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(
    initial || { percent_off: 20, applies_to_slug: 'all', active: true }
  );

  async function handleSave() {
    try {
      const data = {
        ...form,
        code: form.code.toUpperCase(),
        percent_off: Number(form.percent_off),
        max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      };

      if (initial) {
        await updateDoc(doc(db, 'coupons', initial.id), data);
      } else {
        await addDoc(collection(db, 'coupons'), {
            ...data,
            redeemed: 0,
            createdAt: new Date()
        });
      }
      
      toast.success(initial ? 'Coupon updated' : 'Coupon created');
      setOpen(false);
      onSaved();
    } catch (error) {
      console.error('[CouponDialog] Save failed:', error);
      toast.error('Failed to save coupon');
    }
  }

  function handleSimulate() {
      // Local simulation
      const price = 7900;
      const discount = Math.round(price * (form.percent_off / 100));
      toast.message(`Simulation: $79.00 -> $${((price - discount)/100).toFixed(2)}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={initial ? 'outline' : 'default'} size={initial ? 'sm' : 'default'}>
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Code</Label>
            <Input
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
            />
          </div>

          <div>
            <Label>Name (internal)</Label>
            <Input
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Summer 2025 Promotion"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>% Off</Label>
              <Input
                type="number"
                value={form.percent_off || ''}
                onChange={(e) => setForm({ ...form, percent_off: Number(e.target.value) })}
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label>Valid From</Label>
              <Input
                type="datetime-local"
                value={form.valid_from ? new Date(form.valid_from).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div>
              <Label>Expires</Label>
              <Input
                type="datetime-local"
                value={form.valid_to ? new Date(form.valid_to).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({ ...form, valid_to: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>

          <div>
            <Label>Max Redemptions</Label>
            <Input
              type="number"
              value={form.max_redemptions || ''}
              onChange={(e) => setForm({ ...form, max_redemptions: Number(e.target.value) || null })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>

          {/* Price Simulator */}
          <Card className="p-3 bg-muted/50">
            <div className="text-sm font-medium mb-2">Price Testing</div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={handleSimulate}>
                Simulate $79.00
              </Button>
            </div>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {initial ? 'Save Changes' : 'Create Coupon'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
