import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * A compact card displaying a single statistic with a label and optional subtitle.
 *
 * @param props.label - Descriptive heading shown above the value.
 * @param props.value - The primary metric to display.
 * @param props.subtitle - Optional secondary text shown below the value.
 */
export function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
