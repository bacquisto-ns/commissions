import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download, FileImage } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

export default function SharedReport() {
  const { id } = useParams();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        // In a real implementation, this would fetch the report data from the server
        // using the ID from the URL
        setLoading(true);
        const response = await fetch(`/api/shared-reports/${id}`);
        
        if (!response.ok) {
          throw new Error('Report not found or has expired');
        }
        
        const data = await response.json();
        setReportData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [id]);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`commission-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  
  const exportImage = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `commission-report-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error exporting image:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading shared report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-8">{error}</p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Return to Home
        </Button>
      </div>
    );
  }

  // For demo purposes, use placeholder data if the reportData isn't available
  const data = reportData || {
    companyName: "Sample Agency",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    reportType: "broker",
    entityName: "John Smith",
    period: {
      startDate: "2023-01-01",
      endDate: "2023-12-31"
    },
    summary: {
      totalCommissions: "$50.00",
      pendingApprovals: {
        count: 1,
        amount: "$11.00"
      },
      transactions: {
        count: 1,
        avgRate: "$0.75/participant"
      }
    },
    productBreakdown: {
      topProduct: {
        name: "COBRA",
        percentage: 100
      }
    },
    transactions: [
      {
        productType: "COBRA",
        employer: "ABC Company",
        participants: 50,
        rate: "0.75",
        status: "Approved",
        amount: "37.50"
      }
    ]
  };

  const { 
    companyName, 
    primaryColor, 
    secondaryColor, 
    reportType, 
    entityName, 
    period, 
    summary, 
    productBreakdown,
    transactions 
  } = data;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shared Commission Report</h1>
        <div className="space-x-2">
          <Button 
            onClick={generatePDF}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button 
            onClick={exportImage}
            variant="outline"
          >
            <FileImage className="mr-2 h-4 w-4" />
            Export Image
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        <div ref={reportRef} className="min-h-[600px] bg-white rounded-lg p-8">
          {/* Report Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-4" style={{ borderColor: primaryColor }}>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>{companyName}</h2>
              <p className="text-sm text-gray-500">
                Commission Report: {period.startDate} to {period.endDate}
              </p>
              <p className="font-medium mt-2">
                {entityName}
              </p>
            </div>
            <div 
              className="px-4 py-2 rounded-md text-white font-semibold text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {reportType === 'broker' ? 'Broker Report' : 'Agency Report'}
            </div>
          </div>
          
          {/* Commission Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
              Commission Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                <h4 className="font-medium" style={{ color: primaryColor }}>Total Commissions</h4>
                <p className="text-2xl font-bold">{summary.totalCommissions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg" style={{ backgroundColor: `${secondaryColor}10` }}>
                <h4 className="font-medium" style={{ color: secondaryColor }}>Pending Approvals</h4>
                <p className="text-2xl font-bold">{summary.pendingApprovals.count}</p>
                <p className="text-sm mt-1" style={{ color: secondaryColor }}>{summary.pendingApprovals.amount}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                <h4 className="font-medium" style={{ color: primaryColor }}>Total Transactions</h4>
                <p className="text-2xl font-bold">{summary.transactions.count}</p>
                <p className="text-sm mt-1" style={{ color: primaryColor }}>Avg. {summary.transactions.avgRate}</p>
              </div>
            </div>
          </div>
          
          {/* Transaction Details By Product Type */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
              Transaction Details By Product
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50" style={{ backgroundColor: `${primaryColor}10` }}>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {transaction.productType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.employer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        ${transaction.rate}/participant
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: primaryColor }}>
                        ${transaction.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Product Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
              Product Breakdown
            </h3>
            <div className="text-center mb-2">
              <h4 className="text-xl font-medium">{productBreakdown.topProduct.name}</h4>
              <p className="text-sm text-muted-foreground">{productBreakdown.topProduct.percentage}% of total commissions</p>
            </div>
            <div className="flex justify-center my-4">
              <div className="w-40 h-40 rounded-full border-8 flex justify-center items-center" style={{ borderColor: primaryColor }}>
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: primaryColor }}>{productBreakdown.topProduct.percentage}%</div>
                  <div className="text-sm">{productBreakdown.topProduct.name}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with watermark */}
          <div className="mt-16 pt-4 border-t text-center text-sm text-gray-500" style={{ borderColor: primaryColor }}>
            <p>Generated on {format(new Date(), 'MMMM dd, yyyy')} • Powered by Commission Tracker</p>
          </div>
        </div>
      </Card>
    </div>
  );
}