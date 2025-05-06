import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CardContent, Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, HomeIcon, Percent, DollarSign, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const formSchema = z.object({
  property: z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
    selectedProducts: z.array(z.string()).min(1, "At least one product must be selected"),
    propertyTypeGroup: z.string(),
  }),
  transaction: z.object({
    transactionType: z.string(),
    transactionDate: z.date(),
    transactionAmount: z.string().min(1, "Amount is required"),
    commissionRate: z.string().min(1, "Commission rate is required"),
    notes: z.string().optional(),
  }),
  commissions: z.array(
    z.object({
      brokerId: z.number().int().positive(),
      splitPercentage: z.string().min(1, "Split percentage is required"),
      status: z.string(),
      notes: z.string().optional(),
    })
  ).min(1, "At least one commission split is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCommission() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch brokers for the split dropdown
  const { data: brokers } = useQuery({
    queryKey: ["/api/brokers"],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        selectedProducts: ["fsa"],
        propertyTypeGroup: "benefits",
      },
      transaction: {
        transactionType: "enrollment",
        transactionDate: new Date(),
        transactionAmount: "",
        commissionRate: "2.00",
        notes: "",
      },
      commissions: [
        {
          brokerId: 1, // Default to the first broker (Sarah Johnson)
          splitPercentage: "100",
          status: "pending",
          notes: "",
        },
      ],
    },
  });

  // Create commission mutation
  const createCommission = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('POST', '/api/commissions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/1'] });
      toast({
        title: "Commission created",
        description: "New commission has been successfully created",
      });
      navigate("/commissions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create commission. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle product selection
  const handleProductSelection = (productId: string, checked: boolean) => {
    // Get current selected products
    const currentProducts = form.getValues("property.selectedProducts") || [];
    
    let updatedProducts;
    if (checked) {
      // Add to selected products if checked
      updatedProducts = [...currentProducts, productId];
    } else {
      // Remove from selected products if unchecked
      updatedProducts = currentProducts.filter(id => id !== productId);
    }
    
    // Update the form
    form.setValue("property.selectedProducts", updatedProducts);
    // All products are in the benefits group
    form.setValue("property.propertyTypeGroup", "benefits");
  };

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    createCommission.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate("/commissions")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Commission</h1>
          <p className="text-sm text-muted-foreground">
            Create a new commission record
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HomeIcon className="mr-2 h-5 w-5 text-primary" />
                Employer Details
              </CardTitle>
              <CardDescription>
                Enter the employer information for this commission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="property.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Springfield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="property.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="IL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="property.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="62704" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="property.selectedProducts"
                render={() => (
                  <FormItem>
                    <FormLabel>Products</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { id: "fsa", label: "FSA" },
                        { id: "hsa", label: "HSA" },
                        { id: "cobra", label: "COBRA" },
                        { id: "hra", label: "HRA" },
                        { id: "consolidated_billing", label: "Consolidated Billing" }
                      ].map((product) => {
                        // Get current selected products
                        const selectedProducts = form.getValues("property.selectedProducts") || [];
                        const isChecked = selectedProducts.includes(product.id);
                        
                        return (
                          <div key={product.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`product-${product.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                handleProductSelection(product.id, checked as boolean);
                              }}
                            />
                            <label
                              htmlFor={`product-${product.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {product.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Enter the transaction information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="transaction.transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="enrollment">Enrollment</SelectItem>
                        <SelectItem value="renewal">Renewal</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction.transactionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "MMMM d, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="transaction.transactionAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-8" placeholder="500000" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transaction.commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-8" placeholder="3.00" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="transaction.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional transaction notes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission Split</CardTitle>
              <CardDescription>
                Specify how the commission is split between brokers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="commissions.0.brokerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select broker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brokers?.map((broker: any) => (
                          <SelectItem key={broker.id} value={broker.id.toString()}>
                            {broker.firstName} {broker.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissions.0.splitPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Split Percentage</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" placeholder="50" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Percentage of the total commission that goes to this broker
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissions.0.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissions.0.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional commission notes"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/commissions")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCommission.isPending}>
              {createCommission.isPending ? "Creating..." : "Create Commission"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
