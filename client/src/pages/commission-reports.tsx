import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, FileText, Share2, FileImage, Palette } from "lucide-react";
import { SketchPicker } from 'react-color';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CommissionReports() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Branding states
  const [companyName, setCompanyName] = useState("Your Company");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  
  // Report settings
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("broker");
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeMonthlyChart, setIncludeMonthlyChart] = useState(true);
  
  // New theme and layout settings
  const [reportLayout, setReportLayout] = useState("standard");
  const [themeOption, setThemeOption] = useState("custom");
  const [savedTemplates, setSavedTemplates] = useState<Array<{
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
    logoUrl: string;
    layout: string;
  }>>(() => {
    // Load saved templates from localStorage if available
    const savedData = localStorage.getItem('reportTemplates');
    return savedData ? JSON.parse(savedData) : [
      {
        id: "default-1",
        name: "Corporate Blue",
        primaryColor: "#1e40af",
        secondaryColor: "#3b82f6",
        companyName: "Your Company",
        logoUrl: "",
        layout: "standard"
      },
      {
        id: "default-2",
        name: "Modern Green",
        primaryColor: "#047857",
        secondaryColor: "#10b981",
        companyName: "Your Company",
        logoUrl: "",
        layout: "compact"
      }
    ];
  });
  
  // Fetch brokers and agencies for selection
  const { data: brokers, isLoading: brokersLoading } = useQuery({
    queryKey: ['/api/brokers'],
  });
  
  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['/api/agencies'],
  });
  
  // For the report data we'll use specific endpoints based on selection
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: [`/api/reports/${reportType}`, selectedBrokerId || selectedAgencyId, startDate, endDate],
    enabled: !!(
      (reportType === 'broker' && selectedBrokerId) || 
      (reportType === 'agency' && selectedAgencyId)
    ) && !!(startDate && endDate),
  });
  
  const handleColorChange = (color: any, type: 'primary' | 'secondary') => {
    if (type === 'primary') {
      setPrimaryColor(color.hex);
    } else {
      setSecondaryColor(color.hex);
    }
  };
  
  // Load a saved template
  const loadTemplate = (templateId: string) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    setCompanyName(template.companyName);
    setPrimaryColor(template.primaryColor);
    setSecondaryColor(template.secondaryColor);
    setLogoUrl(template.logoUrl);
    setReportLayout(template.layout);
    setThemeOption(templateId);
  };
  
  // Save current template settings
  const saveCurrentTemplate = () => {
    const templateName = prompt("Enter a name for this template:", "My Template");
    if (!templateName) return;
    
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      primaryColor,
      secondaryColor,
      companyName,
      logoUrl,
      layout: reportLayout
    };
    
    const updatedTemplates = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('reportTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template saved",
      description: `"${templateName}" has been saved and can be reused for future reports`
    });
  };
  
  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    toast({
      title: "Generating PDF",
      description: "Please wait while we create your report...",
    });
    
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
      
      toast({
        title: "Success!",
        description: "Your report has been generated and downloaded"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate the PDF report",
        variant: "destructive"
      });
    }
  };
  
  const copyShareableLink = async () => {
    if (isGeneratingDisabled) return;
    
    toast({
      title: "Generating shareable link",
      description: "Please wait while we create your shareable report..."
    });
    
    try {
      // Call the API to create a shareable report
      const response = await fetch('/api/shared-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType,
          entityId: reportType === 'broker' ? selectedBrokerId : selectedAgencyId,
          startDate,
          endDate,
          expireDays: 7 // Link will expire in 7 days
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create shareable report link');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create shareable report link');
      }
      
      // Copy the shareable link to the clipboard
      navigator.clipboard.writeText(data.shareableLink);
      
      toast({
        title: "Link copied!",
        description: `Shareable report link has been copied to clipboard. It will expire on ${new Date(data.expiresAt).toLocaleDateString()}.`
      });
    } catch (error) {
      console.error('Error creating shareable link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create shareable report link',
        variant: "destructive"
      });
    }
  };
  
  const exportImage = async () => {
    if (!reportRef.current) return;
    
    toast({
      title: "Exporting Image",
      description: "Please wait while we create your image...",
    });
    
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
      
      toast({
        title: "Success!",
        description: "Your report image has been generated and downloaded"
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toast({
        title: "Error",
        description: "Failed to export the report as an image",
        variant: "destructive"
      });
    }
  };
  
  const isGeneratingDisabled = 
    (reportType === 'broker' && !selectedBrokerId) || 
    (reportType === 'agency' && !selectedAgencyId) ||
    !startDate || !endDate;
  
  if (brokersLoading || agenciesLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Commission Reports</h1>
        <Button onClick={() => navigate('/commissions')}>
          Back to Commissions
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Report Settings</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select 
                  value={reportType} 
                  onValueChange={setReportType}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Broker Report</SelectItem>
                    <SelectItem value="agency">Agency Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {reportType === 'broker' ? (
                <div>
                  <Label htmlFor="broker">Select Broker</Label>
                  <Select 
                    value={selectedBrokerId} 
                    onValueChange={setSelectedBrokerId}
                  >
                    <SelectTrigger id="broker">
                      <SelectValue placeholder="Select Broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {(brokers || []).map((broker: any) => (
                        <SelectItem key={broker.id} value={broker.id.toString()}>
                          {broker.firstName} {broker.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="agency">Select Agency</Label>
                  <Select 
                    value={selectedAgencyId} 
                    onValueChange={setSelectedAgencyId}
                  >
                    <SelectTrigger id="agency">
                      <SelectValue placeholder="Select Agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {(agencies || []).map((agency: any) => (
                        <SelectItem key={agency.id} value={agency.id.toString()}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Components</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-summary" 
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                  />
                  <label
                    htmlFor="include-summary"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Summary
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-breakdown" 
                    checked={includeBreakdown}
                    onCheckedChange={(checked) => setIncludeBreakdown(checked as boolean)}
                  />
                  <label
                    htmlFor="include-breakdown"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Product Breakdown
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-monthly-chart" 
                    checked={includeMonthlyChart}
                    onCheckedChange={(checked) => setIncludeMonthlyChart(checked as boolean)}
                  />
                  <label
                    htmlFor="include-monthly-chart"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Monthly Chart
                  </label>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Branding Settings</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              
              <div>
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input 
                  id="logo-url" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center mt-1 space-x-2">
                  <div 
                    className="w-10 h-10 rounded cursor-pointer" 
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')}
                  />
                  <Input 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-grow"
                  />
                </div>
                {showColorPicker === 'primary' && (
                  <div className="absolute z-10 mt-1">
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setShowColorPicker(null)}
                    />
                    <SketchPicker 
                      color={primaryColor}
                      onChange={(color: any) => handleColorChange(color, 'primary')}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label>Secondary Color</Label>
                <div className="flex items-center mt-1 space-x-2">
                  <div 
                    className="w-10 h-10 rounded cursor-pointer" 
                    style={{ backgroundColor: secondaryColor }}
                    onClick={() => setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')}
                  />
                  <Input 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-grow"
                  />
                </div>
                {showColorPicker === 'secondary' && (
                  <div className="absolute z-10 mt-1">
                    <div 
                      className="fixed inset-0" 
                      onClick={() => setShowColorPicker(null)}
                    />
                    <SketchPicker 
                      color={secondaryColor}
                      onChange={(color: any) => handleColorChange(color, 'secondary')}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label>Report Layout</Label>
                <Select
                  value={reportLayout}
                  onValueChange={(value) => setReportLayout(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="visual">Visual</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose how your report content is displayed
                </p>
              </div>
              
              <div>
                <Label>Saved Templates</Label>
                <Select
                  value={themeOption}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setThemeOption("custom");
                    } else {
                      loadTemplate(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Saved Templates</SelectLabel>
                      {savedTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a saved template or customize your own
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={saveCurrentTemplate}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Current Settings as Template
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Export Options</h2>
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={generatePDF}
                disabled={isGeneratingDisabled}
              >
                <FileText className="mr-2 h-4 w-4" />
                Download as PDF
              </Button>
              
              <Button 
                className="w-full"
                onClick={exportImage}
                disabled={isGeneratingDisabled}
                variant="outline"
              >
                <FileImage className="mr-2 h-4 w-4" />
                Export as Image
              </Button>
              
              <Button 
                className="w-full"
                onClick={copyShareableLink}
                disabled={isGeneratingDisabled}
                variant="outline"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Create Shareable Link
              </Button>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Tabs defaultValue="preview">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="template">Template</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="pt-2">
                <div className="bg-white rounded-lg border p-6" ref={reportRef}>
                  {reportLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : isGeneratingDisabled ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium">No Report Generated</h3>
                      <p className="max-w-sm mt-2">
                        Select report settings and date range to generate a preview
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Branded Header */}
                      <div className="flex justify-between items-center pb-6 border-b" style={{ color: primaryColor }}>
                        <div>
                          <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>{companyName}</h2>
                          <p className="text-sm text-muted-foreground">
                            Commission Report • {format(new Date(), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        
                        {logoUrl && (
                          <img 
                            src={logoUrl} 
                            alt={`${companyName} logo`} 
                            className="h-12 w-auto object-contain"
                          />
                        )}
                      </div>
                      
                      {/* Report Title */}
                      <div className="mt-6 mb-8 text-center">
                        <h1 className="text-2xl font-bold">
                          {reportType === 'broker' ? 'Broker' : 'Agency'} Commission Report
                        </h1>
                        <p className="text-muted-foreground">
                          {startDate} to {endDate}
                        </p>
                        <p className="font-medium mt-2">
                          {reportType === 'broker' 
                            ? `${(brokers || []).find((b: any) => b.id.toString() === selectedBrokerId)?.firstName || ''} ${(brokers || []).find((b: any) => b.id.toString() === selectedBrokerId)?.lastName || ''}`
                            : (agencies || []).find((a: any) => a.id.toString() === selectedAgencyId)?.name
                          }
                        </p>
                      </div>
                      
                      {/* Placeholder report content based on settings */}
                      {includeSummary && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                            Commission Summary
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                              <h4 className="font-medium" style={{ color: primaryColor }}>Total Commissions</h4>
                              <p className="text-2xl font-bold">$50.00</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg" style={{ backgroundColor: `${secondaryColor}10` }}>
                              <h4 className="font-medium" style={{ color: secondaryColor }}>Pending Approvals</h4>
                              <p className="text-2xl font-bold">1</p>
                              <p className="text-sm mt-1" style={{ color: secondaryColor }}>$11.00</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
                              <h4 className="font-medium" style={{ color: primaryColor }}>Total Transactions</h4>
                              <p className="text-2xl font-bold">1</p>
                              <p className="text-sm mt-1" style={{ color: primaryColor }}>Avg. $0.75/participant</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Transaction Details By Product Type */}
                      {includeSummary && (
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
                                {!reportLoading && reportData?.transactions ? (
                                  reportData.transactions.map((transaction: any, index: number) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {transaction.productType || 'COBRA'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {transaction.employer || 'ABC Company'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {transaction.participants || '50'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        ${transaction.rate || '0.75'}/participant
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          {transaction.status || 'Approved'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: primaryColor }}>
                                        ${transaction.amount || '37.50'}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      COBRA
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      ABC Company
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      50
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      $0.75/participant
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Approved
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: primaryColor }}>
                                      $37.50
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {includeBreakdown && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                            Product Breakdown
                          </h3>
                          <div className="text-center mb-2">
                            <h4 className="text-xl font-medium">COBRA</h4>
                            <p className="text-sm text-muted-foreground">100.0% of total commissions</p>
                          </div>
                          <div className="flex justify-center my-4">
                            <div className="w-40 h-40 rounded-full border-8 flex justify-center items-center" style={{ borderColor: primaryColor }}>
                              <div className="text-center">
                                <div className="text-xl font-bold" style={{ color: primaryColor }}>100%</div>
                                <div className="text-sm">COBRA</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex justify-center">
                            <div className="text-center">
                              <h4 className="text-base font-medium">COBRA</h4>
                              <p className="text-xl font-semibold">$50.00</p>
                              <p className="text-xs text-muted-foreground">100.0%</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {includeMonthlyChart && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
                            Monthly Earnings
                          </h3>
                          <div className="h-60 w-full">
                            <div className="relative h-full flex items-end">
                              {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, i) => (
                                <div key={month} className="flex-1 flex flex-col items-center">
                                  <div className="w-4/5 h-0 rounded-t" style={{ 
                                    height: month === 'May' ? '80%' : '0%',
                                    backgroundColor: primaryColor 
                                  }}></div>
                                  <div className="mt-2 text-xs text-center">{month}</div>
                                </div>
                              ))}
                              {/* Y-axis values */}
                              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
                                <div>60</div>
                                <div>45</div>
                                <div>30</div>
                                <div>15</div>
                                <div>0</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Report Footer */}
                      <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                        <p>
                          Generated on {format(new Date(), 'MMMM d, yyyy')} by {companyName}
                        </p>
                        <p className="mt-1">
                          This report is confidential and intended only for authorized recipients.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="template" className="pt-2">
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Template Settings</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a template to use for your commission report. Customize headers, footers, and sections to include.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Template Style</Label>
                      <Select defaultValue="modern">
                        <SelectTrigger>
                          <SelectValue placeholder="Select template style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Paper Size</Label>
                      <Select defaultValue="a4">
                        <SelectTrigger>
                          <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Font Style</Label>
                      <Select defaultValue="sans">
                        <SelectTrigger>
                          <SelectValue placeholder="Select font style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sans">Sans Serif</SelectItem>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="mono">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <Palette className="mr-2 h-4 w-4" />
                      Apply Template
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}