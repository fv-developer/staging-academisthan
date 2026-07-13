import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Mail, Phone, Building2, MapPin, BookOpen, Award,
  Edit3, Save, X, CreditCard, Calendar, Shield, ArrowRight,
  Calculator, FileText, GraduationCap, Sparkles, Copy, Check,
  TrendingUp, Clock, Newspaper, Star, Target, Zap,
  ExternalLink, ChevronRight, Briefcase, Globe, FlaskConical, Microscope,
  Search, ChevronDown, Loader2, Home, Upload, Users, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { MyCertificates } from '@/components/dashboard/MyCertificates';
import { MyEventRegistrations } from '@/components/dashboard/MyEventRegistrations';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { TeacherTypeOnboarding } from '@/components/dashboard/TeacherTypeOnboarding';
import APIScoreCalculator from '@/pages/tools/APIScoreCalculator';
import PromotionChecker from '@/pages/tools/PromotionChecker';
import ResearchScoreCalculator from '@/pages/tools/ResearchScoreCalculator';
import AcademicCV from '@/pages/tools/AcademicCV';
import NotableContributions from '@/pages/tools/NotableContributions';
import ScholarImpact from '@/pages/tools/ScholarImpact';
import InstituteModule from '@/components/dashboard/InstituteModule';
import EnrollProgramModule from '@/components/dashboard/EnrollProgramModule';
import CertificationModule from '@/components/dashboard/CertificationModule';
import BlogModule from '@/components/dashboard/BlogModule';
import ConnectionsModule from '@/components/dashboard/ConnectionsModule';
import ProgramDetail from '@/pages/ProgramDetail';
import { countries, Country, stateCities, getMaxPhoneLength, getMaxPinLength, getExpectedPhoneLabel, getExpectedPinLabel } from '@/utils/countryData';
import { cn } from '@/lib/utils';

/* ─── Membership Card ─── */
function MembershipCard({ profile }: { profile: any }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    if (profile?.membership_id) {
      navigator.clipboard.writeText(profile.membership_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(228,45%,16%)] via-[hsl(228,45%,20%)] to-[hsl(228,35%,25%)] p-5 md:p-6 border border-gold/20 shadow-[0_20px_60px_hsl(228_45%_16%/0.5)]">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/3 rounded-full blur-2xl" />
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <span className="text-gold/60 text-[10px] tracking-[0.3em] uppercase font-medium">Academisthan</span>
            <h3 className="font-serif text-sm md:text-base text-gold font-bold mt-1">Fellow Membership</h3>
          </div>
          <div className="relative group shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 bg-gold/5 flex items-center justify-center relative shadow-inner">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-gold/60" />
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-serif text-lg md:text-xl font-bold text-warm line-clamp-1">
            {profile?.full_name || 'Fellow'}
          </h2>
          <p className="text-warm/50 text-xs mt-1 truncate">{profile?.designation || 'Educator'}{profile?.institution ? ` · ${profile.institution}` : ''}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-warm/40 text-[10px] uppercase tracking-wider block">Member ID</span>
            <button onClick={copyId} className="flex items-center gap-1.5 group mt-1">
              <span className="font-mono text-gold text-sm md:text-base font-bold tracking-wider">
                {profile?.membership_id || 'ACAD-XXXX-XXXXX'}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-warm/30 group-hover:text-gold transition-colors" />
              )}
            </button>
          </div>
          <div className="text-right shrink-0">
            <span className="text-warm/40 text-[10px] uppercase tracking-wider block">Since</span>
            <p className="text-warm/70 text-xs mt-1">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Action ─── */
