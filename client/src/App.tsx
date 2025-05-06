import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Layout from "./components/layout";
import Dashboard from "./pages/dashboard";
import Commissions from "./pages/commissions";
import CommissionDetails from "./pages/commission-details";
import NewCommission from "./pages/new-commission";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/commissions" component={Commissions} />
      <Route path="/commissions/:id" component={CommissionDetails} />
      <Route path="/commissions/new" component={NewCommission} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Router />
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
