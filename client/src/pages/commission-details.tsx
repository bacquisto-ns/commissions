import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/status-badge";
import { format } from "date-fns";
import { ArrowLeft, FileText, Home, User, Calendar, DollarSign, Percent, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Updated interface to match our new data structure
interface CommissionDetails {
  id: number;
  amount: string | number;
  splitPercentage: string | number;
  status: string;
  paymentDate?: string;
  notes?: string | null;
  transaction: {
    transactionDate: string;
    transactionType: string;
    totalCommission: string | number;
    participantCount: number;
    commissionRate: string | number;
    benefitProgram: {
      programName: string;
      programType: string;
      programGroup: string;
      organization: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
      };
    };
  };
  broker?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export default function CommissionDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [openStatusDialog, setOpenStatusDialog] = useState(false);

  // Fetch commission details
  const { data: commission, isLoading } = useQuery<CommissionDetails>({
    queryKey: [`/api/commissions/${id}`],
  });

  // Update commission status mutation
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const paymentDate = status === 'approved' ? new Date() : null;
      return apiRequest('PATCH', `/api/commissions/${id}/status`, { status, paymentDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/commissions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/7'] }); // Using broker ID 7 instead of 1
      toast({
        title: "Status updated",
        description: "Commission status has been successfully updated",
      });
      setOpenStatusDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update commission status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <CommissionDetailsSkeleton />;
  }

  if (!commission) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h2 className="text-xl font-medium mb-2">Commission Not Found</h2>
        <p className="text-muted-foreground mb-6">The commission you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => navigate("/commissions")}>Back to Commissions</Button>
      </div>
    );
  }

  const { transaction, broker } = commission;
  const { benefitProgram } = transaction;
  const { organization } = benefitProgram;
  
  // Format program type for display
  const programTypeFormatted = benefitProgram.programType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate("/commissions")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Commission Details</h1>
          <p className="text-sm text-muted-foreground">
            View and manage commission for {organization.address}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5 text-primary" />
              Employer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-foreground">{organization.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-foreground">{organization.city}, {organization.state} {organization.zipCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Type</p>
              <p className="text-foreground">{programTypeFormatted}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction Type</p>
              <p className="text-foreground capitalize">{transaction.transactionType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
              <p className="text-foreground">{format(new Date(transaction.transactionDate), 'MMMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Participant Count</p>
              <p className="text-foreground">{transaction.participantCount} participants</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Commission</p>
              <p className="text-foreground">{formatCurrency(Number(transaction.totalCommission))}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Commission Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                <p className="text-lg font-semibold">${transaction.commissionRate} per participant</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-lg font-semibold">{formatCurrency(Number(transaction.totalCommission))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Split</p>
                <p className="text-lg font-semibold">{commission.splitPercentage}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(Number(commission.amount))}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={commission.status} />
                </div>
              </div>
              {commission.paymentDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="text-lg font-semibold">{format(new Date(commission.paymentDate), 'MMMM d, yyyy')}</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Split With</p>
              {broker ? (
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{broker.firstName} {broker.lastName}</p>
                    <p className="text-sm text-muted-foreground">{broker.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No broker assigned
                </div>
              )}
            </div>

            {commission.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{commission.notes}</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {commission.status !== 'approved' && (
              <AlertDialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="mr-2">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Approved
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Commission as Approved?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update the commission status to "Approved" and record today's date as the approval date.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => updateStatus.mutate('approved')}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? "Updating..." : "Confirm"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {commission.status === 'approved' && commission.paymentDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="mr-2 h-4 w-4 text-approved" />
                Approved on {format(new Date(commission.paymentDate), 'MMMM d, yyyy')}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function CommissionDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-10 w-24 mr-4" />
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-3" />
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}