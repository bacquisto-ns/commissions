import { useState } from "react";
import { Helmet } from "react-helmet";
import { BarChart3, FileBarChart, FileText, Download, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

type StatisticsData = {
  earnings: Array<{
    period: string;
    amount: number;
  }>;
  typeBreakdown: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
};

type Broker = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
};

export default function Reports() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [brokerId, setBrokerId] = useState<string>("1");
  
  const { data: statistics, isLoading } = useQuery<StatisticsData>({
    queryKey: [`/api/statistics/${brokerId}`, { period }],
  });
  
  const { data: brokers } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });

  return (
    <>
      <Helmet>
        <title>Reports | BrokerCommissions</title>
        <meta name="description" content="View and export commission reports and analytics" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and view commission reports and analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <span>Report Filters</span>
              </CardTitle>
              <CardDescription>
                Select the data range and filters for your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Broker</label>
                <Select value={brokerId} onValueChange={setBrokerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers && brokers.length > 0 ? (
                      brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id.toString()}>
                          {broker.firstName} {broker.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="1">Default Broker</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as "month" | "year")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="month">Monthly</TabsTrigger>
                    <TabsTrigger value="year">Yearly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>Commission Breakdown</span>
              </CardTitle>
              <CardDescription>
                Breakdown of commissions by benefit program type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || !statistics ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statistics.typeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Commission Amount" fill="#0066CC" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              <span>Commission Trends</span>
            </CardTitle>
            <CardDescription>
              View commission trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !statistics ? (
              <div className="h-64 w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statistics.earnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Commission Amount" fill="#00A67E" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Summary</span>
            </CardTitle>
            <CardDescription>
              Commission summary for selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !statistics ? (
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-md"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {formatCurrency(statistics.earnings.reduce((sum, item) => sum + item.amount, 0))}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Highest Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {statistics.earnings.length > 0 ? (
                      <>
                        <p className="text-2xl font-bold">
                          {formatCurrency(Math.max(...statistics.earnings.map(e => e.amount)))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {statistics.earnings.reduce((prev, current) => 
                            prev.amount > current.amount ? prev : current
                          ).period}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold">$0.00</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Top Program Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {statistics.typeBreakdown.length > 0 ? (
                      <>
                        <p className="text-2xl font-bold">
                          {statistics.typeBreakdown.reduce((prev, current) => 
                            prev.amount > current.amount ? prev : current
                          ).type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(statistics.typeBreakdown.reduce((prev, current) => 
                            prev.amount > current.amount ? prev : current
                          ).amount)}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold">None</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Monthly
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        statistics.earnings.reduce((sum, item) => sum + item.amount, 0) / 
                        (statistics.earnings.length || 1)
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}