import FxAuditGlobal from '@/components/admin/FxAuditGlobal';

export default function AdminPricing() {
  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pricing & FX Management</h1>
      <FxAuditGlobal />
    </main>
  );
}
