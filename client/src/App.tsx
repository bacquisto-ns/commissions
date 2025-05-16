import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./context/auth-context";
import { Permissions } from "./lib/permissions";
import Layout from "./components/layout";
import AuthGuard from "./components/auth-guard";
import Dashboard from "./pages/dashboard";
import Commissions from "./pages/commissions";
import CommissionDetails from "./pages/commission-details";
import NewCommission from "./pages/new-commission";
import Brokers from "./pages/brokers";
import Agencies from "./pages/agencies";
import AgencyDashboard from "./pages/agency-dashboard";
import Products from "./pages/products";
import CommissionStructures from "./pages/commission-structures";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import Login from "./pages/login";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

// Route wrapper with auth guard and permission check
function ProtectedRoute({ 
  component: Component, 
  permission = undefined 
}: { 
  component: React.ComponentType; 
  permission?: string;
}) {
  return (
    <AuthGuard requiredPermission={permission}>
      <Component />
    </AuthGuard>
  );
}

function RouterContent() {
  // Removed automatic redirect to login page
  // Let users navigate freely once logged in

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Protected routes - accessible only when authenticated */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/commissions" component={() => <ProtectedRoute component={Commissions} />} />
      <Route path="/commissions/new" component={() => <ProtectedRoute component={NewCommission} />} />
      <Route path="/commissions/:id" component={() => <ProtectedRoute component={CommissionDetails} />} />
      
      {/* Protected admin routes - require specific permissions */}
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
      
      <Route 
        path="/commission-structures" 
        component={() => 
          <ProtectedRoute 
            component={CommissionStructures} 
            permission={Permissions.MANAGE_COMMISSION_STRUCTURES} 
          />
        } 
      />
      
      <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // If user is on login page or not authenticated, don't wrap in Layout
  if (location === "/login" || !isAuthenticated) {
    return <RouterContent />;
  }
  
  return (
    <Layout>
      <RouterContent />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
