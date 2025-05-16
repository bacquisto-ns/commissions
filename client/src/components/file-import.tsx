import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileType, AlertCircle, Download } from 'lucide-react';
import { parse } from 'papaparse';
import { ImportType } from '@/pages/enhanced-import';

interface FileImportProps {
  importType: ImportType;
  onDataParsed: (data: any[], file: File) => void;
}

export function FileImport({ importType, onDataParsed }: FileImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Handle click on the upload button
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Download template CSV file
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/import/templates/${importType}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${importType}-template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Template Downloaded',
        description: `${importType.charAt(0).toUpperCase() + importType.slice(1)} template downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  // Handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file');
      return;
    }
    
    setUploadedFile(file);
    setFileError(null);
    setIsUploading(true);
    
    // Parse CSV file
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessage = results.errors.map(err => `${err.message} at row ${err.row || 'unknown'}`).join('; ');
          setFileError(`Error parsing CSV: ${errorMessage}`);
          setIsUploading(false);
          return;
        }
        
        if (results.data.length === 0) {
          setFileError('The CSV file is empty');
          setIsUploading(false);
          return;
        }
        
        onDataParsed(results.data, file);
        setIsUploading(false);
      },
      error: (error) => {
        setFileError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    
    if (files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file');
      return;
    }
    
    setUploadedFile(file);
    setFileError(null);
    setIsUploading(true);
    
    // Parse CSV file
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMessage = results.errors.map(err => `${err.message} at row ${err.row || 'unknown'}`).join('; ');
          setFileError(`Error parsing CSV: ${errorMessage}`);
          setIsUploading(false);
          return;
        }
        
        if (results.data.length === 0) {
          setFileError('The CSV file is empty');
          setIsUploading(false);
          return;
        }
        
        onDataParsed(results.data, file);
        setIsUploading(false);
      },
      error: (error) => {
        setFileError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadTemplate}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed rounded-lg p-10 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-gray-500">Processing file...</p>
              </div>
            ) : uploadedFile ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center p-2 bg-blue-50 rounded-lg">
                  <FileType className="h-8 w-8 text-blue-500 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">File uploaded successfully</p>
                <Button size="sm" onClick={handleUploadClick}>
                  Choose Another File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-medium">Drag and drop your CSV file here, or</p>
                  <p className="text-sm text-gray-500">
                    Upload a CSV file with {importType} data
                  </p>
                </div>
                <Button onClick={handleUploadClick}>
                  Browse Files
                </Button>
              </div>
            )}
            
            {fileError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>
                  {fileError}
                </AlertDescription>
              </Alert>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-gray-500">
        <p className="mb-2">File Requirements:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>File must be in CSV format</li>
          <li>First row must contain column headers</li>
          <li>Required columns vary by import type</li>
          <li>Maximum file size: 10MB</li>
          <li>For reference, download the template using the button above</li>
        </ul>
      </div>
    </div>
  );
}