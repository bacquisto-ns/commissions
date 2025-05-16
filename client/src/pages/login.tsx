import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, User, Lock } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(username, password);
      // Redirect happens in the auth context
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Broker Commissions</title>
      </Helmet>
      
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="w-full max-w-md p-4">
          <Card className="w-full">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-primary rounded-full p-3">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl">BrokerCommissions</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
              
              <div className="my-4">
                <Separator />
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="text-center">Demo Accounts:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border rounded p-2">
                    <div className="font-medium">Admin User</div>
                    <div>Username: admin</div>
                    <div>Password: password123</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="font-medium">Agency Admin</div>
                    <div>Username: sarahjohnson</div>
                    <div>Password: password123</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                This is a demo application. Any data entered is not stored securely.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}