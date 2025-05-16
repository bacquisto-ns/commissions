import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImportPreviewTable } from "@/components/import-preview-table";
import Papa from 'papaparse';

interface FileImportProps {
  type: "agencies" | "brokers" | "commissions";
  onDataParsed: (data: any[], headers: string[], errors: Record<number, string[]>) => void;
  requiredFields: string[];
}

export function FileImport({ type, onDataParsed, requiredFields }: FileImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFileError("Please select a CSV file");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsLoading(true);
    setValidationErrors({});
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        if (data.length === 0) {
          setFileError("The uploaded CSV file contains no data");
          setParsedData([]);
          setHeaders([]);
          setIsLoading(false);
          return;
        }
        
        const fileHeaders = Object.keys(data[0]);
        setHeaders(fileHeaders);
        setParsedData(data);
        
        // Validate required fields in headers
        const missingFields = requiredFields.filter(field => !fileHeaders.includes(field));
        if (missingFields.length > 0) {
          setFileError(`The CSV is missing required fields: ${missingFields.join(', ')}`);
        } else {
          setFileError(null);
          // Validate data rows
          const errors = validateData(data, fileHeaders);
          onDataParsed(data, fileHeaders, errors);
        }
        
        setIsLoading(false);
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        setFileError("Failed to parse the CSV file. Please check the format.");
        setIsLoading(false);
      }
    });
  };

  const validateData = (data: any[], headers: string[]): Record<number, string[]> => {
    const errors: Record<number, string[]> = {};
    
    // Validate each row
    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          rowErrors.push(`Missing required field: ${field}`);
        }
      });
      
      // Add type-specific validations
      if (type === 'agencies') {
        if (row.zipCode && !/^\d{5}(-\d{4})?$/.test(String(row.zipCode))) {
          rowErrors.push('Invalid zip code format');
        }
      }
      
      if (type === 'brokers') {
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))) {
          rowErrors.push('Invalid email format');
        }
        if (row.agencyId && isNaN(Number(row.agencyId))) {
          rowErrors.push('Agency ID must be a number');
        }
      }
      
      if (type === 'commissions') {
        if (row.amount && isNaN(Number(row.amount))) {
          rowErrors.push('Amount must be a number');
        }
        if (row.transactionDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(row.transactionDate))) {
          rowErrors.push('Transaction date must be in YYYY-MM-DD format');
        }
      }
      
      if (rowErrors.length > 0) {
        errors[index] = rowErrors;
      }
    });
    
    setValidationErrors(errors);
    return errors;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {type === "agencies" && "Import Agencies"}
          {type === "brokers" && "Import Brokers"}
          {type === "commissions" && "Import Commissions"}
        </CardTitle>
        <CardDescription>
          Upload a CSV file with {type} data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full max-w-xs"
                disabled={isLoading}
              />
              {file && (
                <p className="text-sm text-primary mt-2">
                  Selected file: {file.name}
                </p>
              )}
            </div>
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {/* Format information */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium mb-2">CSV Format Guidelines</h3>
            {type === "agencies" && (
              <p className="text-sm">
                Required columns: {requiredFields.join(', ')}
              </p>
            )}
            {type === "brokers" && (
              <p className="text-sm">
                Required columns: {requiredFields.join(', ')}
              </p>
            )}
            {type === "commissions" && (
              <p className="text-sm">
                Required columns: {requiredFields.join(', ')}
              </p>
            )}
            <p className="text-sm mt-2">
              <Button variant="link" className="p-0 h-auto" asChild>
                <a
                  href={`/api/import/templates/${type}`}
                  download={`${type}-template.csv`}
                  className="text-primary hover:underline"
                >
                  Download template
                </a>
              </Button>
            </p>
          </div>
          
          {/* Preview data if file is uploaded */}
          {parsedData.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-4">Data Preview</h3>
              <ImportPreviewTable 
                headers={headers}
                data={parsedData}
                validationErrors={validationErrors}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}