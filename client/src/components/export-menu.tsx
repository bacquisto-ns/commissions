import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { exportData, ExportFormat, formatDateForFilename } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

interface ExportMenuProps<T extends Record<string, any>> {
  data: T[];
  filename?: string;
  label?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ExportMenu<T extends Record<string, any>>({
  data,
  filename = "export",
  label = "Export",
  className = "",
  variant = "outline",
  size = "sm",
}: ExportMenuProps<T>) {
  const { toast } = useToast();
  
  const handleExport = (format: ExportFormat) => {
    try {
      if (data.length === 0) {
        toast({
          title: "No data to export",
          description: "There is no data available to export.",
          variant: "destructive",
        });
        return;
      }
      
      const date = formatDateForFilename();
      const fullFilename = `${filename}-${date}`;
      
      exportData(data, format, fullFilename);
      
      toast({
        title: "Export successful",
        description: `Data exported as ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <FileDown className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(ExportFormat.CSV)}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(ExportFormat.EXCEL)}>
          Export for Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(ExportFormat.JSON)}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(ExportFormat.PDF)}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}