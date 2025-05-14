/**
 * Utility functions for exporting data in various formats
 */

/**
 * Format types supported for export
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf'
}

/**
 * Convert data to CSV string
 * @param data Array of objects to convert to CSV
 * @returns CSV string with headers
 */
export function convertToCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return '';
  
  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      // Handle values that might contain commas by wrapping in quotes
      if (value === null || value === undefined) {
        return '""';
      }
      if (typeof value === 'string') {
        // Escape double quotes with double double quotes
        const escapedValue = value.replace(/"/g, '""');
        return `"${escapedValue}"`;
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    }).join(',');
  });
  
  // Combine headers and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Convert data to JSON string
 * @param data Array of objects to convert to JSON
 * @returns Formatted JSON string
 */
export function convertToJSON<T>(data: T[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download data as a file in the browser
 * @param data String content to download
 * @param filename Name of the file to download
 * @param mimeType MIME type of the file
 */
export function downloadFile(data: string, filename: string, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Export data in the specified format
 * @param data Data to export
 * @param format Format to export (csv, json, excel, pdf)
 * @param filename Base filename (without extension)
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  format: ExportFormat,
  filename: string
): void {
  switch (format) {
    case ExportFormat.CSV:
      const csvData = convertToCSV(data);
      downloadFile(csvData, `${filename}.csv`, 'text/csv;charset=utf-8;');
      break;
      
    case ExportFormat.JSON:
      const jsonData = convertToJSON(data);
      downloadFile(jsonData, `${filename}.json`, 'application/json;charset=utf-8;');
      break;
      
    case ExportFormat.EXCEL:
      // For Excel, we use CSV format with a specific header that Excel recognizes
      const excelData = convertToCSV(data);
      // UTF-8 BOM for Excel
      const excelBOM = "\uFEFF";
      downloadFile(excelBOM + excelData, `${filename}.csv`, 'text/csv;charset=utf-8;');
      break;
      
    case ExportFormat.PDF:
      // PDF export requires a library like jsPDF or we'd need to send to server
      alert('PDF export is coming soon! Please use CSV or JSON format for now.');
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Format a date for use in filenames (YYYY-MM-DD)
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}