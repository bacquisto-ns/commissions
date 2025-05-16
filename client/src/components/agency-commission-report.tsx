import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { format } from "date-fns";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function AgencyCommissionReport() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("current_year");
  
  // Fetch list of agencies
  const { data: agencies = [], isLoading: isLoadingAgencies } = useQuery({
    queryKey: ["/api/agencies"],
  });
  
  // Fetch agency report data
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: [
      `/api/agencies/${selectedAgencyId}/report`, 
      { dateRange }
    ],
    enabled: !!selectedAgencyId, // Only run query if agency is selected
  });
  
  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };
  
  const handleExportCSV = () => {
    if (!reportData) return;
    
    // Implement CSV export logic here
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Broker,Commissions YTD,Pending Commissions,Percentage of Total\n"
      + reportData.brokerPerformance.map(broker => 
          `${broker.firstName} ${broker.lastName},${broker.totalCommissions},${broker.pendingCommissions},${broker.percentageOfTotal}%`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agency_${selectedAgencyId}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoadingAgencies) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agency Commission Report</CardTitle>
        <CardDescription>
          View commission performance by agency and broker
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/3">
            <Select 
              value={selectedAgencyId} 
              onValueChange={setSelectedAgencyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Agency" />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((agency: any) => (
                  <SelectItem key={agency.id} value={agency.id.toString()}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-1/3">
            <Select 
              value={dateRange} 
              onValueChange={setDateRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_year">Current Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-1/3 flex items-center justify-end">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportCSV}
              disabled={!reportData}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {!selectedAgencyId ? (
          <div className="py-12 text-center text-muted-foreground">
            Select an agency to view commission report
          </div>
        ) : isLoadingReport ? (
          <div className="space-y-8">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : !reportData ? (
          <div className="py-12 text-center text-muted-foreground">
            No data available for the selected agency and date range
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-4">
                  <CardDescription>YTD Commissions</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(Number(reportData.totalYtd))}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardDescription>Pending Commissions</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(Number(reportData.totalPending))}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardDescription>Brokers</CardDescription>
                  <CardTitle className="text-2xl">{reportData.brokerCount}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardDescription>Avg Commission Rate</CardDescription>
                  <CardTitle className="text-2xl">${reportData.avgCommissionRate}/participant</CardTitle>
                </CardHeader>
              </Card>
            </div>
            
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Commission Earnings</CardTitle>
                <CardDescription>
                  Total commissions earned per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.monthlyEarnings}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Commission']} />
                      <Bar dataKey="amount" fill="#0066CC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Product Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Commission by Product Type</CardTitle>
                <CardDescription>
                  Breakdown of commissions by product category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row">
                  <div className="w-full lg:w-1/2 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.breakdownByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="amount"
                          nameKey="type"
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                        >
                          {reportData.breakdownByType.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full lg:w-1/2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Percentage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.breakdownByType.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium capitalize">{item.type}</TableCell>
                            <TableCell>{formatCurrency(item.amount)}</TableCell>
                            <TableCell>{item.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Broker Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Broker Performance</CardTitle>
                <CardDescription>
                  Commission distribution among brokers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker</TableHead>
                      <TableHead>Total Commissions</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>% of Agency Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.brokerPerformance?.map((broker: any) => (
                      <TableRow key={broker.brokerId}>
                        <TableCell className="font-medium">
                          {broker.firstName} {broker.lastName}
                        </TableCell>
                        <TableCell>{formatCurrency(broker.totalCommissions)}</TableCell>
                        <TableCell>{formatCurrency(broker.pendingCommissions)}</TableCell>
                        <TableCell>{broker.percentageOfTotal}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}