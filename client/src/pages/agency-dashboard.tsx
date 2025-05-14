import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { 
  BarChart3, 
  Building2, 
  DollarSign, 
  Users, 
  Timer, 
  ArrowRightLeft, 
  PieChart,
  ChevronLeft 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommissionsChart from "@/components/commissions-chart";
import CommissionBreakdown from "@/components/commission-breakdown";
import MetricsCard from "@/components/metrics-card";
import { formatCurrency, formatPercent, getPercentChangeString } from "@/lib/utils";
import { Link } from "wouter";

interface EarningsDataPoint {
  month: string;
  amount: number;
}

interface AgencyDashboardData {
  totalYtd: string;
  totalLastYear: string;
  totalPending: string;
  pendingCount: number;
  avgCommissionRate: string;
  totalTransactions: number;
  brokerCount: number;
  monthlyEarnings: EarningsDataPoint[];
  breakdownByType: {
    type: string;
    percentage: number;
    amount: number;
  }[];
  topPropertyType: {
    name: string;
    percentage: number;
  };
  brokerPerformance?: Array<{
    brokerId: number;
    firstName: string;
    lastName: string;
    totalCommissions: number;
    pendingCommissions: number;
    percentageOfTotal: number;
  }>;
}

interface AgencyDetail {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  active: boolean;
  brokerCount: number;
}

interface Broker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  active: boolean;
  username: string;
  totalCommissions: number;
  pendingCommissions: number;
}

export default function AgencyDashboard() {
  const [, params] = useRoute<{ id: string }>("/agency-dashboard/:id");
  const [location, setLocation] = useLocation();
  
  const agencyId = params?.id ? parseInt(params.id) : null;
  const [timeframe, setTimeframe] = useState("month");
  
  // If no agency ID is provided, redirect to agencies page
  useEffect(() => {
    if (!agencyId) {
      setLocation("/agencies");
    }
  }, [agencyId, setLocation]);
  
  // Fetch agency details
  const { data: agencyDetail, isLoading: isLoadingAgency } = useQuery<AgencyDetail>({
    queryKey: [`/api/agencies/${agencyId}`],
    enabled: !!agencyId,
  });
  
  // Fetch agency dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery<AgencyDashboardData>({
    queryKey: [`/api/agencies/${agencyId}/dashboard`],
    enabled: !!agencyId,
  });
  
  // Fetch agency brokers
  const { data: brokers, isLoading: isLoadingBrokers } = useQuery<Broker[]>({
    queryKey: [`/api/agencies/${agencyId}/brokers`],
    enabled: !!agencyId,
  });
  
  const isLoading = isLoadingAgency || isLoadingDashboard || isLoadingBrokers;
  
  if (!agencyId) {
    return null; // Will redirect in useEffect
  }
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-80 bg-muted rounded"></div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // This is a fallback if the API hasn't returned data yet
  const dashboardWithDefaults: AgencyDashboardData = {
    totalYtd: dashboardData?.totalYtd || "0",
    totalLastYear: dashboardData?.totalLastYear || "0",
    totalPending: dashboardData?.totalPending || "0",
    pendingCount: dashboardData?.pendingCount || 0,
    avgCommissionRate: dashboardData?.avgCommissionRate || "0",
    totalTransactions: dashboardData?.totalTransactions || 0,
    brokerCount: dashboardData?.brokerCount || (brokers?.length || 0),
    monthlyEarnings: dashboardData?.monthlyEarnings || [],
    breakdownByType: dashboardData?.breakdownByType || [],
    topPropertyType: dashboardData?.topPropertyType || {
      name: "None",
      percentage: 0
    },
    brokerPerformance: dashboardData?.brokerPerformance || []
  };
  
  const agencyBrokers = brokers || [];
  
  const yearlyChange = 
    parseFloat(dashboardWithDefaults.totalYtd) - parseFloat(dashboardWithDefaults.totalLastYear);
  const yearlyChangePercent = 
    parseFloat(dashboardWithDefaults.totalLastYear) > 0 
      ? (yearlyChange / parseFloat(dashboardWithDefaults.totalLastYear)) * 100
      : 0;
  
  return (
    <>
      <Helmet>
        <title>{agencyDetail?.name || "Agency"} Dashboard | BrokerCommissions</title>
        <meta name="description" content="Agency performance dashboard showing commission metrics and broker performance" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/agencies">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> 
                  Back to Agencies
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {agencyDetail?.name || "Agency"} Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {agencyDetail?.brokerCount || 0} Broker{(agencyDetail?.brokerCount || 0) !== 1 ? 's' : ''} • {agencyDetail?.city}, {agencyDetail?.state}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select defaultValue={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="Total Commissions (YTD)"
            value={formatCurrency(parseFloat(dashboardWithDefaults.totalYtd))}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{
              value: yearlyChangePercent,
              label: `${yearlyChangePercent >= 0 ? '+' : ''}${formatCurrency(yearlyChange)} vs last year`
            }}
          />
          
          <MetricsCard
            title="Pending Commissions"
            value={formatCurrency(parseFloat(dashboardWithDefaults.totalPending))}
            icon={<Timer className="h-5 w-5" />}
            footer={`${dashboardWithDefaults.pendingCount} pending transactions`}
          />
          
          <MetricsCard
            title="Average Commission"
            value={`$${dashboardWithDefaults.avgCommissionRate}/participant`}
            icon={<ArrowRightLeft className="h-5 w-5" />}
            footer={`${dashboardWithDefaults.totalTransactions} total transactions`}
          />
          
          <MetricsCard
            title="Active Brokers"
            value={agencyBrokers.filter(b => b.active).length.toString()}
            icon={<Users className="h-5 w-5" />}
            footer={`${agencyBrokers.length} total brokers`}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Commission Earnings
              </CardTitle>
              <CardDescription>
                Total commissions earned over time across all brokers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionsChart data={dashboardWithDefaults.monthlyEarnings} timeframe={timeframe} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Commission Breakdown
              </CardTitle>
              <CardDescription>
                Commission distribution by product type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionBreakdown 
                data={dashboardWithDefaults.breakdownByType}
                topPropertyType={dashboardWithDefaults.topPropertyType}
              />
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Broker Performance
            </CardTitle>
            <CardDescription>
              Commission earnings by broker within this agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium">Broker</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-right font-medium">YTD Commissions</th>
                    <th className="py-3 px-4 text-right font-medium">Pending</th>
                    <th className="py-3 px-4 text-right font-medium">% of Agency Total</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyBrokers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No brokers associated with this agency yet
                      </td>
                    </tr>
                  ) : (
                    agencyBrokers.map((broker) => {
                      const brokerYtd = broker.totalCommissions || 0;
                      const agencyTotal = parseFloat(mockDashboardData.totalYtd);
                      const percentage = agencyTotal > 0 ? (brokerYtd / agencyTotal) * 100 : 0;
                      
                      return (
                        <tr key={broker.id} className="border-b">
                          <td className="py-3 px-4">
                            <div className="font-medium">{broker.firstName} {broker.lastName}</div>
                            <div className="text-sm text-muted-foreground">{broker.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${broker.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {broker.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatCurrency(brokerYtd)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(broker.pendingCommissions || 0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatPercent(percentage)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}