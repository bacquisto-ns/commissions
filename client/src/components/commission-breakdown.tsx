import { Home } from "lucide-react";

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
}

export default function CommissionBreakdown({
  data,
  topPropertyType,
}: CommissionBreakdownProps) {
  // Helper to get color class based on property type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "residential":
        return "bg-primary";
      case "commercial":
        return "bg-secondary";
      case "land":
        return "bg-accent";
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
          <h3 className="text-sm font-medium text-foreground mb-2">Top Property Type</h3>
          <div className="flex items-center">
            <span className="p-1 rounded-md bg-primary/10 mr-2">
              <Home className="w-5 h-5 text-primary" />
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
