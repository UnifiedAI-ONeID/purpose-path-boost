import FxAuditGlobal from '@/components/admin/FxAuditGlobal';
import PricingAdmin from '@/components/admin/PricingAdmin';
import AdminShell from '@/components/admin/AdminShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPricing() {
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">Pricing & FX Management</h1>
      
      <Tabs defaultValue="management" className="w-full">
        <TabsList>
          <TabsTrigger value="management">Plans & Funnels</TabsTrigger>
          <TabsTrigger value="fx">FX Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <PricingAdmin />
        </TabsContent>

        <TabsContent value="fx">
          <FxAuditGlobal />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
