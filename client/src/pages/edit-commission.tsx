import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, FileText, Calendar, DollarSign, Percent, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

// Commission edit form schema
const formSchema = z.object({
  splitPercentage: z.string().min(1, "Split percentage is required"),
  amount: z.string().min(1, "Amount is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved"]),
});

type FormValues = z.infer<typeof formSchema>;

// Commission details interface
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
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    agencyId?: number;
  } | null;
}

export default function EditCommission() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  // Fetch commission details
  const { data: commission, isLoading } = useQuery<CommissionDetails>({
    queryKey: [`/api/commissions/${id}`],
  });

  // Create form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      splitPercentage: "",
      amount: "",
      notes: "",
      status: "pending",
    },
  });

  // Update form values when commission data is loaded
  useEffect(() => {
    if (commission) {
      form.reset({
        splitPercentage: String(commission.splitPercentage),
        amount: String(commission.amount),
        notes: commission.notes || "",
        status: commission.status as "pending" | "approved",
      });
    }
  }, [commission, form]);

  // Update commission mutation
  const updateCommission = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('PATCH', `/api/commissions/${id}`, values);
    },
    onSuccess: () => {
      // Invalidate the specific commission details
      queryClient.invalidateQueries({ queryKey: [`/api/commissions/${id}`] });
      
      // Invalidate all commissions lists
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      
      // Invalidate broker dashboard data - get broker ID from commission if available
      const brokerId = commission?.broker?.id || 10;
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/${brokerId}`] });
      
      // Invalidate agency dashboard data if this commission is associated with an agency
      if (commission?.broker?.agencyId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/agency-dashboard/${commission.broker.agencyId}`] 
        });
      }
      
      // Invalidate any other related queries
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      
      toast({
        title: "Commission updated",
        description: "Commission has been successfully updated",
      });
      navigate(`/commissions/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update commission",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // If status is changing to approved, show confirmation dialog
    if (values.status === "approved" && commission?.status === "pending") {
      setFormValues(values);
      setShowApprovalDialog(true);
    } else {
      // Otherwise, proceed with update
      updateCommission.mutate(values);
    }
  };
  
  const handleConfirmApproval = () => {
    if (formValues) {
      updateCommission.mutate(formValues);
      setShowApprovalDialog(false);
      setFormValues(null);
    }
  };

  if (isLoading) {
    return <EditCommissionSkeleton />;
  }

  if (!commission) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText className="w-16 h-16 text-destructive mb-6" />
        <h2 className="text-xl font-medium mb-2">Commission Not Found</h2>
        <p className="text-muted-foreground mb-6">The commission you're trying to edit doesn't exist or was deleted.</p>
        <Button onClick={() => navigate("/commissions")}>Back to Commissions</Button>
      </div>
    );
  }

  // Format data for display
  const { transaction } = commission;
  const { benefitProgram } = transaction;
  const { organization } = benefitProgram;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(`/commissions/${id}`)} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Edit Commission</h1>
            <p className="text-sm text-muted-foreground">
              Update commission details for {organization.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Transaction Information
            </CardTitle>
            <CardDescription>View transaction details for this commission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employer Name</p>
              <p className="font-medium">{organization.name}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Employer Address</p>
              <p>{organization.address}</p>
              <p>{organization.city}, {organization.state} {organization.zipCode}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Program Details</p>
              <p className="font-medium">{benefitProgram.programName}</p>
              <p className="text-sm">{benefitProgram.programType}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction Type</p>
              <p className="capitalize">{transaction.transactionType}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction Date</p>
              <p>{new Date(transaction.transactionDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-primary" />
              Edit Commission Details
            </CardTitle>
            <CardDescription>Update commission information</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="splitPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Split Percentage (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="100" />
                        </FormControl>
                        <FormDescription>Your percentage of the total commission</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Amount ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" />
                        </FormControl>
                        <FormDescription>Your commission amount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Current status of this commission</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Add any additional notes about this commission" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={updateCommission.isPending}>
                  {updateCommission.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-warning" />
              Approve Commission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this commission? This will mark it as paid and set the payment date to today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApproval}>
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditCommissionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-10 w-20 mr-4" />
        <div>
          <Skeleton className="h-7 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-40 mt-1" />
              </div>
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-40 mt-1" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-40 mt-1" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}