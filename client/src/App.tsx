import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/auth-context";
import { Permissions } from "./lib/permissions";
import Layout from "./components/layout";
import ProtectedRoute from "./components/protected-route";
import Dashboard from "./pages/dashboard";
import Commissions from "./pages/commissions";
import CommissionDetails from "./pages/commission-details";
import NewCommission from "./pages/new-commission";
import Brokers from "./pages/brokers";
import Agencies from "./pages/agencies";
import AgencyDashboard from "./pages/agency-dashboard";
import Products from "./pages/products";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/commissions" component={Commissions} />
      <Route path="/commissions/new" component={NewCommission} />
      <Route path="/commissions/:id" component={CommissionDetails} />
      
      {/* Protected admin routes */}
      <Route 
        path="/brokers" 
        component={() => 
          <ProtectedRoute 
            component={Brokers} 
            permission={Permissions.VIEW_BROKERS} 
          />
        } 
      />
      
      <Route 
        path="/agencies" 
        component={() => 
          <ProtectedRoute 
            component={Agencies} 
            permission={Permissions.VIEW_AGENCIES} 
          />
        } 
      />
      
      <Route 
        path="/agency-dashboard/:id" 
        component={() => 
          <ProtectedRoute 
            component={AgencyDashboard} 
            permission={Permissions.VIEW_AGENCIES} 
          />
        } 
      />
      
      <Route 
        path="/products" 
        component={() => 
          <ProtectedRoute 
            component={Products} 
            permission={Permissions.MANAGE_PRODUCTS} 
          />
        } 
      />
      
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
