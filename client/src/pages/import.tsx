import { useState } from "react";
import { Helmet } from "react-helmet";
import { FileText, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState("agencies");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState("");
  const [importCount, setImportCount] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus('idle');
      setImportMessage("");
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTab);

      const response = await fetch(`/api/import/${activeTab}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportStatus('success');
        setImportMessage(data.message || "Import completed successfully");
        setImportCount(data.count || 0);
        toast({
          title: "Import successful",
          description: `${data.count || 0} records imported successfully`,
        });
      } else {
        setImportStatus('error');
        setImportMessage(data.message || "Import failed");
        toast({
          title: "Import failed",
          description: data.message || "An error occurred during import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus('error');
      setImportMessage("An error occurred during import");
      toast({
        title: "Import error",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Import Data | Broker Commissions</title>
      </Helmet>

      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Import Data</h1>
            <p className="text-muted-foreground mt-1">
              Import agencies, brokers, or commissions from CSV files
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="agencies">Agencies</TabsTrigger>
            <TabsTrigger value="brokers">Brokers</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {activeTab === "agencies" && "Import Agencies"}
                {activeTab === "brokers" && "Import Brokers"}
                {activeTab === "commissions" && "Import Commissions"}
              </CardTitle>
              <CardDescription>
                {activeTab === "agencies" && "Upload a CSV file with agency information"}
                {activeTab === "brokers" && "Upload a CSV file with broker information"}
                {activeTab === "commissions" && "Upload a CSV file with commission data"}
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
                    />
                    {file && (
                      <p className="text-sm text-primary mt-2">
                        Selected file: {file.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Format information */}
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-medium mb-2">CSV Format Guidelines</h3>
                  {activeTab === "agencies" && (
                    <p className="text-sm">
                      Required columns: name, address, city, state, zipCode, phone, email, website
                    </p>
                  )}
                  {activeTab === "brokers" && (
                    <p className="text-sm">
                      Required columns: firstName, lastName, email, phone, agencyId
                    </p>
                  )}
                  {activeTab === "commissions" && (
                    <p className="text-sm">
                      Required columns: brokerId, amount, status, transactionDate, transactionType, programName, programType, employerName
                    </p>
                  )}
                  <p className="text-sm mt-2">
                    <a
                      href={`/templates/${activeTab}-template.csv`}
                      download
                      className="text-primary hover:underline"
                    >
                      Download template
                    </a>
                  </p>
                </div>

                {/* Import status */}
                {importStatus === 'success' && (
                  <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-800" />
                    <AlertTitle>Import Successful</AlertTitle>
                    <AlertDescription>
                      {importMessage || `${importCount} records imported successfully.`}
                    </AlertDescription>
                  </Alert>
                )}

                {importStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Import Failed</AlertTitle>
                    <AlertDescription>
                      {importMessage || "An error occurred during import. Please check your file format and try again."}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={!file || isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import {activeTab}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </>
  );
}