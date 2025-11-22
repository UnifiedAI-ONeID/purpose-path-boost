
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';

type Offer = {
  id: string;
  title_en: string;
  slug: string;
  base_price_cents: number;
  billing_type: 'one_time' | 'subscription';
  active: boolean;
  sort: number;
};

export default function Coaching() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      const q = query(collection(db, 'coaching_offers'), orderBy('sort'));
      const querySnapshot = await getDocs(q);
      const offersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Offer[];
      setOffers(offersData);
    } catch (error) {
      console.error("Failed to load coaching offers: ", error);
      toast.error("Failed to load coaching offers.");
    }
  }

  async function toggleActive(offer: Offer) {
    try {
      const offerRef = doc(db, 'coaching_offers', offer.id);
      await updateDoc(offerRef, { active: !offer.active });
      
      toast.success(`${offer.title_en} ${!offer.active ? 'activated' : 'deactivated'}`);
      
      // Optimistic update
      setOffers(prevOffers => 
        prevOffers.map(o => o.id === offer.id ? { ...o, active: !o.active } : o)
      );

    } catch (error) {
      console.error("Failed to update offer: ", error);
      toast.error('Failed to update offer');
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Coaching Offers</h1>
        
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <Th>Title</Th>
                  <Th>Slug</Th>
                  <Th>Price</Th>
                  <Th>Type</Th>
                  <Th>Active</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => (
                  <tr key={offer.id} className="border-b">
                    <Td>{offer.title_en}</Td>
                    <Td className="font-mono text-xs">{offer.slug}</Td>
                    <Td>${(offer.base_price_cents / 100).toFixed(0)}</Td>
                    <Td className="capitalize">{offer.billing_type}</Td>
                    <Td>
                      <Switch
                        checked={offer.active}
                        onCheckedChange={() => toggleActive(offer)}
                      />
                    </Td>
                    <Td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/coaching/${offer.slug}`, '_blank')}
                      >
                        View
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
