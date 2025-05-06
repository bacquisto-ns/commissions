import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface EarningsDataPoint {
  month: string;
  amount: number;
}

interface CommissionsChartProps {
  data: EarningsDataPoint[];
  timeframe: string;
  className?: string;
}

export default function CommissionsChart({
  data = [],
  timeframe,
  className,
}: CommissionsChartProps) {
  // Format chart data for display
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.month,
      value: item.amount,
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 shadow-md border border-border">
          <p className="font-medium">{label}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            fontSize={12}
            style={{ fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tickFormatter={(value) => `$${value / 1000}k`}
            fontSize={12}
            style={{ fill: 'var(--muted-foreground)' }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--primary))"
            opacity={0.8}
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
