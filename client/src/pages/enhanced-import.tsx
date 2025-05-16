import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileImport } from '@/components/file-import';
import { ImportPreviewTable } from '@/components/import-preview-table';
import { ImportValidationResults } from '@/components/import-validation-results';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, RefreshCw, Check } from 'lucide-react';
import { Steps, Step } from '@/components/ui/steps';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

// Import types
export type ImportType = 'agencies' | 'brokers' | 'commissions';

export default function EnhancedImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(0);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [validationResults, setValidationResults] = useState<{
    importedCount: number;
    errorCount: number;
    validRecords: number;
    totalRecords: number;
    errorDetails: Array<{index: number; row: any; errors: string[]}>;
  } | null>(null);
  
  const [importComplete, setImportComplete] = useState<boolean>(false);
  
  // Import mutation for submitting file
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error importing data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Now we have validation results
      setValidationResults({
        importedCount: data.count || 0,
        errorCount: data.errorCount || 0,
        validRecords: data.validRecords || 0, 
        totalRecords: data.totalRecords || 0,
        errorDetails: data.errorDetails || []
      });
      
      if (data.errorCount === 0) {
        // If no errors, we've completed the import
        setImportComplete(true);
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${data.count} ${importType}`,
        });
        
        // Invalidate relevant queries
        if (importType === 'agencies') {
          queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
        } else if (importType === 'brokers') {
          queryClient.invalidateQueries({ queryKey: ['/api/brokers'] });
        } else if (importType === 'commissions') {
          queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
        }
      }
      
      // Move to the next step regardless
      setStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle import type selection
  const handleImportTypeChange = (type: ImportType) => {
    setImportType(type);
    setStep(1);
  };
  
  // Handle CSV file upload and parsing
  const handleFileUpload = (data: any[], file: File) => {
    setCsvData(data);
    setFileUploaded(true);
    setUploadedFile(file);
  };
  
  // Handle submitting the import
  const handleSubmitImport = () => {
    if (!importType || !uploadedFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    
    importMutation.mutate(formData);
  };
  
  // Handle proceeding with valid records
  const handleProceedWithValid = () => {
    if (validationResults && validationResults.importedCount > 0) {
      setImportComplete(true);
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${validationResults.importedCount} ${importType}`,
      });
      
      // Invalidate relevant queries
      if (importType === 'agencies') {
        queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      } else if (importType === 'brokers') {
        queryClient.invalidateQueries({ queryKey: ['/api/brokers'] });
      } else if (importType === 'commissions') {
        queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      }
    }
  };
  
  // Handle export of error records
  const handleExportErrors = () => {
    if (!validationResults || validationResults.errorDetails.length === 0) return;
    
    try {
      // Convert error details to CSV
      const headers = Object.keys(validationResults.errorDetails[0].row).join(',');
      const rows = validationResults.errorDetails.map(detail => {
        const rowValues = Object.values(detail.row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',');
        return rowValues;
      });
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${importType}-errors.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Errors Exported',
        description: `Error records have been exported to CSV`,
      });
    } catch (error) {
      console.error('Error exporting errors:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export error records',
        variant: 'destructive',
      });
    }
  };
  
  // Handle restart import
  const handleRestartImport = () => {
    setStep(0);
    setImportType(null);
    setCsvData([]);
    setFileUploaded(false);
    setUploadedFile(null);
    setValidationResults(null);
    setImportComplete(false);
  };
  
  // Get import type label
  const getImportTypeLabel = (type: ImportType | null) => {
    if (!type) return '';
    
    const labels = {
      agencies: 'Agencies',
      brokers: 'Brokers',
      commissions: 'Commissions',
    };
    
    return labels[type];
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Select Import Type</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => handleImportTypeChange('agencies')}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">Agencies</h3>
                  <p className="text-muted-foreground">Import agency information including contact details and addresses.</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => handleImportTypeChange('brokers')}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">Brokers</h3>
                  <p className="text-muted-foreground">Import broker information including agency assignments and contact details.</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:border-primary transition-all" onClick={() => handleImportTypeChange('commissions')}>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">Commissions</h3>
                  <p className="text-muted-foreground">Import commission transactions with broker assignments and employer details.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Upload {getImportTypeLabel(importType)} CSV</h2>
            
            <FileImport
              importType={importType as ImportType}
              onDataParsed={handleFileUpload}
            />
            
            {fileUploaded && csvData.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold">Preview</h3>
                <ImportPreviewTable data={csvData} />
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ChevronLeftIcon className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmitImport} disabled={importMutation.isPending}>
                    {importMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Validating...
                      </>
                    ) : (
                      <>
                        Validate and Import
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">
              {importComplete 
                ? 'Import Complete' 
                : 'Validation Results'}
            </h2>
            
            {importComplete ? (
              <Alert className="mb-6" variant="success">
                <Check className="h-4 w-4" />
                <AlertTitle>Import Successful</AlertTitle>
                <AlertDescription>
                  Successfully imported {validationResults?.importedCount} {importType}.
                </AlertDescription>
              </Alert>
            ) : (
              validationResults && (
                <ImportValidationResults
                  importType={getImportTypeLabel(importType)}
                  successCount={validationResults.validRecords}
                  errorCount={validationResults.errorCount}
                  totalRecords={validationResults.totalRecords}
                  errorDetails={validationResults.errorDetails}
                  onProceed={handleProceedWithValid}
                  onCancel={handleRestartImport}
                  onExportErrors={handleExportErrors}
                  allowPartialImport={true}
                />
              )
            )}
            
            {importComplete && (
              <div className="flex justify-end mt-6">
                <Button onClick={handleRestartImport}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Import More Data
                </Button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container py-6">
      <Helmet>
        <title>Import Data | Commission Management</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Import Data</h1>
      
      <div className="mb-8">
        <Steps current={step}>
          <Step title="Select Type" />
          <Step title="Upload CSV" />
          <Step title="Review & Import" />
        </Steps>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        {renderStepContent()}
      </div>
    </div>
  );
}