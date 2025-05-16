import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommissionsTable, { SortField, SortDirection } from "@/components/commissions-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Plus, Search, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ExportMenu from "@/components/export-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Commissions() {
  // In a real app, we'd get the brokerId from authentication context
  // Use broker ID 10 (Michael Chang) since we assigned commissions to this broker
  const brokerId = 10;
  const [status, setStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedCommissions, setSelectedCommissions] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField | undefined>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [transactionType, setTransactionType] = useState<string>("all");
  const [productType, setProductType] = useState<string>("all");
  const [employerName, setEmployerName] = useState<string>("");
  const { toast } = useToast();
  const pageSize = 10;

  // Define commission data type
  interface CommissionItem {
    id: number;
    amount: number | string;
    status: string;
    splitPercentage: number | string;
    paymentDate?: string | null;
    transaction: {
      transactionDate: string;
      transactionType: string;
      totalCommission: number | string;
      benefitProgram: {
        programName: string;
        programType: string;
        programGroup: string;
        organization: {
          address: string;
          name: string;
          city: string;
          state: string;
          zipCode: string;
        };
      };
    };
    broker?: {
      firstName: string;
      lastName: string;
    } | null;
  }

  interface CommissionsResponse {
    data: CommissionItem[];
    meta: {
      total: number;
      limit: number;
      offset: number;
    };
  }

  // Fetch commissions with enhanced filters and sorting
  const { data: commissionsData = { data: [], meta: { total: 0, limit: pageSize, offset: 0 } }, isLoading } = useQuery<CommissionsResponse>({
    queryKey: [
      "/api/commissions", 
      { 
        brokerId, // Use the brokerId from the component state
        status, 
        offset: (currentPage - 1) * pageSize, 
        limit: pageSize, 
        search: searchQuery,
        date: date ? format(date, "yyyy-MM-dd") : undefined,
        sortField,
        sortDirection,
        transactionType: transactionType !== "all" ? transactionType : undefined,
        productType: productType !== "all" ? productType : undefined,
        employerName: employerName || undefined
      }
    ],
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedCommissions([]); // Clear selection on page change
  };
  
  // Handle sorting changes
  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1); // Reset to first page when sort changes
    setSelectedCommissions([]); // Clear selections
  };
  
  // Mutation for bulk approval of commissions
  const bulkApprove = useMutation({
    mutationFn: async (commissionIds: number[]) => {
      // For each commission in the array, send a request to approve it
      const promises = commissionIds.map(id => 
        apiRequest('PATCH', `/api/commissions/${id}/status`, { 
          status: 'approved', 
          paymentDate: new Date() 
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${brokerId}`] });
      
      toast({
        title: "Commissions Approved",
        description: `Successfully approved ${selectedCommissions.length} commissions`,
      });
      
      // Clear selection after successful operation
      setSelectedCommissions([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve commissions",
        variant: "destructive",
      });
    },
  });
  
  const handleBulkApprove = () => {
    if (selectedCommissions.length > 0) {
      bulkApprove.mutate(selectedCommissions);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all your commission transactions
          </p>
        </div>
        <div className="flex mt-4 sm:mt-0 gap-2">
          <ExportMenu
            data={commissionsData?.data || []}
            filename="commissions"
            label="Export"
          />
          <Button asChild>
            <Link href="/commissions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Commission
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={(value) => setStatus(value)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search commissions..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {(searchQuery || date) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery("");
                  setDate(undefined);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pt-6 px-6">
              <CardTitle>All Commissions</CardTitle>
              <CardDescription>
                View and manage all commission transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CommissionsTable 
                commissions={commissionsData?.data || []}
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                totalItems={commissionsData?.meta?.total || 0}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                selectable={true}
                selectedIds={selectedCommissions}
                onSelectionChange={setSelectedCommissions}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardHeader className="pt-6 px-6">
              <CardTitle>Pending Commissions</CardTitle>
              <CardDescription>
                View and manage commissions awaiting payment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CommissionsTable 
                commissions={(commissionsData?.data || []).filter(commission => commission.status === "pending")}
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                selectable={true}
                selectedIds={selectedCommissions}
                onSelectionChange={setSelectedCommissions}
                totalItems={(commissionsData?.data || []).filter(commission => commission.status === "pending").length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          <Card>
            <CardHeader className="pt-6 px-6">
              <CardTitle>Approved Commissions</CardTitle>
              <CardDescription>
                View and manage approved commission payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CommissionsTable 
                commissions={(commissionsData?.data || []).filter(commission => commission.status === "approved")}
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                totalItems={(commissionsData?.data || []).filter(commission => commission.status === "approved").length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Bulk Action Bar for selected commissions */}
      <BulkActionBar 
        selectedIds={selectedCommissions}
        onApproveSelected={handleBulkApprove}
        onClearSelection={() => setSelectedCommissions([])}
      />
    </div>
  );
}
