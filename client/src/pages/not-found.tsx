import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-4 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        className="mt-6"
        onClick={() => navigate("/")}
      >
        Return to Dashboard
      </Button>
    </div>
  );
}