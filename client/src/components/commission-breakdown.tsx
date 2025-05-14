import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { useMobile } from "@/hooks/use-mobile";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface BreakdownItem {
  type: string;
  percentage: number;
  amount: number;
}

interface CommissionBreakdownProps {
  data: BreakdownItem[];
  topPropertyType?: {
    name: string;
    percentage: number;
  };
  className?: string;
}

export default function CommissionBreakdown({
  data,
  topPropertyType,
  className = "",
}: CommissionBreakdownProps) {
  const isMobile = useMobile();
  
  // Sort data by percentage (high to low)
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
  
  // Generate colors for pie chart segments
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A259FF", "#4CAF50", "#FFC107", "#03A9F4"];
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">
            {formatPercent(payload[0].payload.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom legend formatter
  const renderLegendText = (value: string, entry: any) => {
    const percentage = entry.payload.percentage;
    return (
      <span className="text-sm">
        {value} ({formatPercent(percentage)})
      </span>
    );
  };
  
  return (
    <div className={`w-full ${className}`}>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <p className="text-lg font-medium text-muted-foreground">No commission data available</p>
          <p className="text-sm text-muted-foreground">Data will appear once commissions are processed</p>
        </div>
      ) : (
        <>
          {topPropertyType && (
            <div className="text-center mb-4">
              <h3 className="text-xl font-medium">{topPropertyType.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatPercent(topPropertyType.percentage)} of total commissions
              </p>
            </div>
          )}
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  dataKey="amount"
                  nameKey="type"
                  outerRadius={90}
                  innerRadius={60}
                  fill="#8884d8"
                  paddingAngle={1}
                  labelLine={false}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Legend 
                  layout={isMobile ? "horizontal" : "vertical"} 
                  align={isMobile ? "center" : "right"}
                  verticalAlign={isMobile ? "bottom" : "middle"}
                  formatter={renderLegendText}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {sortedData.slice(0, 5).map((item, index) => (
              <div key={index} className="rounded-lg bg-muted/20 p-3">
                <p className="text-sm font-medium truncate">{item.type}</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(item.percentage)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}