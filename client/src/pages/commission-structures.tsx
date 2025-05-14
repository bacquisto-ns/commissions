import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  PlusIcon, 
  Pencil2Icon, 
  Cross2Icon,
  CheckIcon
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ExportMenu from "@/components/export-menu";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCommissionStructure, CommissionStructureType } from "@/lib/commission-calculator";

// Form schema for commission structure
const structureFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  structureType: z.enum(["flat_rate", "per_participant", "tiered_participant", "percentage"]),
  description: z.string().optional(),
  configData: z.string().refine(
    (data) => {
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Config data must be valid JSON",
    }
  ),
  active: z.boolean().default(true)
});

type StructureFormValues = z.infer<typeof structureFormSchema>;

// Example config templates based on structure type
const configTemplates = {
  flat_rate: { rate: 500.00 },
  per_participant: { ratePerParticipant: 2.00 },
  tiered_participant: { 
    tiers: [
      { min: 0, max: 100, rate: 1.50 },
      { min: 101, max: 500, rate: 2.00 },
      { min: 501, max: -1, rate: 2.50 } // -1 means no upper limit
    ]
  },
  percentage: { percentage: 5.00 }
};

export default function CommissionStructuresPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Define structure type
  interface CommissionStructureItem {
    id: number;
    name: string;
    description?: string;
    structureType: string;
    configData: string;
    active: boolean;
  }
  
  // Fetch commission structures
  const { data: structures = [], isLoading } = useQuery<CommissionStructureItem[]>({
    queryKey: ['/api/commission-structures'],
    enabled: true,
  });
  
  // Create form
  const createForm = useForm<StructureFormValues>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      name: "",
      structureType: "per_participant",
      description: "",
      configData: JSON.stringify(configTemplates.per_participant, null, 2),
      active: true
    }
  });
  
  // Edit form
  const editForm = useForm<StructureFormValues>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      name: "",
      structureType: "per_participant",
      description: "",
      configData: "{}",
      active: true
    }
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: StructureFormValues) => {
      const response = await fetch('/api/commission-structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create commission structure');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-structures'] });
      toast({
        title: "Success",
        description: "Commission structure created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StructureFormValues }) => {
      const response = await fetch(`/api/commission-structures/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update commission structure');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-structures'] });
      toast({
        title: "Success",
        description: "Commission structure updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingStructure(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle structure type change to update config template
  const handleStructureTypeChange = (value: string, form: any) => {
    const templateType = value as keyof typeof configTemplates;
    const template = configTemplates[templateType];
    form.setValue('structureType', value);
    form.setValue('configData', JSON.stringify(template, null, 2));
  };
  
  // Handle create form submission
  const onCreateSubmit = (data: StructureFormValues) => {
    createMutation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: StructureFormValues) => {
    if (editingStructure) {
      updateMutation.mutate({ id: editingStructure.id, data });
    }
  };
  
  // Open edit dialog with structure data
  const handleEditStructure = (structure: any) => {
    setEditingStructure(structure);
    editForm.reset({
      name: structure.name,
      structureType: structure.structureType,
      description: structure.description || '',
      configData: structure.configData,
      active: structure.active
    });
    setIsEditDialogOpen(true);
  };
  
  return (
    <>
      <Helmet>
        <title>Commission Structures | Commission Management</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Structures</h1>
          <p className="text-muted-foreground mt-1">Manage commission calculation methods and rules</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ExportMenu
            data={structures || []}
            filename="commission-structures"
            label="Export Structures"
            variant="outline"
          />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Structure
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No commission structures found
                    </TableCell>
                  </TableRow>
                ) : (
                  structures.map((structure: any) => (
                    <TableRow key={structure.id}>
                      <TableCell className="font-medium">{structure.name}</TableCell>
                      <TableCell>
                        {structure.structureType === 'flat_rate' ? 'Flat Rate' :
                         structure.structureType === 'per_participant' ? 'Per Participant' :
                         structure.structureType === 'tiered_participant' ? 'Tiered by Participants' :
                         structure.structureType === 'percentage' ? 'Percentage' : 
                         'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatCommissionStructure(
                          structure.structureType as CommissionStructureType, 
                          structure.configData
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          structure.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {structure.active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditStructure(structure)}
                        >
                          <Pencil2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Create Structure Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Commission Structure</DialogTitle>
            <DialogDescription>
              Create a new commission calculation structure for products
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard Per Participant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="structureType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structure Type</FormLabel>
                    <Select
                      onValueChange={(value) => handleStructureTypeChange(value, createForm)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                        <SelectItem value="per_participant">Per Participant</SelectItem>
                        <SelectItem value="tiered_participant">Tiered by Participants</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The method used to calculate commissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description of this commission structure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="configData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="font-mono text-sm"
                        rows={8}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      JSON configuration for this structure type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Creating...
                    </span>
                  ) : (
                    "Create Structure"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Structure Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Commission Structure</DialogTitle>
            <DialogDescription>
              Update this commission calculation structure
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard Per Participant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="structureType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structure Type</FormLabel>
                    <Select
                      onValueChange={(value) => handleStructureTypeChange(value, editForm)}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                        <SelectItem value="per_participant">Per Participant</SelectItem>
                        <SelectItem value="tiered_participant">Tiered by Participants</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The method used to calculate commissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description of this commission structure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="configData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="font-mono text-sm"
                        rows={8}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      JSON configuration for this structure type
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel className="m-0">Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}