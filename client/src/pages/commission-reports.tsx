import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileText, Share2, FileImage, Palette, Copy } from "lucide-react";
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReportHeader, ReportMetricCard, getTableCellClasses, getStatusBadgeClasses } from '@/components/report-layouts';
import { ReportTemplateSelector } from '@/components/report-templates';

export default function CommissionReports() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Branding states
  const [companyName, setCompanyName] = useState("Your Company");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  
  // Report settings
  const [reportTimeframe, setReportTimeframe] = useState<string>("current_month");
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState<string>("broker");
  const [reportFormat, setReportFormat] = useState<string>("detailed");
  const [reportLayout, setReportLayout] = useState<string>("standard");
  const [brokerId, setBrokerId] = useState<string>("");
  const [agencyId, setAgencyId] = useState<string>("");
  const [includeDetails, setIncludeDetails] = useState<boolean>(true);
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>({});
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [sharingLink, setSharingLink] = useState<string>("");
  const [isSharing, setIsSharing] = useState<boolean>(false);
  
  // Fetch brokers for the dropdown
  const { data: brokersData, isLoading: loadingBrokers } = useQuery({
    queryKey: ['/api/brokers'],
  });
  
  // Fetch agencies for the dropdown
  const { data: agenciesData, isLoading: loadingAgencies } = useQuery({
    queryKey: ['/api/agencies'],
  });
  
  // Handle generating the report
  const generateReport = async () => {
    setLoadingReport(true);
    setReportGenerated(false);
    setSharingLink("");
    
    try {
      // Date range logic based on timeframe
      let reportStartDate = startDate;
      let reportEndDate = endDate;
      
      if (reportTimeframe === "current_month") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
        reportEndDate = format(currentDate, 'yyyy-MM-dd');
      } else if (reportTimeframe === "previous_month") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1), 'yyyy-MM-dd');
        reportEndDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0), 'yyyy-MM-dd');
      } else if (reportTimeframe === "year_to_date") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
        reportEndDate = format(currentDate, 'yyyy-MM-dd');
      } else if (reportTimeframe === "last_year") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear() - 1, 0, 1), 'yyyy-MM-dd');
        reportEndDate = format(new Date(currentDate.getFullYear() - 1, 11, 31), 'yyyy-MM-dd');
      }
      
      // Build the API endpoint based on report type
      let url = `/api/reports/${reportType}/${reportType === "broker" ? brokerId : agencyId}`;
      url += `?startDate=${reportStartDate}&endDate=${reportEndDate}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
        setReportGenerated(true);
        toast({
          title: "Report Generated",
          description: "Your commission report has been generated successfully.",
        });
      } else {
        throw new Error(data.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingReport(false);
    }
  };
  
  // Handle downloading the report as PDF
  const downloadAsPdf = async () => {
    if (!reportRef.current) return;
    
    try {
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF...",
      });
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`commission-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your commission report has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download the report as PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle sharing the report (create a shareable link)
  const shareReport = async () => {
    if (!reportData || !reportGenerated) return;
    
    setIsSharing(true);
    
    try {
      // Get entity ID based on report type
      const entityId = reportType === 'broker' ? brokerId : agencyId;
      
      // Calculate date range based on timeframe
      let reportStartDate = startDate;
      let reportEndDate = endDate;
      
      if (reportTimeframe === "current_month") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
        reportEndDate = format(currentDate, 'yyyy-MM-dd');
      } else if (reportTimeframe === "previous_month") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1), 'yyyy-MM-dd');
        reportEndDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 0), 'yyyy-MM-dd');
      } else if (reportTimeframe === "year_to_date") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
        reportEndDate = format(currentDate, 'yyyy-MM-dd');
      } else if (reportTimeframe === "last_year") {
        const currentDate = new Date();
        reportStartDate = format(new Date(currentDate.getFullYear() - 1, 0, 1), 'yyyy-MM-dd');
        reportEndDate = format(new Date(currentDate.getFullYear() - 1, 11, 31), 'yyyy-MM-dd');
      }
      
      // Create payload with all branding information
      const payload = {
        reportType,
        entityId,
        startDate: reportStartDate,
        endDate: reportEndDate,
        expireDays: 7,
        // Branding parameters
        companyName,
        logoUrl,
        primaryColor,
        secondaryColor,
        reportLayout,
        reportFormat,
        includeCharts,
        includeDetails
      };
      
      const response = await fetch('/api/shared-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSharingLink(data.shareableLink);
        
        // Copy to clipboard
        if (data.shareableLink) {
          await navigator.clipboard.writeText(data.shareableLink);
        }
        
        toast({
          title: "Report Shared",
          description: "Shareable link has been copied to your clipboard! It will expire in 7 days.",
        });
      } else {
        throw new Error(data.message || "Failed to create shareable link");
      }
    } catch (error) {
      console.error("Error sharing report:", error);
      toast({
        title: "Error",
        description: "Failed to create a shareable link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  // Get the report title based on type and entity
  const getReportTitle = () => {
    if (reportType === "broker") {
      const broker = brokersData?.find((b: any) => b.id.toString() === brokerId);
      return broker 
        ? `Broker Commission Report: ${broker.firstName} ${broker.lastName}`
        : "Broker Commission Report";
    } else if (reportType === "agency") {
      const agency = agenciesData?.find((a: any) => a.id.toString() === agencyId);
      return agency 
        ? `Agency Commission Report: ${agency.name}`
        : "Agency Commission Report";
    }
    return "Commission Report";
  };
  
  // Get the report subtitle (date range)
  const getReportSubtitle = () => {
    if (reportTimeframe === "current_month") {
      return `Current Month (${format(new Date(), 'MMMM yyyy')})`;
    } else if (reportTimeframe === "previous_month") {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      return `Previous Month (${format(prevMonth, 'MMMM yyyy')})`;
    } else if (reportTimeframe === "year_to_date") {
      return `Year to Date (${format(new Date(), 'yyyy')})`;
    } else if (reportTimeframe === "last_year") {
      return `Last Year (${format(new Date(new Date().getFullYear() - 1, 0, 1), 'yyyy')})`;
    } else if (reportTimeframe === "custom") {
      return `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;
    }
    return "";
  };
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Commission Reports</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/commissions")}
        >
          Back to Commissions
        </Button>
      </div>
      
      <Tabs defaultValue="generate">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="generate" className="flex-1">Generate Report</TabsTrigger>
          {reportGenerated && (
            <TabsTrigger value="preview" className="flex-1">Preview Report</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="generate" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Report Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Report Type</Label>
                  <Select
                    value={reportType}
                    onValueChange={setReportType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broker">Broker Report</SelectItem>
                      <SelectItem value="agency">Agency Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {reportType === "broker" && (
                  <div>
                    <Label>Select Broker</Label>
                    <Select
                      value={brokerId}
                      onValueChange={setBrokerId}
                    >
                      <SelectTrigger disabled={loadingBrokers}>
                        <SelectValue placeholder="Select broker" />
                      </SelectTrigger>
                      <SelectContent>
                        {brokersData?.map((broker: any) => (
                          <SelectItem key={broker.id} value={broker.id.toString()}>
                            {broker.firstName} {broker.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {reportType === "agency" && (
                  <div>
                    <Label>Select Agency</Label>
                    <Select
                      value={agencyId}
                      onValueChange={setAgencyId}
                    >
                      <SelectTrigger disabled={loadingAgencies}>
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {agenciesData?.map((agency: any) => (
                          <SelectItem key={agency.id} value={agency.id.toString()}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Time Period</Label>
                  <Select
                    value={reportTimeframe}
                    onValueChange={setReportTimeframe}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_month">Current Month</SelectItem>
                      <SelectItem value="previous_month">Previous Month</SelectItem>
                      <SelectItem value="year_to_date">Year to Date</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Report Format</Label>
                  <Select
                    value={reportFormat}
                    onValueChange={setReportFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed (All Transactions)</SelectItem>
                      <SelectItem value="summary">Summary Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {reportTimeframe === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeDetails" 
                    checked={includeDetails} 
                    onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                  />
                  <Label htmlFor="includeDetails">Include Transaction Details</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeCharts" 
                    checked={includeCharts} 
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <Label htmlFor="includeCharts">Include Charts & Visualizations</Label>
                </div>
              </div>
              
              <Button 
                onClick={generateReport} 
                disabled={loadingReport || (reportType === "broker" && !brokerId) || (reportType === "agency" && !agencyId)}
              >
                {loadingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>
            </Card>
            
            <ReportTemplateSelector
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              companyName={companyName}
              logoUrl={logoUrl}
              layout={reportLayout}
              onPrimaryColorChange={setPrimaryColor}
              onSecondaryColorChange={setSecondaryColor}
              onCompanyNameChange={setCompanyName}
              onLogoUrlChange={setLogoUrl}
              onLayoutChange={setReportLayout}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          {reportGenerated ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Report Preview</h2>
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadAsPdf}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={shareReport}
                      disabled={isSharing}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {isSharing ? "Creating Link..." : "Share Report"}
                    </Button>
                  </div>
                </div>
                
                {sharingLink && (
                  <div className="bg-muted p-3 rounded-md mb-6 flex items-center justify-between">
                    <div className="text-sm font-medium truncate max-w-[500px]">
                      {sharingLink}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(sharingLink)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                )}
                
                <div 
                  ref={reportRef} 
                  className={`p-8 border rounded-md overflow-x-auto ${
                    reportLayout === 'visual' ? 'bg-gradient-to-br from-[#2a2a72] to-[#009ffd] text-white' : 'bg-white'
                  }`}
                  style={
                    reportLayout === 'detailed' 
                      ? { borderColor: primaryColor, borderWidth: '2px' } 
                      : {}
                  }
                >
                  <ReportHeader
                    companyName={companyName || "Your Company"}
                    logoUrl={logoUrl || ""}
                    primaryColor={primaryColor || "#3b82f6"}
                    secondaryColor={secondaryColor || "#10b981"}
                    title={getReportTitle()}
                    subtitle={getReportSubtitle()}
                    layout={reportLayout}
                  />
                  
                  {/* Summary Section */}
                  {reportType === "broker" && reportData.statistics && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ReportMetricCard
                        title="Total Commission"
                        value={reportData.statistics.totalCommission || "$0.00"}
                        icon="dollar"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Pending Commission"
                        value={reportData.statistics.pendingCommission || "$0.00"}
                        icon="clock"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Approved Commission"
                        value={reportData.statistics.approvedCommission || "$0.00"}
                        icon="check"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Transactions"
                        value={reportData.statistics.transactionCount?.toString() || "0"}
                        icon="file"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Avg Commission Rate"
                        value={reportData.statistics.avgCommissionRate || "$0.00"}
                        icon="chart"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Top Product Type"
                        value={reportData.statistics.commissionsByProduct?.[0]?.product || "N/A"}
                        subvalue={reportData.statistics.commissionsByProduct?.[0]?.percentage 
                          ? `${reportData.statistics.commissionsByProduct[0].percentage}%` 
                          : ""}
                        icon="star"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                    </div>
                  )}
                  
                  {reportType === "agency" && reportData.statistics && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ReportMetricCard
                        title="Total Commission"
                        value={reportData.statistics.totalCommission || "$0.00"}
                        icon="dollar"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Pending Commission"
                        value={reportData.statistics.pendingCommission || "$0.00"}
                        icon="clock"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Approved Commission"
                        value={reportData.statistics.approvedCommission || "$0.00"}
                        icon="check"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Transactions"
                        value={reportData.statistics.transactionCount?.toString() || "0"}
                        icon="file"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Brokers"
                        value={reportData.statistics.brokerCount?.toString() || "0"}
                        icon="users"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                      <ReportMetricCard
                        title="Avg Commission Rate"
                        value={reportData.statistics.avgCommissionRate || "$0.00"}
                        icon="chart"
                        layout={reportLayout}
                        primaryColor={primaryColor}
                      />
                    </div>
                  )}
                  
                  {/* Broker Performance Section (for agency reports) */}
                  {reportType === "agency" && reportData.brokerPerformance && (
                    <div className="mt-8">
                      <h3 
                        className={`text-lg font-semibold mb-4 ${reportLayout === 'visual' ? 'text-white' : ''}`}
                        style={reportLayout !== 'visual' ? { color: primaryColor } : {}}
                      >
                        Broker Performance
                      </h3>
                      
                      <div className={`border ${reportLayout === 'visual' ? 'border-white/20' : 'border-gray-200'} rounded-md overflow-hidden`}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={reportLayout === 'visual' ? 'bg-black/20' : 'bg-gray-50'}>
                            <tr>
                              <th className={getTableCellClasses(reportLayout, true)}>Broker</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Total Commissions</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Pending</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>% of Total</th>
                            </tr>
                          </thead>
                          <tbody className={
                            reportLayout === 'visual' 
                              ? 'divide-y divide-white/10' 
                              : 'divide-y divide-gray-200'
                          }>
                            {reportData.brokerPerformance.map((broker: any, index: number) => (
                              <tr 
                                key={broker.brokerId} 
                                className={
                                  reportLayout === 'visual' 
                                    ? 'text-white' 
                                    : reportLayout === 'detailed'
                                      ? index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }
                              >
                                <td className={getTableCellClasses(reportLayout)}>
                                  {broker.firstName} {broker.lastName}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}
                                  style={reportLayout === 'detailed' ? { color: primaryColor } : {}}
                                >
                                  ${broker.totalCommissions.toFixed(2)}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}>
                                  ${broker.pendingCommissions.toFixed(2)}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}>
                                  {broker.percentageOfTotal}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Product Breakdown Section */}
                  {includeCharts && reportData.statistics?.commissionsByProduct && (
                    <div className="mb-8">
                      <h3 
                        className={`text-lg font-semibold mb-4 ${reportLayout === 'visual' ? 'text-white' : ''}`}
                        style={reportLayout !== 'visual' ? { color: primaryColor } : {}}
                      >
                        Product Type Breakdown
                      </h3>
                      
                      <div className={`border ${reportLayout === 'visual' ? 'border-white/20' : 'border-gray-200'} rounded-md overflow-hidden`}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={reportLayout === 'visual' ? 'bg-black/20' : 'bg-gray-50'}>
                            <tr>
                              <th className={getTableCellClasses(reportLayout, true)}>Product Type</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Commission</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Percentage</th>
                            </tr>
                          </thead>
                          <tbody className={
                            reportLayout === 'visual' 
                              ? 'divide-y divide-white/10' 
                              : 'divide-y divide-gray-200'
                          }>
                            {reportData.statistics.commissionsByProduct.map((item: any, index: number) => (
                              <tr 
                                key={item.product} 
                                className={
                                  reportLayout === 'visual' 
                                    ? 'text-white' 
                                    : reportLayout === 'detailed'
                                      ? index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }
                              >
                                <td className={getTableCellClasses(reportLayout)}>
                                  {item.product}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}
                                  style={reportLayout === 'detailed' ? { color: primaryColor } : {}}
                                >
                                  ${item.amount.toFixed(2)}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}>
                                  {item.percentage}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Transaction Details */}
                  {includeDetails && (reportData.commissions || []).length > 0 && (
                    <div className="mt-8">
                      <h3 
                        className={`text-lg font-semibold mb-4 ${reportLayout === 'visual' ? 'text-white' : ''}`}
                        style={reportLayout !== 'visual' ? { color: primaryColor } : {}}
                      >
                        Transaction Details
                      </h3>
                      
                      <div className={`border ${reportLayout === 'visual' ? 'border-white/20' : 'border-gray-200'} rounded-md overflow-x-auto`}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={reportLayout === 'visual' ? 'bg-black/20' : 'bg-gray-50'}>
                            <tr>
                              <th className={getTableCellClasses(reportLayout, true)}>Product</th>
                              <th className={getTableCellClasses(reportLayout, true)}>Employer</th>
                              <th className={getTableCellClasses(reportLayout, true)}>Type</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Participants</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Rate</th>
                              <th className={getTableCellClasses(reportLayout, true, true)}>Amount</th>
                              <th className={getTableCellClasses(reportLayout, true)}>Status</th>
                            </tr>
                          </thead>
                          <tbody className={
                            reportLayout === 'visual' 
                              ? 'divide-y divide-white/10' 
                              : 'divide-y divide-gray-200'
                          }>
                            {reportData.commissions.map((transaction: any, index: number) => (
                              <tr 
                                key={transaction.id || index} 
                                className={
                                  reportLayout === 'visual' 
                                    ? 'text-white' 
                                    : reportLayout === 'detailed'
                                      ? index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }
                              >
                                <td className={getTableCellClasses(reportLayout)}>
                                  {transaction.productType}
                                </td>
                                <td className={getTableCellClasses(reportLayout)}>
                                  {transaction.employer}
                                </td>
                                <td className={getTableCellClasses(reportLayout)}>
                                  {transaction.transactionType?.charAt(0).toUpperCase() + 
                                    transaction.transactionType?.slice(1)}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}>
                                  {transaction.participants}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}>
                                  ${transaction.rate}
                                </td>
                                <td className={getTableCellClasses(reportLayout, false, true)}
                                  style={reportLayout === 'detailed' ? { color: primaryColor } : {}}
                                >
                                  ${typeof transaction.amount === 'number' 
                                    ? transaction.amount.toFixed(2) 
                                    : transaction.amount || '0.00'}
                                </td>
                                <td className={getTableCellClasses(reportLayout)}>
                                  <span 
                                    className={getStatusBadgeClasses(
                                      transaction.status, 
                                      reportLayout, 
                                      primaryColor, 
                                      secondaryColor
                                    )}
                                  >
                                    {transaction.status?.charAt(0).toUpperCase() + 
                                      transaction.status?.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className={`mt-8 pt-4 text-xs ${reportLayout === 'visual' ? 'text-white/70 border-t border-white/20' : 'text-gray-500 border-t'}`}>
                    <p>Report generated on {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'h:mm a')}</p>
                    {reportLayout === 'detailed' && (
                      <p className="mt-1">This report is valid for 7 days from the generation date.</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Report Generated</h3>
              <p className="text-muted-foreground mt-1">Please generate a report first</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => {
                  const generateTab = document.querySelector('[data-value="generate"]');
                  if (generateTab && 'click' in generateTab) {
                    (generateTab as HTMLElement).click();
                  }
                }}
              >
                Go to Report Settings
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}