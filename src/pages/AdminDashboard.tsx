import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn, getBustUrl } from '@/lib/utils';
import api, { institutions as instApi } from '@/lib/api-client';
import { DataTable, ColumnDef } from '@/components/admin/DataTable';
import { ConnectionsManager } from '@/components/admin/ConnectionsManager';
import { LmsMonitor } from '@/components/admin/LmsMonitor';
import { ProgramManager } from '@/components/admin/ProgramManager';
import { CertificationsManager } from '@/components/admin/CertificationsManager';
import CKEditor from '@/components/ui/CKEditor';
import {
  Shield, Users, Building2, GraduationCap, FileText, Bell, BarChart3, Settings, Key, LogOut,
  CheckCircle2, XCircle, AlertTriangle, Search, Filter, Edit, Plus, Trash2,
  Calendar, Mail, Phone, Download, Eye, RefreshCw, Clock, BookOpen,
  Loader2, Sparkles, Info, ChevronRight, ChevronLeft, X, ArrowRight, Upload, Tag, Check, ArrowLeft,
  Award, User, MapPin, ExternalLink, Video
} from 'lucide-react';

interface Stats {
  totalFellows: number;
  totalInstitutions: number;
  totalPrograms: number;
  totalEnrollments: number;
  totalBlogs: number;
  pendingInstitutionApprovals: number;
  pendingBlogApprovals: number;
  activeNotifications: number;
}

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

