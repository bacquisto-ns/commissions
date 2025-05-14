import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommissionsTable from "@/components/commissions-table";
import { Plus, Search, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ExportMenu from "@/components/export-menu";

export default function Commissions() {
  const [status, setStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
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

  // Fetch commissions with filters
  const { data: commissionsData = { data: [], meta: { total: 0, limit: pageSize, offset: 0 } }, isLoading } = useQuery<CommissionsResponse>({
    queryKey: [
      "/api/commissions", 
      { 
        status, 
        offset: (currentPage - 1) * pageSize, 
        limit: pageSize, 
        search: searchQuery,
        date: date ? format(date, "yyyy-MM-dd") : undefined
      }
    ],
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
                commissions={commissionsData?.data || []}
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                totalItems={commissionsData?.meta?.total || 0}
                pageSize={pageSize}
                onPageChange={handlePageChange}
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
                commissions={commissionsData?.data || []}
                isLoading={isLoading}
                showPagination={true}
                currentPage={currentPage}
                totalItems={commissionsData?.meta?.total || 0}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
