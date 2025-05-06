import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  footer?: string;
  className?: string;
}

export default function MetricsCard({
  title,
  value,
  icon,
  trend,
  footer,
  className,
}: MetricsCardProps) {
  const isTrendPositive = trend && trend.value >= 0;

  return (
    <Card className={cn("bg-white p-5", className)}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="p-2 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4">
          <span
            className={cn(
              "inline-flex items-center text-sm font-medium",
              isTrendPositive ? "text-secondary" : "text-destructive"
            )}
          >
            {isTrendPositive ? (
              <ChevronUp className="w-4 h-4 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground text-sm ml-2">{trend.label}</span>
        </div>
      )}
      {footer && !trend && (
        <div className="flex items-center mt-4">
          <span className="text-muted-foreground text-sm">{footer}</span>
        </div>
      )}
    </Card>
  );
}
