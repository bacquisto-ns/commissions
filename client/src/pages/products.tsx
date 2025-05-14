import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Plus, Edit, Trash, Check, X, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define the Product type to match our backend schema
type Product = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  defaultCommissionRate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// Form validation schema for adding/editing products
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  code: z.string().min(2, { message: "Product code must be at least 2 characters." }),
  description: z.string().nullable().optional(),
  defaultCommissionRate: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Commission rate must be a positive number." }
  ),
  active: z.boolean().default(true)
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  
  // Fetch all products
  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Filter products based on search query
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Form for adding a new product
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      defaultCommissionRate: "2.00",
      active: true
    }
  });
  
  // Form for editing an existing product
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      defaultCommissionRate: "0.00",
      active: true
    }
  });
  
  // Set up the edit form when a product is selected for editing
  useEffect(() => {
    if (editingProduct) {
      editForm.reset({
        name: editingProduct.name,
        code: editingProduct.code,
        description: editingProduct.description || "",
        defaultCommissionRate: editingProduct.defaultCommissionRate,
        active: editingProduct.active
      });
    }
  }, [editingProduct, editForm]);
  
  // Mutation for creating a new product
  const createProduct = useMutation({
    mutationFn: (data: ProductFormValues) => {
      return apiRequest('POST', '/api/products', data);
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "New product has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create product",
        description: "There was an error creating the product. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating product:", error);
    }
  });
  
  // Mutation for updating an existing product
  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ProductFormValues }) => {
      return apiRequest('PATCH', `/api/products/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "Product information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update product",
        description: "There was an error updating the product. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating product:", error);
    }
  });
  
  // Submit handler for adding a new product
  const onSubmit = (data: ProductFormValues) => {
    createProduct.mutate(data);
  };
  
  // Submit handler for editing a product
  const onEditSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    }
  };

  return (
    <>
      <Helmet>
        <title>Products | BrokerCommissions</title>
        <meta name="description" content="Manage benefit products and commission rates" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage benefit products and commission rates
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new benefit product.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product name" {...field} />
                          </FormControl>
                          <FormDescription>
                            The full name of the benefit product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter product code" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for the product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter product description" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormDescription>
                            A brief description of the product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultCommissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Commission Rate ($)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="pl-8" 
                                placeholder="0.00" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The default commission rate per participant.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>
                              Mark this product as active and available for use.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createProduct.isPending}>
                        {createProduct.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Product Catalog</span>
            </CardTitle>
            <CardDescription>
              View and manage benefit products and commission rates
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ProductsTableSkeleton />
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search query" : "Add your first product to get started"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Commission Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(parseFloat(product.defaultCommissionRate))} per participant</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.active ? "success" : "destructive"}>
                            {product.active ? (
                              <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <X className="h-3 w-3" /> Inactive
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setEditingProduct(product)}
                              >
                                <span className="sr-only">Edit</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Edit Product</DialogTitle>
                                <DialogDescription>
                                  Update product information and commission rates
                                </DialogDescription>
                              </DialogHeader>
                              {editingProduct && (
                                <Form {...editForm}>
                                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                    <FormField
                                      control={editForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Product Name</FormLabel>
                                          <FormControl>
                                            <Input 
                                              defaultValue={editingProduct.name} 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="code"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Product Code</FormLabel>
                                          <FormControl>
                                            <Input 
                                              defaultValue={editingProduct.code} 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="description"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Description</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              defaultValue={editingProduct.description || ""} 
                                              {...field} 
                                              value={field.value || ""}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="defaultCommissionRate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Default Commission Rate ($)</FormLabel>
                                          <FormControl>
                                            <div className="relative">
                                              <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                              <Input 
                                                type="number" 
                                                step="0.01" 
                                                className="pl-8" 
                                                defaultValue={editingProduct.defaultCommissionRate}
                                                {...field} 
                                              />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="active"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                          <div className="space-y-0.5">
                                            <FormLabel>Active Status</FormLabel>
                                            <FormDescription>
                                              Mark this product as active and available for use.
                                            </FormDescription>
                                          </div>
                                          <FormControl>
                                            <input
                                              type="checkbox"
                                              checked={field.value}
                                              onChange={(e) => field.onChange(e.target.checked)}
                                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <DialogFooter>
                                      <Button type="submit" disabled={updateProduct.isPending}>
                                        {updateProduct.isPending ? "Saving..." : "Save Changes"}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </Form>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-5 w-32 bg-muted rounded"></div>
                    <div className="h-3 w-20 bg-muted rounded mt-2"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-36 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <div className="h-8 w-8 bg-muted rounded"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}