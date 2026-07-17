import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateCertificatePDF } from '@/lib/certificate';
import api from '@/lib/api-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  GraduationCap, Lock, Award, Clock,
  ChevronRight, Download, ArrowLeft, BookOpen,
  LayoutDashboard, User, Calendar, Calculator, TrendingUp,
  Settings, RefreshCw, X, Maximize2, Minimize2, Check, ChevronLeft, ChevronUp,
  Building2, Target, Globe, FileText, Sparkles, Copy, Users, Briefcase, Shield, Loader2, ArrowRight, Bookmark,
  CheckCircle2, PlayCircle, Circle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const exploreLinks = [
  { title: 'Jobs & Opportunities', desc: 'Latest faculty positions', href: '/jobs', icon: Briefcase },
  { title: 'Gazette & Regulations', desc: 'Official circulars', href: '/gazette', icon: FileText },
  { title: 'Fellow Directory', desc: 'Find educators', href: '/directory', icon: Globe },
  { title: 'Verify Certificate', desc: 'Check membership', href: '/verify', icon: Shield },
];

function ProfileField({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 text-left">
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(228,45%,16%)] via-[hsl(228,45%,20%)] to-[hsl(228,35%,25%)] p-5 md:p-6 border border-gold/20 shadow-[0_20px_60px_hsl(228_45%_16%/0.5)] text-left">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/3 rounded-full blur-2xl" />
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
                <Check className="w-3.5 h-3.5 text-emerald-500" />
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

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: User, label: 'My Profile', href: '/dashboard/profile' },
  { icon: BookOpen, label: 'My Courses', href: '/dashboard/courses', exact: true },
  { icon: Award, label: 'Certificates', href: '/dashboard/certificates' },
  { icon: Calendar, label: 'My Events', href: '/dashboard/events' },
  { icon: Calculator, label: 'API Score', href: '/tools/api-score' },
  { icon: TrendingUp, label: 'My Progress', href: '/dashboard/progress' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface SyllabusStep {
  id: string;
  module_id: string;
  title: string;
  content_type: string; // 'video', 'text', 'pdf', 'link', 'quiz', 'file'
  video_url?: string | null;
  text_content?: string | null;
  file_url?: string | null;
  quiz_questions?: string | any[] | null;
  passing_score?: number;
  sort_order: number;
  duration_minutes: number;
}

interface ProgramModule {
  id: string;
  program_id: string;
  chapter?: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  sort_order: number;
  duration_minutes: number | null;
  steps?: SyllabusStep[];
}

interface AcademicProgram {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  level: string | null;
  category: string | null;
  image_url: string | null;
  is_published: boolean | number;
  prerequisites: string | null;
  learning_outcomes: string | null;
  modules?: ProgramModule[];
}

interface ProgramEnrollment {
  id: string;
  program_id: string;
  user_id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string | null;
  certificate_number?: string | null;
  program_title?: string;
}

interface CertificateDetail {
  certificate_number: string;
  holder_name: string;
  issued_at: string;
  certificate_type: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/);
  return m ? m[1] : null;
}

