import { useState, useEffect } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import AdminShell from '@/components/admin/AdminShell';

export default function Coaching() {
  const [offers, setOffers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    const { data } = await supabase
      .from('coaching_offers')
      .select('*')
      .order('sort');
    
    setOffers(data || []);
  }

  async function toggleActive(offer: any) {
    try {
      await supabase
        .from('coaching_offers')
        .update({ active: !offer.active })
        .eq('id', offer.id);
      
      toast({ title: 'Updated', description: `${offer.title_en} ${!offer.active ? 'activated' : 'deactivated'}` });
      loadOffers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update offer', variant: 'destructive' });
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
