import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { MetricDelta, MonthComparison } from "@/lib/insights";
import { formatCategoryLabel } from "@/lib/transactions";

interface MonthComparisonCardProps {
  comparison: MonthComparison;
  formatMoney: (value: number) => string;
}

const safeLabel = (value?: string | null) => {
  try {
    return formatCategoryLabel(value);
  } catch {
    return "Uncategorized";
  }
};

const Delta = ({ delta, higherIsBetter }: { delta: MetricDelta; higherIsBetter: boolean }) => {
  const flat = delta.change === 0;
  const isGood = flat ? false : higherIsBetter ? delta.change > 0 : delta.change < 0;
  const Icon = flat ? Minus : delta.change > 0 ? TrendingUp : TrendingDown;
  const tone = flat ? "text-muted-foreground" : isGood ? "text-emerald-500" : "text-rose-500";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {delta.changePct === null ? "new" : `${Math.abs(delta.changePct).toFixed(0)}%`}
    </span>
  );
};

const MonthComparisonCard = ({ comparison, formatMoney }: MonthComparisonCardProps) => {
  const metrics: Array<{ label: string; delta: MetricDelta; higherIsBetter: boolean }> = [
    { label: "Income", delta: comparison.income, higherIsBetter: true },
    { label: "Expenses", delta: comparison.expenses, higherIsBetter: false },
    { label: "Net", delta: comparison.net, higherIsBetter: true },
  ];
  const movers = comparison.topMovers.slice(0, 3);

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">This Month vs Last</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-muted/30 px-3 py-3">
            <div className="text-xs text-muted-foreground">{metric.label}</div>
            <div className="text-lg font-heading font-bold text-foreground">{formatMoney(metric.delta.current)}</div>
            <Delta delta={metric.delta} higherIsBetter={metric.higherIsBetter} />
          </div>
        ))}
      </div>

      {movers.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Biggest movers</div>
          {movers.map((mover) => (
            <div key={mover.category} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{safeLabel(mover.category)}</span>
              <span className={mover.change > 0 ? "text-rose-500" : "text-emerald-500"}>
                {mover.change > 0 ? "+" : "-"}
                {formatMoney(Math.abs(mover.change))}
                {mover.changePct !== null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({mover.change > 0 ? "+" : "-"}
                    {Math.abs(mover.changePct).toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No category spending changes vs last month yet.</p>
      )}
    </div>
  );
};

export default MonthComparisonCard;
