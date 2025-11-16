import { Card } from '@/components/ui/card';

export default function ContentLeaderboard({ rows }: { rows: any[] }) {
  return (
    <Card className="p-6">
      <div className="font-semibold text-lg mb-4">Top Lessons (30d)</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No lesson activity yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Lesson</th>
                <th className="text-center py-2">Starts</th>
                <th className="text-center py-2">Completes</th>
                <th className="text-center py-2">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const rate = r.starts > 0 ? ((r.completes / r.starts) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={r.slug} className="border-b hover:bg-muted/50">
                    <td className="py-2">{r.title || r.slug}</td>
                    <td className="text-center">{r.starts}</td>
                    <td className="text-center">{r.completes}</td>
                    <td className="text-center">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
