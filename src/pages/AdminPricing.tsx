import FxAuditGlobal from '@/components/admin/FxAuditGlobal';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminPricing() {
  return (
    <AdminShell>
      <h1 className="text-2xl font-semibold mb-6">Pricing & FX Management</h1>
      <FxAuditGlobal />
    </AdminShell>
  );
}
