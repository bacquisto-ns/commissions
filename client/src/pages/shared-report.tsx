import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Download, FileText } from "lucide-react";
import { format, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReportHeader, ReportMetricCard, getTableCellClasses, getStatusBadgeClasses } from '@/components/report-layouts';

export default function SharedReport() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportRef, setReportRef] = useState<HTMLDivElement | null>(null);
  
  // Fetch the shared report
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/shared-reports/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setReportData(data);
        } else {
          setError(data.message || 'Failed to load the report');
        }
      } catch (err) {
        setError('An error occurred while loading the report');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);
  
  // Handle downloading the report as PDF
  const downloadAsPdf = async () => {
    if (!reportRef) return;
    
    try {
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your PDF...",
      });
      
      const canvas = await html2canvas(reportRef, {
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
        description: "The commission report has been downloaded as a PDF.",
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
  
  // Check if the report has expired
  const isExpired = () => {
    if (!reportData?.expiresAt) return true;
    
    const expiryDate = new Date(reportData.expiresAt);
    return expiryDate < new Date();
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <h3 className="text-lg font-medium">Loading Report...</h3>
        <p className="text-muted-foreground mt-1">Please wait while we load the shared report</p>
      </div>
    );
  }
  
  if (error || !reportData) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">Report Not Found</h3>
        <p className="text-muted-foreground mt-1">The shared report you're looking for doesn't exist or has been removed</p>
        <Button 
          className="mt-6" 
          variant="outline"
          onClick={() => window.location.href = '/'}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go to Home
        </Button>
      </div>
    );
  }
  
  if (isExpired()) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">Report Expired</h3>
        <p className="text-muted-foreground mt-1">This shared report has expired and is no longer available</p>
        <Button 
          className="mt-6" 
          variant="outline"
          onClick={() => window.location.href = '/'}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Go to Home
        </Button>
      </div>
    );
  }
  
  const {
    reportData: data,
    companyName,
    logoUrl,
    primaryColor,
    secondaryColor,
    reportLayout,
    reportType,
    includeDetails,
    includeCharts,
    reportTimeframe,
    generatedAt
  } = reportData;
  
  // Get the report title based on type and entity
  const getReportTitle = () => {
    if (reportType === "broker") {
      return data?.brokerName 
        ? `Broker Commission Report: ${data.brokerName}`
        : "Broker Commission Report";
    } else if (reportType === "agency") {
      return data?.agencyName 
        ? `Agency Commission Report: ${data.agencyName}`
        : "Agency Commission Report";
    }
    return "Commission Report";
  };
  
  return (
    <div className="container py-6">
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Shared Commission Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generated on {formatDate(generatedAt || new Date().toISOString())}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadAsPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
        
        <div 
          ref={setReportRef} 
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
            reportTitle={getReportTitle()}
            subtitle={data?.timeframeName || ""}
            reportLayout={reportLayout || "standard"}
          />
          
          {/* Report Summary Section */}
          <div className={`grid ${reportLayout === 'compact' ? 'grid-cols-4 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-6'} mb-8`}>
            <ReportMetricCard
              title="Total Commission"
              value={`$${data?.totalCommission || '0.00'}`}
              layout={reportLayout || "standard"}
              primaryColor={primaryColor || "#3b82f6"}
              secondaryColor={secondaryColor || "#10b981"}
              isHighlighted={true}
            />
            
            <ReportMetricCard
              title="Transactions"
              value={data?.transactionCount || 0}
              layout={reportLayout || "standard"}
              primaryColor={primaryColor || "#3b82f6"}
            />
            
            <ReportMetricCard
              title="Average Commission"
              value={`$${data?.averageCommission || '0.00'}`}
              layout={reportLayout || "standard"}
              primaryColor={primaryColor || "#3b82f6"}
            />
          </div>
          
          {/* Transaction Details Table */}
          {includeDetails && data?.transactions && data.transactions.length > 0 && (
            <div className="mb-8">
              <h3 
                className={`text-lg font-semibold mb-4 ${reportLayout === 'visual' ? 'text-white' : ''}`}
                style={reportLayout !== 'visual' ? { color: primaryColor } : {}}
              >
                Transaction Details
              </h3>
              
              <div className={`border ${reportLayout === 'visual' ? 'border-white/20' : 'border-gray-200'} rounded-md overflow-hidden`}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={reportLayout === 'visual' ? 'bg-black/20' : 'bg-gray-50'}>
                    <tr>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Product Type</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Employer</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Participants</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Rate</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Status</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true, true)}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className={
                    reportLayout === 'visual' 
                      ? 'divide-y divide-white/10' 
                      : 'divide-y divide-gray-200'
                  }>
                    {data.transactions.map((transaction, index) => (
                      <tr 
                        key={index} 
                        className={
                          reportLayout === 'visual' 
                            ? 'text-white' 
                            : reportLayout === 'detailed'
                              ? index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }
                      >
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {transaction.productType || 'COBRA'}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {transaction.employer || 'ABC Company'}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {transaction.participants || '50'}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          ${transaction.rate || '0.75'}/participant
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          <span className={getStatusBadgeClasses(transaction.status || 'approved', reportLayout || "standard")}>
                            {transaction.status || 'Approved'}
                          </span>
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard", false, true)}
                          style={reportLayout === 'detailed' ? { color: primaryColor } : {}}
                        >
                          ${transaction.amount || '37.50'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Product Breakdown */}
          {includeDetails && data?.productBreakdown && (
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
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Product Type</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Transactions</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true)}>Participants</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true, true)}>Commission</th>
                      <th className={getTableCellClasses(reportLayout || "standard", true, true)}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody className={
                    reportLayout === 'visual' 
                      ? 'divide-y divide-white/10' 
                      : 'divide-y divide-gray-200'
                  }>
                    {Object.entries(data.productBreakdown || {}).map(([product, data]: [string, any], index: number) => (
                      <tr 
                        key={product} 
                        className={
                          reportLayout === 'visual' 
                            ? 'text-white' 
                            : reportLayout === 'detailed'
                              ? index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }
                      >
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {product}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {data.count || 0}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard")}>
                          {data.participants || 0}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard", false, true)}
                          style={reportLayout === 'detailed' ? { color: primaryColor } : {}}
                        >
                          ${data.commission || '0.00'}
                        </td>
                        <td className={getTableCellClasses(reportLayout || "standard", false, true)}>
                          {data.percentage || '0'}%
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
            <p>Report generated on {formatDate(generatedAt || new Date().toISOString())}</p>
            <p className="mt-1">
              This shared report expires on {formatDate(reportData.expiresAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}