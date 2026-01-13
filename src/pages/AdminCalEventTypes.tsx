/**
 * @file Admin page for managing Cal.com event type mappings and configurations.
 */

import AdminShell from '../components/admin/AdminShell';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { db } from '@/firebase/config';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, Timestamp, CollectionReference } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, RefreshCw, PlusCircle, Save } from 'lucide-react';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface CalEventType {
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
}

// --- Main Component ---

export default function AdminCalEventTypes() {
  const [eventTypes, setEventTypes] = useState<CalEventType[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const eventTypesCollection = collection(db, 'cal_event_types') as CollectionReference<Omit<CalEventType, 'id'>>;

  const reloadEventTypes = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(eventTypesCollection);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalEventType));
      data.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
      setEventTypes(data);
    } catch (error) {
      logger.error('[AdminCalEvents] Failed to load event types.', { error });
      toast.error('Failed to load event types.');
    } finally {
      setLoading(false);
    }
  }, [eventTypesCollection]);

  useEffect(() => {
    reloadEventTypes();
  }, [reloadEventTypes]);

  const handleUpdate = async (id: string, data: Partial<CalEventType>) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'cal_event_types', id), data);
      toast.success('Event type updated successfully.');
      await reloadEventTypes();
    } catch (error) {
      logger.error(`[AdminCalEvents] Failed to update event type ${id}.`, { error });
      toast.error('Failed to save event type.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddNew = async () => {
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
        created_at: serverTimestamp() as Timestamp,
        last_synced_at: null,
        description: ''
      });
      toast.success('New event type created.');
      await reloadEventTypes();
    } catch (error) {
      logger.error('[AdminCalEvents] Failed to add new event type.', { error });
      toast.error('Failed to create event type.');
    } finally {
      setBusy(false);
    }
  };
  
  // Placeholder for future implementation
  const handleSync = async () => {
    setBusy(true);
    toast.info('Cal.com sync feature is not yet implemented.');
    setBusy(false);
  };

  return (
    <AdminShell>
      <Header onAddNew={handleAddNew} onSync={handleSync} busy={busy} />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {eventTypes.map(eventType => (
            <EventTypeCard key={eventType.id} eventType={eventType} onSave={handleUpdate} busy={busy} />
          ))}
          {eventTypes.length === 0 && <EmptyState onAddNew={handleAddNew} />}
        </div>
      )}
    </AdminShell>
  );
}

// --- Sub-components ---

const Header = ({ onAddNew, onSync, busy }: { onAddNew: () => void; onSync: () => void; busy: boolean }) => (
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Calendar className="h-6 w-6" /> Cal.com Event Types
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Manage mappings for coaching offers.
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onSync} disabled={busy}>
        <RefreshCw className="h-4 w-4 mr-2" /> Sync from Cal.com
      </Button>
      <Button size="sm" onClick={onAddNew} disabled={busy}>
        <PlusCircle className="h-4 w-4 mr-2" /> Add New
      </Button>
    </div>
  </div>
);

const EventTypeCard = ({ eventType, onSave, busy }: { eventType: CalEventType; onSave: (id: string, data: Partial<CalEventType>) => void; busy: boolean }) => {
  const [localData, setLocalData] = useState(eventType);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalData(eventType);
    setIsDirty(false);
  }, [eventType]);

  const handleChange = (field: keyof CalEventType, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };
  
  const handleSave = () => {
    const { id, created_at, ...dataToSave } = localData;
    onSave(id, dataToSave);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Form fields for CalEventType */}
      <FormField label="Title">
        <input 
          value={localData.title} 
          onChange={e => handleChange('title', e.target.value)}
          placeholder="Event type title"
          aria-label="Event type title"
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </FormField>
      {/* Add other fields similarly */}
      <div className="flex justify-end pt-4 border-t border-border">
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={busy}>
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        )}
      </div>
    </div>
  );
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        <div className="mt-1">{children}</div>
    </div>
);

const LoadingSpinner = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    <p className="mt-2 text-muted-foreground">Loading event types...</p>
  </div>
);

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
    <p>No Cal.com event types configured yet.</p>
    <Button className="mt-4" onClick={onAddNew}>
      <PlusCircle className="h-4 w-4 mr-2" /> Create First Event Type
    </Button>
  </div>
);
