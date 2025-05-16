import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, XCircle, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ErrorDetail {
  index: number;
  row: any;
  errors: string[];
}

export interface ValidationResultsProps {
  importType: string;
  successCount: number;
  errorCount: number;
  totalRecords: number;
  errorDetails: ErrorDetail[];
  onProceed: () => void;
  onCancel: () => void;
  onExportErrors?: () => void;
  allowPartialImport?: boolean;
}

export function ImportValidationResults({
  importType,
  successCount,
  errorCount,
  totalRecords,
  errorDetails,
  onProceed,
  onCancel,
  onExportErrors,
  allowPartialImport = true,
}: ValidationResultsProps) {
  const [selectedErrors, setSelectedErrors] = useState<number[]>([]);
  const successRate = totalRecords > 0 ? Math.round((successCount / totalRecords) * 100) : 0;
  
  const toggleSelectError = (index: number) => {
    if (selectedErrors.includes(index)) {
      setSelectedErrors(selectedErrors.filter(i => i !== index));
    } else {
      setSelectedErrors([...selectedErrors, index]);
    }
  };
  
  const toggleSelectAll = () => {
    if (selectedErrors.length === errorDetails.length) {
      setSelectedErrors([]);
    } else {
      setSelectedErrors(errorDetails.map((_, index) => index));
    }
  };
  
  // Helper to format a row of data for display
  const formatRowData = (row: any) => {
    return Object.entries(row)
      .filter(([key]) => key !== 'errors' && key !== 'index')
      .map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium">{key}: </span>
          <span className="text-gray-700">{value !== undefined && value !== null ? String(value) : 'N/A'}</span>
        </div>
      ));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Import Validation Results</CardTitle>
        <CardDescription>
          Results of validating {importType} data before import
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total Records</div>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
              Valid Records
            </div>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 mr-1 text-red-500" />
              Invalid Records
            </div>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className={`h-2.5 rounded-full ${
              successRate > 75 ? 'bg-green-600' : successRate > 40 ? 'bg-yellow-500' : 'bg-red-600'
            }`} 
            style={{ width: `${successRate}%` }}>
          </div>
        </div>
        
        {errorCount > 0 && (
          <>
            <Alert className="mb-6" variant={successCount > 0 && allowPartialImport ? "warning" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {successCount > 0 && allowPartialImport 
                  ? "Warning: Some records have validation errors" 
                  : "Error: All records have validation issues"}
              </AlertTitle>
              <AlertDescription>
                {successCount > 0 && allowPartialImport
                  ? "You can proceed with importing valid records or fix the errors and try again."
                  : "Please fix the errors below and try again."}
              </AlertDescription>
            </Alert>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Error Details</h3>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Checkbox 
                    id="select-all" 
                    checked={selectedErrors.length === errorDetails.length && errorDetails.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="ml-2 text-sm cursor-pointer">
                    Select All ({errorDetails.length})
                  </label>
                </div>
                {onExportErrors && (
                  <Button variant="outline" size="sm" onClick={onExportErrors}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Errors
                  </Button>
                )}
              </div>
            </div>
            
            <Accordion type="multiple" className="w-full">
              {errorDetails.map((detail, index) => (
                <AccordionItem value={`error-${index}`} key={index} className="border rounded-md mb-2 p-1">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`error-${index}`}
                      checked={selectedErrors.includes(index)}
                      onCheckedChange={() => toggleSelectError(index)}
                      className="ml-2 mr-2"
                    />
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex flex-1 justify-between items-center">
                        <span className="text-sm font-medium">
                          Record #{detail.index + 1}
                        </span>
                        <Badge variant="destructive" className="mr-4">
                          {detail.errors.length} {detail.errors.length === 1 ? 'error' : 'errors'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="px-4 pt-2">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Errors:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {detail.errors.map((error, errIndex) => (
                          <li key={errIndex} className="text-sm text-red-600">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator className="my-2" />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Record Data:</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {formatRowData(detail.row)}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </>
        )}
        
        {errorCount === 0 && (
          <Alert className="mb-6" variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>All records passed validation</AlertTitle>
            <AlertDescription>
              All {totalRecords} records have passed validation and are ready to import.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          disabled={successCount === 0 || (successCount < totalRecords && !allowPartialImport)}
          onClick={onProceed}
        >
          {successCount === totalRecords
            ? `Import All ${successCount} Records`
            : `Import ${successCount} Valid Records`}
        </Button>
      </CardFooter>
    </Card>
  );
}