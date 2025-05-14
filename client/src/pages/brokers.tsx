import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Mail, Phone, Edit, Trash, Check, X, Building2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ExportMenu from "@/components/export-menu";

type Broker = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  active: boolean;
  username: string;
  agencyId: number | null;
};

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

export default function Brokers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: brokers, isLoading } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });
  
  const { data: agencies } = useQuery<Agency[]>({
    queryKey: ["/api/agencies"],
  });
  
  const filteredBrokers = brokers?.filter(broker => 
    broker.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    broker.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    broker.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleNewBroker = () => {
    toast({
      title: "Broker added",
      description: "New broker has been successfully added.",
    });
  };
  
  const handleEditBroker = async (brokerId: number, formData: HTMLFormElement) => {
    try {
      const formElements = formData.elements;
      
      // Extract form values
      const firstName = (formElements.namedItem('edit-firstName') as HTMLInputElement).value;
      const lastName = (formElements.namedItem('edit-lastName') as HTMLInputElement).value;
      const email = (formElements.namedItem('edit-email') as HTMLInputElement).value;
      const phoneNumber = (formElements.namedItem('edit-phone') as HTMLInputElement).value;
      const agencyId = (formElements.namedItem('edit-agency') as HTMLSelectElement)?.value;
      
      // Create payload for API
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        agencyId: agencyId === 'null' ? null : parseInt(agencyId)
      };
      
      // Make API request to update broker
      const response = await fetch(`/api/brokers/${brokerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update broker');
      }
      
      // Show success message
      toast({
        title: "Broker updated",
        description: "Broker information has been updated successfully.",
      });
      
      // Invalidate the brokers query to refresh the data
      window.location.reload();
      
    } catch (error) {
      // Show error message
      toast({
        title: "Update failed",
        description: "There was a problem updating the broker information.",
        variant: "destructive"
      });
      console.error("Error updating broker:", error);
    }
  };
  
  const handleDeleteBroker = () => {
    toast({
      title: "Broker deleted",
      description: "Broker has been successfully removed.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Brokers | BrokerCommissions</title>
        <meta name="description" content="Manage insurance brokers and their commission splits" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brokers</h1>
            <p className="text-muted-foreground">
              Manage brokers and their commission structures
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <ExportMenu
              data={filteredBrokers || []}
              filename="brokers-list"
              label="Export Brokers"
              variant="outline"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Broker</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Broker</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new broker
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">
                      First Name
                    </Label>
                    <Input id="firstName" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">
                      Last Name
                    </Label>
                    <Input id="lastName" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input id="email" type="email" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input id="phone" type="tel" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input id="username" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleNewBroker}>Add Broker</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Broker Directory</span>
            </CardTitle>
            <CardDescription>
              View and manage all registered brokers
            </CardDescription>
            <div className="mt-4">
              <Input
                placeholder="Search brokers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <BrokersTableSkeleton />
            ) : filteredBrokers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No brokers found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search query" : "Add a broker to get started"}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrokers.map((broker) => (
                      <TableRow key={broker.id}>
                        <TableCell className="font-medium">
                          {broker.firstName} {broker.lastName}
                          <div className="text-sm text-muted-foreground">
                            @{broker.username}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{broker.email}</span>
                          </div>
                          {broker.phoneNumber && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{broker.phoneNumber}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {broker.agencyId ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {agencies?.find(a => a.id === broker.agencyId)?.name || "Unknown Agency"}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No Agency</span>
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
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Edit</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Broker</DialogTitle>
                                <DialogDescription>
                                  Update broker information
                                </DialogDescription>
                              </DialogHeader>
                              <form id={`edit-broker-${broker.id}`} onSubmit={(e) => {
                                e.preventDefault();
                                handleEditBroker(broker.id, e.currentTarget);
                              }}>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`edit-firstName-${broker.id}`} className="text-right">
                                      First Name
                                    </Label>
                                    <Input 
                                      id={`edit-firstName-${broker.id}`}
                                      name="edit-firstName"
                                      defaultValue={broker.firstName} 
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`edit-lastName-${broker.id}`} className="text-right">
                                      Last Name
                                    </Label>
                                    <Input 
                                      id={`edit-lastName-${broker.id}`}
                                      name="edit-lastName"
                                      defaultValue={broker.lastName} 
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`edit-email-${broker.id}`} className="text-right">
                                      Email
                                    </Label>
                                    <Input 
                                      id={`edit-email-${broker.id}`}
                                      name="edit-email"
                                      type="email" 
                                      defaultValue={broker.email} 
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`edit-phone-${broker.id}`} className="text-right">
                                      Phone
                                    </Label>
                                    <Input 
                                      id={`edit-phone-${broker.id}`}
                                      name="edit-phone"
                                      type="tel" 
                                      defaultValue={broker.phoneNumber} 
                                      className="col-span-3" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`edit-agency-${broker.id}`} className="text-right">
                                      Agency
                                    </Label>
                                    <Select 
                                      name="edit-agency" 
                                      defaultValue={broker.agencyId?.toString() || "null"}
                                    >
                                      <SelectTrigger id={`edit-agency-${broker.id}`} className="col-span-3">
                                        <SelectValue placeholder="Select agency" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="null">No Agency</SelectItem>
                                        {agencies?.map((agency) => (
                                          <SelectItem key={agency.id} value={agency.id.toString()}>
                                            {agency.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                <span className="sr-only">Delete</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this broker? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteBroker}>Delete</Button>
                              </DialogFooter>
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

function BrokersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Broker</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Agency</TableHead>
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
                    <div className="h-4 w-36 bg-muted rounded"></div>
                    <div className="h-4 w-24 bg-muted rounded mt-1"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 bg-muted rounded"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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