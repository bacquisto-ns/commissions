import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Trash2,
  AlertCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface Commission {
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

// Define sorting fields and directions
export type SortField = 'employer' | 'transaction' | 'date' | 'amount' | 'status';
export type SortDirection = 'asc' | 'desc';

interface CommissionsTableProps {
  commissions: any[]; // Use 'any' to avoid type conflicts between different commission formats
  brokers?: any[]; // Add brokers list to access broker data
  isLoading: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField, direction: SortDirection) => void;
}

export default function CommissionsTable({
  commissions,
  brokers = [], // Add default empty array for brokers
  isLoading,
  showPagination = true,
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange = () => {},
  sortField,
  sortDirection = 'desc',
  onSortChange,
}: CommissionsTableProps) {
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commissionToDelete, setCommissionToDelete] = useState<number | null>(null);
  
  // Delete commission mutation
  const deleteCommission = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/commissions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete commission');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commission deleted",
        description: "The commission has been successfully deleted.",
      });
      // Refresh the commission list
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete commission",
        description: "There was an error deleting the commission.",
        variant: "destructive"
      });
      console.error("Error deleting commission:", error);
    }
  });
  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Format product type for display
  const formatPropertyType = (type: string): string => {
    // For the new product types, display them directly
    if (['fsa', 'hsa', 'cobra', 'hra', 'consolidated_billing'].includes(type.toLowerCase())) {
      return type.toUpperCase();
    }
    
    // For legacy property types, format them as before
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return <CommissionsTableSkeleton />;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox 
                    checked={commissions.length > 0 && selectedIds.length === commissions.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Select all visible commissions
                        onSelectionChange(commissions.map(c => c.id));
                      } else {
                        // Deselect all
                        onSelectionChange([]);
                      }
                    }}
                  />
                </TableHead>
              )}
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onSortChange?.('employer', sortField === 'employer' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc')}
                >
                  Employer Details
                  {sortField === 'employer' ? (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onSortChange?.('transaction', sortField === 'transaction' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc')}
                >
                  Transaction
                  {sortField === 'transaction' ? (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onSortChange?.('date', sortField === 'date' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc')}
                >
                  Date
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead>Split With</TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onSortChange?.('amount', sortField === 'amount' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc')}
                >
                  Amount
                  {sortField === 'amount' ? (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => onSortChange?.('status', sortField === 'status' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc')}
                >
                  Status
                  {sortField === 'status' ? (
                    sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectable ? 8 : 7} className="h-24 text-center">
                  No commissions found
                </TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => (
                <TableRow key={commission.id} className="hover:bg-muted/50">
                  {selectable && (
                    <TableCell className="w-10">
                      <Checkbox 
                        checked={selectedIds.includes(commission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSelectionChange([...selectedIds, commission.id]);
                          } else {
                            onSelectionChange(selectedIds.filter(id => id !== commission.id));
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {commission.transaction.benefitProgram.organization.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {commission.transaction.benefitProgram.programName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="capitalize">{commission.transaction.transactionType}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(Number(commission.transaction.totalCommission))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(commission.transaction.transactionDate), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {/* Display primary broker */}
                      <div>
                        {commission.brokerId && brokers 
                          ? (() => {
                              // Find broker by ID from the brokers list
                              const brokerData = brokers.find(b => b.id === commission.brokerId);
                              return brokerData 
                                ? `${brokerData.firstName} ${brokerData.lastName} (${commission.splitPercentage}%)`
                                : `No Broker/Unassigned (${commission.splitPercentage}%)`;
                            })()
                          : `No Broker/Unassigned (${commission.splitPercentage}%)`
                        }
                      </div>
                      
                      {/* Check if there are other commissions with the same transactionId */}
                      {commissions && commissions.some(c => 
                        c.id !== commission.id && 
                        c.transactionId === commission.transactionId
                      ) && (
                        <div className="text-xs text-muted-foreground">
                          {/* Display other brokers involved in this transaction */}
                          {commissions
                            .filter(c => c.id !== commission.id && c.transactionId === commission.transactionId)
                            .map(c => {
                              // Find broker by ID from the brokers list
                              const otherBrokerData = brokers?.find(b => b.id === c.brokerId);
                              
                              return (
                                <div key={c.id}>
                                  {otherBrokerData 
                                    ? `+ ${otherBrokerData.firstName} ${otherBrokerData.lastName} (${c.splitPercentage}%)`
                                    : `+ Unassigned (${c.splitPercentage}%)`
                                  }
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(Number(commission.amount))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={commission.status} />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end space-x-2">
                    <Button variant="link" asChild>
                      <Link href={`/commissions/${commission.id}`}>Details</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCommissionToDelete(commission.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && totalPages > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{startItem}</span> to{" "}
                <span className="font-medium">{endItem}</span> of{" "}
                <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={i}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    onClick={() => onPageChange?.(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between w-full sm:hidden">
            <Button
              variant="outline"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CommissionsTableSkeleton({ selectable = false }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Skeleton className="h-4 w-4 rounded" />
              </TableHead>
            )}
            <TableHead>Employer Details</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Split With</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {selectable && (
                <TableCell className="w-10">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-9 w-16 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