const getInitials = (name: string) => {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColor = (type: string) => {
  switch (type) {
    case 'institution_status': return 'bg-sky-100 text-sky-700';
    case 'blog': return 'bg-amber-100 text-amber-700';
    case 'course': return 'bg-indigo-100 text-indigo-700';
    case 'general': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const { isAdmin, role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/admin/institutions')) return 'institutions';
    if (path.includes('/admin/fellows')) return 'fellows';
    if (path.includes('/admin/blogs')) return 'blogs';
    if (path.includes('/admin/programs')) return 'programs';
    if (path.includes('/admin/enrollments')) return 'enrollments';
    if (path.includes('/admin/notifications')) return 'notifications';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/change-password')) return 'change-password';
    if (path.includes('/admin/connections')) return 'connections';
    if (path.includes('/admin/lms-monitor')) return 'lms-monitor';
    if (path.includes('/admin/certifications')) return 'certifications';
    return 'dashboard';
  });

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    const newPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    window.history.pushState(null, '', newPath);
  };

  // State Variables
  const [stats, setStats] = useState<Stats>({
    totalFellows: 0,
    totalInstitutions: 0,
    totalPrograms: 0,
    totalEnrollments: 0,
    totalBlogs: 0,
    pendingInstitutionApprovals: 0,
    pendingBlogApprovals: 0,
    activeNotifications: 0
  });

  const [loading, setLoading] = useState(true);
  const [fellows, setFellows] = useState<any[]>([]);
  const fellowsOnly = useMemo(() => {
    return fellows.filter(f => !f.admin_role);
  }, [fellows]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Filters
  const [fellowSearch, setFellowSearch] = useState('');
  const [fellowStatus, setFellowStatus] = useState('all');
  const [instSearch, setInstSearch] = useState('');
  const [instStatus, setInstStatus] = useState('all');
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatus, setBlogStatus] = useState('all');

  // Hierarchical cascading filters
  const [fellowCountry, setFellowCountry] = useState('all');
  const [fellowStateFilter, setFellowStateFilter] = useState('all');
  const [fellowCityFilter, setFellowCityFilter] = useState('all');

  const [instCountry, setInstCountry] = useState('all');
  const [instStateFilter, setInstStateFilter] = useState('all');
  const [instCityFilter, setInstCityFilter] = useState('all');

  // Reset cascading filters on parent selection changes
  useEffect(() => {
    setFellowStateFilter('all');
    setFellowCityFilter('all');
  }, [fellowCountry]);

  useEffect(() => {
    setFellowCityFilter('all');
  }, [fellowStateFilter]);

  useEffect(() => {
    setInstStateFilter('all');
    setInstCityFilter('all');
  }, [instCountry]);

  useEffect(() => {
    setInstCityFilter('all');
  }, [instStateFilter]);

  // Dynamic cascading option compiler lists
  const uniqueFellowCountries = useMemo(() => {
    const s = new Set<string>();
    fellowsOnly.forEach(f => { if (f.country) s.add(f.country); });
    return Array.from(s).sort();
  }, [fellowsOnly]);

  const uniqueFellowStates = useMemo(() => {
    const s = new Set<string>();
    fellowsOnly.forEach(f => {
      if (f.state && (fellowCountry === 'all' || f.country === fellowCountry)) {
        s.add(f.state);
      }
    });
    return Array.from(s).sort();
  }, [fellowsOnly, fellowCountry]);

  const uniqueFellowCities = useMemo(() => {
    const s = new Set<string>();
    fellowsOnly.forEach(f => {
      if (f.city && 
          (fellowCountry === 'all' || f.country === fellowCountry) &&
          (fellowStateFilter === 'all' || f.state === fellowStateFilter)) {
        s.add(f.city);
      }
    });
    return Array.from(s).sort();
  }, [fellowsOnly, fellowCountry, fellowStateFilter]);

  const uniqueInstCountries = useMemo(() => {
    const s = new Set<string>();
    institutions.forEach(i => { if (i.country) s.add(i.country); });
    return Array.from(s).sort();
  }, [institutions]);

  const uniqueInstStates = useMemo(() => {
    const s = new Set<string>();
    institutions.forEach(i => {
      if (i.state && (instCountry === 'all' || i.country === instCountry)) {
        s.add(i.state);
      }
    });
    return Array.from(s).sort();
  }, [institutions, instCountry]);

  const uniqueInstCities = useMemo(() => {
    const s = new Set<string>();
    institutions.forEach(i => {
      if (i.city && 
          (instCountry === 'all' || i.country === instCountry) &&
          (instStateFilter === 'all' || i.state === instStateFilter)) {
        s.add(i.city);
      }
    });
    return Array.from(s).sort();
  }, [institutions, instCountry, instStateFilter]);

  // Filtered lists for DataTables
  const filteredFellowsList = useMemo(() => {
    return fellowsOnly.filter(f => {
      const matchesStatus = fellowStatus === 'all' || f.membership_status === fellowStatus;
      const matchesCountry = fellowCountry === 'all' || f.country === fellowCountry;
      const matchesState = fellowStateFilter === 'all' || f.state === fellowStateFilter;
      const matchesCity = fellowCityFilter === 'all' || f.city === fellowCityFilter;
      return matchesStatus && matchesCountry && matchesState && matchesCity;
    });
  }, [fellowsOnly, fellowStatus, fellowCountry, fellowStateFilter, fellowCityFilter]);

  const filteredInstitutionsList = useMemo(() => {
    return institutions.filter(i => {
      const matchesStatus = instStatus === 'all' || i.status === instStatus;
      const matchesCountry = instCountry === 'all' || i.country === instCountry;
      const matchesState = instStateFilter === 'all' || i.state === instStateFilter;
      const matchesCity = instCityFilter === 'all' || i.city === instCityFilter;
      return matchesStatus && matchesCountry && matchesState && matchesCity;
    });
  }, [institutions, instStatus, instCountry, instStateFilter, instCityFilter]);

  // Edit Blog states
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [adminBlogView, setAdminBlogView] = useState<'list' | 'create' | 'edit'>('list');
  const [blogEditForm, setBlogEditForm] = useState({
    title: '',
    summary: '',
    content: '',
    cover_image_url: '',
    category: 'General',
    status: 'published',
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);

  // Modal / Detail views
  const [viewingFellow, setViewingFellow] = useState<any | null>(null);
  const [viewingInst, setViewingInst] = useState<any | null>(null);
  const [viewingInstDetails, setViewingInstDetails] = useState<any | null>(null);
  const [viewingBlog, setViewingBlog] = useState<any | null>(null);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programModules, setProgramModules] = useState<any[]>([]);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);

  // Form states
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showChangeReqDialog, setShowChangeReqDialog] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [selectedChangeReq, setSelectedChangeReq] = useState<any | null>(null);

  const [fellowToolResults, setFellowToolResults] = useState<any[]>([]);
  const [fellowActivity, setFellowActivity] = useState<any[]>([]);
  const [activePanelTab, setActivePanelTab] = useState<'activity' | 'task'>('activity');
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    title: string;
    actionType: 'reject_fellow' | 'suspend_fellow' | 'reject_inst' | 'suspend_inst' | '';
    targetId: string;
  }>({
    isOpen: false,
    title: '',
    actionType: '',
    targetId: ''
  });
  const [reasonText, setReasonText] = useState('');
  useEffect(() => {
    setRejectReason('');
    if (viewingFellow?.id) {
      api.apiRequest(`/admin/users/${viewingFellow.id}/tool-results`)
        .then(res => setFellowToolResults(res || []))
        .catch(err => console.error(err));
      api.apiRequest(`/admin/users/${viewingFellow.id}/activity`)
        .then(res => setFellowActivity(res || []))
        .catch(err => console.error(err));
    } else {
      setFellowToolResults([]);
      setFellowActivity([]);
    }
  }, [viewingFellow?.id]);

  useEffect(() => {
    setRejectReason('');
    if (viewingInst?.id) {
      api.apiRequest(`/admin/institutions/${viewingInst.id}`)
        .then(res => {
          setViewingInstDetails(res);
        })
        .catch(err => {
          console.error('Failed to fetch detailed institution details:', err);
          setViewingInstDetails(null);
        });
    } else {
      setViewingInstDetails(null);
    }
  }, [viewingInst?.id]);

  // Generic prompt/reason modal state
  const [actionReasonDialog, setActionReasonDialog] = useState<{
    isOpen: boolean;
    title: string;
    label: string;
    placeholder: string;
    confirmText: string;
    confirmClass: string;
    value: string;
    error: string;
    onSubmit: (value: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    label: '',
    placeholder: '',
    confirmText: '',
    confirmClass: '',
    value: '',
    error: '',
    onSubmit: async () => {},
  });

  // Program Form
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    duration: '',
    level: 'intermediate',
    category: 'Pedagogy',
    image_url: '',
    prerequisites: '',
    learning_outcomes: '',
    certificate_settings: JSON.stringify({ template: 'standard', signatory: 'Director' }),
    status: 'draft'
  });

  // Module Form
  const [moduleForm, setModuleForm] = useState({
    title: '',
    chapter: 'Chapter 1',
    description: '',
    video_url: '',
    content: '',
    sort_order: 0,
    duration_minutes: 30
  });

  // Enrollment Form
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    userId: '',
    programId: ''
  });

  // Notifications states
  const [notifTarget, setNotifTarget] = useState<'all' | 'selected'>('all');
  const [selectedNotifUsers, setSelectedNotifUsers] = useState<string[]>([]);
  const [notifForm, setNotifForm] = useState({
    type: 'general',
    title: '',
    message: '',
    link: ''
  });
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'previous'>('today');

  // Settings states
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: 'Academisthan Portal',
    supportEmail: 'support@academisthan.org',
    maintenanceMode: false,
    categories: 'Pedagogy, Research, Leadership, Policy, Technology'
  });

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // DataTable columns definitions
  const fellowColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Fellow Details',
      accessorKey: 'full_name',
      sortable: true,
      className: 'font-semibold text-slate-700',
      cell: (row) => (
        <div className="space-y-1">
          <button
            onClick={() => setViewingFellow(row)}
            className="text-left font-semibold text-navy hover:text-gold hover:underline transition-colors focus:outline-none text-[13px] block"
          >
            {row.full_name}
          </button>
          <div className="text-[10px] text-slate-400 font-normal space-y-0.5">
            <span className="block">{row.email || 'N/A'}</span>
            <span className="block">{row.phone || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Institution / Work',
      accessorKey: 'institution',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-700">{row.institution || 'N/A'}</p>
          {(row.designation || row.department) && (
            <p className="text-[10px] text-slate-400 font-normal">
              {row.designation || ''} {row.designation && row.department ? '•' : ''} {row.department || ''}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Location & Joined',
      accessorKey: 'city',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-slate-700">{`${row.city ? `${row.city}, ` : ''}${row.state || ''} (${row.country || 'India'})`}</p>
          <p className="text-[10px] text-slate-400 font-normal">
            Joined: {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'membership_status',
      sortable: true,
      className: 'text-center',
      cell: (row) => (
        <Badge className={cn(
          "border px-2 py-0.5 rounded-full text-[10px] font-semibold",
          row.membership_status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          row.membership_status === 'suspended' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          row.membership_status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
          row.membership_status === 'pending_review' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
          'bg-amber-50 text-amber-600 border-amber-200'
        )}>
          {row.membership_status === 'pending_review' ? 'pending review' : (row.membership_status || 'pending')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-end items-center gap-1.5">
          <Button
            onClick={() => setViewingFellow(row)}
            className="btn-outline btn-xs"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {row.membership_status === 'pending' || row.membership_status === 'pending_review' ? (
            <>
              <Button className="btn-success btn-xs" onClick={() => handleUpdateFellowStatus(row.id, 'active')}>
                Approve
              </Button>
              <Button className="btn-danger btn-xs" onClick={() => handleUpdateFellowStatus(row.id, 'rejected')}>
                Reject
              </Button>
            </>
          ) : row.membership_status === 'rejected' ? (
            <Button className="btn-success btn-xs" onClick={() => handleUpdateFellowStatus(row.id, 'active')}>
              Approve
            </Button>
          ) : row.membership_status === 'suspended' ? (
            <Button className="btn-success btn-xs" onClick={() => handleUpdateFellowStatus(row.id, 'active')}>
              Activate
            </Button>
          ) : (
            <Button className="btn-danger btn-xs" onClick={() => handleUpdateFellowStatus(row.id, 'suspended')}>
              Suspend
            </Button>
          )}
          <Button
            onClick={() => handleDeleteFellow(row.id, row.full_name)}
            className="btn-danger btn-xs"
            title="Delete Fellow"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ], [enrollments]);

  const instColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      header: 'Institute Details',
      accessorKey: 'name',
      sortable: true,
      className: 'font-semibold text-slate-700',
      cell: (row) => (
        <div className="space-y-0.5">
          <button
            onClick={() => setViewingInst(row)}
            className="text-left font-semibold text-navy hover:text-gold hover:underline transition-colors focus:outline-none text-[13px] block"
          >
            {row.name}
          </button>
          <span className="text-[10px] text-slate-400 font-mono block">
            {row.institute_code || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessorKey: 'contact_person',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-slate-700">{row.contact_person || 'N/A'}</p>
          <p className="text-[10px] text-slate-400 font-normal">{row.contact_email || 'N/A'}</p>
          <p className="text-[10px] text-slate-400 font-normal">{row.contact_phone || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Location',
      accessorKey: 'city',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-medium text-slate-700">{row.city || 'N/A'}</span>
          <span className="text-[10px] text-slate-400 block font-normal">{row.state || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-center',
      cell: (row) => (
        <Badge className={cn(
          "border px-2 py-0.5 rounded-full text-[10px] font-semibold",
          row.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          row.status === 'pending_change_approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
          row.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
          row.status === 'suspended' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          'bg-amber-50 text-amber-600 border-amber-200'
        )}>
          {row.status === 'pending_change_approval' ? 'pending change' : row.status || 'pending'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-end items-center gap-1.5">
          {row.status === 'pending' ? (
            <Button className="btn-warning btn-xs" onClick={() => setViewingInst(row)}>
              Review
            </Button>
          ) : row.status === 'pending_change_approval' ? (
            <Button className="btn-warning btn-xs" onClick={() => { setViewingInst(row); handleFetchChangeRequest(row.id); }}>
              Review Changes
            </Button>
          ) : (
            <Button
              onClick={() => setViewingInst(row)}
              className="btn-outline btn-xs"
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={() => handleDeleteInst(row.id, row.name)}
            className="btn-danger btn-xs"
            title="Delete Institution"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ], []);

  const programColumns = useMemo<ColumnDef<any>[]>(() => [
    { header: 'Title', accessorKey: 'title', sortable: true, className: 'font-semibold text-slate-700' },
    { header: 'Category', accessorKey: 'category', sortable: true },
    { header: 'Level', accessorKey: 'level', sortable: true, className: 'capitalize' },
    { header: 'Duration', accessorKey: 'duration', sortable: true, cell: (row) => row.duration || 'Self-paced' },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-center',
      cell: (row) => (
        <Badge className={cn(
          "border",
          row.status === 'published' || row.is_published ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
        )}>
          {row.status || (row.is_published ? 'published' : 'draft')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-end items-center gap-1.5">
          <Button size="xs" variant="outline" className="rounded-lg text-[10px] h-7 px-2.5" onClick={() => { handleOpenModules(row); setShowModuleModal(false); }}>
            Modules
          </Button>
          <Button size="xs" variant="outline" className="rounded-lg text-[10px] h-7 px-2.5" onClick={() => { setEditingProgram(row); setProgramForm({ title: row.title, description: row.description || '', duration: row.duration || '', level: row.level || 'intermediate', category: row.category || 'Pedagogy', image_url: row.image_url || '', prerequisites: row.prerequisites || '', learning_outcomes: row.learning_outcomes || '', certificate_settings: row.certificate_settings || JSON.stringify({ template: 'standard', signatory: 'Director' }), status: row.status || 'draft' }); setShowProgramModal(true); }}>
            Edit
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg animate-none" onClick={() => handleDeleteProgram(row.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ], []);

  const enrollmentColumns = useMemo<ColumnDef<any>[]>(() => [
    { header: 'Fellow Name', accessorKey: 'fellow_name', sortable: true, className: 'font-semibold text-slate-700' },
    { header: 'Program Name', accessorKey: 'program_name', sortable: true, className: 'font-medium text-slate-600' },
    {
      header: 'Enrollment Date',
      accessorKey: 'enrolled_at',
      sortable: true,
      cell: (row) => row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString() : ''
    },
    {
      header: 'Progress',
      accessorKey: 'progress_percentage',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="w-8 font-bold text-slate-700">{row.progress_percentage || 0}%</span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-gold" style={{ width: `${row.progress_percentage || 0}%` }} />
          </div>
        </div>
      )
    },
    {
      header: 'Completion Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-center',
      cell: (row) => (
        <Badge className={cn(
          "border",
          row.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gold/10 text-gold border-gold/20'
        )}>
          {row.status || 'enrolled'}
        </Badge>
      )
    },
    {
      header: 'Certificate Status',
      accessorKey: 'certificate_number',
      sortable: true,
      className: 'text-center',
      cell: (row) => row.certificate_number ? (
        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 font-normal">
          {row.certificate_number}
        </Badge>
      ) : 'Not Issued'
    }
  ], []);

  const blogColumns = useMemo<ColumnDef<any>[]>(() => [
    { header: 'Blog Title', accessorKey: 'title', sortable: true, className: 'font-semibold text-slate-700 truncate max-w-[200px]' },
    { header: 'Author', accessorKey: 'author_name', sortable: true },
    { header: 'Category', accessorKey: 'category', sortable: true, className: 'capitalize' },
    {
      header: 'Submitted Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      className: 'text-center',
      cell: (row) => (
        <Badge className={cn(
          "border",
          row.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
          row.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
          'bg-amber-50 text-amber-600 border-amber-200'
        )}>
          {row.status === 'pending_review' ? 'pending approval' : row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <div className="flex justify-end items-center gap-1.5">
          <Button size="icon" variant="ghost" className="w-7 h-7 text-slate-400 hover:text-gold" onClick={() => window.open(`/blog/${row.slug}`, '_blank')}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-7 h-7 text-slate-400 hover:text-gold"
            onClick={() => {
              const predefined = ["General", "Research & Analytics", "Teaching Methodologies", "AI in Education", "Academic Policies"];
              const isCustom = row.category && !predefined.includes(row.category);
              setEditingBlog(row);
              setBlogEditForm({
                title: row.title || '',
                summary: row.summary || '',
                content: row.content || '',
                cover_image_url: row.cover_image_url || '',
                category: row.category || 'General',
                status: row.status || 'published',
                tags: row.tags || [],
              });
              setTagInput('');
              setCoverFile(null);
              setCoverBase64('');
              setIsCustomCategory(isCustom);
              setCustomCategory(isCustom ? row.category : '');
              setAdminBlogView('edit');
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {row.status === 'pending_review' && (
            <>
              <Button 
                type="button" 
                size="xs" 
                className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[10px] h-7 px-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleApproveBlog(row.id);
                }}
              >
                Approve
              </Button>
              <Button 
                type="button" 
                size="xs" 
                className="bg-rose-500 text-white hover:bg-rose-600 rounded-lg text-[10px] h-7 px-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRejectBlog(row.id);
                }}
              >
                Reject
              </Button>
            </>
          )}
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteBlog(row.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ], [handleApproveBlog, handleRejectBlog, handleDeleteBlog]);

  const notificationColumns = useMemo<ColumnDef<any>[]>(() => [
    { header: 'Title', accessorKey: 'title', sortable: true, className: 'font-semibold text-slate-700' },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <span className="text-[10px] capitalize bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border border-slate-200">
          {row.type}
        </span>
      )
    },
    { header: 'Message', accessorKey: 'message', sortable: true, className: 'text-slate-500 max-w-sm truncate' },
    {
      header: 'Recipient',
      accessorKey: 'fellow_name',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-700 block">{row.fellow_name || 'Fellow'}</span>
          <span className="text-[10px] text-slate-400 block">{row.fellow_email}</span>
        </div>
      )
    },
    {
      header: 'Sent Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (row) => (
        <Button size="icon" variant="ghost" className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteNotification(row.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    }
  ], []);

  // Load Admin Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.apiRequest('/admin/stats');
      if (statsRes) setStats(statsRes);

      // Fetch fellows
      const fellowsRes = await api.apiRequest('/admin/users');
      if (fellowsRes) setFellows(fellowsRes);

      // Fetch institutions
      const instRes = await api.apiRequest('/admin/institutions?limit=1000');
      if (instRes) setInstitutions(instRes.institutions || instRes);

      // Fetch programs
      const progRes = await api.programs.getAll();
      if (progRes) setPrograms(progRes);

      // Fetch enrollments
      const enrollRes = await api.apiRequest('/admin/enrollments');
      if (enrollRes) setEnrollments(enrollRes);

      // Fetch blogs
      const blogsRes = await api.apiRequest('/blogs/admin/all');
      if (blogsRes) setBlogs(blogsRes);

      // Fetch notifications logs
      const notifRes = await api.apiRequest('/admin/notifications/history');
      if (notifRes) setNotificationsHistory(notifRes);

      // Fetch unread notifications count
      const countRes = await api.apiRequest('/admin/notifications/unread-count');
      if (countRes) setUnreadCount(countRes.count);

      // Fetch recent log results
      const logRes = await api.apiRequest('/admin/tool-results');
      if (logRes) setRecentActivities(logRes.slice(0, 10));

    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error loading dashboard data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Mark all unread notifications as read when visiting the notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && isAdmin) {
      const markNotificationsRead = async () => {
        try {
          await api.apiRequest('/admin/notifications/mark-read', { method: 'PUT' });
          setUnreadCount(0);
          // Refresh logs
          const notifRes = await api.apiRequest('/admin/notifications/history');
          if (notifRes) setNotificationsHistory(notifRes);
        } catch (err) {
          console.error('Failed to mark notifications as read:', err);
        }
      };
      markNotificationsRead();
    }
  }, [activeTab, isAdmin]);

  // View state synchronizer
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/admin/institutions')) setActiveTab('institutions');
      else if (path.includes('/admin/fellows')) setActiveTab('fellows');
      else if (path.includes('/admin/blogs')) setActiveTab('blogs');
      else if (path.includes('/admin/programs')) setActiveTab('programs');
      else if (path.includes('/admin/enrollments')) setActiveTab('enrollments');
      else if (path.includes('/admin/notifications')) setActiveTab('notifications');
      else if (path.includes('/admin/reports')) setActiveTab('reports');
      else if (path.includes('/admin/settings')) setActiveTab('settings');
      else if (path.includes('/admin/change-password')) setActiveTab('change-password');
      else setActiveTab('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update Fellow Status from panel directly
  const handleUpdateFellowStatusFromPanel = async (fellowId: string, status: string) => {
    if (status === 'rejected' && !rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please specify a rejection reason.', variant: 'destructive' });
      return;
    }
    if (status === 'suspended' && !rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please specify a suspension reason.', variant: 'destructive' });
      return;
    }
    try {
      await api.apiRequest(`/admin/users/${fellowId}/status`, {
        method: 'PUT',
        body: { membership_status: status, reason: rejectReason }
      });
      toast({ title: 'Status Updated', description: `Fellow status successfully updated to ${status}.` });
      fetchData();
      setViewingFellow(prev => prev ? { ...prev, membership_status: status } : null);
      setRejectReason('');
    } catch (err: any) {
      toast({ title: 'Operation failed', description: err.message, variant: 'destructive' });
    }
  };

  // Update Fellow Status (Activate/Suspend/Reject)
  const handleUpdateFellowStatus = async (fellowId: string, status: string) => {
    const performStatusUpdate = async (reason: string) => {
      try {
        await api.apiRequest(`/admin/users/${fellowId}/status`, {
          method: 'PUT',
          body: { membership_status: status, reason }
        });
        toast({ title: 'Status Updated', description: `Fellow status successfully updated to ${status}.` });
        fetchData();
        if (viewingFellow && viewingFellow.id === fellowId) {
          setViewingFellow({ ...viewingFellow, membership_status: status });
        }
      } catch (err: any) {
        toast({ title: 'Operation failed', description: err.message, variant: 'destructive' });
      }
    };

    if (status === 'rejected') {
      setActionReasonDialog({
        isOpen: true,
        title: 'Reject Fellow Application',
        label: 'Reason for Rejection (Mandatory)',
        placeholder: 'Specify what revisions are required or reasons for rejection.',
        confirmText: 'Confirm Rejection',
        confirmClass: 'btn-danger',
        value: '',
        error: '',
        onSubmit: performStatusUpdate,
      });
      return;
    }

    if (status === 'suspended') {
      setActionReasonDialog({
        isOpen: true,
        title: 'Suspend Fellow Account',
        label: 'Reason for Suspension (Mandatory)',
        placeholder: 'Specify violation reasons or administrative blocks.',
        confirmText: 'Confirm Suspension',
        confirmClass: 'btn-danger',
        value: '',
        error: '',
        onSubmit: performStatusUpdate,
      });
      return;
    }

    // For active/other states, just perform the update without prompt
    await performStatusUpdate('');
  };

  // Delete Fellow Account
  const handleDeleteFellow = async (fellowId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the fellow account for "${name}"? This action cannot be undone and will delete all user progress and data.`)) return;
    try {
      await api.profiles.delete(fellowId);
      toast({ title: 'Fellow Deleted', description: 'Fellow account successfully deleted.' });
      fetchData();
      if (viewingFellow && viewingFellow.id === fellowId) {
        setViewingFellow(null);
      }
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  // Delete Institution
  const handleDeleteInst = async (instId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the institution "${name}"? This action cannot be undone.`)) return;
    try {
      await api.admin.bulkDeleteInstitutions([instId]);
      toast({ title: 'Institution Deleted', description: 'Institution successfully deleted.' });
      fetchData();
      if (viewingInst && viewingInst.id === instId) {
        setViewingInst(null);
      }
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  // Update Institution Status from panel directly
  const handleUpdateInstitutionStatusFromPanel = async (instId: string, status: string) => {
    if ((status === 'rejected' || status === 'suspended') && !rejectReason.trim()) {
      toast({ title: 'Reason required', description: `Please specify a reason for status: ${status}.`, variant: 'destructive' });
      return;
    }
    try {
      if (status === 'approved') {
        await api.apiRequest(`/admin/institutions/${instId}/approve`, { method: 'PUT' });
        toast({ title: 'Institution Approved 🏛️', description: 'The institution has been approved and is now active.' });
      } else if (status === 'rejected') {
        await api.apiRequest(`/admin/institutions/${instId}/reject`, {
          method: 'PUT',
          body: { reason: rejectReason }
        });
        toast({ title: 'Institution Rejected', description: 'The registration request has been rejected.' });
      } else if (status === 'suspended') {
        await api.apiRequest(`/admin/institutions/${instId}/suspend`, {
          method: 'PUT',
          body: { reason: rejectReason }
        });
        toast({ title: 'Institution Suspended', description: 'The institution has been suspended.' });
      }
      fetchData();
      setViewingInst(prev => prev ? { ...prev, status } : null);
      setRejectReason('');
    } catch (err: any) {
      toast({ title: 'Operation failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleLeaderVerification = async (leaderId: string, currentVerified: boolean) => {
    try {
      await api.apiRequest(`/admin/institutions/${viewingInst.id}/leadership/${leaderId}/verify`, {
        method: 'PUT',
        body: { verified: !currentVerified }
      });
      
      // Update local detailed state
      setViewingInstDetails((prev: any) => {
        if (!prev) return prev;
        const updatedLeads = prev.leadership.map((l: any) => 
          l.id === leaderId ? { ...l, admin_verified: currentVerified ? 0 : 1 } : l
        );
        return { ...prev, leadership: updatedLeads };
      });
      
      toast({ title: 'Verification updated', description: 'Leadership profile verification updated successfully.' });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update verification status', variant: 'destructive' });
    }
  };

  const handleSubmitReasonModal = async () => {
    if (!reasonText.trim()) {
      toast({ title: 'Reason required', description: 'Please enter a valid reason.', variant: 'destructive' });
      return;
    }
    const { actionType, targetId } = reasonModal;
    try {
      if (actionType === 'reject_fellow') {
        await api.apiRequest(`/admin/users/${targetId}/status`, {
          method: 'PUT',
          body: { membership_status: 'rejected', reason: reasonText }
        });
        toast({ title: 'Status Updated', description: 'Fellow status updated to Rejected.' });
        setViewingFellow(prev => prev ? { ...prev, membership_status: 'rejected' } : null);
      } else if (actionType === 'suspend_fellow') {
        await api.apiRequest(`/admin/users/${targetId}/status`, {
          method: 'PUT',
          body: { membership_status: 'suspended', reason: reasonText }
        });
        toast({ title: 'Status Updated', description: 'Fellow status updated to Suspended.' });
        setViewingFellow(prev => prev ? { ...prev, membership_status: 'suspended' } : null);
      } else if (actionType === 'reject_inst') {
        await api.apiRequest(`/admin/institutions/${targetId}/reject`, {
          method: 'PUT',
          body: { reason: reasonText }
        });
        toast({ title: 'Institution Rejected', description: 'Institution has been rejected.' });
        setViewingInst(prev => prev ? { ...prev, status: 'rejected' } : null);
      } else if (actionType === 'suspend_inst') {
        await api.apiRequest(`/admin/institutions/${targetId}/suspend`, {
          method: 'PUT',
          body: { reason: reasonText }
        });
        toast({ title: 'Institution Suspended', description: 'Institution has been suspended.' });
        setViewingInst(prev => prev ? { ...prev, status: 'suspended' } : null);
      }
      fetchData();
      setReasonModal({ isOpen: false, title: '', actionType: '', targetId: '' });
      setReasonText('');
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  // Institution Approvals
  const handleApproveInstitution = async (instId: string) => {
    if (!confirm('Are you sure you want to APPROVE this institution registration?')) return;
    try {
      await api.apiRequest(`/admin/institutions/${instId}/approve`, { method: 'PUT' });
      toast({ title: 'Institution Approved 🏛️', description: 'The institution has been approved and is now active.' });
      fetchData();
      setViewingInst(null);
    } catch (err: any) {
      toast({ title: 'Approve failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleRejectInstitution = async () => {
    if (!rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a rejection reason.', variant: 'destructive' });
      return;
    }
    if (!confirm('Are you sure you want to REJECT this institution registration?')) return;
    try {
      await api.apiRequest(`/admin/institutions/${viewingInst.id}/reject`, {
        method: 'PUT',
        body: { reason: rejectReason.trim() }
      });
      toast({ title: 'Institution Rejected', description: 'Notification sent to the registrant fellow.' });
      setShowRejectDialog(false);
      setRejectReason('');
      setViewingInst(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Rejection failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSuspendInstitution = async () => {
    if (!suspendReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a suspension reason.', variant: 'destructive' });
      return;
    }
    try {
      await api.apiRequest(`/admin/institutions/${viewingInst.id}/suspend`, {
        method: 'PUT',
        body: { reason: suspendReason.trim() }
      });
      toast({ title: 'Institution Suspended', description: 'The institution has been suspended and hidden from search.' });
      setShowSuspendDialog(false);
      setSuspendReason('');
      setViewingInst(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Suspension failed', description: err.message, variant: 'destructive' });
    }
  };

  // Change Request Actions
  const handleFetchChangeRequest = async (instId: string) => {
    try {
      const res = await api.apiRequest(`/admin/institutions/${instId}/change-requests`);
      if (res && res.length > 0) {
        setChangeRequests(res);
        setSelectedChangeReq(res[0]);
        setShowChangeReqDialog(true);
      } else {
        toast({ title: 'No Requests Found', description: 'No pending change requests for this institution.' });
      }
    } catch (err: any) {
      toast({ title: 'Fetch failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleApproveChangeRequest = async (reqId: string) => {
    try {
      await api.apiRequest(`/admin/institutions/change-requests/${reqId}/approve`, { method: 'PUT' });
      toast({ title: 'Changes Approved', description: 'Institution profile updated successfully.' });
      setShowChangeReqDialog(false);
      setViewingInst(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Approval failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleRejectChangeRequest = async (reqId: string) => {
    try {
      await api.apiRequest(`/admin/institutions/change-requests/${reqId}/reject`, {
        method: 'PUT',
        body: { notes: 'Changes do not align with our guidelines.' }
      });
      toast({ title: 'Changes Rejected', description: 'Change request rejected and archived.' });
      setShowChangeReqDialog(false);
      setViewingInst(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Rejection failed', description: err.message, variant: 'destructive' });
    }
  };

  // Program Actions
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...programForm,
        slug: programForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      };

      if (editingProgram) {
        await api.apiRequest(`/programs/${editingProgram.id}`, {
          method: 'PUT',
          body: payload
        });
        toast({ title: 'Program Updated', description: `Successfully updated program "${payload.title}"` });
      } else {
        await api.apiRequest('/programs', {
          method: 'POST',
          body: payload
        });
        toast({ title: 'Program Created 🎓', description: `Successfully created program "${payload.title}"` });
      }
      setShowProgramModal(false);
      setEditingProgram(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Failed to save program', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteProgram = async (progId: string) => {
    if (!confirm('Are you sure you want to delete this program? All modules will be deleted.')) return;
    try {
      await api.apiRequest(`/programs/${progId}`, { method: 'DELETE' });
      toast({ title: 'Program Deleted', description: 'The program was permanently removed.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Failed to delete program', description: err.message, variant: 'destructive' });
    }
  };

  // Modules Editor
  const handleOpenModules = async (prog: any) => {
    setEditingProgram(prog);
    try {
      const res = await api.apiRequest(`/programs/${prog.id}/modules`);
      setProgramModules(res || []);
    } catch (err: any) {
      toast({ title: 'Failed to load modules', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModule) {
        await api.apiRequest(`/programs/modules/${editingModule.id}`, {
          method: 'PUT',
          body: moduleForm
        });
        toast({ title: 'Module Updated', description: 'Module updated successfully.' });
      } else {
        await api.apiRequest(`/programs/${editingProgram.id}/modules`, {
          method: 'POST',
          body: moduleForm
        });
        toast({ title: 'Module Added', description: 'Module added to program successfully.' });
      }
      setShowModuleModal(false);
      setEditingModule(null);
      handleOpenModules(editingProgram);
    } catch (err: any) {
      toast({ title: 'Failed to save module', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteModule = async (modId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      await api.apiRequest(`/programs/modules/${modId}`, { method: 'DELETE' });
      toast({ title: 'Module Deleted', description: 'Module deleted successfully.' });
      handleOpenModules(editingProgram);
    } catch (err: any) {
      toast({ title: 'Failed to delete module', description: err.message, variant: 'destructive' });
    }
  };

  // Fellow Enrollment
  const handleEnrollFellow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.userId || !enrollForm.programId) {
      toast({ title: 'Missing fields', description: 'Select fellow and program.', variant: 'destructive' });
      return;
    }
    try {
      await api.apiRequest('/programs/enroll', {
        method: 'POST',
        body: { program_id: enrollForm.programId, user_id: enrollForm.userId }
      });
      toast({ title: 'Fellow Enrolled Successfully! 🎓', description: 'Notification sent to fellow dashboard.' });
      setShowEnrollModal(false);
      setEnrollForm({ userId: '', programId: '' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Enrollment failed', description: err.message, variant: 'destructive' });
    }
  };

  // Blog management
  async function handleApproveBlog(blogId: string) {
    try {
      await api.apiRequest(`/blogs/admin/approve/${blogId}`, { method: 'PUT' });
      toast({ title: 'Blog Approved & Published', description: 'The blog is now visible to all fellows.' });
      fetchData();
      setViewingBlog(null);
    } catch (err: any) {
      toast({ title: 'Approve failed', description: err.message, variant: 'destructive' });
    }
  }

  async function handleRejectBlog(blogId: string, reason?: string) {
    const performBlogRejection = async (finalReason: string) => {
      try {
        await api.apiRequest(`/blogs/admin/reject/${blogId}`, {
          method: 'PUT',
          body: { reason: finalReason }
        });
        toast({ title: 'Blog Rejected', description: 'Revisions request sent to author.' });
        fetchData();
        setViewingBlog(null);
      } catch (err: any) {
        toast({ title: 'Rejection failed', description: err.message, variant: 'destructive' });
      }
    };

    if (!reason) {
      setActionReasonDialog({
        isOpen: true,
        title: 'Reject Blog Post',
        label: 'Reason for Rejection (Mandatory)',
        placeholder: 'Specify what revisions are required for this blog post.',
        confirmText: 'Confirm Rejection',
        confirmClass: 'btn-danger',
        value: '',
        error: '',
        onSubmit: performBlogRejection,
      });
      return;
    }

    await performBlogRejection(reason);
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File size limit exceeded', description: 'Cover image must be under 2MB', variant: 'destructive' });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCoverFile(file);
      setCoverBase64(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const addTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !blogEditForm.tags.includes(clean)) {
      setBlogEditForm(p => ({ ...p, tags: [...p.tags, clean] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setBlogEditForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogEditForm.title.trim() || !blogEditForm.content.trim()) {
      toast({ title: 'Title and Content are required', variant: 'destructive' });
      return;
    }
    setIsSubmittingBlog(true);
    try {
      let finalCoverUrl = blogEditForm.cover_image_url;

      if (coverFile && coverBase64) {
        const uploadRes = await api.blogs.uploadCover(coverBase64);
        finalCoverUrl = uploadRes.coverImageUrl || uploadRes.imageUrl;
      }

      const payload = {
        ...blogEditForm,
        cover_image_url: finalCoverUrl,
      };

      if (editingBlog) {
        await api.blogs.update(editingBlog.id, payload);
        toast({ title: 'Blog Post Updated! 📝', description: 'Blog post changes saved successfully.' });
      } else {
        await api.blogs.create(payload);
        toast({ title: 'Blog Post Created! 🎉', description: 'New blog post created successfully.' });
      }
      setAdminBlogView('list');
      setEditingBlog(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Failed to save blog', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmittingBlog(false);
    }
  };

  async function handleDeleteBlog(blogId: string) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await api.apiRequest(`/blogs/${blogId}`, { method: 'DELETE' });
      toast({ title: 'Blog Post Deleted', description: 'The blog post has been deleted successfully.' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  }

  // Custom Notifications Broadcast
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      toast({ title: 'Required fields', description: 'Enter title and message content.', variant: 'destructive' });
      return;
    }
    try {
      if (notifTarget === 'all') {
        await api.apiRequest('/admin/notifications/broadcast', {
          method: 'POST',
          body: notifForm
        });
      } else {
        if (selectedNotifUsers.length === 0) {
          toast({ title: 'No users selected', description: 'Select at least one fellow.', variant: 'destructive' });
          return;
        }
        await api.apiRequest('/admin/notifications/send-selected', {
          method: 'POST',
          body: { ...notifForm, userIds: selectedNotifUsers }
        });
      }
      toast({ title: 'Notification Center', description: 'Notifications dispatched successfully.' });
      setNotifForm({ type: 'general', title: '', message: '', link: '' });
      setSelectedNotifUsers([]);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Send failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.apiRequest(`/admin/notifications/${id}`, { method: 'DELETE' });
      toast({ title: 'Notification Deleted', description: 'Notification removed from history logs.' });
      setSelectedNotifIds(prev => prev.filter(item => item !== id));
      fetchData();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkDeleteNotification = async () => {
    if (selectedNotifIds.length === 0) return;
    try {
      await api.apiRequest('/admin/notifications/bulk-delete', {
        method: 'POST',
        body: { ids: selectedNotifIds }
      });
      toast({ 
        title: 'Notifications Deleted', 
        description: `Permanently deleted ${selectedNotifIds.length} notifications.` 
      });
      setSelectedNotifIds([]);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Bulk delete failed', description: err.message, variant: 'destructive' });
    }
  };

  // Change Password Form Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Mismatch Error', description: 'Confirm password must match the new password.', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: 'Validation Warning', description: 'New password must be at least 8 characters.', variant: 'destructive' });
      return;
    }

    try {
      await api.apiRequest('/auth/change-password', {
        method: 'POST',
        body: {
          oldPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }
      });
      toast({ title: 'Password Updated Successfully! 🔐', description: 'A confirmation security email has been sent.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast({ title: 'Password update failed', description: err.message, variant: 'destructive' });
    }
  };

  // Export Reports dynamically to CSV
  const handleExportCSV = (reportType: string) => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `${reportType}_report_${Date.now()}.csv`;

    if (reportType === 'fellows') {
      headers = ['Name', 'Email', 'Phone', 'Institution', 'City', 'State', 'Country', 'Status', 'Registered Date'];
      rows = fellowsOnly.map(f => [
        f.full_name || '',
        f.email || '',
        f.phone || '',
        f.institution || '',
        f.city || '',
        f.state || '',
        f.country || 'India',
        f.membership_status || 'pending',
        f.created_at ? new Date(f.created_at).toLocaleDateString() : ''
      ]);
    } else if (reportType === 'institutions') {
      headers = ['Institution Name', 'Registrant Fellow', 'Office Email', 'Contact Phone', 'Country', 'State', 'City', 'Status', 'Established Year'];
      rows = institutions.map(i => [
        i.name || '',
        i.contact_person || '',
        i.contact_email || '',
        i.contact_phone || '',
        i.country || '',
        i.state || '',
        i.city || '',
        i.status || '',
        i.established_year || ''
      ]);
    } else if (reportType === 'enrollments') {
      headers = ['Fellow Name', 'Program Name', 'Enrolled Date', 'Progress %', 'Status', 'Certificate No'];
      rows = enrollments.map(e => [
        e.fellow_name || '',
        e.program_name || '',
        e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '',
        `${e.progress_percentage || 0}%`,
        e.status || '',
        e.certificate_number || 'N/A'
      ]);
    } else {
      headers = ['Title', 'Author', 'Category', 'Likes', 'Comments', 'Status', 'Submitted Date'];
      rows = blogs.map(b => [
        b.title || '',
        b.author_name || 'Fellow',
        b.category || '',
        b.like_count || 0,
        b.comment_count || 0,
        b.status || '',
        b.created_at ? new Date(b.created_at).toLocaleDateString() : ''
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Complete', description: `Report downloaded successfully as ${filename}.` });
  };

  // Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Settings Saved', description: 'System configurations updated successfully.' });
  };

  // Auth Guard checking
  if (roleLoading || (loading && fellows.length === 0)) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-warm gap-3">
        <Loader2 className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-sm">Authenticating Admin Workspace...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-warm text-center px-4">
        <AlertTriangle className="w-16 h-16 text-gold mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-warm/60 max-w-sm">
          This secure admin portal is restricted to authorized administrators only. Please log in with admin privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col justify-between font-sans dashboard-theme">
      <div>
        <Navbar />

        {/* ═══ Hero Header ═══ */}
        <div className="relative pt-20 pb-12 bg-gradient-to-b from-navy via-navy/95 to-background overflow-hidden text-white">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10 pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">Admin Workspace</span>
                  <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase">
                    🛡️ {role?.replace('_', ' ')}
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-warm">
                  Welcome Admin, {profile?.full_name?.split(' ')[0] || 'Administrator'} 👋
                </h1>
                <p className="text-warm/40 text-sm mt-1">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Button variant="outline" onClick={async () => {
                await signOut();
                window.location.href = '/';
              }} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 self-start">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="pb-16 pt-8">
          <div className="container mx-auto px-4 space-y-8">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
              {/* ═══ LEFT COLUMN ═══ */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                {/* Membership Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(228,45%,16%)] via-[hsl(228,45%,20%)] to-[hsl(228,35%,25%)] p-5 md:p-6 border border-gold/20 shadow-[0_20px_60px_hsl(228_45%_16%/0.5)] text-white">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/3 rounded-full blur-2xl" />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div>
                        <span className="text-gold/60 text-[10px] tracking-[0.3em] uppercase font-medium">Academisthan</span>
                        <h3 className="font-serif text-sm md:text-base text-gold font-bold mt-1">Admin Workspace</h3>
                      </div>
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 bg-gold/5 flex items-center justify-center shrink-0">
                        {profile?.avatar_url ? (
                          <img src={getBustUrl(profile.avatar_url)} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Shield className="w-7 h-7 text-gold/60" />
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="font-serif text-lg font-bold text-warm truncate">
                        {profile?.full_name || 'System Admin'}
                      </h2>
                      <p className="text-warm/50 text-xs mt-1 capitalize truncate">
                        {role?.replace('_', ' ')} · Academisthan
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-warm/40 text-[10px] uppercase tracking-wider block">Admin Email</span>
                        <span className="font-mono text-gold text-xs font-bold tracking-wider block truncate max-w-[120px]">
                          {user?.email || 'admin@academisthan.org'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-warm/40 text-[10px] uppercase tracking-wider block">Session</span>
                        <p className="text-warm/70 text-xs mt-1">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Navigation Sidebar Card */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" /> Admin Console
                  </h3>
                  <div className="space-y-1 dashboard-menu">
                    {[
                      { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart3 },
                      { id: 'fellows', label: 'Fellow List', icon: Users },
                      { id: 'connections', label: 'Fellow Connections', icon: Users },
                      { id: 'lms-monitor', label: 'LMS Progress', icon: GraduationCap },
                      { id: 'certifications', label: 'Teacher Tools Certifications', icon: Award },
                      { id: 'institutions', label: 'Institution Management', icon: Building2 },
                      { id: 'programs', label: 'Program Management', icon: GraduationCap },
                      { id: 'enrollments', label: 'Program Enrollments', icon: BookOpen },
                      { id: 'blogs', label: 'Blog Management', icon: FileText },
                      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
                      { id: 'reports', label: 'Reports', icon: Download },
                      { id: 'settings', label: 'Settings', icon: Settings },
                      { id: 'change-password', label: 'Change Password', icon: Key },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item.id)}
                          className={cn(
                            "sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-250 group",
                            isActive 
                              ? "bg-gold/10 text-gold font-semibold" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={cn("w-4 h-4", isActive ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", isActive ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ═══ RIGHT COLUMN ═══ */}
              <div className="lg:col-span-3 space-y-6 min-h-[750px]">
                {activeTab !== 'dashboard' && (
                  <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <span className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gold" />
                      {activeTab === 'fellows' && 'Fellow Fellowship Manager'}
                      {activeTab === 'institutions' && 'Institution Submissions & Approvals'}
                      {activeTab === 'programs' && 'Curriculum & Program Builder'}
                      {activeTab === 'enrollments' && 'Fellow Program Enrollments'}
                      {activeTab === 'blogs' && 'Blog Review Board'}
                      {activeTab === 'notifications' && 'Broadcast Announcement Center'}
                      {activeTab === 'reports' && 'Exportable Activity Reports'}
                      {activeTab === 'settings' && 'Portal Configurations'}
                      {activeTab === 'change-password' && 'Password Security Panel'}
                      {activeTab === 'connections' && 'Fellow Connections'}
                      {activeTab === 'lms-monitor' && 'LMS Student Progress Auditing'}
                      {activeTab === 'certifications' && 'Teacher Tools Certifications'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo('dashboard')}
                      className="rounded-xl border-gold/20 text-gold hover:bg-gold/10 hover:text-gold gap-1.5 h-8 text-xs font-semibold"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Dashboard
                    </Button>
                  </div>
                )}

                {/* Tab Container */}
                <div className={cn("bg-card border border-border rounded-2xl p-1 relative overflow-hidden", activeTab !== 'dashboard' && "p-6 md:p-8")}>

          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'totalFellows', label: 'Total Fellows', val: stats.totalFellows, icon: Users, color: 'border-l-blue-500', tab: 'fellows' },
                  { key: 'totalInstitutions', label: 'Total Institutions', val: stats.totalInstitutions, icon: Building2, color: 'border-l-indigo-500', tab: 'institutions' },
                  { key: 'totalPrograms', label: 'Total Programs', val: stats.totalPrograms, icon: GraduationCap, color: 'border-l-purple-500', tab: 'programs' },
                  { key: 'totalEnrollments', label: 'Program Enrollments', val: stats.totalEnrollments, icon: BookOpen, color: 'border-l-teal-500', tab: 'enrollments' },
                  { key: 'totalBlogs', label: 'Total Blogs', val: stats.totalBlogs, icon: FileText, color: 'border-l-sky-500', tab: 'blogs' },
                  { key: 'pendingInstitutionApprovals', label: 'Pending Institutions', val: stats.pendingInstitutionApprovals, icon: Clock, color: 'border-l-amber-500 text-amber-600', tab: 'institutions', filter: 'pending' },
                  { key: 'pendingBlogApprovals', label: 'Pending Blogs', val: stats.pendingBlogApprovals, icon: Info, color: 'border-l-yellow-500 text-yellow-600', tab: 'blogs', filter: 'pending_review' },
                  { key: 'activeNotifications', label: 'Active Notifications', val: stats.activeNotifications, icon: Bell, color: 'border-l-emerald-500', tab: 'notifications' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.key}
                      onClick={() => {
                        navigateTo(card.tab);
                        if (card.filter) {
                          if (card.tab === 'institutions') setInstStatus(card.filter);
                          if (card.tab === 'blogs') setBlogStatus(card.filter);
                        }
                      }}
                      className={`bg-white border-l-4 ${card.color} border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold font-serif text-slate-800 mt-2">{card.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions & Recent logs */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent activity list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 space-y-4">
                  <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" /> Recent Audit Activity Log
                  </h3>
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="flex justify-between items-start text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-700">{act.full_name || 'Fellow'} - <span className="text-slate-400 font-medium">{act.membership_id || 'N/A'}</span></div>
                          <div className="text-slate-500 font-medium">{act.tool_name || 'Tool Execution'} completed.</div>
                        </div>
                        <div className="text-right text-[10px]">
                          <Badge variant="secondary" className="font-normal text-[9px] bg-slate-100 text-slate-500">
                            {act.created_at ? new Date(act.created_at).toLocaleDateString() : ''}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {recentActivities.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-xs">No recent activity logs found.</div>
                    )}
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" /> Quick Shortcuts
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Frequently used administrative activities. Click a link below to execute.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => { navigateTo('programs'); setEditingProgram(null); setProgramForm({ title: '', description: '', duration: '', level: 'intermediate', category: 'Pedagogy', image_url: '', prerequisites: '', learning_outcomes: '', certificate_settings: JSON.stringify({ template: 'standard', signatory: 'Director' }), status: 'draft' }); setShowProgramModal(true); }}
                      className="w-full flex justify-between items-center px-4 py-2.5 bg-navy text-warm rounded-xl text-xs font-semibold hover:bg-navy/90 transition-all"
                    >
                      <span>Create New Course</span>
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { navigateTo('notifications'); setNotifTarget('all'); }}
                      className="w-full flex justify-between items-center px-4 py-2.5 bg-gold/15 text-gold border border-gold/25 hover:bg-gold/25 rounded-xl text-xs font-semibold transition-all"
                    >
                      <span>Broadcast notification</span>
                      <Bell className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { navigateTo('institutions'); setInstStatus('pending'); }}
                      className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                    >
                      <span>Review Pending Institutions</span>
                      <Building2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. FELLOW MANAGEMENT */}
          {activeTab === 'fellows' && (
            <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={fellowStatus}
                    onChange={e => setFellowStatus(e.target.value)}
                    className="rounded-xl border border-slate-200 text-xs px-3 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Hierarchical Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Country:</span>
                    <select
                      value={fellowCountry}
                      onChange={e => setFellowCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueFellowCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">State:</span>
                    <select
                      value={fellowStateFilter}
                      onChange={e => setFellowStateFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueFellowStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">City:</span>
                    <select
                      value={fellowCityFilter}
                      onChange={e => setFellowCityFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueFellowCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <DataTable
                data={filteredFellowsList}
                columns={fellowColumns}
                searchPlaceholder="Search fellows by name, email, designation..."
                exportFilename="academisthan_fellows"
              />
            </div>
          )}

          {/* 3. INSTITUTION MANAGEMENT */}
          {activeTab === 'institutions' && (
            <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={instStatus}
                    onChange={e => setInstStatus(e.target.value)}
                    className="rounded-xl border border-slate-200 text-xs px-3 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                  >
                    <option value="all">All Submissions</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="pending_change_approval">Pending Change Approval</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Hierarchical Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Country:</span>
                    <select
                      value={instCountry}
                      onChange={e => setInstCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueInstCountries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">State:</span>
                    <select
                      value={instStateFilter}
                      onChange={e => setInstStateFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueInstStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">City:</span>
                    <select
                      value={instCityFilter}
                      onChange={e => setInstCityFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 text-xs px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="all">All</option>
                      {uniqueInstCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <DataTable
                data={filteredInstitutionsList}
                columns={instColumns}
                searchPlaceholder="Search institutions by name, email, contact..."
                exportFilename="academisthan_institutions"
              />
            </div>
          )}

          {/* 4. PROGRAM MANAGEMENT */}
          {activeTab === 'programs' && (
            <ProgramManager />
          )}

          {/* 5. PROGRAM ENROLLMENTS */}
          {activeTab === 'enrollments' && (
            <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-serif text-sm font-bold text-navy">Enrollment Registry</h3>
                <Button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Enroll Fellow
                </Button>
              </div>

              <DataTable
                data={enrollments}
                columns={enrollmentColumns}
                searchPlaceholder="Search enrollments by fellow name, program name, status..."
                exportFilename="academisthan_enrollments"
              />
            </div>
          )}

          {/* 6. BLOG MANAGEMENT */}
          {activeTab === 'blogs' && (
            <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              {adminBlogView === 'list' ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="font-serif text-sm font-bold text-navy">Blog Submissions</h3>
                    <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                          value={blogStatus}
                          onChange={e => setBlogStatus(e.target.value)}
                          className="rounded-xl border border-slate-200 text-xs px-3 py-1.5 bg-white font-medium text-slate-700 outline-none focus:ring-1 focus:ring-gold"
                        >
                          <option value="all">All Submissions</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="published">Published</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingBlog(null);
                          setBlogEditForm({
                            title: '',
                            summary: '',
                            content: '',
                            cover_image_url: '',
                            category: 'General',
                            status: 'published',
                            tags: [],
                          });
                          setTagInput('');
                          setCoverFile(null);
                          setCoverBase64('');
                          setIsCustomCategory(false);
                          setCustomCategory('');
                          setAdminBlogView('create');
                        }}
                        size="sm"
                        className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 gap-1.5 text-xs font-semibold px-4"
                      >
                        <Plus className="w-4 h-4" /> Write Article
                      </Button>
                    </div>
                  </div>

                  <DataTable
                    data={blogs.filter(b => blogStatus === 'all' || b.status === blogStatus)}
                    columns={blogColumns}
                    searchPlaceholder="Search blogs by title, author, category..."
                    exportFilename="academisthan_blogs"
                  />
                </>
              ) : (
                <form onSubmit={handleSaveBlog} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-serif text-base font-bold text-navy">
                        {adminBlogView === 'edit' ? 'Edit Blog Post' : 'Create New Blog'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {adminBlogView === 'edit' ? 'Modify post details and update content' : 'Publish insights, methodologies, or announcements directly'}
                      </p>
                    </div>
                    <Button type="button" onClick={() => { setAdminBlogView('list'); setEditingBlog(null); }} variant="ghost" size="sm" className="rounded-xl h-8 gap-1.5 text-xs">
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Blog Title *</label>
                      <Input
                        value={blogEditForm.title}
                        onChange={e => setBlogEditForm(p => ({ ...p, title: e.target.value }))}
                        required
                        placeholder="E.g. Enhancing Student Engagement with AI Calculators"
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-600">Category</label>
                          <button
                            type="button"
                            onClick={() => {
                              const toggleState = !isCustomCategory;
                              setIsCustomCategory(toggleState);
                              if (toggleState) {
                                setBlogEditForm(p => ({ ...p, category: customCategory || '' }));
                              } else {
                                setBlogEditForm(p => ({ ...p, category: 'General' }));
                              }
                            }}
                            className="text-gold text-[10px] font-bold hover:underline"
                          >
                            {isCustomCategory ? 'Select Predefined' : '+ Custom Category'}
                          </button>
                        </div>
                        {isCustomCategory ? (
                          <Input
                            value={customCategory}
                            onChange={e => {
                              setCustomCategory(e.target.value);
                              setBlogEditForm(p => ({ ...p, category: e.target.value }));
                            }}
                            placeholder="Enter custom category name..."
                            className="rounded-xl h-9 text-xs"
                            required
                          />
                        ) : (
                          <select
                            value={blogEditForm.category}
                            onChange={e => setBlogEditForm(p => ({ ...p, category: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 bg-white h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-gold"
                          >
                            <option value="General">General</option>
                            <option value="Research & Analytics">Research & Analytics</option>
                            <option value="Teaching Methodologies">Teaching Methodologies</option>
                            <option value="AI in Education">AI in Education</option>
                            <option value="Academic Policies">Academic Policies</option>
                          </select>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Cover Image URL (or upload below)</label>
                        <Input
                          value={blogEditForm.cover_image_url}
                          onChange={e => setBlogEditForm(p => ({ ...p, cover_image_url: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                          className="rounded-xl h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Cover Image File (Optional)</label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('cover-file-input-admin-inline')?.click()}
                            className="rounded-xl h-9 text-xs gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload Image
                          </Button>
                          <input
                            type="file"
                            id="cover-file-input-admin-inline"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {coverFile ? coverFile.name : 'No file chosen'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Moderation Status</label>
                        <select
                          value={blogEditForm.status}
                          onChange={e => setBlogEditForm(p => ({ ...p, status: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-gold"
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="published">Published</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Summary / Short Snippet *</label>
                      <textarea
                        value={blogEditForm.summary}
                        onChange={e => setBlogEditForm(p => ({ ...p, summary: e.target.value }))}
                        placeholder="A brief 1-2 sentence overview of your post..."
                        className="w-full text-xs rounded-xl border border-slate-200 p-2.5 h-16 outline-none focus:ring-1 focus:ring-gold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Blog Content *</label>
                      <CKEditor
                        value={blogEditForm.content}
                        onChange={val => setBlogEditForm(p => ({ ...p, content: val }))}
                        placeholder="Start writing your article here..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Tags</label>
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          placeholder="Add tag and press Enter"
                          className="rounded-xl h-9 text-xs"
                        />
                        <Button type="button" onClick={addTag} variant="outline" size="sm" className="rounded-xl h-9 text-xs">
                          Add
                        </Button>
                      </div>
                      {blogEditForm.tags && blogEditForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {blogEditForm.tags.map(t => (
                            <span key={t} className="text-[9px] font-semibold bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              {t}
                              <button type="button" onClick={() => removeTag(t)} className="text-rose-500 hover:text-rose-700 font-bold ml-0.5">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setAdminBlogView('list'); setEditingBlog(null); }}
                      className="rounded-xl h-10 px-4 text-xs gap-1.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingBlog}
                      className="rounded-xl bg-navy hover:bg-navy/95 text-warm h-10 px-5 text-xs gap-1.5 font-semibold animate-none"
                    >
                      {isSubmittingBlog ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Save Post
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 7. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Broadcast announcement form */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-sm font-bold text-navy">Send Announcement</h3>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Announcement Target</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input type="radio" checked={notifTarget === 'all'} onChange={() => setNotifTarget('all')} />
                        Broadcast to All Fellows
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input type="radio" checked={notifTarget === 'selected'} onChange={() => setNotifTarget('selected')} />
                        Selected Fellows
                      </label>
                    </div>
                  </div>

                  {notifTarget === 'selected' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Fellows</label>
                      <select
                        multiple
                        className="w-full text-xs rounded-xl border border-slate-200 p-2 min-h-24"
                        value={selectedNotifUsers}
                        onChange={e => {
                          const options = Array.from(e.target.selectedOptions, o => o.value);
                          setSelectedNotifUsers(options);
                        }}
                      >
                        {fellowsOnly.map(f => (
                          <option key={f.id} value={f.id}>{f.full_name || f.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Notification Type</label>
                    <select
                      value={notifForm.type}
                      onChange={e => setNotifForm({ ...notifForm, type: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                    >
                      <option value="general">General Announcement</option>
                      <option value="institution_status">Institution Updates</option>
                      <option value="course">Program Updates</option>
                      <option value="blog">Blog Approval</option>
                      <option value="system">System Notification</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                    <Input
                      value={notifForm.title}
                      onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                      placeholder="Enter announcement title..."
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Message Content</label>
                    <textarea
                      value={notifForm.message}
                      onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                      placeholder="Write announcement body..."
                      className="w-full text-xs rounded-xl border border-slate-200 p-3 h-24 focus:ring-1 focus:ring-gold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Redirect Link (Optional)</label>
                    <Input
                      value={notifForm.link}
                      onChange={e => setNotifForm({ ...notifForm, link: e.target.value })}
                      placeholder="e.g. /programs, /blog"
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-navy hover:bg-navy/95 text-warm rounded-xl text-xs font-semibold py-2">
                    Dispatch Notification
                  </Button>
                </form>
              </div>

              {/* Notification logs history */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-sm font-bold text-navy">Notifications History Logs</h3>
                  {selectedNotifIds.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={handleBulkDeleteNotification}
                      className="text-[10px] h-7 px-3 rounded-lg font-semibold flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      Bulk Delete Selected ({selectedNotifIds.length})
                    </Button>
                  )}
                </div>

                {/* Sub-tabs header matching the reference design */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setActiveSubTab('today');
                        setSelectedNotifIds([]);
                      }}
                      className={`text-xs font-bold pb-2 transition-all border-b-2 ${
                        activeSubTab === 'today' 
                          ? 'border-gold text-navy font-semibold' 
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Today <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                        {notificationsHistory.filter(n => isToday(n.created_at)).length}
                      </span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveSubTab('previous');
                        setSelectedNotifIds([]);
                      }}
                      className={`text-xs font-bold pb-2 transition-all border-b-2 ${
                        activeSubTab === 'previous' 
                          ? 'border-gold text-navy font-semibold' 
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Previous <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                        {notificationsHistory.filter(n => !isToday(n.created_at)).length}
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Select All Checkbox */}
                    {((activeSubTab === 'today' ? notificationsHistory.filter(n => isToday(n.created_at)) : notificationsHistory.filter(n => !isToday(n.created_at))).length > 0) && (
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={
                            (activeSubTab === 'today' ? notificationsHistory.filter(n => isToday(n.created_at)) : notificationsHistory.filter(n => !isToday(n.created_at)))
                              .every(n => selectedNotifIds.includes(n.id))
                          }
                          onChange={() => {
                            const subtabNotifs = activeSubTab === 'today' 
                              ? notificationsHistory.filter(n => isToday(n.created_at)) 
                              : notificationsHistory.filter(n => !isToday(n.created_at));
                            const allSelected = subtabNotifs.every(n => selectedNotifIds.includes(n.id));
                            if (allSelected) {
                              setSelectedNotifIds(prev => prev.filter(id => !subtabNotifs.some(n => n.id === id)));
                            } else {
                              setSelectedNotifIds(prev => Array.from(new Set([...prev, ...subtabNotifs.map(n => n.id)])));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-gold focus:ring-gold"
                        />
                        Select All
                      </label>
                    )}
                  </div>
                </div>

                {/* Notifications list */}
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
                  {(activeSubTab === 'today' 
                    ? notificationsHistory.filter(n => isToday(n.created_at)) 
                    : notificationsHistory.filter(n => !isToday(n.created_at))
                  ).length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No notifications in this section.
                    </div>
                  ) : (
                    (activeSubTab === 'today' 
                      ? notificationsHistory.filter(n => isToday(n.created_at)) 
                      : notificationsHistory.filter(n => !isToday(n.created_at))
                    ).map((n) => (
                      <div key={n.id} className="flex items-center gap-3 py-3 px-1 hover:bg-slate-50 transition-all rounded-xl">
                        {/* Checkbox */}
                        <input 
                          type="checkbox" 
                          checked={selectedNotifIds.includes(n.id)}
                          onChange={() => {
                            if (selectedNotifIds.includes(n.id)) {
                              setSelectedNotifIds(prev => prev.filter(id => id !== n.id));
                            } else {
                              setSelectedNotifIds(prev => [...prev, n.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-gold focus:ring-gold"
                        />

                        {/* Unread blue dot */}
                        <div className="w-2 flex justify-center">
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block shrink-0" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(n.type)} flex items-center justify-center font-bold text-xs shrink-0`}>
                          {getInitials(n.fellow_name)}
                        </div>

                        {/* Info Block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-slate-800 text-xs truncate">
                              {n.fellow_name || 'Fellow'}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs leading-normal mt-0.5">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border border-slate-100 bg-slate-50 text-slate-500 shrink-0">
                              {n.type}
                            </span>
                            {n.link && (
                              <button 
                                onClick={() => {
                                  const tab = n.link.startsWith('/admin/') ? n.link.replace('/admin/', '') : 'dashboard';
                                  navigateTo(tab);
                                }} 
                                className="text-[10px] text-gold hover:underline font-semibold shrink-0"
                              >
                                View details →
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Trash Action */}
                        <div className="shrink-0 flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" 
                            onClick={() => handleDeleteNotification(n.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8. REPORTS */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <p className="text-xs text-slate-400 leading-normal">
                  Generate activity report spreadsheets for system data tracking. Select a report category to download.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'fellows', title: 'Fellow Registration Report', desc: 'Listing all registered fellows, active profiles, emails, phone numbers, and location states.', icon: Users },
                  { id: 'institutions', title: 'Institution Applications Report', desc: 'Detailing all registered colleges, contact points, approval statuses, website domains, and established years.', icon: Building2 },
                  { id: 'enrollments', title: 'Program Enrollments Report', desc: 'Compiling curriculum enrollment records, progress statistics, and certificate issuance status.', icon: BookOpen },
                  { id: 'blogs', title: 'Blog Submissions Report', desc: 'Summary of fellows blog articles, categories, likes, comment rates, and review logs.', icon: FileText },
                ].map((rep) => {
                  const Icon = rep.icon;
                  return (
                    <div key={rep.id} className="border border-slate-100 hover:border-gold/30 rounded-2xl p-5 flex justify-between items-start gap-4 hover:shadow-sm transition-all duration-300">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-gold/10 text-gold">
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <h4 className="font-serif text-sm font-bold text-navy">{rep.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal">{rep.desc}</p>
                      </div>
                      <Button size="icon" variant="outline" className="rounded-xl border-slate-200 shrink-0 text-slate-600 hover:text-gold" onClick={() => handleExportCSV(rep.id)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Site Title</label>
                  <Input value={settingsForm.siteTitle} onChange={e => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })} className="rounded-xl text-xs" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Support Email Contact</label>
                  <Input value={settingsForm.supportEmail} onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })} className="rounded-xl text-xs" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Program/Course Categories</label>
                  <Input value={settingsForm.categories} onChange={e => setSettingsForm({ ...settingsForm, categories: e.target.value })} className="rounded-xl text-xs" />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">Maintenance Mode</h4>
                    <p className="text-[11px] text-slate-400">Temporarily restrict public portal accessibility.</p>
                  </div>
                  <input type="checkbox" checked={settingsForm.maintenanceMode} onChange={e => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })} className="w-4 h-4 cursor-pointer" />
                </div>

                <Button type="submit" className="bg-navy hover:bg-navy/95 text-warm rounded-xl text-xs font-semibold py-2 px-6">
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* 10. CHANGE PASSWORD */}
          {activeTab === 'change-password' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password</label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm New Password</label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button type="submit" className="bg-navy hover:bg-navy/95 text-warm rounded-xl text-xs font-semibold py-2 w-full mt-2">
                  Update Security Password
                </Button>
              </form>
            </div>
          )}

          {/* 11. FELLOW CONNECTIONS */}
          {activeTab === 'connections' && (
            <ConnectionsManager />
          )}

          {/* 12. LMS PROGRESS MONITOR */}
          {activeTab === 'lms-monitor' && (
            <LmsMonitor />
          )}

          {/* 13. TEACHER TOOLS CERTIFICATIONS */}
          {activeTab === 'certifications' && (
            <CertificationsManager />
          )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* POPUP MODALS */}

      {/* 1. FELLOW PROFILE SLIDING PANEL */}
      {viewingFellow && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setViewingFellow(null)}
          />
          {/* Sliding panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[700px] bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-350">
            {/* Header / Nav */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={filteredFellowsList.findIndex(f => f.id === viewingFellow.id) <= 0}
                  onClick={() => {
                    const idx = filteredFellowsList.findIndex(f => f.id === viewingFellow.id);
                    if (idx > 0) setViewingFellow(filteredFellowsList[idx - 1]);
                  }}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/60 transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={filteredFellowsList.findIndex(f => f.id === viewingFellow.id) >= filteredFellowsList.length - 1}
                  onClick={() => {
                    const idx = filteredFellowsList.findIndex(f => f.id === viewingFellow.id);
                    if (idx < filteredFellowsList.length - 1) setViewingFellow(filteredFellowsList[idx + 1]);
                  }}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/60 transition-colors"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-serif text-sm font-bold text-navy">Fellow Review</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setViewingFellow(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Profile Summary Hero */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white">
              {viewingFellow.avatar_url ? (
                <img src={getBustUrl(viewingFellow.avatar_url)} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center text-gold font-bold text-xl">
                  {viewingFellow.full_name?.charAt(0) || 'F'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-navy leading-tight">{viewingFellow.full_name}</h3>
                  <Badge className={cn(
                    "border text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                    viewingFellow.membership_status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    viewingFellow.membership_status === 'suspended' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    viewingFellow.membership_status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    viewingFellow.membership_status === 'pending_review' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  )}>
                    {viewingFellow.membership_status === 'pending_review' ? 'pending review' : (viewingFellow.membership_status || 'pending')}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">ID: {viewingFellow.membership_id || 'N/A'}</p>
                <p className="text-[11px] text-slate-400">Joined: {viewingFellow.created_at ? new Date(viewingFellow.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {/* Premium CRM Action Row */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-2 shrink-0 items-center">
              {viewingFellow.membership_status !== 'active' && (
                <Button 
                  onClick={() => handleUpdateFellowStatusFromPanel(viewingFellow.id, 'active')}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
              )}
              {viewingFellow.membership_status !== 'rejected' && (
                <Button 
                  onClick={() => setReasonModal({ isOpen: true, title: 'Reject Fellow Account', actionType: 'reject_fellow', targetId: viewingFellow.id })}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              )}
              {viewingFellow.membership_status !== 'suspended' && (
                <Button 
                  onClick={() => setReasonModal({ isOpen: true, title: 'Suspend Fellow Account', actionType: 'suspend_fellow', targetId: viewingFellow.id })}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                </Button>
              )}
              <a href={`mailto:${viewingFellow.work_email || viewingFellow.email}`} className="inline-block">
                <Button variant="outline" className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 bg-white">
                  <Mail className="w-3.5 h-3.5" /> Email
                </Button>
              </a>
              {viewingFellow.phone && (
                <a href={`tel:${viewingFellow.phone}`} className="inline-block">
                  <Button variant="outline" className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 bg-white">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                </a>
              )}
            </div>

            {/* Tabs Selector Bar */}
            <div className="px-6 border-b border-slate-100 flex gap-6 bg-white pt-3 shrink-0">
              <button
                onClick={() => setActivePanelTab('activity')}
                className={cn(
                  "pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors relative focus:outline-none",
                  activePanelTab === 'activity' ? "text-navy" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Activity History
                {activePanelTab === 'activity' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-navy" />
                )}
              </button>
              <button
                onClick={() => setActivePanelTab('task')}
                className={cn(
                  "pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors relative focus:outline-none",
                  activePanelTab === 'task' ? "text-navy" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Task / Details
                {activePanelTab === 'task' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-navy" />
                )}
              </button>
            </div>

            {/* Tab Contents Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {activePanelTab === 'activity' ? (
                /* Activity History Tab content */
                <div className="space-y-4">
                  {fellowActivity.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">No activity logs found.</p>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-4">
                      {fellowActivity.map((log: any) => (
                        <div key={log.id} className="relative text-xs leading-normal">
                          {/* Timeline dot */}
                          <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-navy border-2 border-white shadow-sm" />
                          <span className="text-[10px] text-slate-400 font-semibold block">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                          <span className="text-slate-700 font-bold capitalize">{(log.activity_type || '').replace('_', ' ')}:</span>{' '}
                          <span className="text-slate-500">{log.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Task / Details Tab content */
                <div className="space-y-6">
                  {/* Academic Details (Score calculations) */}
                  <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                    <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                      <div className="p-1.5 bg-gold/10 text-gold rounded-lg">
                        <GraduationCap className="w-4 h-4 fill-gold/10" />
                      </div>
                      Academic Score Check (Tasks)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-0.5">
                        <span className="text-slate-400 block font-medium">UGC API Score</span>
                        <p className="font-serif text-sm font-bold text-navy">{fellowToolResults.find(r => r.tool_name === 'api_score')?.score || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-0.5">
                        <span className="text-slate-400 block font-medium">CAS Status</span>
                        <p className="font-serif text-sm font-bold text-navy">{fellowToolResults.find(r => r.tool_name === 'cas_check')?.score || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-0.5">
                        <span className="text-slate-400 block font-medium">Research Score</span>
                        <p className="font-serif text-sm font-bold text-navy">{fellowToolResults.find(r => r.tool_name === 'research_score')?.score || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-sm space-y-0.5">
                        <span className="text-slate-400 block font-medium">Google Scholar Link</span>
                        {viewingFellow.google_scholar_url ? (
                          <a href={viewingFellow.google_scholar_url} target="_blank" rel="noreferrer" className="text-gold hover:underline font-semibold flex items-center gap-1.5 text-xs">
                            View Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="font-semibold text-slate-400">Not Linked</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                    <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                      <div className="p-1.5 bg-navy/10 text-navy rounded-lg">
                        <User className="w-4 h-4 fill-navy/10" />
                      </div>
                      Personal Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-medium">Official Email</span>
                        <p className="font-semibold text-slate-700 break-all">{viewingFellow.work_email || viewingFellow.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Contact Number</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Designation</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.designation || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Department</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.department || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-medium">Linked Institution</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.institution || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Location</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.city ? `${viewingFellow.city}, ${viewingFellow.state || ''}` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Country</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.country || 'India'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-medium">Specialization</span>
                        <p className="font-semibold text-slate-700">{viewingFellow.specialization || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Program Enrollments */}
                  <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                    <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                        <BookOpen className="w-4 h-4 fill-emerald-500/10" />
                      </div>
                      Program Enrollments
                    </h4>
                    {viewingFellow.enrolled_programs ? (
                      <div className="space-y-2">
                        {viewingFellow.enrolled_programs.split(', ').map((progName: string, idx: number) => {
                          const status = viewingFellow.enrollment_statuses?.split(', ')[idx] || 'enrolled';
                          const progress = viewingFellow.enrollment_progress?.split(', ')[idx] || '0';
                          return (
                            <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-700">{progName}</span>
                                <div className="text-[10px] text-slate-400">
                                  Status: <span className="font-bold text-slate-500 capitalize">{status}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <span>{progress}%</span>
                                <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">Not enrolled in any program.</p>
                    )}
                  </div>

                  {/* Uploaded Documents */}
                  <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                    <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                        <FileText className="w-4 h-4 fill-indigo-500/10" />
                      </div>
                      Verification Documents
                    </h4>
                    {viewingFellow.avatar_url ? (
                      <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-gold shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700">Profile Image File</span>
                            <p className="text-[10px] text-slate-400">Uploaded user profile avatar photo</p>
                          </div>
                        </div>
                        <a href={getBustUrl(viewingFellow.avatar_url)} target="_blank" rel="noreferrer">
                          <Button size="sm" className="rounded-lg text-xs gap-1.5 px-4 h-8 bg-[#8B1538] hover:bg-[#720E2C] text-white font-semibold shadow-sm border-0">
                            <Download className="w-3.5 h-3.5" /> View
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">No documents uploaded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <Button className="btn-outline w-28 text-xs font-semibold rounded-xl" onClick={() => setViewingFellow(null)}>Close</Button>
            </div>
          </div>
        </>
      )}

      {/* 2. INSTITUTION DETAIL SLIDING PANEL */}
      {viewingInst && !showRejectDialog && !showSuspendDialog && !showChangeReqDialog && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setViewingInst(null)}
          />
          {/* Sliding panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[700px] bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-350">
            {/* Header / Nav */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={filteredInstitutionsList.findIndex(i => i.id === viewingInst.id) <= 0}
                  onClick={() => {
                    const idx = filteredInstitutionsList.findIndex(i => i.id === viewingInst.id);
                    if (idx > 0) setViewingInst(filteredInstitutionsList[idx - 1]);
                  }}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/60 transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  disabled={filteredInstitutionsList.findIndex(i => i.id === viewingInst.id) >= filteredInstitutionsList.length - 1}
                  onClick={() => {
                    const idx = filteredInstitutionsList.findIndex(i => i.id === viewingInst.id);
                    if (idx < filteredInstitutionsList.length - 1) setViewingInst(filteredInstitutionsList[idx + 1]);
                  }}
                  className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200/60 transition-colors"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-serif text-sm font-bold text-navy">Institute Review</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setViewingInst(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Logo & Hero */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
              <div className="flex items-center gap-3">
                {viewingInst.logo_url ? (
                  <img src={viewingInst.logo_url} alt="Logo" className="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1 bg-slate-50 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                    🏛️
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-base font-bold text-navy leading-tight">{viewingInst.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">{viewingInst.type?.replace('_', ' ') || 'Academic Institution'}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Institution Code: <span className="font-semibold text-slate-600 font-mono">{viewingInst.institute_code || 'N/A'}</span></p>
                </div>
              </div>
              <Badge className={cn(
                "border px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider",
                viewingInst.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                viewingInst.status === 'pending_change_approval' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                viewingInst.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                viewingInst.status === 'suspended' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-amber-50 text-amber-600 border-amber-200'
              )}>
                {viewingInst.status === 'pending_change_approval' ? 'pending change' : viewingInst.status || 'pending'}
              </Badge>
            </div>

            {/* Premium CRM Action Row */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-2 shrink-0 items-center">
              {viewingInst.status !== 'approved' && (
                <Button 
                  onClick={() => handleUpdateInstitutionStatusFromPanel(viewingInst.id, 'approved')}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </Button>
              )}
              {viewingInst.status !== 'rejected' && (
                <Button 
                  onClick={() => setReasonModal({ isOpen: true, title: 'Reject Institution Registration', actionType: 'reject_inst', targetId: viewingInst.id })}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              )}
              {viewingInst.status !== 'suspended' && (
                <Button 
                  onClick={() => setReasonModal({ isOpen: true, title: 'Suspend Institution Membership', actionType: 'suspend_inst', targetId: viewingInst.id })}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm border-0"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                </Button>
              )}
              {viewingInst.contact_email && (
                <a href={`mailto:${viewingInst.contact_email}`} className="inline-block">
                  <Button variant="outline" className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 bg-white">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Button>
                </a>
              )}
              {viewingInst.contact_phone && (
                <a href={`tel:${viewingInst.contact_phone}`} className="inline-block">
                  <Button variant="outline" className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 bg-white">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                </a>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {viewingInst.description && (
                <p className="text-xs text-slate-605 italic bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                  "{viewingInst.description}"
                </p>
              )}

              {/* Representative details */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-navy/10 text-navy rounded-lg">
                    <Users className="w-4 h-4 fill-navy/10" />
                  </div>
                  Representative Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Contact Person</span>
                    <p className="font-semibold text-slate-700">{viewingInst.contact_person || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Designation</span>
                    <p className="font-semibold text-slate-700">{viewingInst.representative_designation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Office Email</span>
                    <p className="font-semibold text-slate-700 break-all">{viewingInst.contact_email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Number</span>
                    <p className="font-semibold text-slate-700">{viewingInst.contact_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Institution Leadership details */}
              <div className="space-y-4 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  Institution Leadership Details
                </h4>

                {(!viewingInstDetails || !viewingInstDetails.leadership || viewingInstDetails.leadership.length === 0) ? (
                  <p className="text-slate-400 italic">No leadership profiles registered for this institution.</p>
                ) : (
                  <div className="space-y-4">
                    {viewingInstDetails.leadership.map((lead: any) => {
                      const isVerified = lead.admin_verified === 1;

                      return (
                        <div key={lead.id} className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm space-y-3 relative hover:shadow transition-shadow">
                          {/* Top row with name, designation, verification badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {lead.photo_url ? (
                                <img src={lead.photo_url} alt={lead.full_name} className="w-9 h-9 object-cover rounded-full border border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                  {lead.full_name?.charAt(0) || 'L'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="font-bold text-slate-800 text-xs">{lead.full_name}</h5>
                                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                    {lead.role}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{lead.designation}</p>
                              </div>
                            </div>
                            
                            {/* Verification Badge */}
                            <Badge className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 border rounded uppercase tracking-wider shrink-0",
                              isVerified 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-amber-50 text-amber-600 border-amber-200"
                            )}>
                              {isVerified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                          </div>

                          {/* Contact Details & Links */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 font-medium">Email ID</span>
                              <p className="font-semibold text-slate-700 break-all">{lead.email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Contact Number</span>
                              <p className="font-semibold text-slate-700">{lead.phone || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Social links & Admin Toggle Button */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {lead.linkedin_url && (
                                <a 
                                  href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] text-indigo-600 hover:underline font-semibold flex items-center gap-0.5"
                                >
                                  LinkedIn ↗
                                </a>
                              )}
                              {lead.google_scholar_url && (
                                <a 
                                  href={lead.google_scholar_url.startsWith('http') ? lead.google_scholar_url : `https://${lead.google_scholar_url}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] text-amber-600 hover:underline font-semibold flex items-center gap-0.5"
                                >
                                  Google Scholar ↗
                                </a>
                              )}
                              {!lead.linkedin_url && !lead.google_scholar_url && (
                                <span className="text-[9px] text-slate-350 italic">No social profiles</span>
                              )}
                            </div>

                            {/* Verification Toggle */}
                            <Button
                              type="button"
                              onClick={() => handleToggleLeaderVerification(lead.id, isVerified)}
                              variant={isVerified ? "outline" : "default"}
                              size="xs"
                              className={cn(
                                "rounded-lg text-[9px] h-6 px-2.5 font-semibold",
                                isVerified 
                                  ? "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                                  : "bg-[#8B1538] hover:bg-[#720E2C] text-white"
                              )}
                            >
                              {isVerified ? 'Revoke Verify' : 'Verify Profile'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Institute details */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-gold/10 text-gold rounded-lg">
                    <Building2 className="w-4 h-4 fill-gold/10" />
                  </div>
                  Institute Info
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Type</span>
                    <p className="font-semibold text-slate-700 capitalize">{viewingInst.type?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Established Year</span>
                    <p className="font-semibold text-slate-700">{viewingInst.established_year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Accreditation Grade</span>
                    <p className="font-semibold text-slate-700">{viewingInst.accreditation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Website</span>
                    {viewingInst.website ? (
                      <a href={viewingInst.website.startsWith('http') ? viewingInst.website : `https://${viewingInst.website}`} target="_blank" rel="noreferrer" className="text-gold hover:underline font-semibold break-all flex items-center gap-1">
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="font-semibold text-slate-400">N/A</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Student Strength</span>
                    <p className="font-semibold text-slate-700">{viewingInst.student_count || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Faculty Strength</span>
                    <p className="font-semibold text-slate-700">{viewingInst.faculty_count || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100 text-xs">
                <h4 className="font-serif text-[13px] font-bold text-navy border-b border-slate-100 pb-2 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                    <MapPin className="w-4 h-4 fill-indigo-500/10" />
                  </div>
                  Address Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Street Address</span>
                    <p className="font-semibold text-slate-700">{viewingInst.address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">City, State</span>
                    <p className="font-semibold text-slate-700">{viewingInst.city ? `${viewingInst.city}, ${viewingInst.state || ''}` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Pincode, Country</span>
                    <p className="font-semibold text-slate-700">{viewingInst.pincode ? `${viewingInst.pincode}, ${viewingInst.country || ''}` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Verification Documents */}
              {viewingInst.document_url && (
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-gold shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700">Verification Document</span>
                      <p className="text-[10px] text-slate-400">PDF / Image upload for credential check</p>
                    </div>
                  </div>
                  <a href={getBustUrl(viewingInst.document_url)} target="_blank" rel="noreferrer">
                    <Button size="sm" className="rounded-lg text-xs gap-1.5 px-4 h-8 bg-[#8B1538] hover:bg-[#720E2C] text-white font-semibold shadow-sm border-0">
                      <Download className="w-3.5 h-3.5" /> View / Download
                    </Button>
                  </a>
                </div>
              )}

              {/* Campus Tour & Overview Media Review */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-3 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Video className="w-4 h-4 text-gold shrink-0" />
                  <span className="font-semibold text-slate-700">Campus Tour / Overview Media</span>
                </div>

                {/* Campus Gallery Images */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campus Gallery Images</span>
                  {(() => {
                    let gallery: string[] = [];
                    if (Array.isArray(viewingInst.campus_gallery)) {
                      gallery = viewingInst.campus_gallery;
                    } else if (typeof viewingInst.campus_gallery === 'string') {
                      try {
                        gallery = JSON.parse(viewingInst.campus_gallery);
                      } catch (e) {
                        gallery = viewingInst.campus_gallery.split(',').filter(Boolean);
                      }
                    }
                    if (!gallery || gallery.length === 0) {
                      return <p className="text-[11px] text-slate-400 italic">No gallery images uploaded</p>;
                    }
                    return (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {gallery.map((imgUrl, idx) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block group relative overflow-hidden rounded-lg border border-slate-200 aspect-video bg-slate-100">
                            <img src={imgUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[9px] px-1 py-0.5 text-center truncate">
                              Image {idx + 1}
                            </span>
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Campus MP4 Video */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Campus MP4 Video</span>
                  {viewingInst.campus_video_url ? (
                    <div className="space-y-2">
                      <video src={viewingInst.campus_video_url} controls className="w-full max-h-48 rounded-xl border border-slate-200 bg-black" />
                      <a href={viewingInst.campus_video_url} target="_blank" rel="noreferrer" className="inline-block">
                        <Button size="sm" className="rounded-lg text-xs gap-1.5 px-4 h-8 bg-[#8B1538] hover:bg-[#720E2C] text-white font-semibold shadow-sm border-0">
                          <Download className="w-3.5 h-3.5" /> View Full Video
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No campus video uploaded</p>
                  )}
                </div>

                {/* YouTube Video Link */}
                {viewingInst.youtube_url && (
                  <div className="space-y-1 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">YouTube Link</span>
                    <a href={viewingInst.youtube_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[11px] font-medium flex items-center gap-1.5 truncate">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{viewingInst.youtube_url}</span>
                    </a>
                  </div>
                )}
              </div>

              {viewingInst.status === 'rejected' && viewingInst.rejection_reason && (
                <div className="bg-rose-50 text-rose-600 text-xs p-3.5 rounded-xl border border-rose-100 space-y-1">
                  <span className="font-bold block uppercase tracking-wider text-[9px]">Rejection Reason</span>
                  <p className="font-medium leading-relaxed">{viewingInst.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <Button className="btn-outline w-28 text-xs font-semibold rounded-xl" onClick={() => setViewingInst(null)}>Close</Button>
            </div>
          </div>
        </>
      )}

      {/* 3. REJECT INSTITUTION DIALOG */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-sm font-bold text-rose-600">Reject Institution Application</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Rejection (Mandatory)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Specify mismatch details, missing documents etc."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 h-24 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <Button className="btn-outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button className="btn-danger" onClick={handleRejectInstitution}>Submit Rejection</Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUSPEND INSTITUTION DIALOG */}
      {showSuspendDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-sm font-bold text-slate-700">Suspend Approved Institution</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Suspension (Mandatory)</label>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Specify violation reasons or administrative blocks."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 h-24 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <Button className="btn-outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
              <Button className="btn-danger" onClick={handleSuspendInstitution}>Confirm Suspension</Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CHANGE REQUEST REVIEW DIALOG */}
      {showChangeReqDialog && selectedChangeReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 relative">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" onClick={() => setShowChangeReqDialog(false)}>×</button>
            <h3 className="font-serif text-base font-bold text-navy">Review Profile Change Request</h3>
            
            <p className="text-xs text-slate-400">
              Registrant Fellow has requested updates to key identifiers. Review the side-by-side comparison below.
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-semibold border-b border-slate-200">
                    <th className="p-2.5">Field</th>
                    <th className="p-2.5 text-rose-600 bg-rose-50/50">Approved Active</th>
                    <th className="p-2.5 text-emerald-600 bg-emerald-50/50">Requested Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'name', label: 'Institution Name' },
                    { key: 'country', label: 'Country' },
                    { key: 'state', label: 'State' },
                    { key: 'city', label: 'City' },
                    { key: 'established_year', label: 'Established Year' },
                  ].map((field) => {
                    const activeVal = viewingInst[field.key];
                    const requestedVal = selectedChangeReq[field.key];
                    const hasDiff = String(activeVal) !== String(requestedVal);
                    return (
                      <tr key={field.key} className="border-b border-slate-100 last:border-0">
                        <td className="p-2.5 font-medium text-slate-500">{field.label}</td>
                        <td className="p-2.5 text-rose-700 bg-rose-50/15">{activeVal}</td>
                        <td className={`p-2.5 ${hasDiff ? 'font-bold text-emerald-700 bg-emerald-50/20' : 'text-slate-600 bg-emerald-50/5'}`}>
                          {requestedVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button className="btn-outline" onClick={() => setShowChangeReqDialog(false)}>Close</Button>
              <Button className="btn-success" onClick={() => handleApproveChangeRequest(selectedChangeReq.id)}>Approve Changes</Button>
              <Button className="btn-danger" onClick={() => handleRejectChangeRequest(selectedChangeReq.id)}>Reject Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREATE / EDIT PROGRAM MODAL */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" onClick={() => setShowProgramModal(false)}>×</button>
            <h3 className="font-serif text-base font-bold text-navy">
              {editingProgram ? 'Edit Program Details' : 'Create New Program'}
            </h3>

            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Program Title</label>
                <Input value={programForm.title} onChange={e => setProgramForm({ ...programForm, title: e.target.value })} required className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Description</label>
                <textarea value={programForm.description} onChange={e => setProgramForm({ ...programForm, description: e.target.value })} required className="w-full text-xs rounded-xl border border-slate-200 p-2.5 h-16" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Duration (e.g. 30 Hours, 5 Days)</label>
                  <Input value={programForm.duration} onChange={e => setProgramForm({ ...programForm, duration: e.target.value })} className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Category</label>
                  <Input value={programForm.category} onChange={e => setProgramForm({ ...programForm, category: e.target.value })} className="rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Difficulty Level</label>
                  <select value={programForm.level} onChange={e => setProgramForm({ ...programForm, level: e.target.value })} className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Status</label>
                  <select value={programForm.status} onChange={e => setProgramForm({ ...programForm, status: e.target.value })} className="w-full text-xs rounded-xl border border-slate-200 p-2 bg-white">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Prerequisites</label>
                <Input value={programForm.prerequisites} onChange={e => setProgramForm({ ...programForm, prerequisites: e.target.value })} className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Learning Outcomes</label>
                <Input value={programForm.learning_outcomes} onChange={e => setProgramForm({ ...programForm, learning_outcomes: e.target.value })} className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Cover Image URL (Optional)</label>
                <Input value={programForm.image_url} onChange={e => setProgramForm({ ...programForm, image_url: e.target.value })} className="rounded-xl text-xs" />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" className="btn-outline" onClick={() => setShowProgramModal(false)}>Cancel</Button>
                <Button type="submit" className="btn-success">Save Program</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODULES VIEW / MANAGEMENT MODAL */}
      {editingProgram && !showProgramModal && programModules.length > 0 && !showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 relative">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" onClick={() => setEditingProgram(null)}>×</button>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-base font-bold text-navy">{editingProgram.title} - Modules</h3>
              <Button size="xs" className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-lg text-[10px] gap-1" onClick={() => { setEditingModule(null); setModuleForm({ title: '', chapter: 'Chapter 1', description: '', video_url: '', content: '', sort_order: programModules.length + 1, duration_minutes: 30 }); setShowModuleModal(true); }}>
                <Plus className="w-3.5 h-3.5" /> Add Module
              </Button>
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {programModules.map((mod) => (
                <div key={mod.id} className="flex justify-between items-center border border-slate-100 rounded-xl p-3 hover:border-gold/30 hover:shadow-sm transition-all text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">{mod.chapter}: {mod.title}</span>
                    <p className="text-[10px] text-slate-400">{mod.duration_minutes || 0} min · sort order: {mod.sort_order}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button size="xs" variant="outline" className="rounded-lg text-[10px]" onClick={() => { setEditingModule(mod); setModuleForm({ title: mod.title, chapter: mod.chapter || 'Chapter 1', description: mod.description || '', video_url: mod.video_url || '', content: mod.content || '', sort_order: mod.sort_order || 0, duration_minutes: mod.duration_minutes || 30 }); setShowModuleModal(true); }}>
                      Edit
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteModule(mod.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setEditingProgram(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CREATE / EDIT MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" onClick={() => setShowModuleModal(false)}>×</button>
            <h3 className="font-serif text-sm font-bold text-navy">
              {editingModule ? 'Edit Module Details' : 'Add New Module'}
            </h3>

            <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Chapter/Unit Name</label>
                <Input value={moduleForm.chapter} onChange={e => setModuleForm({ ...moduleForm, chapter: e.target.value })} required className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Module Title</label>
                <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} required className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Description</label>
                <textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} className="w-full text-xs rounded-xl border border-slate-200 p-2 h-16" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Sort Order</label>
                  <Input type="number" value={moduleForm.sort_order} onChange={e => setModuleForm({ ...moduleForm, sort_order: parseInt(e.target.value) || 0 })} className="rounded-xl text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 uppercase">Duration (mins)</label>
                  <Input type="number" value={moduleForm.duration_minutes} onChange={e => setModuleForm({ ...moduleForm, duration_minutes: parseInt(e.target.value) || 0 })} className="rounded-xl text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Video Lecture URL (Optional)</label>
                <Input value={moduleForm.video_url} onChange={e => setModuleForm({ ...moduleForm, video_url: e.target.value })} className="rounded-xl text-xs" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">HTML Content / Reading Material</label>
                <textarea value={moduleForm.content} onChange={e => setModuleForm({ ...moduleForm, content: e.target.value })} className="w-full text-xs rounded-xl border border-slate-200 p-2 h-20" />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setShowModuleModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-navy hover:bg-navy/95 text-warm rounded-xl text-xs font-semibold px-4">Save Module</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. ENROLL FELLOW MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" onClick={() => setShowEnrollModal(false)}>×</button>
            <h3 className="font-serif text-sm font-bold text-navy">Enroll Fellow in Program</h3>

            <form onSubmit={handleEnrollFellow} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Select Fellow</label>
                <select
                  value={enrollForm.userId}
                  onChange={e => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Choose Fellow --</option>
                  {fellowsOnly.map(f => (
                    <option key={f.id} value={f.id}>{f.full_name || f.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase">Select Program</label>
                <select
                  value={enrollForm.programId}
                  onChange={e => setEnrollForm({ ...enrollForm, programId: e.target.value })}
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white"
                >
                  <option value="">-- Choose Program --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" className="btn-outline" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
                <Button type="submit" className="btn-success">Enroll Fellow</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERIC ACTION REASON DIALOG (Replaces browser prompts) */}
      {actionReasonDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative animate-in zoom-in-95 duration-200">
            <button 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold" 
              onClick={() => setActionReasonDialog(prev => ({ ...prev, isOpen: false }))}
            >
              ×
            </button>
            <h3 className="font-serif text-sm font-bold text-navy">{actionReasonDialog.title}</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{actionReasonDialog.label}</label>
              <textarea
                value={actionReasonDialog.value}
                onChange={e => {
                  const val = e.target.value;
                  setActionReasonDialog(prev => ({ ...prev, value: val, error: '' }));
                }}
                placeholder={actionReasonDialog.placeholder}
                className={cn(
                  "w-full text-xs rounded-xl border p-3 h-24 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-navy/20",
                  actionReasonDialog.error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-slate-300"
                )}
              />
              {actionReasonDialog.error && (
                <p className="text-[10px] text-rose-500 font-medium">{actionReasonDialog.error}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2.5">
              <Button 
                className="btn-outline" 
                onClick={() => setActionReasonDialog(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button 
                className={actionReasonDialog.confirmClass}
                onClick={async () => {
                  if (!actionReasonDialog.value.trim()) {
                    setActionReasonDialog(prev => ({ ...prev, error: 'Reason is required.' }));
                    return;
                  }
                  
                  try {
                    await actionReasonDialog.onSubmit(actionReasonDialog.value.trim());
                    setActionReasonDialog(prev => ({ ...prev, isOpen: false }));
                  } catch (err) {
                    // Handled inside onSubmit
                  }
                }}
              >
                {actionReasonDialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* REASON INPUT DIALOG (MESSAGE BOX) */}
      {reasonModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative animate-in zoom-in-95 duration-200">
            <button 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 font-bold text-lg" 
              onClick={() => {
                setReasonModal({ isOpen: false, title: '', actionType: '', targetId: '' });
                setReasonText('');
              }}
            >
              ×
            </button>
            <h3 className="font-serif text-sm font-bold text-navy">{reasonModal.title}</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Reason / Feedback Comments</label>
              <textarea
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                placeholder="Specify feedback or reason for this status change..."
                className="w-full h-24 text-xs rounded-xl border border-slate-200 p-3 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-navy/20 bg-white"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2.5">
              <Button 
                variant="outline"
                className="rounded-xl text-xs h-9 px-4"
                onClick={() => {
                  setReasonModal({ isOpen: false, title: '', actionType: '', targetId: '' });
                  setReasonText('');
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-navy hover:bg-navy/90 text-white rounded-xl text-xs h-9 px-4 font-semibold"
                onClick={handleSubmitReasonModal}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
