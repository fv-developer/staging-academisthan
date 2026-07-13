import React, { useState, useEffect, useMemo } from 'react';
import { admin as adminApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateCertificatePDF } from '@/lib/certificate';
import { DataTable, ColumnDef } from './DataTable';
import {
  Award, CheckCircle2, XCircle, Trash2, Download, Eye,
  RefreshCw, Search, Filter, AlertTriangle, Calendar, Mail, FileText,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FRIENDLY_TOOL_NAMES: Record<string, string> = {
  'UGC Academic & Research Score Calculator': 'UGC Academic & Research Score Certification',
  'Research Score Calculator': 'Research Score Certification',
  'CAS Promotion Checker (UGC 2018)': 'CAS Promotion Eligibility Certification',
  'Scholar Impact Analyzer': 'Google Scholar Impact Certification',
  'NAAC Self-Assessment (Criterion 3)': 'NAAC Self-Assessment (Criterion 3) Certification',
};

export function CertificationsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter States
  const [selectedTool, setSelectedTool] = useState('all');
  const [selectedResult, setSelectedResult] = useState('all');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getToolResults();
      setRecords(data || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to load test records',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handlePdfAction = (row: any, action: 'view' | 'download') => {
    const friendlyName = FRIENDLY_TOOL_NAMES[row.tool_name] || row.tool_name;
    const certNum = row.certificate_number || `ACAD-CERT-${row.id.slice(0, 6).toUpperCase()}`;
    const issuedAt = row.certificate_issued_at || row.created_at;

    generateCertificatePDF({
      holderName: row.full_name || 'Fellow',
      programTitle: friendlyName,
      certificateNumber: certNum,
      issuedAt: issuedAt,
      certificateType: 'Certification',
    }, action);

    toast({
      title: action === 'view' ? '✓ Opening Preview' : '✓ Downloading Certificate',
      description: `Certificate for ${row.full_name || 'Fellow'} generated successfully.`,
      duration: 2000,
    });
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await adminApi.deleteToolResult(id);
      toast({
        title: 'Record deleted',
        description: 'Test record was deleted successfully.',
      });
      fetchRecords();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await adminApi.bulkDeleteToolResults(Array.from(selectedIds));
      toast({
        title: 'Records deleted',
        description: `${selectedIds.size} test records were deleted successfully.`,
      });
      fetchRecords();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Bulk delete failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // Filtered Records List
  const filteredRecords = useMemo(() => {
    return records.filter(row => {
      const matchesTool = selectedTool === 'all' || row.tool_name.includes(selectedTool) || (selectedTool === 'api_score' && row.tool_name.includes('Academic')) || (selectedTool === 'naac' && row.tool_name.includes('NAAC')) || (selectedTool === 'promotion' && row.tool_name.includes('CAS'));
      const matchesResult = selectedResult === 'all' || row.result === selectedResult;
      return matchesTool && matchesResult;
    });
  }, [records, selectedTool, selectedResult]);

  // Unique tool names for filtering
  const toolsList = useMemo(() => {
    const list = new Set<string>();
    records.forEach(r => {
      if (r.tool_name) list.add(r.tool_name);
    });
    return Array.from(list);
  }, [records]);

  // Column definitions for DataTable
  const columns: ColumnDef<any>[] = [
    {
      header: (
        <input
          type="checkbox"
          checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 text-gold focus:ring-gold"
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
          className="rounded border-gray-300 text-gold focus:ring-gold"
        />
      ),
      className: "w-10",
    },
    {
      header: 'Fellow Name',
      accessorKey: 'full_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.full_name || 'Anonymous'}</div>
          <div className="text-[10px] text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Test Name',
      accessorKey: 'tool_name',
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{FRIENDLY_TOOL_NAMES[row.tool_name] || row.tool_name}</div>
          {row.certificate_number && (
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              No. {row.certificate_number}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Attempt Date & Time',
      accessorKey: 'created_at',
      sortable: true,
      cell: (row) => (
        <div className="text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })} &middot; {new Date(row.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    },
    {
      header: 'Score',
      accessorKey: 'score',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-foreground">
          {row.score !== null ? `${row.score} pts` : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Result',
      accessorKey: 'result',
      sortable: true,
      cell: (row) => {
        const isPass = row.result === 'Pass';
        return isPass ? (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[10px] gap-1 px-2">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </Badge>
        ) : (
          <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 font-semibold text-[10px] gap-1 px-2">
            <XCircle className="w-3 h-3" /> FAIL
          </Badge>
        );
      },
    },
    {
      header: 'Certificate Status',
      accessorKey: 'certificate_status',
      sortable: true,
      cell: (row) => {
        const isIssued = row.certificate_status === 'Issued';
        return isIssued ? (
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[10px] gap-1 px-2">
            Issued
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground italic font-medium">N/A</span>
        );
      },
    },
    {
      header: 'Actions',
      className: "text-right",
      cell: (row) => {
        const isPass = row.result === 'Pass';
        return (
          <div className="flex items-center justify-end gap-1.5">
            {isPass && (
              <>
                <Button
                  onClick={() => handlePdfAction(row, 'view')}
                  variant="ghost"
                  size="sm"
                  title="View PDF"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handlePdfAction(row, 'download')}
                  variant="ghost"
                  size="sm"
                  title="Download PDF"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete Record"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-sm">Delete Test Record?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will permanently remove {row.full_name || 'Fellow'}'s attempt and certificate. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-xs h-9">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSingle(row.id)}
                    className="rounded-xl text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-gold" /> Teacher Tools Certifications
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor all fellow certification test history records.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchRecords}
            variant="outline"
            size="sm"
            className="rounded-xl h-9 text-xs font-semibold gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          {selectedIds.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl h-9 text-xs font-semibold gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Bulk Delete ({selectedIds.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-sm">Delete {selectedIds.size} Records?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will permanently delete the selected test attempts and their certificates. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl text-xs h-9">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="rounded-xl text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete Selected
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/30 border border-border p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-gold" /> Filters
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Certification Tests</option>
              <option value="api_score">UGC Academic & Research Score</option>
              <option value="research_score">Research Score Assessment</option>
              <option value="promotion">CAS Promotion Eligibility</option>
              <option value="scholar_impact">Google Scholar Impact</option>
              <option value="naac">NAAC Self-Assessment (Criterion 3)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Results</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
          </div>
        </div>
      </div>

      {/* DataTable */}
      {loading && records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-xs">Loading certification logs...</p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <DataTable
            data={filteredRecords}
            columns={columns}
            searchPlaceholder="Search fellows, tests, or emails..."
            exportFilename="teacher_tools_certifications"
          />
        </div>
      )}
    </div>
  );
}
