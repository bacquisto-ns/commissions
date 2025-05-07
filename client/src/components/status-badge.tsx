import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string): { bg: string; text: string } => {
    switch (status.toLowerCase()) {
      case "approved":
        return { bg: "bg-paid/10", text: "text-paid" };
      case "pending":
        return { bg: "bg-pending/10", text: "text-pending" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-500" };
    }
  };

  const { bg, text } = getStatusStyles(status);

  return (
    <span
      className={cn(
        "status-badge",
        bg,
        text,
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
