import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ImportPreviewTableProps {
  headers: string[];
  data: any[];
  validationErrors?: Record<number, string[]>;
}

export function ImportPreviewTable({
  headers,
  data,
  validationErrors = {},
}: ImportPreviewTableProps) {
  // Limit preview to first 5 rows
  const previewData = data.slice(0, 5);
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-4">
      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            There are validation errors in your data. Please fix them before importing.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Row</TableHead>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 2} className="h-24 text-center">
                  No data to preview
                </TableCell>
              </TableRow>
            ) : (
              previewData.map((row, index) => (
                <TableRow key={index} className={validationErrors[index] ? "bg-red-50" : ""}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  {headers.map((header) => (
                    <TableCell key={`${index}-${header}`}>
                      {row[header] !== undefined ? String(row[header]) : ""}
                    </TableCell>
                  ))}
                  <TableCell>
                    {validationErrors[index] ? (
                      <Badge variant="destructive" className="cursor-help" title={validationErrors[index].join(", ")}>
                        Error
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Valid
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 5 && (
        <p className="text-sm text-muted-foreground text-right">
          Showing 5 of {data.length} rows
        </p>
      )}

      {hasErrors && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Validation Errors:</h4>
          <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
            {Object.entries(validationErrors).map(([rowIndex, errors]) => (
              <li key={rowIndex}>
                Row {Number(rowIndex) + 1}: {errors.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}