import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Plus, Edit, Users, Check, X, Building } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define the Agency type to match our backend schema
type Agency = {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type Broker = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  username: string;
  agencyId: number | null;
  active: boolean;
};

// Form validation schema for adding/editing agencies
const agencyFormSchema = z.object({
  name: z.string().min(2, { message: "Agency name must be at least 2 characters." }),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }).optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  active: z.boolean().default(true)
});

type AgencyFormValues = z.infer<typeof agencyFormSchema>;

export default function Agencies() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [showBrokers, setShowBrokers] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch all agencies
  const { data: agencies, isLoading, refetch } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });
  
  // Fetch brokers for a specific agency
  const { data: agencyBrokers, isLoading: isBrokersLoading } = useQuery<Broker[]>({
    queryKey: ["/api/agencies", selectedAgencyId, "brokers"],
    enabled: selectedAgencyId !== null,
  });
  
  // Filter agencies based on search query
  const filteredAgencies = agencies?.filter(agency => 
    agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agency.contactName && agency.contactName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (agency.contactEmail && agency.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Form for adding a new agency
  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      active: true
    }
  });
  
  // Form for editing an existing agency
  const editForm = useForm<AgencyFormValues>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      website: "",
      active: true
    }
  });
  
  // Set up the edit form when an agency is selected for editing
  useState(() => {
    if (editingAgency) {
      editForm.reset({
        name: editingAgency.name,
        address: editingAgency.address || "",
        city: editingAgency.city || "",
        state: editingAgency.state || "",
        zipCode: editingAgency.zipCode || "",
        contactName: editingAgency.contactName || "",
        contactEmail: editingAgency.contactEmail || "",
        contactPhone: editingAgency.contactPhone || "",
        website: editingAgency.website || "",
        active: editingAgency.active
      });
    }
  });
  
  // Mutation for creating a new agency
  const createAgency = useMutation({
    mutationFn: (data: AgencyFormValues) => {
      return apiRequest('POST', '/api/agencies', data);
    },
    onSuccess: () => {
      toast({
        title: "Agency created",
        description: "New agency has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create agency",
        description: "There was an error creating the agency. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating agency:", error);
    }
  });
  
  // Mutation for updating an existing agency
  const updateAgency = useMutation({
    mutationFn: ({ id, data }: { id: number, data: AgencyFormValues }) => {
      return apiRequest('PATCH', `/api/agencies/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Agency updated",
        description: "Agency information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      setEditingAgency(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update agency",
        description: "There was an error updating the agency. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating agency:", error);
    }
  });
  
  // Submit handler for adding a new agency
  const onSubmit = (data: AgencyFormValues) => {
    createAgency.mutate(data);
  };
  
  // Submit handler for editing an agency
  const onEditSubmit = (data: AgencyFormValues) => {
    if (editingAgency) {
      updateAgency.mutate({ id: editingAgency.id, data });
    }
  };

  // Handler for viewing brokers in an agency
  const handleViewBrokers = (agencyId: number) => {
    setSelectedAgencyId(agencyId);
    setShowBrokers(true);
  };

  return (
    <>
      <Helmet>
        <title>Agencies | BrokerCommissions</title>
        <meta name="description" content="Manage brokerage agencies and their brokers" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agencies</h1>
            <p className="text-muted-foreground">
              Manage brokerage agencies and their brokers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Agency</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Agency</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new brokerage agency.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agency Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter agency name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter address" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="State" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Zip Code" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input placeholder="Contact Name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact Email" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact Phone" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                          </FormControl>
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
                              Mark this agency as active and available for use.
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
                      <Button type="submit" disabled={createAgency.isPending}>
                        {createAgency.isPending ? "Creating..." : "Create Agency"}
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
              <Building2 className="h-5 w-5" />
              <span>Agencies</span>
            </CardTitle>
            <CardDescription>
              View and manage brokerage agencies
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder="Search agencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <AgenciesTableSkeleton />
            ) : filteredAgencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No agencies found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search query" : "Add your first agency to get started"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgencies.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell className="font-medium">
                          {agency.name}
                          {agency.website && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              <a href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="hover:underline">
                                {agency.website}
                              </a>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {agency.contactName && (
                            <div className="font-medium">{agency.contactName}</div>
                          )}
                          {agency.contactEmail && (
                            <div className="text-sm text-muted-foreground">
                              <a href={`mailto:${agency.contactEmail}`} className="hover:underline">
                                {agency.contactEmail}
                              </a>
                            </div>
                          )}
                          {agency.contactPhone && (
                            <div className="text-sm text-muted-foreground">
                              {agency.contactPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {agency.city && agency.state && (
                            <div>{agency.city}, {agency.state}</div>
                          )}
                          {!agency.city && agency.state && (
                            <div>{agency.state}</div>
                          )}
                          {agency.city && !agency.state && (
                            <div>{agency.city}</div>
                          )}
                          {!agency.city && !agency.state && agency.address && (
                            <div className="text-muted-foreground">Address available</div>
                          )}
                          {!agency.city && !agency.state && !agency.address && (
                            <div className="text-muted-foreground">No location data</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={agency.active ? "success" : "destructive"}>
                            {agency.active ? (
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
                          <div className="flex justify-end space-x-2">
                            <Link href={`/agency-dashboard/${agency.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Agency Dashboard"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewBrokers(agency.id)}
                              title="View Brokers"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setEditingAgency(agency)}
                                  title="Edit Agency"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Agency</DialogTitle>
                                  <DialogDescription>
                                    Update agency information
                                  </DialogDescription>
                                </DialogHeader>
                                {editingAgency && (
                                  <Form {...editForm}>
                                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                      <FormField
                                        control={editForm.control}
                                        name="name"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Agency Name</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={editForm.control}
                                          name="address"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Address</FormLabel>
                                              <FormControl>
                                                <Input {...field} value={field.value || ""} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField
                                            control={editForm.control}
                                            name="city"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                  <Input {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={editForm.control}
                                            name="state"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                  <Input {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>
                                      
                                      <FormField
                                        control={editForm.control}
                                        name="zipCode"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Zip Code</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={editForm.control}
                                        name="contactName"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                          control={editForm.control}
                                          name="contactEmail"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Email</FormLabel>
                                              <FormControl>
                                                <Input {...field} value={field.value || ""} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={editForm.control}
                                          name="contactPhone"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Phone</FormLabel>
                                              <FormControl>
                                                <Input {...field} value={field.value || ""} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      <FormField
                                        control={editForm.control}
                                        name="website"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ""} />
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
                                                Mark this agency as active and available for use.
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
                                        <Button type="submit" disabled={updateAgency.isPending}>
                                          {updateAgency.isPending ? "Saving..." : "Save Changes"}
                                        </Button>
                                      </DialogFooter>
                                    </form>
                                  </Form>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
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

      {/* Dialog for viewing brokers in an agency */}
      <Dialog open={showBrokers} onOpenChange={setShowBrokers}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              Agency Brokers
            </DialogTitle>
            <DialogDescription>
              Brokers associated with this agency
            </DialogDescription>
          </DialogHeader>
          
          {isBrokersLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-24 w-full bg-muted rounded animate-pulse"></div>
            </div>
          ) : !agencyBrokers || agencyBrokers.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No Brokers Found</h3>
              <p className="text-muted-foreground mt-1">
                This agency doesn't have any associated brokers yet.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyBrokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">
                        {broker.firstName} {broker.lastName}
                        <div className="text-sm text-muted-foreground">
                          {broker.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{broker.email}</div>
                        {broker.phoneNumber && (
                          <div className="text-sm text-muted-foreground">
                            {broker.phoneNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={broker.active ? "success" : "destructive"}>
                          {broker.active ? (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrokers(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgenciesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-5 w-36 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded mt-2"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-24 bg-muted rounded"></div>
                    <div className="h-3 w-32 bg-muted rounded mt-2"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-8 bg-muted rounded"></div>
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