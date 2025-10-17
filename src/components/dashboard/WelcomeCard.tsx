export default function WelcomeCard({ name }: { name: string }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex-1">
      <div className="text-sm text-muted-foreground">Welcome back</div>
      <div className="text-2xl font-semibold mt-1">{name}</div>
      <div className="text-sm text-muted-foreground mt-1">Grow with Clarity 🌱</div>
    </div>
  );
}
