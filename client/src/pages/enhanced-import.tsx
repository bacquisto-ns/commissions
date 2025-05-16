import { useState } from "react";
import { Helmet } from "react-helmet";
import { FileUp, ChevronRight, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { ImportPreviewTable } from "@/components/import-preview-table";
import { Progress } from "@/components/ui/progress";
import { Steps, Step } from "@/components/ui/steps";
import { FileImport } from "@/components/file-import";

export default function EnhancedImport() {
  const [activeTab, setActiveTab] = useState<"agencies" | "brokers" | "commissions">("agencies");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState("");
  const [importCount, setImportCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();

  const requiredFields = {
    agencies: ['name', 'address', 'city', 'state', 'zipCode'],
    brokers: ['firstName', 'lastName', 'email', 'agencyId'],
    commissions: ['amount', 'transactionDate', 'transactionType', 'programName', 'programType', 'employerName']
  };

  const handleDataParsed = (data: any[], fileHeaders: string[], errors: Record<number, string[]>) => {
    setParsedData(data);
    setHeaders(fileHeaders);
    setValidationErrors(errors);
    setCurrentStep(1);
  };

  const proceedToConfirmation = () => {
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors in your data before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(2);
  };

  const handleImport = async () => {
    if (!file || parsedData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please select a valid CSV file with data",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setImportStatus('idle');
    setImportProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);

      const response = await fetch(`/api/import/${activeTab}`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const data = await response.json();

      if (response.ok) {
        setImportStatus('success');
        setImportMessage(data.message || "Import completed successfully");
        setImportCount(data.count || 0);
        toast({
          title: "Import successful",
          description: `${data.count || 0} records imported successfully`,
        });
        // Go to success step
        setCurrentStep(3);
      } else {
        setImportStatus('error');
        setImportMessage(data.message || "Import failed. Make sure your CSV format is correct.");
        toast({
          title: "Import failed",
          description: data.message || "Please check your CSV format and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus('error');
      setImportMessage("There was a problem with the file format. Please download the template and ensure your CSV matches the format exactly.");
      toast({
        title: "Import error",
        description: "Please check your CSV format and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setCurrentStep(1);
    setImportStatus('idle');
    setImportMessage("");
    setValidationErrors({});
    setImportProgress(0);
  };
  
  const onTabChange = (value: string) => {
    // Cast is safe because we control the tab values
    setActiveTab(value as "agencies" | "brokers" | "commissions");
    resetImport();
  };

  return (
    <>
      <Helmet>
        <title>Import Data | Broker Commissions</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Import Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import agencies, brokers, or commissions from CSV files
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="agencies">Agencies</TabsTrigger>
            <TabsTrigger value="brokers">Brokers</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle>
                Import {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </CardTitle>
              <CardDescription>
                Import your data in three simple steps: upload, validate, and import.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Steps currentStep={currentStep} className="mb-8">
                <Step title="Upload CSV" description="Select and validate your data file" />
                <Step title="Review Data" description="Confirm your data looks correct" />
                <Step title="Complete" description="Your data has been imported" />
              </Steps>
              
              {currentStep === 1 && (
                <div className="space-y-6">
                  <FileImport
                    type={activeTab}
                    onDataParsed={handleDataParsed}
                    requiredFields={requiredFields[activeTab]}
                  />
                  {parsedData.length > 0 && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={proceedToConfirmation} 
                        disabled={parsedData.length === 0 || Object.keys(validationErrors).length > 0}
                        className="flex items-center gap-2"
                      >
                        Proceed to Review
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-6">
                  <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                    <AlertTitle>Ready to import</AlertTitle>
                    <AlertDescription>
                      You're about to import {parsedData.length} records. This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-4">Data Summary</h3>
                    <ImportPreviewTable 
                      headers={headers}
                      data={parsedData}
                    />
                  </div>
                  
                  {isLoading && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Importing data...</p>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
                  <p className="text-muted-foreground mb-6">
                    {importCount} records were successfully imported.
                  </p>
                  <Button onClick={resetImport} variant="outline" className="mr-2">
                    Import More Data
                  </Button>
                  <Button asChild>
                    <a href={`/${activeTab}`}>
                      View {activeTab}
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
            
            {(currentStep === 1 || currentStep === 2) && (
              <CardFooter className="flex justify-between border-t px-6 py-4">
                {currentStep > 1 ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={resetImport}
                    disabled={!file || isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
                
                {currentStep === 1 && (
                  <Button 
                    onClick={proceedToConfirmation} 
                    disabled={!file || parsedData.length === 0 || isLoading}
                    className="ml-auto"
                  >
                    Validate & Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                
                {currentStep === 2 && (
                  <Button 
                    onClick={handleImport}
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FileUp className="mr-2 h-4 w-4" />
                        Import Data
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </Tabs>
      </div>
    </>
  );
}