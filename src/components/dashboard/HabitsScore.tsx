import { Card, CardContent } from '@/components/ui/card';

type HabitsScoreProps = {
  score: number;
};

export default function HabitsScore({ score }: HabitsScoreProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - percentage / 100);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              className="transition-all duration-500"
            />
            <text
              x="48"
              y="52"
              textAnchor="middle"
              fontSize="18"
              fontWeight="600"
              fill="currentColor"
            >
              {percentage}
            </text>
          </svg>
          <div>
            <div className="text-sm font-semibold">Habits score</div>
            <div className="text-xs text-muted-foreground">
              Consistency + Focus + Completion
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
