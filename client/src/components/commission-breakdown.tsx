import { CircleDollarSign, Heart, Home } from "lucide-react";

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
  // Property renamed in component usage but keeping the same interface for backward compatibility
}

export default function CommissionBreakdown({
  data,
  topPropertyType,
}: CommissionBreakdownProps) {
  // Helper to get color class based on product type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "fsa":
        return "bg-primary";
      case "hsa":
        return "bg-secondary";
      case "cobra":
        return "bg-accent";
      case "hra":
        return "bg-indigo-500";
      case "consolidated_billing":
        return "bg-emerald-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {data.map((item) => (
        <div key={item.type}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground capitalize">{item.type}</span>
            <span className="font-medium">{item.percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`${getTypeColor(item.type)} rounded-full h-2`}
              style={{ width: `${item.percentage}%` }}
            ></div>
          </div>
        </div>
      ))}
      
      {topPropertyType && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Top Product</h3>
          <div className="flex items-center">
            <span className="p-1 rounded-md bg-primary/10 mr-2">
              <Heart className="w-5 h-5 text-primary" />
            </span>
            <div>
              <p className="font-medium">{topPropertyType.name}</p>
              <p className="text-sm text-muted-foreground">
                {topPropertyType.percentage.toFixed(0)}% of total earnings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
