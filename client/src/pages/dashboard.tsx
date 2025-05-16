import { useAuth } from "../context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700">Total Commissions</h3>
            <p className="text-2xl font-bold">$12,450.00</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-700">Pending Approvals</h3>
            <p className="text-2xl font-bold">6</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-700">Active Clients</h3>
            <p className="text-2xl font-bold">24</p>
          </div>
        </div>
      </Card>
    </div>
  );
}