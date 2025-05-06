import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { User, Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";

type Broker = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  active: boolean;
  username: string;
};

export default function Brokers() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: brokers, isLoading } = useQuery<Broker[]>({
    queryKey: ["/api/brokers"],
  });
  
  const filteredBrokers = brokers?.filter((broker) => {
    const fullName = `${broker.firstName} ${broker.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           broker.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Helmet>
        <title>Brokers | BrokerCommissions</title>
        <meta name="description" content="Manage your insurance brokers and their commission settings" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brokers</h1>
            <p className="text-muted-foreground">
              Manage your brokers and their commission settings
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search brokers..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Add Broker</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>All Brokers</span>
            </CardTitle>
            <CardDescription>
              View and manage all brokers in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <BrokersTableSkeleton />
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Broker</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead className="hidden md:table-cell">Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrokers && filteredBrokers.length > 0 ? (
                      filteredBrokers.map((broker) => (
                        <TableRow key={broker.id}>
                          <TableCell className="font-medium">{broker.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                user={{ firstName: broker.firstName, lastName: broker.lastName }}
                                className="h-8 w-8"
                              />
                              <div>
                                <p className="font-medium">{broker.firstName} {broker.lastName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{broker.email}</TableCell>
                          <TableCell className="hidden md:table-cell">{broker.phoneNumber || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{broker.username}</TableCell>
                          <TableCell>
                            <Badge variant={broker.active ? "success" : "destructive"}>
                              {broker.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          No brokers found
                        </TableCell>
                      </TableRow>
                    )}
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead className="hidden md:table-cell">Username</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}