function QuickAction({ icon: Icon, title, desc, href, accent, badge, onClick, active }: { icon: any; title: string; desc: string; href: string; accent: string; badge?: string; onClick?: () => void; active?: boolean }) {
  const content = (
    <div className={cn(
      "relative overflow-hidden bg-card border rounded-2xl p-5 hover:shadow-[0_8px_30px_hsl(38_55%_58%/0.08)] transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer",
      active ? "border-gold bg-gold/5 shadow-[0_8px_30px_hsl(38_55%_58%/0.08)] -translate-y-1" : "border-border hover:border-gold/40"
    )}>
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/[0.03] group-hover:to-transparent transition-all duration-300 rounded-2xl",
        active && "from-gold/[0.05] to-transparent"
      )} />
      
      {badge && (
        <span className="absolute top-3 right-3 text-[9px] font-bold tracking-wider uppercase bg-gold/15 text-gold border border-gold/20 rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}

      <div className="relative z-10">
        <div className={cn(
          `w-11 h-11 rounded-xl ${accent} flex items-center justify-center mb-4 transition-transform duration-300`,
          active ? "scale-110" : "group-hover:scale-110"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className={cn("font-serif text-sm font-bold mb-0.5 transition-colors", active ? "text-gold" : "text-foreground group-hover:text-gold")}>{title}</h3>
        <p className="text-muted-foreground text-[11px] leading-relaxed">{desc}</p>
      </div>

      {/* Arrow indicator */}
      <div className={cn(
        "absolute bottom-4 right-4 transition-all duration-300",
        active ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
      )}>
        <ArrowRight className="w-3.5 h-3.5 text-gold/60" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={(e) => { e.preventDefault(); onClick(); }} className="group relative w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link to={href} className="group relative">
      {content}
    </Link>
  );
}

/* ─── Academic Calendar (live from news feed) ─── */
function useUpcomingDates() {
  const [items, setItems] = useState<Array<{ date: string; title: string; type: string; color: string; url: string | null }>>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('news_updates')
        .select('title, published_at, last_date, category, source_url')
        .eq('is_published', true)
        .in('category', ['event', 'job_opening', 'scholarship', 'announcement'])
        .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('published_at', { ascending: false })
        .limit(5);
      const colorMap: Record<string, string> = {
        event: 'bg-gold',
        job_opening: 'bg-accent',
        scholarship: 'bg-teal',
        announcement: 'bg-destructive',
      };
      setItems((data || []).map((n: any) => ({
        date: new Date(n.last_date || n.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        title: n.title,
        type: n.category,
        color: colorMap[n.category] || 'bg-gold',
        url: n.source_url ?? null,
      })));
    })();
  }, []);
  return items;
}

