import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMobile } from "@/hooks/use-mobile";
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
  data,
  timeframe,
  className = "",
}: CommissionsChartProps) {
  const isMobile = useMobile();
  const [chartData, setChartData] = useState<EarningsDataPoint[]>([]);
  
  // Format data for the chart
  useEffect(() => {
    setChartData(data);
  }, [data]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`w-full h-[300px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: isMobile ? 0 : 10,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066CC" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            tick={{ fontSize: 12 }}
            width={isMobile ? 30 : 60}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            allowDecimals={false}
            style={{ paddingLeft: "10px" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#0066CC"
            fillOpacity={1}
            fill="url(#colorAmount)"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}