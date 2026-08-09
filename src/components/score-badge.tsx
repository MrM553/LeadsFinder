import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <Badge variant="outline">—</Badge>;

  const tone =
    score >= 70
      ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
      : score >= 40
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
        : "bg-red-600/15 text-red-700 dark:text-red-400 border-red-600/30";

  return <Badge className={cn("border", tone)}>{score}/100</Badge>;
}
