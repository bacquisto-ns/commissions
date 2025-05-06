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
import { CalendarIcon, HomeIcon, Percent, DollarSign, ArrowLeft, Users, PlusCircle, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Form validation schema
const formSchema = z.object({
  property: z.object({
    address: z.string().min(5, "Address must be at least 5 characters"),
    city: z.string().min(2, "City must be at least 2 characters"),
    state: z.string().min(2, "State must be at least 2 characters"),
    zipCode: z.string().min(5, "Zip code must be at least 5 characters"),
    propertyTypeGroup: z.string(),
  }),
  // Global transaction details
  transaction: z.object({
    transactionType: z.string(),
    transactionDate: z.date(),
    notes: z.string().optional(),
  }),
  // Product-specific details
  productDetails: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      participantCount: z.string().min(1, "Participant count is required"),
      commissionRate: z.string().min(1, "Commission rate is required"),
      transactionAmount: z.string().min(1, "Amount is required"),
      commissions: z.array(
        z.object({
          brokerId: z.number().int().positive(),
          splitPercentage: z.string().min(1, "Split percentage is required"),
          status: z.string(),
          notes: z.string().optional(),
        })
      ).min(1, "At least one commission split is required"),
    })
  ).min(1, "At least one product detail is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCommission() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch brokers for the split dropdown
  const { data: brokers } = useQuery({
    queryKey: ["/api/brokers"],
  });

  // Product data mapping
  const PRODUCTS = [
    { id: "fsa", label: "FSA" },
    { id: "hsa", label: "HSA" },
    { id: "cobra", label: "COBRA" },
    { id: "hra", label: "HRA" },
    { id: "consolidated_billing", label: "Consolidated Billing" }
  ];

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property: {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        propertyTypeGroup: "health", // Updated to use a valid enum value
      },
      transaction: {
        transactionType: "enrollment",
        transactionDate: new Date(),
        notes: "",
      },
      productDetails: [
        {
          productId: "fsa",
          productName: "FSA",
          participantCount: "100",
          commissionRate: "2.00",
          transactionAmount: "200.00",
          commissions: [
            {
              brokerId: 1, // Default to the first broker (Sarah Johnson)
              splitPercentage: "100",
              status: "pending",
              notes: "",
            },
            {
              brokerId: 1,
              splitPercentage: "0",
              status: "pending",
              notes: "",
            },
            {
              brokerId: 1,
              splitPercentage: "0",
              status: "pending",
              notes: "",
            },
            {
              brokerId: 1,
              splitPercentage: "0",
              status: "pending",
              notes: "",
            },
          ],
        },
      ],
    },
  });

  // Create commission mutation
  const createCommission = useMutation({
    mutationFn: async (data: FormValues) => {
      // Convert string values to appropriate types
      const processedData = {
        ...data,
        productDetails: data.productDetails.map(product => {
          return {
            ...product,
            participantCount: parseInt(product.participantCount),
            transactionAmount: parseFloat(product.transactionAmount) || 0,
            commissionRate: parseFloat(product.commissionRate) || 2.00,
            commissions: product.commissions.map(commission => ({
              ...commission,
              splitPercentage: parseFloat(commission.splitPercentage) || 100
            }))
          };
        })
      };
      
      return apiRequest('POST', '/api/commissions', processedData);
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

  // Add a new product to the form
  const addProduct = (productId: string) => {
    const currentProductDetails = form.getValues("productDetails") || [];
    
    // Find if this product is already added
    const existingProduct = currentProductDetails.find(p => p.productId === productId);
    if (existingProduct) {
      toast({
        title: "Product already added",
        description: "This product is already in your commission form.",
        variant: "destructive",
      });
      return;
    }
    
    // Find the product information
    const productInfo = PRODUCTS.find(p => p.id === productId);
    if (!productInfo) return;
    
    // Add new product detail
    const updatedProductDetails = [
      ...currentProductDetails, 
      {
        productId: productInfo.id,
        productName: productInfo.label,
        participantCount: "100",
        commissionRate: "2.00",
        transactionAmount: "200.00",
        commissions: [
          {
            brokerId: 1,
            splitPercentage: "100",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 1,
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 1,
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 1,
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
        ],
      }
    ];
    
    // Update the form
    form.setValue("productDetails", updatedProductDetails);
  };

  // Remove a product from the form
  const removeProduct = (productIndex: number) => {
    const currentProductDetails = form.getValues("productDetails") || [];
    
    // Ensure we always have at least one product
    if (currentProductDetails.length <= 1) {
      toast({
        title: "Cannot remove product",
        description: "You must have at least one product.",
        variant: "destructive",
      });
      return;
    }
    
    // Remove the product at the specified index
    const updatedProductDetails = currentProductDetails.filter((_, index) => index !== productIndex);
    
    // Update the form
    form.setValue("productDetails", updatedProductDetails);
  };

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    createCommission.mutate(data);
  };

  // Calculate estimated commission based on participant count and rate
  const calculateEstimatedCommission = (participantCount: string, rate: string) => {
    const count = parseInt(participantCount) || 0;
    const commissionRate = parseFloat(rate) || 0;
    return (count * commissionRate).toFixed(2);
  };

  // Update the transaction amount when participant count or commission rate changes
  const updateTransactionAmount = (productIndex: number) => {
    const participantCount = form.getValues(`productDetails.${productIndex}.participantCount`);
    const commissionRate = form.getValues(`productDetails.${productIndex}.commissionRate`);
    const estimatedAmount = calculateEstimatedCommission(participantCount, commissionRate);
    
    form.setValue(`productDetails.${productIndex}.transactionAmount`, estimatedAmount);
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
          {/* Employer Details Section */}
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
              
              <div className="grid gap-4 md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="property.propertyTypeGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                          <SelectItem value="retirement">Retirement</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The group category of the benefits being managed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Enter the global transaction information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <FormField
                control={form.control}
                name="transaction.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Notes</FormLabel>
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

          {/* Add Product Section */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Add the products included in this commission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => addProduct(value)}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Add a product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Product Details Sections */}
          {form.getValues("productDetails").map((product, productIndex) => (
            <Card key={product.productId} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 mt-2 mr-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {product.productName}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon"
                  type="button"
                  onClick={() => removeProduct(productIndex)}
                  className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                >
                  <MinusCircle className="h-5 w-5" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {product.productName} Details
                </CardTitle>
                <CardDescription>
                  Enter the specific details for {product.productName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`productDetails.${productIndex}.participantCount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participant Count</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              className="pl-8" 
                              type="number" 
                              placeholder="100" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                updateTransactionAmount(productIndex);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Number of participants in the program
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`productDetails.${productIndex}.commissionRate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate ($ per participant)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              className="pl-8" 
                              placeholder="2.00" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                updateTransactionAmount(productIndex);
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`productDetails.${productIndex}.transactionAmount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Calculated: ${calculateEstimatedCommission(
                            form.getValues(`productDetails.${productIndex}.participantCount`),
                            form.getValues(`productDetails.${productIndex}.commissionRate`)
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Commission Split Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-md font-medium">Commission Split</h3>
                  <p className="text-sm text-muted-foreground">Specify how the commission for {product.productName} is split between brokers</p>
                  
                  {product.commissions.map((commission, commissionIndex) => (
                    <div key={commissionIndex} className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.commissions.${commissionIndex}.brokerId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Broker</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString() || "1"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select broker" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(brokers) ? brokers.map((broker: any) => (
                                  <SelectItem key={broker.id} value={broker.id.toString()}>
                                    {broker.firstName} {broker.lastName}
                                  </SelectItem>
                                )) : null}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.commissions.${commissionIndex}.splitPercentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Split Percentage</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-8" placeholder="100" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.commissions.${commissionIndex}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

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