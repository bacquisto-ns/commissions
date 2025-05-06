import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, getPercentChangeString } from "@/lib/utils";
import MetricsCard from "@/components/metrics-card";
import CommissionsChart from "@/components/commissions-chart";
import CommissionsTable from "@/components/commissions-table";
import CommissionBreakdown from "@/components/commission-breakdown";
import { DollarSign, Clock, PercentIcon, FileText, ChevronUp } from "lucide-react";

export default function Dashboard() {
  // In a real app, we'd get the brokerId from authentication
  const brokerId = 1;
  const [chartTimeframe, setChartTimeframe] = useState("6months");

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: [`/api/dashboard/${brokerId}`],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Broker Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{dashboardData ? `, ${dashboardData.broker?.firstName}` : ''}. Here's your commission overview.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isDashboardLoading ? (
          <>
            <Card className="p-5">
              <Skeleton className="h-9 w-36 mb-4" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-36 mt-4" />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-9 w-36 mb-4" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-36 mt-4" />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-9 w-36 mb-4" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-36 mt-4" />
            </Card>
            <Card className="p-5">
              <Skeleton className="h-9 w-36 mb-4" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-5 w-36 mt-4" />
            </Card>
          </>
        ) : (
          <>
            <MetricsCard
              title="Total Earnings (YTD)"
              value={formatCurrency(Number(dashboardData?.totalYtd || 0))}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
              trend={{
                value: calculateYearlyChange(Number(dashboardData?.totalYtd || 0), Number(dashboardData?.totalLastYear || 0)),
                label: "from last year",
              }}
            />
            <MetricsCard
              title="Pending Commissions"
              value={formatCurrency(Number(dashboardData?.totalPending || 0))}
              icon={<Clock className="h-6 w-6 text-pending" />}
              footer={`${dashboardData?.pendingCount || 0} pending transactions`}
            />
            <MetricsCard
              title="Average Commission Rate"
              value={`${Number(dashboardData?.avgCommissionRate || 0).toFixed(1)}%`}
              icon={<PercentIcon className="h-6 w-6 text-accent" />}
              trend={{
                value: 0.5,
                label: "from last quarter",
              }}
            />
            <MetricsCard
              title="Total Transactions"
              value={dashboardData?.totalTransactions || 0}
              icon={<FileText className="h-6 w-6 text-secondary" />}
              trend={{
                value: 18,
                label: "from last month",
              }}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Commission Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-lg font-semibold text-foreground">Commission Earnings</h2>
            <Select defaultValue={chartTimeframe} onValueChange={setChartTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-5">
            {isDashboardLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <CommissionsChart 
                data={dashboardData?.monthlyEarnings || []} 
                timeframe={chartTimeframe} 
              />
            )}
          </div>
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-foreground">Commission Breakdown</h2>
          </div>
          <div className="p-5">
            {isDashboardLoading ? (
              <>
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-4 w-full mb-6" />
                <Skeleton className="h-24 w-full mt-6" />
              </>
            ) : (
              <CommissionBreakdown 
                data={dashboardData?.breakdownByType || []} 
                topPropertyType={dashboardData?.topPropertyType} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Commissions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-foreground">Recent Commissions</h2>
        </div>
        <div>
          <CommissionsTable 
            commissions={dashboardData?.recentCommissions || []} 
            isLoading={isDashboardLoading} 
            showPagination={false}
          />
        </div>
      </div>
    </div>
  );
}

function calculateYearlyChange(current: number, previous: number): number {
  if (previous === 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
