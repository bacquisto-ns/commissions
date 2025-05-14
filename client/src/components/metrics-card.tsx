import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

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
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <h2 className="text-3xl font-bold">{value}</h2>
          {trend && (
            <p className="mt-1 flex items-center text-sm">
              <span
                className={cn(
                  "mr-1 flex items-center",
                  trend.value >= 0
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {trend.value >= 0 ? (
                  <ArrowUpIcon className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="mr-1 h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </p>
          )}
          {footer && (
            <p className="mt-1 text-xs text-muted-foreground">{footer}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}