function cleanSyllabusHtml(html: string): string {
  if (!html) return '';
  let cleaned = html;

  // 1. Remove duplicate wix video players/figures and their wrapper container divs
  cleaned = cleaned.replace(/<div[^>]*class="oM1x-"[^>]*>[\s\S]*?(?:figure-VIDEO|video-player|react-player__preview)[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<figure[^>]+data-hook="figure-VIDEO"[\s\S]*?<\/figure>/gi, '');
  cleaned = cleaned.replace(/<div[^>]+data-hook="video-player"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 1.5. Remove divider widgets and their wrapper container divs
  cleaned = cleaned.replace(/<div[^>]*class="oM1x-"[^>]*>[\s\S]*?data-hook="divider[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="oM1x-"[^>]*>[\s\S]*?divider-single[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]+data-hook="divider[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 2. Remove gap spacers
  cleaned = cleaned.replace(/<div[^>]+data-hook="gap-spacer"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="vDp--"[^>]*>[\s\S]*?<\/div>/gi, '');

  // 3. Remove empty paragraphs and helper spacer divs
  cleaned = cleaned.replace(/<p[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/div>/gi, '');

  // 4. Clean up trailing empty paragraphs, divs or spacers recursively at the end of the content
  while (true) {
    const prev = cleaned;
    cleaned = cleaned.replace(/(?:<p[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/p>|<div[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*\s*<\/div>)\s*$/gi, '');
    if (cleaned === prev) break;
  }

  return cleaned;
}

interface ProgramDetailProps {
  embedded?: boolean;
  embeddedSlug?: string;
  onCloseLms?: () => void;
}

export default function ProgramDetail({ embedded = false, embeddedSlug, onCloseLms }: ProgramDetailProps = {}) {
  const { slug: routeSlug } = useParams();
  const slug = embedded ? embeddedSlug : routeSlug;
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect full-page LMS routes to Dashboard workspace
  useEffect(() => {
    if (!embedded && routeSlug) {
      navigate(`/dashboard?program=${routeSlug}`, { replace: true });
    }
  }, [embedded, routeSlug, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [program, setProgram] = useState<AcademicProgram | null>(null);
  const [modules, setModules] = useState<ProgramModule[]>([]);
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null);
  const [progress, setProgress] = useState<Record<string, { completed: boolean; score?: number; passed?: boolean }>>({});
  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  
  // LMS active syllabus step state
  const [activeStep, setActiveStep] = useState<SyllabusStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Full Screen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const resetScroll = () => {
      // 1. Reset inner container scroll (for fullscreen and standard layouts)
      const body = document.getElementById('lms-player-body');
      if (body) {
        body.scrollTop = 0;
      }

      // 2. Scroll the window to the top of the content container (not the top of the entire page) in normal view
      if (!isFullscreen) {
        const container = document.getElementById('lms-content-container');
        if (container) {
          const yOffset = -90; // offset to align below the fixed navbar
          const y = container.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'instant' });
        }
      }
    };

    // Run immediately on activeStep change
    resetScroll();

    // Run at successive intervals to counter asynchronous iframe loading, autofocus, and layout recalculations
    const t1 = setTimeout(resetScroll, 50);
    const t2 = setTimeout(resetScroll, 150);
    const t3 = setTimeout(resetScroll, 350);
    const t4 = setTimeout(resetScroll, 650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [activeStep, isFullscreen]);

  // Quiz Attempt State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Auto-calculated flat steps sequence list
  const flatSteps = useMemo(() => {
    return modules.flatMap(m => (m.steps || []).map(s => ({ ...s, moduleId: m.id, moduleTitle: m.title })));
  }, [modules]);

  // Current active step index in flat steps sequence
  const currentStepIdx = useMemo(() => {
    if (!activeStep) return -1;
    return flatSteps.findIndex(s => s.id === activeStep.id);
  }, [activeStep, flatSteps]);

  // Lock status check for a step
  const getStepLockStatus = useCallback((step: SyllabusStep) => {
    const stepIdx = flatSteps.findIndex(s => s.id === step.id);
    if (stepIdx <= 0) return { isLocked: false, requiredStep: null };

    // Locked if any preceding step is incomplete
    for (let i = 0; i < stepIdx; i++) {
      const prec = flatSteps[i];
      const prog = progress[prec.id];
      const isComplete = prog?.completed && (prec.content_type !== 'quiz' || prog?.passed);
      if (!isComplete) {
        return { isLocked: true, requiredStep: prec };
      }
    }

    return { isLocked: false, requiredStep: null };
  }, [flatSteps, progress]);

  // Check if a module is unlocked (unlocked if its first step is unlocked)
  const isModuleUnlocked = useCallback((mod: ProgramModule) => {
    if (!mod.steps || mod.steps.length === 0) return true;
    const firstStep = mod.steps[0];
    return !getStepLockStatus(firstStep).isLocked;
  }, [getStepLockStatus]);

  // Fetch program hierarchy and user progress
  const fetchData = useCallback(async () => {
    try {
      if (!slug) return;
      const prog = await api.programs.getBySlug(slug);
      if (!prog) { setLoading(false); return; }
      setProgram(prog);
      
      const mods = prog.modules || [];
      setModules(mods);

      if (user) {
        const enrolls = await api.programs.getEnrollments();
        const enr = enrolls.find((e: ProgramEnrollment) => e.program_id === prog.id);
        setEnrollment(enr);

        if (enr) {
          // Fetch backend LMS user step progress
          const progressList = await api.programs.getStudentProgress(enr.id);
          const progressMap: Record<string, { completed: boolean; score?: number; passed?: boolean }> = {};
          
          progressList.forEach((p: any) => {
            progressMap[p.step_id] = {
              completed: !!p.completed,
              score: p.score !== null ? p.score : undefined,
              passed: p.passed !== null ? !!p.passed : undefined
            };
          });
          setProgress(progressMap);

          // Find first incomplete step to resume learning
          const allFlat = mods.flatMap((m: any) => (m.steps || []).map((s: any) => ({ ...s, moduleId: m.id })));
          const firstIncompleteIdx = allFlat.findIndex((s: any) => {
            const progRecord = progressMap[s.id];
            return !progRecord?.completed || (s.content_type === 'quiz' && !progRecord?.passed);
          });

          // Default to showing the Program Overview page on mount
          setActiveStep(null);

          // Check certificate
          const certIssued = enr.status === 'completed' || (firstIncompleteIdx === -1 && allFlat.length > 0);
          if (certIssued) {
            setCertificate({
              certificate_number: enr.certificate_number || `ACAD-CERT-${prog.id.slice(0, 6).toUpperCase()}`,
              holder_name: profile?.full_name || 'Fellow',
              issued_at: enr.completed_at || new Date().toISOString(),
              certificate_type: 'completion'
            });
          }
        }
      }
    } catch (err) {
      console.error('Fetch program details error:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, user, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Accordion management: Auto-expand active step's chapter
  useEffect(() => {
    if (modules.length > 0) {
      const initialExpanded: Record<string, boolean> = { ...expandedChapters };
      const unique = Array.from(new Set(modules.map(m => m.chapter || 'Overview')));
      
      unique.forEach((ch, idx) => {
        if (initialExpanded[ch] === undefined) {
          initialExpanded[ch] = idx === 0; // expand first chapter by default
        }
      });
      
      if (activeStep) {
        const parentMod = modules.find(m => (m.steps || []).some(s => s.id === activeStep.id));
        if (parentMod && parentMod.chapter) {
          initialExpanded[parentMod.chapter] = true;
        }
      }
      setExpandedChapters(initialExpanded);
    }
  }, [modules, activeStep]);

  // Reset quiz state when active step changes
  useEffect(() => {
    if (!activeStep) return;
    
    const savedAttempt = progress[activeStep.id];
    if (savedAttempt && activeStep.content_type === 'quiz') {
      setQuizSubmitted(true);
      setQuizScore(savedAttempt.score !== undefined ? savedAttempt.score : null);
      setSelectedAnswers({});
    } else {
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  }, [activeStep, progress]);

  // Full Screen handler
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };



  const handleEnroll = async () => {
    if (!user) { navigate('/auth/signin'); return; }
    setEnrolling(true);
    try {
      await api.programs.enrollUser(program!.id);
      toast({ title: 'Enrolled successfully! 🎉 Start learning now.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Enrollment failed', description: error.message, variant: 'destructive' });
    } finally {
      setEnrolling(false);
    }
  };

  // Mark non-quiz step complete and optionally navigate to next
  const handleMarkComplete = async () => {
    if (!user || !enrollment || !activeStep) return;
    setSubmittingProgress(true);
    try {
      await api.programs.completeSyllabusStep(enrollment.id, activeStep.id);
      
      // Update local state
      setProgress(prev => ({
        ...prev,
        [activeStep.id]: { completed: true }
      }));

      toast({ title: 'Step completed! ✅' });

      // Auto load details to calculate progress
      fetchData();

      // Go to next step if exists
      if (currentStepIdx < flatSteps.length - 1) {
        setActiveStep(flatSteps[currentStepIdx + 1]);
      }
    } catch (err: any) {
      toast({ title: 'Error saving progress', variant: 'destructive' });
    } finally {
      setSubmittingProgress(false);
    }
  };

  // Grade and Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!user || !enrollment || !activeStep) return;

    let questionsList: any[] = [];
    try {
      if (activeStep.quiz_questions) {
        questionsList = typeof activeStep.quiz_questions === 'string'
          ? JSON.parse(activeStep.quiz_questions)
          : activeStep.quiz_questions;
      }
    } catch (e) {
      console.error(e);
    }

    if (questionsList.length === 0) {
      toast({ title: 'No quiz questions loaded', variant: 'destructive' });
      return;
    }

    // Grade answers
    let correctCount = 0;
    questionsList.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      const correct = q.correct_answer || q.options[0] || '';
      if (selected && selected.trim().toLowerCase() === correct.trim().toLowerCase()) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / questionsList.length) * 100);
    const passingMarks = activeStep.passing_score || 80;
    const hasPassed = percent >= passingMarks;

    setSubmittingProgress(true);
    try {
      await api.programs.completeSyllabusStep(enrollment.id, activeStep.id, { score: percent });
      
      setProgress(prev => ({
        ...prev,
        [activeStep.id]: { completed: true, score: percent, passed: hasPassed }
      }));

      setQuizSubmitted(true);
      setQuizScore(percent);

      if (hasPassed) {
        toast({ title: '🎉 Quiz Passed!', description: `Grade: ${percent}% (Passed). Next items unlocked!` });
        fetchData();
      } else {
        toast({
          title: '❌ Quiz Failed',
          description: `Grade: ${percent}% (Passing score is ${passingMarks}%). Please click Try Again to retake.`,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({ title: 'Error submitting quiz answers', variant: 'destructive' });
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleUndoQuestionAnswer = (questionIdx: number) => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[questionIdx];
      return next;
    });
  };

  const handleBypassQuiz = async () => {
    if (!user || !enrollment || !activeStep) return;
    setSubmittingProgress(true);
    try {
      const score = quizScore !== null ? quizScore : 0;
      await api.programs.completeSyllabusStep(enrollment.id, activeStep.id, { score, bypass: true });
      
      setProgress(prev => ({
        ...prev,
        [activeStep.id]: { completed: true, score, passed: true }
      }));

      toast({ title: 'Step bypassed! ✅', description: 'Bypassed quiz to unlock next steps.' });
      fetchData();
      
      // Navigate to next step
      if (currentStepIdx < flatSteps.length - 1) {
        setActiveStep(flatSteps[currentStepIdx + 1]);
      }
    } catch (err: any) {
      toast({ title: 'Error bypassing quiz', variant: 'destructive' });
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleGoToRequiredStep = (requiredStep: SyllabusStep) => {
    setActiveStep(requiredStep);
    toast({
      title: 'Active step changed',
      description: `Please complete: "${requiredStep.title}" first.`
    });
  };

  const downloadCertificate = () => {
    if (!certificate || !program) return;
    generateCertificatePDF({
      holderName: certificate.holder_name,
      programTitle: program.title,
      certificateNumber: certificate.certificate_number,
      issuedAt: certificate.issued_at,
      certificateType: certificate.certificate_type,
    });
  };

  const getTextProgressBar = (percent: number) => {
    const filledCount = Math.round(percent / 10);
    const emptyCount = 10 - filledCount;
    return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
  };

  const renderSyllabusList = (isDarkFullscreen = false) => {
    return (
      <div className={cn(
        "border rounded-2xl overflow-hidden shadow-lg flex flex-col",
        isDarkFullscreen 
          ? "bg-slate-900 border-slate-800 text-slate-200 h-full" 
          : "bg-slate-900 border-slate-800 text-slate-200"
      )}>
        {!isDarkFullscreen && (
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h4 className="font-sans text-sm font-bold text-white">Course Syllabus</h4>
            <Badge className="bg-gold/10 text-gold border-gold/20 text-[9px] font-bold uppercase">
              {modules.length} Modules
            </Badge>
          </div>
        )}

        <div className={cn(
          "divide-y divide-slate-800",
          isDarkFullscreen ? "flex-1 overflow-y-auto" : "max-h-[500px] overflow-y-auto"
        )}>
          {/* Overview Tab Button */}
          <button
            onClick={() => {
              setActiveStep(null);
              setIsFullscreen(false);
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.error(err));
              }
            }}
            className={cn(
              "w-full flex items-center gap-2.5 p-4 transition-colors text-left",
              activeStep === null 
                ? "bg-[#cfa459] hover:bg-[#cfa459] text-[#222] font-semibold" 
                : "hover:bg-slate-800/50 text-slate-300"
            )}
          >
            <Info className={cn("w-3.5 h-3.5", activeStep === null ? "text-[#222]" : "text-slate-400")} />
            <span className={cn(
              "text-xs font-sans font-bold",
              activeStep === null ? "text-[#222]" : "text-slate-300"
            )}>
              Overview
            </span>
          </button>

          {modules.map((mod, mIdx) => {
            const chapterName = mod.chapter || 'Overview';
            const stepList = mod.steps || [];
            const isExpanded = !!expandedChapters[chapterName];
            const completedInModule = stepList.filter(s => {
              const progRecord = progress[s.id];
              return progRecord?.completed && (s.content_type !== 'quiz' || progRecord?.passed);
            }).length;
            const totalInModule = stepList.length;
            const modulePercent = totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0;

            return (
              <div key={mod.id} className="bg-slate-900/50">
                <button
                  onClick={() => {
                    setExpandedChapters(prev => ({
                      ...prev,
                      [chapterName]: !prev[chapterName]
                    }));
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="min-w-0 pr-4">
                    <h5 className="font-sans font-bold text-xs text-white truncate">
                      {mod.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{stepList.length} steps</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-gold font-bold bg-gold/10 px-1.5 py-0.5 rounded">
                      {modulePercent}%
                    </span>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-slate-400 transition-transform",
                      isExpanded ? "rotate-90" : ""
                    )} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-slate-950/40 border-t border-slate-850 divide-y divide-slate-850">
                    {stepList.length === 0 ? (
                      <div className="px-5 py-3 text-[10px] text-slate-500 italic">No steps in this module.</div>
                    ) : (
                      stepList.map((step, sIdx) => {
                        const isActive = activeStep?.id === step.id;
                        const progRecord = progress[step.id];
                        const isComplete = progRecord?.completed && (step.content_type !== 'quiz' || progRecord?.passed);
                        const isQuizFailed = step.content_type === 'quiz' && progRecord?.completed && !progRecord?.passed;
                        const { isLocked, requiredStep } = getStepLockStatus(step);

                        const handleStepClick = () => {
                          setActiveStep(step);
                          if (isLocked) {
                            toast({
                              title: 'Preview Mode 👁️',
                              description: 'You can view this step, but you must complete preceding steps to unlock the completion button.',
                            });
                          }
                        };

                        let stepLabel = step.title;
                        if (step.content_type === 'quiz') {
                          if (isComplete) {
                            stepLabel = 'Quiz Passed';
                          } else if (isQuizFailed) {
                            stepLabel = 'Quiz Failed (Try Again)';
                          }
                        }

                        return (
                          <button
                            key={step.id}
                            onClick={handleStepClick}
                            className={cn(
                              "w-full text-left px-5 py-3 flex items-center gap-2.5 transition-colors",
                              isActive 
                                ? "bg-[#cfa459] hover:bg-[#cfa459] text-[#222] font-semibold" 
                                : "hover:bg-slate-900/40",
                              isLocked ? "opacity-75" : ""
                            )}
                          >
                            <span className="shrink-0">
                              {isComplete ? (
                                <CheckCircle2 className={cn("w-3.5 h-3.5", isActive ? "text-[#222]" : "text-emerald-400")} />
                              ) : isLocked ? (
                                <Lock className={cn("w-3.5 h-3.5", isActive ? "text-[#222]" : "text-slate-500")} />
                              ) : isActive ? (
                                <PlayCircle className="w-3.5 h-3.5 text-[#222]" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </span>
                            <span className={cn(
                              "text-xs truncate",
                              isActive ? "text-[#222] font-bold" : "text-slate-300"
                            )}>
                              {stepLabel}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPlayerContent = (isDarkFullscreen = false) => {
    if (!activeStep) {
      if (program) {
        const totalSteps = flatSteps.length;
        const completedSteps = flatSteps.filter(s => {
          const progRecord = progress[s.id];
          return progRecord?.completed && (s.content_type !== 'quiz' || progRecord?.passed);
        }).length;
        const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        // Find the first step to start/resume
        const resumeStep = flatSteps.find(s => {
          const progRecord = progress[s.id];
          return !progRecord?.completed || (s.content_type === 'quiz' && !progRecord?.passed);
        }) || flatSteps[0];

        return (
          <div className={cn(
            "border rounded-2xl p-6 md:p-8 text-left shadow-sm space-y-6 flex flex-col justify-between min-h-[500px]",
            isDarkFullscreen 
              ? "bg-slate-900 border-slate-800 text-slate-200" 
              : "bg-white border-slate-200 text-slate-800"
          )}>
            <div className="space-y-6">
              {/* Header stats */}
              <div className={cn(
                "flex justify-between items-center border-b pb-4 relative pr-10",
                isDarkFullscreen ? "border-slate-800" : "border-slate-100"
              )}>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider font-mono",
                  isDarkFullscreen ? "text-slate-400" : "text-slate-500"
                )}>
                  {totalSteps} Steps
                </span>
                {!isDarkFullscreen && !isFullscreen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="absolute right-0 top-0.5 rounded-lg h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors hidden md:inline-flex"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {/* Cover Image */}
              {program.image_url && (
                <div className={cn(
                  "relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden border bg-slate-950",
                  isDarkFullscreen ? "border-slate-850" : "border-slate-150"
                )}>
                  <img 
                    src={program.image_url} 
                    alt={program.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* About description */}
              <div className="space-y-2">
                <h3 className={cn(
                  "font-serif text-base font-bold",
                  isDarkFullscreen ? "text-white" : "text-gray-900"
                )}>
                  About
                </h3>
                <p className={cn(
                  "text-sm leading-relaxed whitespace-pre-line",
                  isDarkFullscreen ? "text-slate-350" : "text-slate-600"
                )}>
                  {program.description || 'Welcome to the program! Set yourself up for success by completing each module step-by-step.'}
                </p>
              </div>

              {/* Prerequisites & Outcomes */}
              {(program.prerequisites || program.learning_outcomes) && (
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t",
                  isDarkFullscreen ? "border-slate-800" : "border-slate-100"
                )}>
                  {program.prerequisites && (
                    <div className="space-y-1">
                      <h4 className={cn(
                        "text-[10px] font-bold uppercase tracking-wider font-serif",
                        isDarkFullscreen ? "text-slate-400" : "text-slate-500"
                      )}>
                        Prerequisites
                      </h4>
                      <p className={cn(
                        "text-xs leading-relaxed whitespace-pre-line",
                        isDarkFullscreen ? "text-slate-350" : "text-slate-650"
                      )}>
                        {program.prerequisites}
                      </p>
                    </div>
                  )}
                  {program.learning_outcomes && (
                    <div className="space-y-1">
                      <h4 className={cn(
                        "text-[10px] font-bold uppercase tracking-wider font-serif",
                        isDarkFullscreen ? "text-slate-400" : "text-slate-500"
                      )}>
                        What you will learn
                      </h4>
                      <p className={cn(
                        "text-xs leading-relaxed whitespace-pre-line",
                        isDarkFullscreen ? "text-slate-350" : "text-slate-650"
                      )}>
                        {program.learning_outcomes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom action button */}
            {resumeStep && (
              <div className={cn(
                "flex justify-end pt-4 border-t w-full",
                isDarkFullscreen ? "border-slate-800" : "border-slate-100"
              )}>
                <Button 
                  onClick={() => {
                    setActiveStep(resumeStep);
                    // Also expand the module chapter of the resume step
                    const parentMod = modules.find(m => (m.steps || []).some(s => s.id === resumeStep.id));
                    if (parentMod) {
                      const chapterName = parentMod.chapter || 'Overview';
                      setExpandedChapters(prev => ({
                        ...prev,
                        [chapterName]: true
                      }));
                    }
                  }}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  {completedSteps > 0 ? 'Resume Course' : 'Start'} &rarr;
                </Button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">No Steps Configured</h3>
          <p className="text-muted-foreground text-sm">This program currently does not contain any syllabus steps. Please check back later.</p>
        </div>
      );
    }

    return (
      <div 
        id="lms-content-container" 
        className={cn(
          "overflow-hidden flex flex-col w-full h-full text-slate-800",
          isDarkFullscreen 
            ? "bg-transparent p-0" 
            : "bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6"
        )}
      >
        {/* Player Header - centered path & active step title */}
        {!isFullscreen && (
          <div className="flex flex-col items-center border-b pb-4 mb-4 text-center relative w-full pr-12 border-slate-200">
            <h3 className="font-serif text-sm md:text-base font-bold text-navy select-none">
              {(activeStep.moduleTitle || 'Module')} / {activeStep.title}
            </h3>

            {/* Fullscreen handler on the right */}
            {!isDarkFullscreen && !isFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="absolute right-3 top-1 rounded-lg h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors hidden md:inline-flex"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        )}

        {/* Player Content Body */}
        <div id="lms-player-body" className="flex-1 overflow-y-auto min-h-[300px] mb-5 pr-1 relative">
          {/* 1. Video content */}
          {/* Unified Content Viewer (Non-Quiz) */}
          {activeStep.content_type !== 'quiz' && (
            <div className="space-y-6">
              {/* YouTube / Video player */}
              {activeStep.video_url && (
                <div className="space-y-4">
                  {extractYouTubeId(activeStep.video_url) ? (
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(activeStep.video_url)}?rel=0&enablejsapi=1`}
                        title={activeStep.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                      <video 
                        src={activeStep.video_url} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Text / Article Content */}
              {activeStep.text_content && (
                <div className="space-y-4">
                  <style>{`
                    .lms-article-content h1,
                    .lms-article-content h1 * {
                      font-size: 2.25rem !important;
                      font-weight: 800 !important;
                      line-height: 1.25 !important;
                      margin-top: 2rem !important;
                      margin-bottom: 1.5rem !important;
                      color: #0f172a !important;
                      font-family: 'Playfair Display', Georgia, serif !important;
                    }
                    .lms-article-content h2,
                    .lms-article-content h2 * {
                      font-size: 1.75rem !important;
                      font-weight: 700 !important;
                      line-height: 1.35 !important;
                      margin-top: 1.75rem !important;
                      margin-bottom: 1rem !important;
                      color: #1e293b !important;
                      font-family: 'Playfair Display', Georgia, serif !important;
                    }
                    .lms-article-content h3,
                    .lms-article-content h3 * {
                      font-size: 1.375rem !important;
                      font-weight: 600 !important;
                      line-height: 1.4 !important;
                      margin-top: 1.5rem !important;
                      margin-bottom: 0.75rem !important;
                      color: #334155 !important;
                      font-family: 'Playfair Display', Georgia, serif !important;
                    }
                    .lms-article-content p,
                    .lms-article-content p * {
                      font-size: 14px !important;
                      font-weight: 400 !important;
                      line-height: 1.7 !important;
                      margin-bottom: 10px !important;
                      color: #334155 !important;
                      font-family: 'Inter', system-ui, sans-serif !important;
                    }

                    .lms-article-content.text-left h1,
                    .lms-article-content.text-left h1 *,
                    .lms-article-content.text-left h2,
                    .lms-article-content.text-left h2 *,
                    .lms-article-content.text-left h3,
                    .lms-article-content.text-left h3 *,
                    .lms-article-content.text-left h4,
                    .lms-article-content.text-left h4 *,
                    .lms-article-content.text-left h5,
                    .lms-article-content.text-left h5 *,
                    .lms-article-content.text-left h6,
                    .lms-article-content.text-left h6 * {
                      font-weight: 600 !important;
                    }
                    .lms-article-content ul {
                      list-style-type: disc !important;
                      padding-left: 1.5rem !important;
                      margin-bottom: 1.25rem !important;
                      font-family: 'Inter', system-ui, sans-serif !important;
                    }
                    .lms-article-content ol {
                      list-style-type: decimal !important;
                      padding-left: 1.5rem !important;
                      margin-bottom: 1.25rem !important;
                      font-family: 'Inter', system-ui, sans-serif !important;
                    }
                    .lms-article-content li,
                    .lms-article-content li * {
                      font-size: 0.9375rem !important;
                      margin-bottom: 0.5rem !important;
                      color: #334155 !important;
                      font-family: 'Inter', system-ui, sans-serif !important;
                    }
                    .lms-article-content img {
                      max-width: 100% !important;
                      height: auto !important;
                      border-radius: 12px !important;
                      margin: 1.5rem 0 !important;
                    }
                    .lms-article-content video {
                      max-width: 100% !important;
                      border-radius: 12px !important;
                      margin: 1.5rem 0 !important;
                    }
                  `}</style>
                  <div 
                    className="lms-article-content text-left"
                    dangerouslySetInnerHTML={{ __html: cleanSyllabusHtml(activeStep.text_content) }}
                  />
                </div>
              )}

              {/* PDF Document Preview / Embedded View at the Bottom */}
              {activeStep.file_url && (activeStep.content_type === 'pdf' || activeStep.file_url.toLowerCase().endsWith('.pdf')) && (
                <div className="space-y-4 border-t border-slate-100 pt-5 text-left">
                  <h4 className="font-serif font-bold text-sm text-navy flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-gold" /> Syllabus PDF Document
                  </h4>
                  <div className="w-full h-[600px] border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 relative">
                    <iframe
                      src={`${activeStep.file_url}#toolbar=0`}
                      className="w-full h-full border-0"
                      title="PDF syllabus document"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button asChild className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 text-xs py-2 px-5">
                      <a href={activeStep.file_url} target="_blank" rel="noopener noreferrer">
                        Open PDF in New Tab
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Standard link & document resource downloads if type is file or link and no pdf preview rendered */}
              {activeStep.file_url && !(activeStep.content_type === 'pdf' || activeStep.file_url.toLowerCase().endsWith('.pdf')) && (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-slate-200 text-center bg-slate-50">
                  {activeStep.content_type === 'link' ? (
                    <>
                      <BookOpen className="w-12 h-12 text-gold mb-3" />
                      <h4 className="font-serif font-bold text-sm mb-2 text-navy">Explore Reference Link</h4>
                      <p className="text-slate-400 text-xs mb-4">This step points to external content. Open it to proceed.</p>
                      <Button asChild className="rounded-xl bg-navy text-warm hover:bg-navy/95 text-xs py-2 px-5">
                        <a href={activeStep.file_url} target="_blank" rel="noopener noreferrer">
                          Visit Link
                        </a>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Download className="w-12 h-12 text-gold mb-3" />
                      <h4 className="font-serif font-bold text-sm mb-2 text-navy">Download Resources</h4>
                      <p className="text-slate-400 text-xs mb-4">Download accompanying slides, templates, or references.</p>
                      <Button asChild className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 text-xs py-2 px-5">
                        <a href={activeStep.file_url} download>
                          Download Resource File
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Fallback if step is empty */}
              {!activeStep.video_url && !activeStep.text_content && !activeStep.file_url && (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-55 rounded-xl border border-dashed text-slate-400 italic">
                  No video, text content, or files attached to this step.
                </div>
              )}
            </div>
          )}

          {/* 6. MCQ Quiz Player - Styled exactly like mockup Slide 3 Screen 7 */}
          {activeStep.content_type === 'quiz' && (
            <div className="space-y-5 w-full">
              {(() => {
                let quizQuestions: any[] = [];
                try {
                  if (activeStep.quiz_questions) {
                    quizQuestions = typeof activeStep.quiz_questions === 'string'
                      ? JSON.parse(activeStep.quiz_questions)
                      : activeStep.quiz_questions;
                  }
                } catch (e) {
                  console.error(e);
                }

                if (quizQuestions.length === 0) {
                  return <div className="text-slate-400 italic text-xs py-4 text-center">No quiz questions defined for this step.</div>;
                }

                return (
                  <div className="space-y-6 w-full text-left">
                    <div className="flex justify-between items-center border-b pb-2 border-slate-200">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        Passing score: {activeStep.passing_score || 80}%
                      </span>
                      {quizScore !== null && (
                        <div className={cn("px-2.5 py-0.5 border rounded-lg text-center",
                          quizScore >= (activeStep.passing_score || 80)
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-red-50 border-red-100 text-red-700'
                        )}>
                          <span className="text-[10px] font-bold">{quizScore}% Passed</span>
                        </div>
                      )}
                    </div>

                    {/* Questions List stack */}
                    <div className="space-y-5 w-full">
                      {quizQuestions.map((q, qIdx) => {
                        const selected = selectedAnswers[qIdx];
                        const correct = q.correct_answer || q.options[0] || '';
                        const isCorrect = selected === correct;

                        return (
                          <div key={qIdx} className="space-y-3 pb-5 last:border-0 last:pb-0 w-full border-b border-slate-100">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-bold text-slate-800">Q{qIdx + 1}. {q.question}</p>
                              <div className="flex items-center gap-3">
                                {!quizSubmitted && selected && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUndoQuestionAnswer(qIdx)}
                                    className="h-6 text-[10px] text-rose-500 hover:text-rose-600 font-bold px-2 py-0 hover:bg-rose-50 rounded-lg"
                                  >
                                    Undo choice
                                  </Button>
                                )}
                                <span className="text-[9px] text-slate-405 font-bold uppercase">Question {qIdx + 1} of {quizQuestions.length}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 w-full">
                              {q.options.map((opt: string, oIdx: number) => {
                                const isSelected = selected === opt;
                                
                                let containerStyle = "border-slate-200 hover:border-blue-300 hover:bg-slate-50/20 text-slate-700";
                                let radioStyle = "border-slate-350 bg-white";
                                
                                if (quizSubmitted) {
                                  if (opt === correct) {
                                    containerStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                                    radioStyle = "border-emerald-500 bg-emerald-500 text-white flex items-center justify-center";
                                  } else if (isSelected && !isCorrect) {
                                    containerStyle = "bg-rose-50 border-rose-300 text-rose-800";
                                    radioStyle = "border-rose-500 bg-rose-500 text-white flex items-center justify-center";
                                  } else {
                                    containerStyle = "border-slate-100 opacity-60 text-slate-400";
                                  }
                                } else if (isSelected) {
                                  containerStyle = "border-blue-600 bg-blue-50/50 text-blue-800 font-bold";
                                  radioStyle = "border-blue-600 bg-blue-600 flex items-center justify-center";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    disabled={quizSubmitted}
                                    onClick={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 ${containerStyle}`}
                                  >
                                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${radioStyle}`}>
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Incorrect / Correct alerts inline inside cards (Screen 7 validation layout) */}
                            {quizSubmitted && selected && (
                              <div className={`mt-3 px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 font-semibold ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border-rose-250 text-rose-700'
                              }`}>
                                {isCorrect ? (
                                  <>
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span>Correct Answer!</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 shrink-0" />
                                    <span>Incorrect! Please try again.</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Player Footer Navigation - Back/Forward/Try Again aligned to layout */}
        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={() => setActiveStep(flatSteps[currentStepIdx - 1])}
            disabled={currentStepIdx <= 0}
            className="rounded-xl h-9 text-xs px-4 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
          >
            ← Previous
          </Button>

          {/* Right side navigation buttons */}
          {(() => {
            const { isLocked, requiredStep } = getStepLockStatus(activeStep);
            
            if (activeStep.content_type === 'quiz') {
              return quizSubmitted ? (
                <div className="flex items-center gap-2">
                  {quizScore !== null && quizScore < (activeStep.passing_score || 80) && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleRetakeQuiz}
                        variant="outline"
                        className="rounded-xl h-9 text-xs gap-1 border-slate-200 text-slate-500 font-bold px-4 hover:bg-slate-50"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={handleBypassQuiz}
                        className="rounded-xl h-9 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs px-4"
                      >
                        Go Next (Bypass)
                      </Button>
                    </div>
                  )}
                  {(quizScore !== null && quizScore >= (activeStep.passing_score || 80) || progress[activeStep.id]?.passed) && currentStepIdx < flatSteps.length - 1 && (
                    <Button
                      onClick={() => setActiveStep(flatSteps[currentStepIdx + 1])}
                      className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
                    >
                      Next →
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={
                      isLocked ||
                      submittingProgress ||
                      (() => {
                        let questionsCount = 0;
                        try {
                          if (activeStep.quiz_questions) {
                            questionsCount = (typeof activeStep.quiz_questions === 'string'
                              ? JSON.parse(activeStep.quiz_questions)
                              : activeStep.quiz_questions).length;
                          }
                        } catch (e) {}
                        return Object.keys(selectedAnswers).length < questionsCount;
                      })()
                    }
                    className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
                  >
                    {submittingProgress ? 'Grading...' : 'Submit Quiz'}
                  </Button>
                  {isLocked && requiredStep && (
                    <span className="text-[10px] text-rose-500 font-medium">
                      Complete "{requiredStep.title}" first to submit quiz
                    </span>
                  )}
                </div>
              );
            }

            return (
              /* Non-quiz standard complete button */
              <div className="flex gap-2">
                {!progress[activeStep.id]?.completed ? (
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={isLocked || submittingProgress}
                      className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
                    >
                      {submittingProgress ? 'Saving...' : 'Complete & Next'}
                    </Button>
                    {isLocked && requiredStep && (
                      <span className="text-[10px] text-rose-500 font-medium">
                        Complete "{requiredStep.title}" first to unlock
                      </span>
                    )}
                  </div>
                ) : (
                  currentStepIdx < flatSteps.length - 1 && (
                    <Button
                      onClick={() => setActiveStep(flatSteps[currentStepIdx + 1])}
                      className="rounded-xl h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
                    >
                      Next →
                    </Button>
                  )
                )}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-40">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center text-center py-20">
          <GraduationCap className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-serif text-2xl font-bold mb-2 text-gray-900">Program Not Found</h2>
          <Link to="/dashboard" className="text-gold hover:underline">← Back to Dashboard</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isProfileComplete = profile && ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'].every(f => {
    const val = (profile as any)[f];
    return val && typeof val === 'string' && val.trim();
  });
  const isFellow = (profile?.membership_status === 'active' || profile?.membership_status === 'approved' || isProfileComplete) && profile?.membership_status !== 'suspended';
  
  // Calculate stats based on new syllabus steps
  const totalStepsCount = flatSteps.length;
  const completedStepsCount = flatSteps.filter(s => {
    const progRecord = progress[s.id];
    return progRecord?.completed && (s.content_type !== 'quiz' || progRecord?.passed);
  }).length;
  const overallProgressPercentage = enrollment?.progress_percentage || (totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0);

  const canonical = `https://academisthan.org/learn/${program.slug}`;
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.title,
    description: program.description || program.title,
provider: {
      '@type': 'Organization',
      name: 'Academisthan',
      sameAs: 'https://academisthan.org',
    },
    image: program.image_url || undefined,
    url: canonical,
  };

  if (isFullscreen && enrollment) {
    return (
      <div 
        id="lms-workspace-container"
        className="fixed inset-0 z-[100] flex bg-slate-950 text-slate-100 overflow-hidden font-sans"
      >
        <Helmet>
          <title>{program.title} | LMS Player</title>
        </Helmet>
        
        {/* Fullscreen left sidebar - dark narrow syllabus */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
            <button 
              onClick={toggleFullscreen} 
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
            
            <h2 className="font-serif text-sm font-bold text-white leading-tight mt-1">{program.title}</h2>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>Progress</span>
                <span>{overallProgressPercentage}%</span>
              </div>
              <div className="h-[3px] w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gold rounded-full transition-all duration-500" 
                  style={{ width: `${overallProgressPercentage}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {renderSyllabusList(true)}
          </div>
        </div>
        
        {/* Fullscreen right content area */}
        <div className="flex-grow bg-slate-50 flex flex-col h-full overflow-hidden text-slate-800">
          {/* Header */}
          <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
            <div className="flex items-center text-left">
              <span className="text-xs font-semibold text-slate-800">
                {activeStep ? `${activeStep.moduleTitle || 'Module'} / ${activeStep.title}` : 'Overview / Program Overview'}
              </span>
            </div>
            <button 
              onClick={toggleFullscreen} 
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto bg-slate-50 p-4 md:p-6">
            <div className="mx-auto w-full max-w-5xl">
              {renderPlayerContent(false)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (embedded) {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      );
    }

    if (!program) {
      return (
        <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">Program Not Found</h3>
          <p className="text-muted-foreground text-sm">The selected program could not be loaded.</p>
        </div>
      );
    }

    const isFellow = (profile?.membership_status === 'active' || profile?.membership_status === 'approved' || isProfileComplete) && profile?.membership_status !== 'suspended';
    const isAiEducators = program.slug === 'ai-for-educators' || program.title === 'AI for Educators';

    return (
      <div className="space-y-6 text-left">
        {/* Embedded Header with Back/Close button */}
        <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-200">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">LMS Workspace</span>
            <h2 className="font-serif text-xl font-bold text-navy mt-0.5">{program.title}</h2>
          </div>
          {onCloseLms && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseLms}
              className="rounded-xl border-gold/20 text-gold hover:bg-gold/10 hover:text-gold gap-1.5 h-8 text-xs font-semibold animate-pulse"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Dashboard
            </Button>
          )}
        </div>

        {enrollment && !isFellow && !isAiEducators ? (
          <div className="bg-white border border-gold/20 rounded-2xl p-8 text-center max-w-xl mx-auto my-6 shadow-md text-left">
            <Lock className="w-16 h-16 text-gold mx-auto mb-4 animate-pulse" />
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Fellowship Required</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Access to the program content of <strong>{program.title}</strong> is restricted to active Fellows.
              Please complete your profile and wait for administrator approval to activate your Fellow status.
            </p>
          </div>
        ) : (
          <>
            {/* Enrollment Trigger */}
            {!enrollment && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center mb-6 shadow-sm">
                <GraduationCap className="w-12 h-12 text-navy mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Enroll in This Program</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  {user ? 'Join this program and start learning. Complete all modules and pass quizzes to earn your certificate.' : 'Sign in as a registered teacher to enroll in this program.'}
                </p>
                <Button onClick={handleEnroll} disabled={enrolling} className="rounded-xl bg-navy hover:bg-navy/95 text-warm gap-2 px-8">
                  {enrolling ? 'Enrolling...' : user ? 'Enroll Now — Free' : 'Sign In to Enroll'}
                </Button>
              </div>
            )}

            {/* Certificate Download Banner */}
            {certificate && (
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/20 rounded-2xl p-5 md:p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-gray-900">Certificate Earned! 🎓</h4>
                    <p className="text-muted-foreground text-xs">Certificate #{certificate.certificate_number}</p>
                  </div>
                </div>
                <Button onClick={downloadCertificate} variant="outline" className="rounded-xl gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 shrink-0">
                  <Download className="w-4 h-4" /> Download Certificate
                </Button>
              </div>
            )}

            {/* LMS Main Learning Layout - Sidebar on Left, Content Player on Right */}
            {enrollment && (
              <div 
                id="lms-workspace-container"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left"
              >
                {/* Left Column: Module & Syllabus Steps Sidebar */}
                <div className="space-y-4 lg:col-span-1">
                  {/* Overall Progress Tracker Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="text-xs font-semibold text-slate-700 space-y-2 text-left">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Overall Progress</span>
                        <span className="text-gold font-bold text-xs">{overallProgressPercentage}%</span>
                      </div>
                      <div className="h-[3px] w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gold rounded-full transition-all duration-500" 
                          style={{ width: `${overallProgressPercentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Course Syllabus Steps List */}
                  {renderSyllabusList(false)}
                </div>

                {/* Right Column: Syllabus Content Player */}
                <div className="lg:col-span-2 space-y-4">
                  {renderPlayerContent(false)}
                </div>
              </div>
            )}

            {/* Syllabus Previews if user is not enrolled */}
            {!enrollment && modules.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm text-left">
                <div className="p-5 border-b border-gray-200 bg-slate-50">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Course Syllabus Preview</h3>
                  <p className="text-muted-foreground text-sm">{modules.length} modules, {totalStepsCount} steps in total</p>
                </div>
                <div className="divide-y divide-gray-200">
                  {modules.map((mod, mIdx) => {
                    const chapterName = mod.chapter || 'Overview';
                    const stepList = mod.steps || [];
                    const isExpanded = !!expandedChapters[chapterName];
                    
                    return (
                      <div key={mod.id} className="bg-white">
                        <button
                          onClick={() => {
                            setExpandedChapters(prev => ({
                              ...prev,
                              [chapterName]: !prev[chapterName]
                            }));
                          }}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div>
                             <h4 className="font-serif font-bold text-sm text-gray-900">{mod.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{stepList.length} syllabus steps</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="bg-slate-50/50 border-t divide-y divide-gray-100">
                            {stepList.map((step, sIdx) => (
                              <div key={step.id} className="px-6 py-3 flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                                  {sIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{step.title}</p>
                                  <p className="text-[8px] text-muted-foreground uppercase font-bold mt-0.5">{step.content_type}</p>
                                </div>
                                <Lock className="w-3 h-3 text-muted-foreground/45 shrink-0" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{program.title} | Academisthan LMS</title>
        <meta name="description" content={(program.description || program.title).slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(courseSchema)}</script>
      </Helmet>

      <Navbar />

      {/* ═══ Hero Header ═══ */}
      <div className="relative pt-20 pb-12 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10 pt-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">Program Workspace</span>
                {profile && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold">
                    🏆 Active Fellow
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-warm leading-tight">
                {program.title}
              </h1>
              <p className="text-warm/50 text-xs md:text-sm mt-1 max-w-3xl leading-relaxed">
                {program.description}
              </p>
            </div>
            <Link to="/dashboard" className="shrink-0 self-start md:self-end">
              <Button variant="outline" className="rounded-xl border-gold/30 text-gold hover:bg-gold/10 gap-1.5 h-9 text-xs">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="pb-16 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* ═══ LEFT COLUMN (Dashboard Sidebar) ═══ */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              <MembershipCard profile={profile} />

              {/* Profile completion / Strength */}
              {profile && (
                <div className="bg-card border border-border rounded-2xl p-5 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-gold" /> Profile Strength
                    </span>
                    <span className="font-bold text-sm text-gold">100%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(38,55%,58%)] to-[hsl(38,65%,68%)]"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Fellow Modules Navigation Card */}
              <div className="bg-card border border-border rounded-2xl p-5 text-left">
                <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold" /> Fellow Workspace
                </h3>
                <div className="space-y-1">
                  <Link
                    to="/dashboard?tool=institute"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      <span>My Institution</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/dashboard?tool=enroll-program"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-gold/10 text-gold font-semibold transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-gold" />
                      <span>Enroll Program</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gold translate-x-0.5" />
                  </Link>

                  <Link
                    to="/dashboard?tool=certification"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      <span>Teacher Certifications</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/dashboard?tool=blog"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      <span>Blog Publisher</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/dashboard?tool=saved-blogs"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      <span>Saved Blogs</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/dashboard?tool=connections"
                    className="sidebar-menu-btn w-full flex items-center justify-between p-2.5 rounded-xl text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
                      <span>Fellow Connections</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>

              {/* Explore Hub */}
              <div className="bg-card border border-border rounded-2xl p-5 text-left">
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
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors animate-none" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT COLUMN (LMS Workspace Area) ═══ */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Locked View if not Fellow */}
              {enrollment && !isFellow && !(program?.slug === 'ai-for-educators' || program?.title === 'AI for Educators') ? (
                <div className="bg-white border border-gold/20 rounded-2xl p-8 text-center max-w-xl mx-auto my-6 shadow-md text-left">
                  <Lock className="w-16 h-16 text-gold mx-auto mb-4 animate-pulse" />
                  <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Fellowship Required</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Access to the program content of <strong>{program.title}</strong> is restricted to active Fellows.
                    Please complete your profile and wait for administrator approval to activate your Fellow status.
                  </p>
                  <Link to="/dashboard">
                    <Button className="bg-navy hover:bg-navy/95 text-warm rounded-xl px-6 font-semibold">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Enrollment Trigger */}
                  {!enrollment && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center mb-6 shadow-sm">
                      <GraduationCap className="w-12 h-12 text-navy mx-auto mb-4" />
                      <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Enroll in This Program</h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                        {user ? 'Join this program and start learning. Complete all modules and pass quizzes to earn your certificate.' : 'Sign in as a registered teacher to enroll in this program.'}
                      </p>
                      <Button onClick={handleEnroll} disabled={enrolling} className="rounded-xl bg-navy hover:bg-navy/95 text-warm gap-2 px-8">
                        {enrolling ? 'Enrolling...' : user ? 'Enroll Now — Free' : 'Sign In to Enroll'}
                      </Button>
                    </div>
                  )}

                  {/* Certificate Download Banner */}
                  {certificate && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/20 rounded-2xl p-5 md:p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                          <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-gray-900">Certificate Earned! 🎓</h4>
                          <p className="text-muted-foreground text-xs">Certificate #{certificate.certificate_number}</p>
                        </div>
                      </div>
                      <Button onClick={downloadCertificate} variant="outline" className="rounded-xl gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 shrink-0">
                        <Download className="w-4 h-4" /> Download Certificate
                      </Button>
                    </div>
                  )}

                  {/* LMS Main Learning Layout - Sidebar on Left, Content Player on Right */}
                  {enrollment && (
                    <div 
                      id="lms-workspace-container"
                      className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left"
                    >
                      {/* Left Column: Module & Syllabus Steps Sidebar */}
                      <div className="space-y-4 lg:col-span-1">
                        {/* Overall Progress Tracker Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                          <div className="text-xs font-semibold text-slate-700 space-y-2 text-left">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>Overall Progress</span>
                              <span className="text-gold font-bold text-xs">{overallProgressPercentage}%</span>
                            </div>
                            <div className="h-[3px] w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gold rounded-full transition-all duration-500" 
                                style={{ width: `${overallProgressPercentage}%` }} 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Course Syllabus Steps List */}
                        {renderSyllabusList(false)}
                      </div>

                      {/* Right Column: Syllabus Content Player */}
                      <div className="lg:col-span-2 space-y-4">
                        {renderPlayerContent(false)}
                      </div>
                    </div>
                  )}

                  {/* Syllabus Previews if user is not enrolled */}
                  {!enrollment && modules.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm text-left">
                      <div className="p-5 border-b border-gray-200 bg-slate-50">
                        <h3 className="font-serif text-lg font-bold text-gray-900">Course Syllabus Preview</h3>
                        <p className="text-muted-foreground text-sm">{modules.length} modules, {totalStepsCount} steps in total</p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {modules.map((mod, mIdx) => {
                          const chapterName = mod.chapter || 'Overview';
                          const stepList = mod.steps || [];
                          const isExpanded = !!expandedChapters[chapterName];
                          
                          return (
                            <div key={mod.id} className="bg-white">
                              <button
                                onClick={() => {
                                  setExpandedChapters(prev => ({
                                    ...prev,
                                    [chapterName]: !prev[chapterName]
                                  }));
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                              >
                                <div>
                                   <h4 className="font-serif font-bold text-sm text-gray-900">{mod.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">{stepList.length} syllabus steps</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>

                              {isExpanded && (
                                <div className="bg-slate-50/50 border-t divide-y divide-gray-100">
                                  {stepList.map((step, sIdx) => (
                                    <div key={step.id} className="px-6 py-3 flex items-center gap-3">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                                        {sIdx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{step.title}</p>
                                        <p className="text-[8px] text-muted-foreground uppercase font-bold mt-0.5">{step.content_type}</p>
                                      </div>
                                      <Lock className="w-3 h-3 text-muted-foreground/45 shrink-0" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
