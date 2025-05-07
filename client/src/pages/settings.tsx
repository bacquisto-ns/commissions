import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon, User, Shield, Bell, Key, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";

type Broker = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  username?: string;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  
  const { data: broker, refetch } = useQuery<Broker>({
    queryKey: ["/api/brokers/me"],
  });
  
  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!broker?.id) return;
    
    // Get form values
    const formElements = (event.target as HTMLFormElement).elements;
    const firstName = (formElements.namedItem('firstName') as HTMLInputElement)?.value;
    const lastName = (formElements.namedItem('lastName') as HTMLInputElement)?.value;
    const email = (formElements.namedItem('email') as HTMLInputElement)?.value;
    const phoneNumber = (formElements.namedItem('phone') as HTMLInputElement)?.value;

    try {
      // Make the API request to update the broker
      const response = await fetch(`/api/brokers/${broker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Refetch broker data
      refetch();
      
      // Show success notification
      toast({
        title: "Settings saved",
        description: "Your settings have been successfully saved.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Failed to save settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings | BrokerCommissions</title>
        <meta name="description" content="Manage your account and application settings" />
      </Helmet>
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:text-primary">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:text-primary">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:text-primary">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2 data-[state=active]:text-primary">
              <SettingsIcon className="h-4 w-4" />
              <span>Application</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and contact details
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveSettings}>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <UserAvatar 
                      user={broker} 
                      className="h-16 w-16"
                    />
                    <div>
                      <h3 className="font-medium text-lg">Profile Picture</h3>
                      <p className="text-muted-foreground text-sm">
                        Upload a new profile picture
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" type="button">
                          Change Avatar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        defaultValue={broker?.firstName || ""} 
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        defaultValue={broker?.lastName || ""} 
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        defaultValue={broker?.email || ""} 
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        defaultValue={broker?.phoneNumber || ""} 
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button className="ml-auto gap-1" type="submit">
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to enhance your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button className="ml-auto gap-1" onClick={handleSaveSettings}>
                  <Key className="h-4 w-4" />
                  <span>Update Password</span>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable 2FA</h3>
                    <p className="text-muted-foreground text-sm">
                      Secure your account with two-factor authentication
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-muted-foreground text-sm">
                      Receive notifications about new commissions via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Commission Updates</h3>
                    <p className="text-muted-foreground text-sm">
                      Get notified when commission status changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Payment Notifications</h3>
                    <p className="text-muted-foreground text-sm">
                      Receive alerts when payments are processed
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Monthly Summaries</h3>
                    <p className="text-muted-foreground text-sm">
                      Get monthly reports of your commissions
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button className="ml-auto" onClick={handleSaveSettings}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="app" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-muted-foreground text-sm">
                      Enable dark mode for the application
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Compact View</h3>
                    <p className="text-muted-foreground text-sm">
                      Show more data with less spacing
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-refresh Dashboard</h3>
                    <p className="text-muted-foreground text-sm">
                      Automatically refresh dashboard data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button className="ml-auto" onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Analytics Consent</h3>
                    <p className="text-muted-foreground text-sm">
                      Allow us to collect anonymous usage data to improve the application
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="mt-4">
                  <Button variant="outline">Download My Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}