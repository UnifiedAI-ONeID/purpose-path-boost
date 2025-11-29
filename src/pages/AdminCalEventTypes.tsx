import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { db } from '@/firebase/config';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, RefreshCw } from 'lucide-react';

type CalEventType = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cal_event_type_id: string;
  length: number;
  price: number | null;
  currency: string | null;
  active: boolean;
  last_synced_at: Timestamp | null;
  created_at: Timestamp;
};

export default function AdminCalEventTypes() {
  const [rows, setRows] = useState<CalEventType[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const eventTypesCollection = collection(db, 'cal_event_types');

  useEffect(() => {
    reload();
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const snapshot = await getDocs(eventTypesCollection);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalEventType));
      data.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
      setRows(data || []);
    } catch (err) {
      console.error('Failed to load Cal.com event types:', err);
      toast.error('Failed to load event types');
      setRows([]);
    }
    setLoading(false);
  }

  async function save(row: CalEventType) {
    setBusy(true);
    try {
      const docRef = doc(db, 'cal_event_types', row.id);
      await updateDoc(docRef, {
        title: row.title,
        description: row.description,
        cal_event_type_id: row.cal_event_type_id,
        length: row.length,
        price: row.price,
        currency: row.currency,
        active: row.active
      });

      toast.success('Event type updated successfully');
      setEditingId(null);
      reload();
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save event type');
    }
    setBusy(false);
  }

  async function addNew() {
    setBusy(true);
    try {
      const newSlug = `event-${Date.now()}`;
      await addDoc(eventTypesCollection, {
        slug: newSlug,
        title: 'New Event Type',
        cal_event_type_id: `${newSlug}-temp`,
        length: 60,
        price: 0,
        currency: 'USD',
        active: false,
        created_at: serverTimestamp(),
        last_synced_at: null,
      });

      toast.success('Event type created');
      reload();
    } catch (err) {
      console.error('Failed to add:', err);
      toast.error('Failed to create event type');
    }
    setBusy(false);
  }

  async function syncFromCalCom() {
    setBusy(true);
    try {
      // Placeholder for Cal.com sync functionality
      toast.info('Cal.com sync not yet implemented');
    } catch (err) {
      console.error('Failed to sync:', err);
      toast.error('Failed to sync from Cal.com');
    }
    setBusy(false);
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Cal.com Event Types
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage Cal.com event type IDs and mappings for coaching offers
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncFromCalCom}
              disabled={busy}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync from Cal.com
            </Button>
            <Button
              size="sm"
              onClick={addNew}
              disabled={busy}
            >
              + Add New
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Slug (Internal)
                  </label>
                  <div className="mt-1 font-mono text-sm px-3 py-2 rounded border border-border bg-muted">
                    {row.slug}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cal.com Event Type ID
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded border border-border bg-background font-mono text-sm"
                    placeholder="e.g., abc123def or 30min-consultation"
                    value={row.cal_event_type_id}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].cal_event_type_id = e.target.value;
                      setRows(newRows);
                      setEditingId(row.id);
                    }}
                  />
                  {row.cal_event_type_id.endsWith('-temp') && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Placeholder ID - Replace with actual Cal.com event type ID
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Title
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded border border-border bg-background"
                    value={row.title}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].title = e.target.value;
                      setRows(newRows);
                      setEditingId(row.id);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Length (minutes)
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded border border-border bg-background"
                    type="number"
                    value={row.length}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].length = parseInt(e.target.value) || 0;
                      setRows(newRows);
                      setEditingId(row.id);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Price (cents)
                  </label>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded border border-border bg-background"
                    type="number"
                    value={row.price || 0}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].price = parseInt(e.target.value) || 0;
                      setRows(newRows);
                      setEditingId(row.id);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Currency
                  </label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded border border-border bg-background"
                    value={row.currency || 'USD'}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].currency = e.target.value;
                      setRows(newRows);
                      setEditingId(row.id);
                    }}
                  >
                    {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[i].active = e.target.checked;
                        setRows(newRows);
                        setEditingId(row.id);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{row.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full px-3 py-2 rounded border border-border bg-background resize-none"
                  rows={2}
                  value={row.description || ''}
                  onChange={(e) => {
                    const newRows = [...rows];
                    newRows[i].description = e.target.value;
                    setRows(newRows);
                    setEditingId(row.id);
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Last synced: {row.last_synced_at ? row.last_synced_at.toDate().toLocaleString() : 'Never'}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://cal.com/event-types', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Cal.com Dashboard
                  </Button>
                  {editingId === row.id && (
                    <Button
                      size="sm"
                      onClick={() => save(row)}
                      disabled={busy}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No Cal.com event types configured yet.</p>
          <Button className="mt-4" onClick={addNew}>
            Create First Event Type
          </Button>
        </div>
      )}
    </AdminShell>
  );
}
