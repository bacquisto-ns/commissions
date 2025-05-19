import React, { useState, useEffect } from "react";
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
import { CardContent, Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  CalendarIcon, HomeIcon, Percent, DollarSign, ArrowLeft, Users, 
  PlusCircle, MinusCircle, CheckCircle, Package, Layers 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Form validation schema
const formSchema = z.object({
  property: z.object({
    name: z.string().min(2, "Employer name must be at least 2 characters"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    propertyTypeGroup: z.string(),
  }),
  // Global transaction details
  transaction: z.object({
    transactionType: z.string(),
    transactionDate: z.date(),
    notes: z.string().optional(),
  }),
  // Product specific details
  productDetails: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      participantCount: z.string(), // Will be parsed to number when submitting
      commissionRate: z.string(), // Will be parsed to number when submitting
      transactionAmount: z.string(), // Will be parsed to number when submitting
      useFixedAmount: z.boolean().default(false), // Whether to use fixed amount instead of calculated
      commissions: z.array(
        z.object({
          brokerId: z.number(),
          splitPercentage: z.string(), // Will be parsed to number when submitting
          status: z.string().optional(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

// Product data mapping with rich descriptions
const PRODUCTS = [
  { 
    id: "fsa", 
    label: "FSA", 
    description: "Flexible Spending Account for healthcare expenses", 
    icon: <Package className="h-6 w-6 text-primary" /> 
  },
  { 
    id: "hsa", 
    label: "HSA", 
    description: "Health Savings Account for qualified medical expenses", 
    icon: <Package className="h-6 w-6 text-primary" /> 
  },
  { 
    id: "cobra", 
    label: "COBRA", 
    description: "Continuation of health coverage after job loss", 
    icon: <Layers className="h-6 w-6 text-primary" /> 
  },
  { 
    id: "hra", 
    label: "HRA", 
    description: "Health Reimbursement Arrangement for medical expenses", 
    icon: <Package className="h-6 w-6 text-primary" /> 
  },
  { 
    id: "consolidated_billing", 
    label: "Consolidated Billing", 
    description: "Combined billing for multiple benefit plans", 
    icon: <Layers className="h-6 w-6 text-primary" /> 
  }
];

export default function NewCommission() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Initialize the selectedProducts from localStorage if available
  const [selectedProducts, setSelectedProducts] = useState<string[]>(() => {
    const savedProducts = localStorage.getItem('commission_selected_products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  
  // Start with product selection, but store step in localStorage to persist it
  const [step, setStep] = useState<'select-products' | 'form'>(() => {
    // Check if we have a stored step in localStorage
    const savedStep = localStorage.getItem('commission_form_step');
    // Only use 'form' if we also have selected products stored
    if (savedStep === 'form' && localStorage.getItem('commission_selected_products')) {
      return 'form';
    }
    return 'select-products';
  });
  
  // Fetch brokers for the split dropdown
  const { data: brokers } = useQuery({
    queryKey: ["/api/brokers"],
  });
  
  // Periodically save form state to prevent timeout issues
  useEffect(() => {
    // Function to save form state
    const saveFormState = () => {
      if (step === 'form') {
        const formData = JSON.stringify(form.getValues());
        localStorage.setItem('commission_form_data', formData);
      }
    };
    
    // Save form state every 30 seconds
    const intervalId = setInterval(saveFormState, 30000);
    
    // Also save on window blur (when user switches tabs or apps)
    const handleBlur = () => saveFormState();
    window.addEventListener('blur', handleBlur);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('blur', handleBlur);
    };
  }, [step]);
  
  // Try to load saved form data from localStorage
  const getSavedFormData = () => {
    try {
      const savedFormData = localStorage.getItem('commission_form_data');
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        
        // Ensure the transaction date is properly converted back to a Date object
        if (parsedData.transaction && parsedData.transaction.transactionDate) {
          parsedData.transaction.transactionDate = new Date(parsedData.transaction.transactionDate);
        }
        
        return parsedData;
      }
    } catch (error) {
      console.error("Error loading saved form data:", error);
    }
    
    // Default values if no saved data or error occurred
    return {
      property: {
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        propertyTypeGroup: "health",
      },
      transaction: {
        transactionType: "enrollment",
        transactionDate: new Date(),
        notes: "",
      },
      productDetails: [],
    };
  };
  
  // Form setup with saved data (if available)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getSavedFormData(),
    shouldUnregister: false,
  });

  // Create commission mutation
  const createCommission = useMutation({
    mutationFn: async (data: FormValues) => {
      // Add mock data to backend endpoint for now
      const mockOrganization = {
        organization: {
          name: data.property.name,
          address: "123 Main St",
          city: "Sample City",
          state: "ST",
          zipCode: "12345",
          contactName: "John Doe",
          contactEmail: "john.doe@example.com",
          contactPhone: "555-555-5555"
        },
        benefitProgram: {
          groupName: "Company Benefits",
          groupNumber: "BG123456",
          programType: data.productDetails[0].productId || "cobra",
          benefitProgramGroup: "health",
          effectiveDate: new Date().toISOString(),
          terminationDate: null,
          notes: ""
        },
        transaction: {
          transactionType: data.transaction.transactionType,
          transactionDate: data.transaction.transactionDate.toISOString(),
          participantCount: parseInt(data.productDetails[0].participantCount) || 100,
          notes: data.transaction.notes || ""
        },
        commissions: data.productDetails[0].commissions.filter(c => parseInt(c.splitPercentage) > 0).map(c => ({
          brokerId: c.brokerId,
          amount: ((parseInt(data.productDetails[0].participantCount) * parseFloat(data.productDetails[0].commissionRate)) * (parseInt(c.splitPercentage) / 100)).toFixed(2),
          status: "pending",
          paymentDate: null,
          notes: c.notes || ""
        }))
      };
      
      return apiRequest('POST', '/api/commissions/simple', mockOrganization);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/7'] });
      toast({
        title: "Commission created",
        description: "New commission has been successfully created",
      });
      
      // Clear local storage on successful submission
      localStorage.removeItem('commission_form_step');
      localStorage.removeItem('commission_selected_products');
      localStorage.removeItem('commission_form_data');
      
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

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createCommission.mutate(data);
  };

  // Calculate estimated amount based on participant count and rate
  const updateCommissionAmount = (productIndex: number) => {
    const productDetails = form.getValues(`productDetails.${productIndex}`);
    if (!productDetails) return;
    
    const participantCount = parseInt(productDetails.participantCount) || 0;
    const commissionRate = parseFloat(productDetails.commissionRate) || 0;
    const estimatedAmount = (participantCount * commissionRate).toFixed(2);
    
    form.setValue(`productDetails.${productIndex}.transactionAmount`, estimatedAmount);
  };

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      let newSelection;
      // If product is already selected, remove it
      if (prev.includes(productId)) {
        newSelection = prev.filter(id => id !== productId);
      } else {
        // Otherwise add it
        newSelection = [...prev, productId];
      }
      
      // Save to localStorage
      localStorage.setItem('commission_selected_products', JSON.stringify(newSelection));
      return newSelection;
    });
  };

  // Initialize form with selected products
  const initializeFormWithProducts = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product",
        variant: "destructive"
      });
      return;
    }

    // Create product details array from selections
    const productDetails = selectedProducts.map(productId => {
      const productInfo = PRODUCTS.find(p => p.id === productId);
      return {
        productId: productInfo?.id || "",
        productName: productInfo?.label || "",
        participantCount: "100",
        commissionRate: "2.00",
        transactionAmount: "200.00",
        useFixedAmount: false, // Default to calculated amount
        commissions: [
          {
            brokerId: 0, // No Broker / Unassigned
            splitPercentage: "100",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 0, // No Broker / Unassigned
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 0, // No Broker / Unassigned
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
          {
            brokerId: 0, // No Broker / Unassigned
            splitPercentage: "0",
            status: "pending",
            notes: "",
          },
        ],
      };
    });

    // Update form with selected products
    form.setValue("productDetails", productDetails);
    setStep('form');
    // Save form step to localStorage
    localStorage.setItem('commission_form_step', 'form');
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

      {step === 'select-products' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Select Products
            </CardTitle>
            <CardDescription>
              Choose which products to include in this commission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRODUCTS.map(product => (
                <div 
                  key={product.id}
                  className={`relative p-6 border rounded-lg cursor-pointer transition-all
                    ${selectedProducts.includes(product.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/40 hover:bg-muted/20'}`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {product.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{product.label}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                  {selectedProducts.includes(product.id) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </p>
            <Button 
              onClick={initializeFormWithProducts}
              disabled={selectedProducts.length === 0}
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setStep('select-products');
                  localStorage.setItem('commission_form_step', 'select-products');
                }}
                className="mb-4"
              >
                Change Product Selection
              </Button>
            </div>
            
            {/* Employer Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HomeIcon className="mr-2 h-5 w-5" />
                  Employer Details
                </CardTitle>
                <CardDescription>
                  Enter information about the employer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="property.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter employer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
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
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
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
                          <Input placeholder="Enter zip code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="property.propertyTypeGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="dental">Dental</SelectItem>
                          <SelectItem value="vision">Vision</SelectItem>
                          <SelectItem value="life">Life</SelectItem>
                          <SelectItem value="disability">Disability</SelectItem>
                          <SelectItem value="retirement">Retirement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Transaction Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  Transaction Details
                </CardTitle>
                <CardDescription>
                  Enter general transaction information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transaction.transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                className="w-full pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes or comments"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Product Details Section */}
            <div className="space-y-4">
              {form.watch("productDetails").map((product, productIndex) => (
                <Card key={`product-${productIndex}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Package className="mr-2 h-5 w-5" />
                      {product.productName} Details
                    </CardTitle>
                    <CardDescription>
                      Enter specific details for this product
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`productDetails.${productIndex}.useFixedAmount`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 mb-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Override with fixed amount</FormLabel>
                            <FormDescription>
                              Use a custom commission amount instead of the calculated one
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.participantCount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Participant Count</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="100"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (!form.getValues(`productDetails.${productIndex}.useFixedAmount`)) {
                                      updateCommissionAmount(productIndex);
                                    }
                                  }}
                                  disabled={form.getValues(`productDetails.${productIndex}.useFixedAmount`)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.commissionRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Rate</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="2.00"
                                  className="pl-10"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (!form.getValues(`productDetails.${productIndex}.useFixedAmount`)) {
                                      updateCommissionAmount(productIndex);
                                    }
                                  }}
                                  disabled={form.getValues(`productDetails.${productIndex}.useFixedAmount`)}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Dollar amount per participant
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`productDetails.${productIndex}.transactionAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="200.00"
                                  className="pl-10"
                                  {...field}
                                  readOnly={!form.getValues(`productDetails.${productIndex}.useFixedAmount`)}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {form.getValues(`productDetails.${productIndex}.useFixedAmount`) 
                                ? "Fixed commission amount" 
                                : "Auto-calculated commission"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-base font-medium mb-2">Commission Splits</h3>
                    
                    {product.commissions.map((commission, commissionIndex) => (
                      <div key={`commission-${productIndex}-${commissionIndex}`} className="p-4 border rounded-md mb-4">
                        <h4 className="text-sm font-medium mb-3">Broker {commissionIndex + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`productDetails.${productIndex}.commissions.${commissionIndex}.brokerId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Broker</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))} 
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a broker" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">No Broker / Unassigned</SelectItem>
                                    {brokers?.map((broker) => (
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
                            name={`productDetails.${productIndex}.commissions.${commissionIndex}.splitPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Split Percentage</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="100"
                                      className="pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name={`productDetails.${productIndex}.commissions.${commissionIndex}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter any notes for this broker's commission"
                                    className="min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2"
                onClick={() => navigate("/commissions")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCommission.isPending}>
                {createCommission.isPending ? "Creating..." : "Create Commission"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}