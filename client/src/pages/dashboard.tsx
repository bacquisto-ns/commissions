import { useAuth } from "../context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Helper function to format currency
const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(num);
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  
  // For the system admin dashboard, show all commissions by using ID 0
  // In a real app with actual users, we would get this from user context
  const brokerId = 0;
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/${brokerId}`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!brokerId,
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName || 'User'}!</h2>
        <p className="text-gray-600 mb-4">
          You are logged in as: <span className="font-medium">{user?.role || 'broker'}</span>
        </p>
        <div className="flex space-x-4">
          <Button onClick={() => navigate('/commissions')}>
            View Commissions
          </Button>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-700">Total Commissions YTD</h3>
              <p className="text-2xl font-bold">
                {dashboardData ? formatCurrency(dashboardData.totalYtd) : '$0.00'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-700">Pending Approvals</h3>
              <p className="text-2xl font-bold">
                {dashboardData ? dashboardData.pendingCount : 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {dashboardData ? formatCurrency(dashboardData.totalPending) : '$0.00'}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-700">Total Transactions</h3>
              <p className="text-2xl font-bold">
                {dashboardData ? dashboardData.totalTransactions : 0}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                Avg. {dashboardData ? `$${dashboardData.avgCommissionRate}` : '$0'}/participant
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}