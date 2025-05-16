import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Search } from 'lucide-react';

export interface ImportPreviewTableProps {
  data: any[];
}

export function ImportPreviewTable({ data }: ImportPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  const itemsPerPage = 5;
  
  // Get all headers from the data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Search and filter the data
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return data;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });
  }, [data, searchTerm]);
  
  // Sort the data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) {
      return filteredData;
    }
    
    const { key, direction } = sortConfig;
    return [...filteredData].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue === bValue) return 0;
      
      // Handle undefined and null values
      if (aValue === undefined || aValue === null) return direction === 'ascending' ? -1 : 1;
      if (bValue === undefined || bValue === null) return direction === 'ascending' ? 1 : -1;
      
      // Sort string case-insensitively
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Sort numbers, booleans, etc.
      return direction === 'ascending'
        ? aValue < bValue ? -1 : 1
        : aValue < bValue ? 1 : -1;
    });
  }, [filteredData, sortConfig]);
  
  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sort request
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-8"
          placeholder="Search data..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="cursor-pointer" onClick={() => requestSort(header)}>
                  <div className="flex items-center">
                    {header}
                    {sortConfig?.key === header && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => (
                <TableRow key={i}>
                  {headers.map((header) => (
                    <TableCell key={`${i}-${header}`}>
                      {row[header] !== undefined && row[header] !== null
                        ? String(row[header])
                        : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="text-center py-4">
                  {searchTerm
                    ? 'No matching records found'
                    : 'No data available for preview'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} records
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show max 5 page links, centered around the current page
                let pageNum;
                const leftSide = Math.min(2, currentPage - 1);
                const rightSide = Math.min(2, totalPages - currentPage);
                
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - leftSide + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}