/* ─── Explore Hub ─── */
const exploreLinks = [
  { title: 'Jobs & Opportunities', desc: 'Latest faculty positions', href: '/jobs', icon: Briefcase },
  { title: 'Gazette & Regulations', desc: 'Official circulars', href: '/gazette', icon: FileText },
  { title: 'Fellow Directory', desc: 'Find educators', href: '/directory', icon: Globe },
  { title: 'Verify Certificate', desc: 'Check membership', href: '/verify', icon: Shield },
];

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { profile, refreshProfile, signOut } = useAuth();

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, roleLoading, navigate]);
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestingReactivation, setRequestingReactivation] = useState(false);

  const handleRequestReactivation = async () => {
    setRequestingReactivation(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/profiles/request-reactivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit reactivation request');

      toast({
        title: 'Request Submitted! 🔓',
        description: 'Your reactivation request has been submitted to the Admin for approval.',
      });
      await refreshProfile();
    } catch (err: any) {
      toast({
        title: 'Request Failed',
        description: err.message || 'Failed to submit reactivation request.',
        variant: 'destructive'
      });
    } finally {
      setRequestingReactivation(false);
    }
  };

  const location = useLocation();
  const [activeTool, setActiveTool] = useState<string | null>(() => {
    if (location.state && (location.state as any).activeTool) {
      return (location.state as any).activeTool;
    }
    const params = new URLSearchParams(location.search);
    const prog = params.get('program');
    if (prog) return 'lms';
    return params.get('tool');
  });

  // Sync state with query parameters dynamically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toolParam = params.get('tool');
    const programParam = params.get('program');
    
    if (programParam) {
      setActiveTool('lms');
    } else if (toolParam) {
      setActiveTool(toolParam);
    } else {
      setActiveTool(null);
    }
  }, [location.search]);
  const upcomingDates = useUpcomingDates();
  // Custom states for Country, State, City, PIN/ZIP, Phone
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.code === 'IN') || countries[0]);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [phoneVal, setPhoneVal] = useState('');
  
  const [stateSearch, setStateSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [submittingEmailChange, setSubmittingEmailChange] = useState(false);

  const countryContainerRef = useRef<HTMLDivElement>(null);
  const stateContainerRef = useRef<HTMLDivElement>(null);

  // Click outside searchable dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateContainerRef.current && !stateContainerRef.current.contains(event.target as Node)) {
        setStateDropdownOpen(false);
      }
      if (countryContainerRef.current && !countryContainerRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    designation: '',
    department: '',
    institution: '',
    city: '',
    state: '',
    specialization: '',
    experience_years: 0,
    bio: '',
    linkedin_url: '',
    google_scholar_url: '',
    country: 'India',
    address: '',
    pincode: '',
    work_email: '',
  });

  const startEditing = () => {
    if (profile) {
      const activeCountry = countries.find(c => c.name === (profile.country || 'India')) || countries.find(c => c.code === 'IN') || countries[0];
      setSelectedCountry(activeCountry);
      
      const rawPhone = profile.phone || '';
      const dialCode = activeCountry.dialCode;
      let displayPhone = rawPhone;
      if (rawPhone.startsWith(dialCode)) {
        displayPhone = rawPhone.substring(dialCode.length).trim();
      }
      setPhoneVal(displayPhone);
      setStateSearch(profile.state || '');

      setForm({
        full_name: profile.full_name || '',
        phone: rawPhone,
        designation: profile.designation || '',
        department: profile.department || '',
        institution: profile.institution || '',
        city: profile.city || '',
        state: profile.state || '',
        specialization: profile.specialization || '',
        experience_years: profile.experience_years || 0,
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        google_scholar_url: profile.google_scholar_url || '',
        country: profile.country || 'India',
        address: profile.address || '',
        pincode: profile.pincode || '',
        work_email: profile.work_email || '',
      });
    }
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!profile) return;

    // Form validations
    if (!form.full_name.trim()) {
      toast({ title: 'Full Name is required', variant: 'destructive' });
      return;
    }

    // Phone / Mobile Validation based on country regex
    const phoneRegex = new RegExp(selectedCountry.phoneRegex);
    const maxLen = getMaxPhoneLength(selectedCountry);
    const expectedDigits = getExpectedPhoneLabel(selectedCountry);

    if (!phoneVal.trim()) {
      toast({ title: 'Mobile Number is required', variant: 'destructive' });
      return;
    }
    if (phoneVal.length > maxLen) {
      toast({ title: 'Validation Error', description: `Mobile number cannot exceed ${maxLen} digits.`, variant: 'destructive' });
      return;
    }
    if (phoneVal.length < maxLen && !phoneRegex.test(phoneVal)) {
      toast({ title: 'Validation Error', description: `Please enter a valid ${expectedDigits}-digit mobile number.`, variant: 'destructive' });
      return;
    }
    if (!phoneRegex.test(phoneVal)) {
      toast({ title: 'Validation Error', description: 'Invalid mobile number format.', variant: 'destructive' });
      return;
    }

    if (!form.designation.trim()) {
      toast({ title: 'Designation is required', variant: 'destructive' });
      return;
    }
    if (!form.department.trim()) {
      toast({ title: 'Department is required', variant: 'destructive' });
      return;
    }
    if (!form.institution.trim()) {
      toast({ title: 'Institution is required', variant: 'destructive' });
      return;
    }
    if (!form.state) {
      toast({ title: 'State is required', variant: 'destructive' });
      return;
    }
    if (!form.city) {
      toast({ title: 'City is required', variant: 'destructive' });
      return;
    }

    // PIN Code Validation based on country regex
    const pinRegex = new RegExp(selectedCountry.pinRegex);
    const maxPinLen = getMaxPinLength(selectedCountry);
    const expectedPinDigits = getExpectedPinLabel(selectedCountry);
    const pinTerm = selectedCountry.code === 'IN' ? 'PIN Code' : 'ZIP Code';

    if (!form.pincode.trim()) {
      toast({ title: `${pinTerm} is required`, variant: 'destructive' });
      return;
    }
    if (form.pincode.length > maxPinLen) {
      toast({ title: 'Validation Error', description: `${pinTerm} cannot exceed ${maxPinLen} digits.`, variant: 'destructive' });
      return;
    }
    if (form.pincode.length < maxPinLen && !pinRegex.test(form.pincode)) {
      toast({ title: 'Validation Error', description: `Please enter a valid ${expectedPinDigits}-digit ${pinTerm}.`, variant: 'destructive' });
      return;
    }
    if (!pinRegex.test(form.pincode)) {
      toast({ title: 'Validation Error', description: `Invalid ${pinTerm} format.`, variant: 'destructive' });
      return;
    }

    if (form.work_email && form.work_email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(form.work_email.trim())) {
        toast({ title: 'Invalid Working Email Address', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    const fullPhone = `${selectedCountry.dialCode} ${phoneVal.trim()}`;

    // Check if all profile completion fields are filled with non-empty values
    const isProfileCompleteNow = [
      form.full_name,
      form.designation,
      form.institution,
      form.city,
      form.state,
      form.specialization,
      form.department,
      form.bio
    ].every(val => val && val.trim());

    const updatePayload: any = {
      full_name: form.full_name.trim().slice(0, 100),
      phone: fullPhone,
      designation: form.designation.trim().slice(0, 100),
      department: form.department.trim().slice(0, 100),
      institution: form.institution.trim().slice(0, 200),
      city: form.city.trim().slice(0, 100),
      state: form.state.trim().slice(0, 100),
      specialization: form.specialization.trim().slice(0, 200),
      experience_years: Math.max(0, Math.min(60, form.experience_years)),
      bio: form.bio.trim().slice(0, 500),
      linkedin_url: form.linkedin_url.trim().slice(0, 300),
      google_scholar_url: form.google_scholar_url.trim().slice(0, 300),
      country: selectedCountry.name,
      address: form.address.trim() || null,
      pincode: form.pincode.trim(),
      work_email: form.work_email.trim() || null,
    };

    if (isProfileCompleteNow) {
      updatePayload.membership_status = 'active';
      updatePayload.status = 'active';
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated! ✨' });
      await refreshProfile();
      setEditing(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail.trim())) {
      toast({ title: 'Invalid email address', variant: 'destructive' });
      return;
    }

    setSubmittingEmailChange(true);
    try {
      const response = await fetch('/api/profiles/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ newEmail: newEmail.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit request');
      
      toast({
        title: 'Request Submitted! 📧',
        description: 'Your email change request has been submitted to the Admin for approval.',
      });
      setEmailModalOpen(false);
      setNewEmail('');
    } catch (err: any) {
      toast({
        title: 'Request Failed',
        description: err.message || 'Failed to submit request.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingEmailChange(false);
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be less than 5MB.', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const response = await fetch('/api/profiles/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ image: base64Data })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to upload photo');

        const { avatarUrl } = data;

        const { error: dbError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl } as any)
          .eq('id', profile!.id);

        if (dbError) throw dbError;

        toast({ title: 'Profile photo updated! ✨' });
        await refreshProfile();
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      toast({ title: 'Failed to upload photo', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    setUploadingPhoto(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null } as any)
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: 'Profile photo removed' });
      await refreshProfile();
    } catch (err: any) {
      console.error('Photo remove error:', err);
      toast({ title: 'Failed to remove photo', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const completionFields = ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'] as const;
  const filledFields = completionFields.filter((f) => profile?.[f]);
  const completion = Math.round((filledFields.length / completionFields.length) * 100);

  const getCompletionTier = () => {
    if (completion >= 100) return { label: 'Gold Fellow', emoji: '🏆', color: 'text-gold' };
    if (completion >= 75) return { label: 'Silver Fellow', emoji: '🥈', color: 'text-warm/80' };
    if (completion >= 50) return { label: 'Bronze Fellow', emoji: '🥉', color: 'text-gold/60' };
    return { label: 'Getting Started', emoji: '🌱', color: 'text-muted-foreground' };
  };
  const tier = getCompletionTier();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ═══ Hero Header ═══ */}
      <div className="relative pt-20 pb-12 bg-gradient-to-b from-navy via-navy/95 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">Fellow Dashboard</span>
                <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold">
                  {tier.emoji} {tier.label}
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-warm">
                Welcome, {profile?.full_name?.split(' ')[0] || 'Fellow'} 👋
              </h1>
              <p className="text-warm/40 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" onClick={signOut} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 self-start">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {profile?.membership_status === 'suspended' || profile?.membership_status === 'pending_review' ? (
        <div className="pb-16">
          <div className="container mx-auto px-4 max-w-3xl py-12 animate-in fade-in duration-300">
            {profile?.membership_status === 'suspended' ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full text-slate-600">
                    <ShieldAlert className="w-12 h-12" />
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">Account Suspended</h2>
                  <p className="text-slate-600 text-sm max-w-md leading-relaxed">
                    Your Fellowship account has been suspended by the administration.
                  </p>
                </div>
                
                {profile.suspension_reason && (
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-xs font-mono max-w-lg mx-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Suspension</div>
                    <p className="text-sm">{profile.suspension_reason}</p>
                  </div>
                )}
                
                <div className="text-center text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Please contact Academisthan support if you have questions or wish to appeal this decision.
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleRequestReactivation} 
                    disabled={requestingReactivation}
                    className="bg-slate-800 hover:bg-slate-950 text-white rounded-xl gap-2 font-medium px-6 h-11 shadow-md hover:shadow-lg transition-all"
                  >
                    {requestingReactivation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Requesting...
                      </>
                    ) : (
                      'Request Reactivation'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                    <Clock className="w-12 h-12 animate-pulse" />
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-indigo-900">Application Under Review</h2>
                  <p className="text-indigo-700 text-sm max-w-md leading-relaxed">
                    Thank you! Your profile has been resubmitted and is currently undergoing administrative review. We will notify you by email once approved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pb-16">
          <div className="container mx-auto px-4 space-y-8">
            {/* ═══ STATUS WARNING BANNER ═══ */}
            {profile?.membership_status === 'rejected' && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-rose-900">Fellowship Profile Review Update</h4>
                    <p className="text-rose-700 text-sm mt-1">
                      Your Fellowship application requires revisions. 
                    </p>
                    {profile.rejection_reason && (
                      <div className="mt-3 p-3 bg-white/80 border border-rose-100 rounded-xl text-rose-800 text-xs font-mono">
                        <strong>Reason from Admin:</strong> {profile.rejection_reason}
                      </div>
                    )}
                    <p className="text-rose-600/70 text-xs mt-3">
                      Please correct the highlighted fields and resubmit. The application will be sent back for review automatically when your profile reaches 100% completion.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    startEditing();
                    document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 self-start md:self-center shrink-0 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> Edit Profile & Resubmit
                </Button>
              </div>
            )}

          {/* ═══ TEACHER TYPE ONBOARDING ═══ */}
          <TeacherTypeOnboarding />

          {/* ═══ TEACHER TOOLS — Full Width ═══ */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" /> Teacher Tools
              </h3>
              <Link to="/tools" className="text-gold text-sm font-semibold hover:underline flex items-center gap-1">
                View All & History <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickAction icon={Calculator} title="API Score" desc="UGC score calculator" href="/tools/api-score" accent="bg-gold/15 text-gold" onClick={() => setActiveTool('api-score')} active={activeTool === 'api-score'} />
              <QuickAction icon={Award} title="CAS Check" desc="Promotion eligibility" href="/tools/promotion-check" accent="bg-teal/15 text-teal" onClick={() => setActiveTool('promotion-check')} active={activeTool === 'promotion-check'} />
              <QuickAction icon={FlaskConical} title="Research Score" desc="Research output" href="/tools/research-score" accent="bg-accent/15 text-accent" onClick={() => setActiveTool('research-score')} active={activeTool === 'research-score'} />
              <QuickAction icon={FileText} title="Academic CV" desc="Generate your CV" href="/tools/academic-cv" accent="bg-navy/80 text-warm" onClick={() => setActiveTool('academic-cv')} active={activeTool === 'academic-cv'} />
              <QuickAction icon={Star} title="Contributions" desc="Notable works" href="/tools/notable-contributions" accent="bg-gold/10 text-gold" onClick={() => setActiveTool('notable-contributions')} active={activeTool === 'notable-contributions'} />
              <QuickAction icon={Sparkles} title="Scholar Impact" desc="AI-powered analysis" href="/tools/scholar-impact" accent="bg-gold/20 text-gold" badge="AI" onClick={() => setActiveTool('scholar-impact')} active={activeTool === 'scholar-impact'} />
            </div>
          </div>


          <div className="grid lg:grid-cols-4 gap-8 items-start">
            {/* ═══ LEFT COLUMN ═══ */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              <MembershipCard profile={profile} />

              {/* Profile completion - gamified */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-gold" /> Profile Strength
                  </span>
                  <span className={`font-bold text-sm ${tier.color}`}>{completion}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${completion}%`,
                      background: completion >= 100
                        ? 'linear-gradient(90deg, hsl(38,55%,58%), hsl(38,65%,68%))'
                        : completion >= 50
                        ? 'linear-gradient(90deg, hsl(170,50%,36%), hsl(38,55%,58%))'
                        : 'hsl(38,55%,58%)',
                    }}
                  />
                </div>
                {completion < 100 && (
                  <div className="mt-3 space-y-1.5">
                    {completionFields
                      .filter((f) => !profile?.[f])
                      .slice(0, 3)
                      .map((f) => (
                        <div key={f} className="flex items-center gap-2 text-muted-foreground text-[11px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
                          Add your {f.replace('_', ' ')}
                        </div>
                      ))}
                    <button onClick={startEditing} className="text-gold text-xs font-semibold mt-1 hover:underline">
                      Complete Profile →
                    </button>
                  </div>
                )}
              </div>

              {/* Fellow Modules Navigation Card */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold" /> Fellow Workspace
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTool('institute')}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all duration-250 group",
                      activeTool === 'institute' 
                        ? "bg-gold/10 text-gold font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className={cn("w-4 h-4", activeTool === 'institute' ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                      <span>My Institution</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", activeTool === 'institute' ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                  </button>

                  <button
                    onClick={() => setActiveTool('enroll-program')}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all duration-250 group",
                      activeTool === 'enroll-program' 
                        ? "bg-gold/10 text-gold font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className={cn("w-4 h-4", activeTool === 'enroll-program' ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                      <span>Enroll Program</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", activeTool === 'enroll-program' ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                  </button>

                  <button
                    onClick={() => setActiveTool('certification')}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all duration-250 group",
                      activeTool === 'certification' 
                        ? "bg-gold/10 text-gold font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className={cn("w-4 h-4", activeTool === 'certification' ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                      <span>Teacher Certifications</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", activeTool === 'certification' ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                  </button>

                  <button
                    onClick={() => setActiveTool('blog')}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all duration-250 group",
                      activeTool === 'blog' 
                        ? "bg-gold/10 text-gold font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className={cn("w-4 h-4", activeTool === 'blog' ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                      <span>Blog Publisher</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", activeTool === 'blog' ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                  </button>

                  <button
                    onClick={() => setActiveTool('connections')}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all duration-250 group",
                      activeTool === 'connections' 
                        ? "bg-gold/10 text-gold font-semibold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className={cn("w-4 h-4", activeTool === 'connections' ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
                      <span>Fellow Connections</span>
                    </div>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-250", activeTool === 'connections' ? "text-gold translate-x-0.5" : "text-muted-foreground group-hover:translate-x-0.5")} />
                  </button>
                </div>
              </div>

              {/* Academic Calendar */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" /> Upcoming
                  </h3>
                  <Link to="/events" className="text-gold text-xs font-semibold hover:underline flex items-center gap-1">
                    All Events <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingDates.length === 0 && (
                    <p className="text-xs text-muted-foreground">No upcoming dates in the news feed yet.</p>
                  )}
                  {upcomingDates.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${event.color} shrink-0 mt-1`} />
                        {i < upcomingDates.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-bold text-gold/70">{event.date}</p>
                        {event.url ? (
                          <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground leading-snug hover:text-gold">
                            {event.title}
                          </a>
                        ) : (
                          <p className="text-sm text-foreground leading-snug">{event.title}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explore Hub */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-serif text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" /> Explore
                </h3>
                <div className="space-y-2">
                  {exploreLinks.map((link) => (
                    <Link key={link.href} to={link.href} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                        <link.icon className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">{link.title}</p>
                        <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT COLUMN ═══ */}
            <div className="lg:col-span-3 space-y-6">
              {activeTool === 'lms' ? (
                <ProgramDetail 
                  embedded={true} 
                  embeddedSlug={new URLSearchParams(location.search).get('program') || ''} 
                  onCloseLms={() => navigate('/dashboard')} 
                />
              ) : activeTool ? (
                <div className="space-y-6">
                  {/* Back to Profile header */}
                  <div className="flex items-center justify-between bg-card border border-border rounded-2xl p-4">
                    <span className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      {activeTool === 'api-score' && 'UGC API Score Calculator'}
                      {activeTool === 'promotion-check' && 'CAS Promotion Eligibility'}
                      {activeTool === 'research-score' && 'Research Score Calculator'}
                      {activeTool === 'academic-cv' && 'Academic CV Generator'}
                      {activeTool === 'notable-contributions' && 'Notable Contributions'}
                      {activeTool === 'scholar-impact' && 'Scholar Impact Analyzer'}
                      {activeTool === 'institute' && 'My Institution'}
                      {activeTool === 'enroll-program' && 'Academic Programs Enrollment'}
                      {activeTool === 'certification' && 'Teacher Tools Certifications'}
                      {activeTool === 'blog' && 'Blog Publisher Panel'}
                      {activeTool === 'connections' && 'Fellow Connections'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTool(null)}
                      className="rounded-xl border-gold/20 text-gold hover:bg-gold/10 hover:text-gold gap-1.5 h-8 text-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Profile
                    </Button>
                  </div>

                  {/* Tool Container */}
                  <div className="bg-card border border-border rounded-2xl p-1 relative overflow-hidden">
                    {activeTool === 'api-score' && <APIScoreCalculator embedded={true} />}
                    {activeTool === 'promotion-check' && <PromotionChecker embedded={true} />}
                    {activeTool === 'research-score' && <ResearchScoreCalculator embedded={true} />}
                    {activeTool === 'academic-cv' && <AcademicCV embedded={true} />}
                    {activeTool === 'notable-contributions' && <NotableContributions embedded={true} />}
                    {activeTool === 'scholar-impact' && <ScholarImpact embedded={true} />}
                    {activeTool === 'institute' && <InstituteModule />}
                    {activeTool === 'enroll-program' && <EnrollProgramModule />}
                    {activeTool === 'certification' && <CertificationModule />}
                    {activeTool === 'blog' && <BlogModule />}
                    {activeTool === 'connections' && <ConnectionsModule />}
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Editor */}
                  <div id="profile-section" className="bg-card border border-border rounded-2xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
                        <User className="w-5 h-5 text-gold" /> Fellow Profile
                      </h2>
                  {!editing ? (
                    <Button onClick={startEditing} variant="outline" size="sm" className="rounded-xl gap-2">
                      <Edit3 className="h-4 w-4" /> Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="rounded-xl gap-1">
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button onClick={saveProfile} disabled={saving} size="sm" className="rounded-xl gap-1 bg-gold text-gold-foreground hover:bg-gold/90">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Profile Photo Action Component */}
                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="h-8 text-xs rounded-xl gap-1.5 border-gold/20 text-gold hover:bg-gold/10 hover:text-gold"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </>
                    )}
                  </Button>
                  {profile?.avatar_url && !uploadingPhoto && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="h-8 text-xs rounded-xl gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Photo
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {editing ? (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs">Full Name</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="rounded-xl" maxLength={100} />
                    </div>

                    {/* Country Searchable Dropdown */}
                    <div className="space-y-2 relative" ref={countryContainerRef}>
                      <Label className="text-xs">Country</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <span>{selectedCountry ? selectedCountry.name : 'Select Country'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </button>
                        {countryDropdownOpen && (
                          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-lg">
                            <div className="flex items-center border-b border-border px-3 pb-2 mb-2">
                              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              />
                            </div>
                            <div className="space-y-1">
                              {countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setCountryDropdownOpen(false);
                                    setCountrySearch('');
                                    setPhoneVal('');
                                    setForm(f => ({ ...f, state: '', city: '' }));
                                    setStateSearch('');
                                  }}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                                    selectedCountry?.code === c.code && "bg-muted font-medium text-gold"
                                  )}
                                >
                                  <span>{c.name}</span>
                                  <span className="text-muted-foreground text-xs">{c.dialCode}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Input */}
                    <div className="space-y-2">
                      <Label className="text-xs">Mobile Number</Label>
                      <div className="flex gap-2">
                        <div className="flex h-10 items-center justify-center rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground font-medium min-w-[65px]">
                          {selectedCountry?.dialCode || '+91'}
                        </div>
                        <Input
                          type="tel"
                          placeholder={selectedCountry?.phonePlaceholder || 'Mobile number'}
                          value={phoneVal}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const maxLen = getMaxPhoneLength(selectedCountry);
                            if (val.length <= maxLen) {
                              setPhoneVal(val);
                            }
                          }}
                          className="rounded-xl h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Working Email ID</Label>
                      <Input
                        type="email"
                        value={form.work_email}
                        onChange={(e) => setForm({ ...form, work_email: e.target.value })}
                        placeholder="e.g. yourname@institution.edu"
                        className="rounded-xl h-10"
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Designation</Label>
                      <Select
                        value={form.designation}
                        onValueChange={(val) => setForm({ ...form, designation: val })}
                      >
                        <SelectTrigger className="rounded-xl h-10 border border-border bg-card text-foreground">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professor">Professor</SelectItem>
                          <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                          <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                          <SelectItem value="Dean">Dean</SelectItem>
                          <SelectItem value="HOD">HOD</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Department</Label>
                      <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" className="rounded-xl" maxLength={100} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs">Institution</Label>
                      <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. University of Mumbai" className="rounded-xl" maxLength={200} />
                    </div>

                    {/* State Searchable Dropdown */}
                    <div className="space-y-2 relative" ref={stateContainerRef}>
                      <Label className="text-xs">State</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (!stateCities[selectedCountry?.name]) {
                              toast({ title: 'No states available', description: `Please manually type State/Province for ${selectedCountry.name}` });
                              return;
                            }
                            setStateDropdownOpen(!stateDropdownOpen);
                          }}
                          className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <span>{form.state || 'Select State'}</span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </button>
                        {stateDropdownOpen && stateCities[selectedCountry?.name] && (
                          <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-lg">
                            <div className="flex items-center border-b border-border px-3 pb-2 mb-2">
                              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search state..."
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              />
                            </div>
                            <div className="space-y-1">
                              {Object.keys(stateCities[selectedCountry.name]).filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setForm(f => ({ ...f, state: s, city: '' }));
                                    setStateDropdownOpen(false);
                                    setStateSearch('');
                                  }}
                                  className={cn(
                                    "flex w-full items-center rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                                    form.state === s && "bg-muted font-medium text-gold"
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {!stateCities[selectedCountry?.name] && (
                        <Input
                          placeholder="State / Province"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="rounded-xl mt-1 h-10"
                        />
                      )}
                    </div>

                    {/* City Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-xs">City</Label>
                      {stateCities[selectedCountry?.name] && form.state ? (
                        <Select
                          value={form.city}
                          onValueChange={(val) => setForm({ ...form, city: val })}
                        >
                          <SelectTrigger className="rounded-xl h-10">
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {(stateCities[selectedCountry.name][form.state] || []).map((c: string) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="City"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="rounded-xl h-10"
                        />
                      )}
                    </div>

                    {/* PIN / ZIP Code */}
                    <div className="space-y-2">
                      <Label className="text-xs">
                        {selectedCountry?.code === 'IN' ? 'PIN Code' : 'ZIP / Postal Code'}
                      </Label>
                      <Input
                        value={form.pincode}
                        placeholder={selectedCountry?.pinPlaceholder || 'Postal code'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const maxLen = getMaxPinLength(selectedCountry);
                          if (val.length <= maxLen) {
                            setForm({ ...form, pincode: val });
                          }
                        }}
                        className="rounded-xl h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Specialization</Label>
                      <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Artificial Intelligence" className="rounded-xl" maxLength={200} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Years of Experience</Label>
                      <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} className="rounded-xl" min={0} max={60} />
                    </div>

                    {/* Address (Optional) */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs">Address (Optional)</Label>
                      <Textarea
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Street address, building, apartment..."
                        className="rounded-xl resize-none h-20"
                        maxLength={500}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-xs">Bio</Label>
                      <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about your academic journey..." className="rounded-xl resize-none" rows={3} maxLength={500} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">LinkedIn URL</Label>
                      <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="rounded-xl" maxLength={300} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Google Scholar URL</Label>
                      <Input value={form.google_scholar_url} onChange={(e) => setForm({ ...form, google_scholar_url: e.target.value })} placeholder="https://scholar.google.com/..." className="rounded-xl" maxLength={300} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* View mode */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <ProfileField icon={User} label="Full Name" value={profile?.full_name} />
                      
                      <div className="flex flex-col gap-1">
                        <ProfileField icon={Mail} label="Email" value={profile?.email} />
                        <button
                          type="button"
                          onClick={() => setEmailModalOpen(true)}
                          className="text-[10px] text-gold hover:underline font-semibold self-start ml-11"
                        >
                          Request Email Change
                        </button>
                      </div>

                      <ProfileField icon={Mail} label="Working Email ID" value={profile?.work_email} />

                      <ProfileField icon={Phone} label={profile?.country ? `${profile.country} Phone` : 'Phone'} value={profile?.phone} />
                      <ProfileField icon={GraduationCap} label="Designation" value={profile?.designation} />
                      <ProfileField icon={BookOpen} label="Department" value={profile?.department} />
                      <ProfileField icon={Building2} label="Institution" value={profile?.institution} />
                      
                      <ProfileField 
                        icon={MapPin} 
                        label="Location" 
                        value={[profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') + (profile?.pincode ? ` - ${profile.pincode}` : '')} 
                      />
                      
                      <ProfileField icon={Sparkles} label="Specialization" value={profile?.specialization} />
                      <ProfileField icon={Calendar} label="Experience" value={profile?.experience_years ? `${profile.experience_years} years` : null} />
                      <ProfileField icon={Award} label="Status" value={profile?.membership_status ? profile.membership_status.charAt(0).toUpperCase() + profile.membership_status.slice(1) : null} />
                      
                      {profile?.address && (
                        <div className="sm:col-span-2">
                          <ProfileField icon={Home} label="Address" value={profile.address} />
                        </div>
                      )}
                    </div>

                    {profile?.bio && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Bio</span>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* Social Links */}
                    {(profile?.linkedin_url || profile?.google_scholar_url) && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {profile?.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(210,80%,50%)]/10 text-[hsl(210,80%,50%)] text-xs font-semibold hover:bg-[hsl(210,80%,50%)]/20 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                          </a>
                        )}
                        {profile?.google_scholar_url && (
                          <a href={profile.google_scholar_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> Google Scholar
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* My Certificates */}
              <MyCertificates />

              {/* My Event Registrations */}
              <MyEventRegistrations />

              {/* News & Updates Feed */}
              <NewsFeed />
            </>
          )}
        </div>
      </div>
    </div>
  </div>
      )}

      {/* Email Change Request Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground">Request Email Change</h3>
                <p className="text-xs text-muted-foreground">Submit a change request to the Admin</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">New Email Address</Label>
              <Input
                type="email"
                placeholder="new-email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-xl h-10"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Email address cannot be changed directly. An admin will review and process your request.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEmailModalOpen(false);
                  setNewEmail('');
                }}
                disabled={submittingEmailChange}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestEmailChange}
                disabled={submittingEmailChange || !newEmail.trim()}
                className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {submittingEmailChange ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
      </div>
    </div>
  );
}
