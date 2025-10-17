export default function ContentLeaderboard({ rows }: { rows: any[] }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="font-semibold text-lg mb-4">Top lessons (30d)</div>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.slug} className="border-b">
                  <td className="py-2">{r.title || r.slug}</td>
                  <td className="text-center">{r.starts}</td>
                  <td className="text-center">{r.completes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
