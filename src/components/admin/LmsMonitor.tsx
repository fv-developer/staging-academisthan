import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search, RefreshCw, User, BookOpen, Award, Clock, FileSpreadsheet, Eye, X, Filter
} from 'lucide-react';

export function LmsMonitor() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  
  // Selected student for inline details panel (no popup!)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.programs.getProgressReports();
      setReports(data || []);
    } catch (err: any) {
      toast({ title: 'Failed to fetch progress reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter logic
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && r.enrollment_status === 'completed') ||
      (statusFilter === 'in_progress' && r.enrollment_status === 'in_progress') ||
      (statusFilter === 'not_started' && r.enrollment_status === 'enrolled' && (r.progress_percentage || 0) === 0);

    const matchesProgram = 
      programFilter === 'all' || 
      r.program_title === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Extract unique program titles for filter dropdown
  const programTitles = Array.from(new Set(reports.map(r => r.program_title))).filter(Boolean);

  // Statistics summaries - dynamic calculations matching screen 8
  const stats = useMemo(() => {
    const total = reports.length;
    const completed = reports.filter(r => r.enrollment_status === 'completed').length;
    const notStarted = reports.filter(r => (r.progress_percentage || 0) === 0).length;
    const inProgress = total - completed - notStarted;
    const avgProg = total > 0 
      ? Math.round(reports.reduce((acc, r) => acc + (r.progress_percentage || 0), 0) / total)
      : 0;
    
    return { total, completed, inProgress, notStarted, avgProg };
  }, [reports]);

  // CSV Report Exporter
  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      toast({ title: 'No records to export', variant: 'destructive' });
      return;
    }

    const headers = ['Fellow Name', 'Fellow Email', 'Program Title', 'Progress %', 'Modules Completed', 'Avg Quiz Score', 'Last Activity', 'Status'];
    const rows = filteredReports.map(r => {
      const isCompleted = r.enrollment_status === 'completed' || r.progress_percentage === 100;
      const completedModCount = r.modules?.filter((m: any) => m.completed).length || 0;
      const totalModCount = r.modules?.length || 0;
      const quizzes = r.quizzes || [];
      const avgQuizScore = quizzes.length > 0
        ? Math.round(quizzes.reduce((acc: number, q: any) => acc + (q.score || 0), 0) / quizzes.length)
        : 0;

      return [
        r.full_name || 'N/A',
        r.email || 'N/A',
        r.program_title || 'N/A',
        `${r.progress_percentage || 0}%`,
        `${completedModCount}/${totalModCount}`,
        quizzes.length > 0 ? `${avgQuizScore}%` : 'N/A',
        r.last_activity ? new Date(r.last_activity).toLocaleDateString('en-IN') : 'N/A',
        isCompleted ? 'Completed' : (r.progress_percentage > 0 ? 'In Progress' : 'Not Started')
      ];
    });

    const csvContent = "\uFEFF"
      + [headers.join(','), ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LMS_Admin_Progress_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'CSV Progress Report Downloaded! 📊' });
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* ═══ VIEW 8: ADMIN PROGRESS SUMMARY STATS GRID ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Enrollments', val: stats.total, percent: '+12% vs last month', isGreen: true },
          { label: 'In Progress', val: stats.inProgress, percent: '+8% vs last month', isGreen: true },
          { label: 'Completed', val: stats.completed, percent: '+5% vs last month', isGreen: true },
          { label: 'Not Started', val: stats.notStarted, percent: '-3% vs last month', isGreen: false },
          { label: 'Average Progress', val: `${stats.avgProg}%`, percent: '+10% vs last month', isGreen: true }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm min-h-[95px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
            <div className="flex items-baseline justify-between mt-2 flex-wrap gap-1">
              <span className="text-lg font-bold text-slate-800 font-serif">{stat.val}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                stat.isGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {stat.percent}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and search row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm w-full">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 min-w-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by fellow student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs h-9 bg-slate-50/15"
            />
          </div>

          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-xl text-xs h-9">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🎓 All Programs</SelectItem>
              {programTitles.map((t, idx) => (
                <SelectItem key={idx} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] rounded-xl text-xs h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">⚙️ All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchReports} className="rounded-xl h-9 gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button onClick={handleExportCSV} className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-bold shadow-sm px-4">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Main progress auditing workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        
        {/* Left Column: Progress auditing table */}
        <div className={selectedStudent ? 'lg:col-span-2 w-full' : 'lg:col-span-3 w-full'}>
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Fellow Name</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 text-center">Modules Completed</th>
                  <th className="p-4 text-center">Quizzes Avg Score</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-gold animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                      No matching student progress reports.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((row) => {
                    const isCompleted = row.enrollment_status === 'completed' || row.progress_percentage === 100;
                    const completedModCount = row.modules?.filter((m: any) => m.completed).length || 0;
                    const totalModCount = row.modules?.length || 0;
                    const quizzes = row.quizzes || [];
                    const avgQuizScore = quizzes.length > 0
                      ? Math.round(quizzes.reduce((acc: number, q: any) => acc + (q.score || 0), 0) / quizzes.length)
                      : 0;

                    let statusLabel = 'In Progress';
                    let statusColor = 'bg-blue-50 text-blue-600 border border-blue-100';
                    if (isCompleted) {
                      statusLabel = 'Completed';
                      statusColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                    } else if ((row.progress_percentage || 0) === 0) {
                      statusLabel = 'Not Started';
                      statusColor = 'bg-slate-50 text-slate-400 border border-slate-150';
                    }

                    return (
                      <tr 
                        key={row.enrollment_id} 
                        className={`hover:bg-slate-50/40 cursor-pointer transition-colors ${
                          selectedStudent?.enrollment_id === row.enrollment_id ? 'bg-slate-50' : ''
                        }`}
                        onClick={() => setSelectedStudent(row)}
                      >
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{row.full_name || 'N/A'}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{row.email || 'N/A'}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-700 truncate max-w-[120px]">
                          {row.program_title}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 w-8">{row.progress_percentage || 0}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-gold rounded-full" style={{ width: `${row.progress_percentage || 0}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-medium text-slate-700">
                          {completedModCount} / {totalModCount}
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-750">
                          {quizzes.length > 0 ? `${avgQuizScore}%` : 'N/A'}
                        </td>
                        <td className="p-4 text-slate-500">
                          {row.last_activity ? new Date(row.last_activity).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="p-4">
                          <Badge className={statusColor}>
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedStudent(row)}
                            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-navy rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Inline Fellow Details Card (No popups!) */}
        {selectedStudent && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 self-start animate-in fade-in slide-in-from-right-3 duration-200 w-full">
            {/* Card Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-serif text-sm font-bold text-navy">{selectedStudent.full_name}</h4>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="h-7 w-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Fields matching mock schema */}
            <div className="space-y-3.5 text-xs">
              {/* 1. Completed Modules */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Modules</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.modules && selectedStudent.modules.filter((m: any) => m.completed).map((m: any, idx: number) => (
                    <Badge key={m.id} className="bg-slate-100 text-slate-700 border-none font-bold py-0.5 text-[9px] rounded-lg">
                      M{idx + 1}
                    </Badge>
                  ))}
                  {(!selectedStudent.modules || selectedStudent.modules.filter((m: any) => m.completed).length === 0) && (
                    <span className="text-[10px] text-slate-400 italic">None completed yet</span>
                  )}
                </div>
              </div>

              {/* 2. Completed Quiz */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Quiz</span>
                <div className="space-y-1">
                  {selectedStudent.quizzes && selectedStudent.quizzes.filter((q: any) => q.passed).map((q: any) => (
                    <div key={q.step_id} className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                      <span className="text-emerald-500 font-bold">✓</span> {q.step_title}
                    </div>
                  ))}
                  {(!selectedStudent.quizzes || selectedStudent.quizzes.filter((q: any) => q.passed).length === 0) && (
                    <span className="text-[10px] text-slate-400 italic">No quizzes passed yet</span>
                  )}
                </div>
              </div>

              {/* 3. Current Step */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current Step</span>
                <div className="text-[10px] text-slate-700 font-bold flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  <span>
                    {(() => {
                      if (!selectedStudent.modules || selectedStudent.modules.length === 0) return 'N/A';
                      for (const mod of selectedStudent.modules) {
                        if (!mod.completed) return mod.title;
                      }
                      return 'Program Completed! 🎉';
                    })()}
                  </span>
                </div>
              </div>

              {/* 4. Last Activity */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Last Activity</span>
                <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedStudent.last_activity 
                      ? new Date(selectedStudent.last_activity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* 5. Quiz Score */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quiz Score</span>
                <div className="space-y-1">
                  {selectedStudent.quizzes && selectedStudent.quizzes.map((q: any) => (
                    <div key={q.step_id} className="flex justify-between items-center text-[10px] text-slate-600">
                      <span>{q.step_title}</span>
                      <span className={`font-bold ${q.passed ? 'text-emerald-600' : 'text-red-500'}`}>{q.score}%</span>
                    </div>
                  ))}
                  {(!selectedStudent.quizzes || selectedStudent.quizzes.length === 0) && (
                    <span className="text-[10px] text-slate-400 italic">No quiz scores recorded</span>
                  )}
                </div>
              </div>

              {/* 6. Certificate Status */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Certificate Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge className={`text-[9px] font-bold border ${
                    selectedStudent.enrollment_status === 'completed' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {selectedStudent.enrollment_status === 'completed' ? 'Issued' : 'Not Issued'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={() => setSelectedStudent(null)} 
                className="rounded-xl bg-navy hover:bg-navy/95 text-warm text-[10px] font-bold h-8 px-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
