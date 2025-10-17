export default function KpiTiles({ kpi }: { kpi: any }) {
  const Item = ({ label, val }: { label: string; val: any }) => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{val}</div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Item label="MRR" val={`$${((kpi?.mrr || 0) / 100).toFixed(0)}`} />
      <Item label="Active subs" val={kpi?.active || 0} />
      <Item label="DAU" val={kpi?.dau || 0} />
      <Item label="MAU" val={kpi?.mau || 0} />
      <Item label="Lesson completes (30d)" val={kpi?.completes30 || 0} />
      <Item label="Bookings (30d)" val={kpi?.bookings30 || 0} />
    </div>
  );
}
