import React, { useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  exportFilename?: string;
  exportable?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  searchPlaceholder = 'Search...',
  exportFilename = 'export',
  exportable = true,
  onRowClick
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Helper to resolve nested object path values (e.g. 'profile.name')
  const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // 1. Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((row) => {
      return columns.some((col) => {
        const val = col.accessorKey
          ? getNestedValue(row, col.accessorKey as string)
          : null;
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, columns, searchQuery]);

  // 2. Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      const key = sortConfig.key;
      let valA = getNestedValue(a, key);
      let valB = getNestedValue(b, key);

      // Handle undefined/nulls
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Alphanumeric conversion
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      // Number comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  // 3. Paginate Data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Total pages
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Toggle Sorting
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = columns.map((col) => (typeof col.header === 'string' ? col.header : ''));
    const rows = sortedData.map((row) => {
      return columns.map((col) => {
        if (col.accessorKey) {
          const val = getNestedValue(row, col.accessorKey as string);
          return val === null || val === undefined ? '' : String(val).replace(/"/g, '""');
        }
        return '';
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFilename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Table Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
          {/* Search Input */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 rounded-xl text-xs h-9 bg-white"
            />
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Export Button */}
        {exportable && (
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="rounded-xl border-gold/20 text-gold hover:bg-gold/10 hover:text-gold gap-1.5 h-9 text-xs font-semibold shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100">
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false && col.accessorKey;
                const sortKey = (col.sortKey || col.accessorKey) as string;
                const isSorted = sortConfig?.key === sortKey;
                const isAsc = sortConfig?.direction === 'asc';

                return (
                  <th
                    key={idx}
                    className={cn(
                      "p-3.5 font-semibold select-none",
                      isSortable && "cursor-pointer hover:bg-slate-100/50 hover:text-slate-700 transition-colors",
                      col.className
                    )}
                    onClick={() => isSortable && requestSort(sortKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            isAsc ? <ArrowUp className="w-3 h-3 text-gold" /> : <ArrowDown className="w-3 h-3 text-gold" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, colIdx) => {
                    const value = col.accessorKey
                      ? getNestedValue(row, col.accessorKey as string)
                      : null;
                    return (
                      <td key={colIdx} className={cn("p-3.5 text-slate-600 align-middle", col.className)}>
                        {col.cell ? col.cell(row) : (value === null || value === undefined ? '—' : String(value))}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-400 font-medium">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center text-xs text-muted-foreground pt-1">
        <div>
          Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {/* Simple range pagination */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400 select-none">...</span>}
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="icon"
                      className={cn(
                        "w-8 h-8 rounded-lg",
                        currentPage === page
                          ? "bg-gold hover:bg-gold/90 text-warm-foreground font-bold"
                          : "hover:bg-slate-50 text-slate-600 border-slate-200"
                      )}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                );
              })}

            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
