import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';
import {
  BookOpen, TrendingUp, Target, Award, Star, ChevronRight,
  BarChart3, Zap, Lightbulb, ArrowRight, Sparkles, CheckCircle2,
  Globe, FileText, Users, Clock, Flame, Trophy, GraduationCap,
  ArrowLeft, AlertCircle, Loader2, ExternalLink, Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/* ── Types ── */
type Recommendation = {
  title: string;
  description: string;
  estimatedImpact: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeframe: string;
  priority: number;
  category: string;
};

type Benchmarks = {
  hIndex: { current: number; nationalAvg: number; percentile: number };
  i10Index: { current: number; nationalAvg: number; percentile: number };
  citations: { current: number; nationalAvg: number; percentile: number };
};

type Analysis = {
  impactScore: number;
  tier: string;
  tierEmoji: string;
  summary: string;
  benchmarks: Benchmarks;
  recommendations: Recommendation[];
  quickWins: string[];
  motivationalMessage: string;
  ugcApiConnection: string;
};

type ProfileInput = {
  name: string;
  designation: string;
  department: string;
  institution: string;
  experienceYears: number;
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  totalPublications: number;
  researchAreas: string;
  careListPubs: number;
  scopusPubs: number;
  conferencePapers: number;
  booksChapters: number;
  hasGoogleScholar: boolean;
  hasOrcid: boolean;
  hasResearchGate: boolean;
};

const DESIGNATIONS = [
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Head of Department',
  'Dean',
  'Research Scholar',
  'Post-Doctoral Fellow',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-accent/15 text-accent border-accent/30',
  Medium: 'bg-gold/15 text-gold border-gold/30',
  Hard: 'bg-destructive/15 text-destructive border-destructive/30',
};

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'Publication Strategy': FileText,
  'Citation Growth': TrendingUp,
  'Visibility': Globe,
  'Collaboration': Users,
  'UGC-API Connection': Shield,
};

const TIER_COLORS: Record<string, string> = {
  'Emerging Researcher': 'from-muted to-muted/50 border-border text-foreground',
  'Active Researcher': 'from-accent/20 to-accent/5 border-accent/30 text-accent',
  'Impactful Scholar': 'from-gold/20 to-gold/5 border-gold/30 text-gold',
  'Distinguished Researcher': 'from-primary/20 to-primary/5 border-primary/30 text-primary',
};

/* ── Metric Bar Component ── */
function MetricBar({ label, current, avg, percentile }: { label: string; current: number; avg: number; percentile: number }) {
  const ratio = avg > 0 ? Math.min((current / (avg * 2)) * 100, 100) : 0;
  const isAbove = current >= avg;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{label}</p>
          <p className="font-serif text-3xl font-bold text-foreground mt-1">{current}</p>
        </div>
        <div className="text-right">
          <Badge className={cn('text-[10px] border', isAbove ? 'bg-accent/15 text-accent border-accent/30' : 'bg-gold/15 text-gold border-gold/30')}>
            {isAbove ? '↑ Above Avg' : '↓ Below Avg'}
          </Badge>
          <p className="text-muted-foreground text-[10px] mt-1">Top {100 - percentile}% nationally</p>
        </div>
      </div>
      <Progress value={ratio} className="h-2 mb-2" />
      <p className="text-muted-foreground text-[11px]">
        National average for your designation: <strong className="text-foreground">{avg}</strong>
      </p>
    </div>
  );
}

/* ── Main Page ── */
export default function ScholarImpact({ embedded }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { saveResult } = useToolResultSaver();
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [profile, setProfile] = useState<ProfileInput>({
    name: '',
    designation: 'Assistant Professor',
    department: '',
    institution: '',
    experienceYears: 0,
    hIndex: 0,
    i10Index: 0,
    totalCitations: 0,
    totalPublications: 0,
    researchAreas: '',
    careListPubs: 0,
    scopusPubs: 0,
    conferencePapers: 0,
    booksChapters: 0,
    hasGoogleScholar: false,
    hasOrcid: false,
    hasResearchGate: false,
  });

  const updateProfile = (key: keyof ProfileInput, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!profile.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setStep('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('scholar-impact', {
        body: { profile },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        setStep('results');
        saveResult({
          toolType: 'scholar_impact',
          toolName: 'Scholar Impact Analyzer',
          inputData: profile as unknown as Record<string, unknown>,
          resultData: data.analysis as unknown as Record<string, unknown>,
          score: data.analysis.impactScore,
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      toast({
        title: 'Analysis failed',
        description: err?.message || 'Please try again later',
        variant: 'destructive',
      });
      setStep('input');
    }
  };

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}

      {/* ── Hero ── */}
      <section className={cn("relative overflow-hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background")}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-[20%] w-96 h-96 bg-gold/6 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 right-[10%] w-72 h-72 bg-accent/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {!embedded && (
              <Link to="/resources" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Resources
              </Link>
            )}
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold tracking-wide">AI-Powered Analysis</span>
            </div>
            <h1 className={cn("font-serif font-bold mb-2 leading-tight", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
              Scholar Impact <span className="text-gradient-gold">Analyzer</span>
            </h1>
            <p className={cn("mx-auto leading-relaxed", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg max-w-2xl text-warm/55")}>
              Get AI-powered insights on your Google Scholar metrics with personalized recommendations 
              to dramatically improve your research impact, h-index, and academic visibility.
            </p>
          </div>
        </div>
      </section>

      {/* ── Input Form ── */}
      {step === 'input' && (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <ScrollSection>
              {/* Basic Info */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Academic Profile</h2>
                    <p className="text-muted-foreground text-xs">Tell us about yourself</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Name *</label>
                    <Input
                      value={profile.name}
                      onChange={e => updateProfile('name', e.target.value.slice(0, 100))}
                      placeholder="Dr. John Doe"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Designation</label>
                    <select
                      value={profile.designation}
                      onChange={e => updateProfile('designation', e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                    >
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Department</label>
                    <Input
                      value={profile.department}
                      onChange={e => updateProfile('department', e.target.value.slice(0, 100))}
                      placeholder="Computer Science"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Institution</label>
                    <Input
                      value={profile.institution}
                      onChange={e => updateProfile('institution', e.target.value.slice(0, 150))}
                      placeholder="University of Mumbai"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Years of Experience</label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={profile.experienceYears || ''}
                      onChange={e => updateProfile('experienceYears', Math.min(50, parseInt(e.target.value) || 0))}
                      placeholder="10"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Research Areas</label>
                    <Input
                      value={profile.researchAreas}
                      onChange={e => updateProfile('researchAreas', e.target.value.slice(0, 200))}
                      placeholder="Machine Learning, NLP, Data Science"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Scholar Metrics */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Google Scholar Metrics</h2>
                    <p className="text-muted-foreground text-xs">
                      Find these on your{' '}
                      <a href="https://scholar.google.com/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                        Google Scholar Profile <ExternalLink className="inline h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">h-index</label>
                    <Input
                      type="number"
                      min={0}
                      max={200}
                      value={profile.hIndex || ''}
                      onChange={e => updateProfile('hIndex', Math.min(200, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="rounded-xl text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">i10-index</label>
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      value={profile.i10Index || ''}
                      onChange={e => updateProfile('i10Index', Math.min(500, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="rounded-xl text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Total Citations</label>
                    <Input
                      type="number"
                      min={0}
                      max={100000}
                      value={profile.totalCitations || ''}
                      onChange={e => updateProfile('totalCitations', Math.min(100000, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="rounded-xl text-center text-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Total Publications</label>
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      value={profile.totalPublications || ''}
                      onChange={e => updateProfile('totalPublications', Math.min(1000, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="rounded-xl text-center text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 bg-gold/5 border border-gold/15 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    <strong className="text-foreground/80">Don't have a Google Scholar profile?</strong> No worries — enter 0 for all metrics. 
                    Our AI will include creating your profile as a top recommendation.
                  </p>
                </div>
              </div>

              {/* Publication Details */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-teal" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Publication Breakdown</h2>
                    <p className="text-muted-foreground text-xs">Helps us give more precise recommendations</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">UGC-CARE List</label>
                    <Input
                      type="number" min={0} max={500}
                      value={profile.careListPubs || ''}
                      onChange={e => updateProfile('careListPubs', Math.min(500, parseInt(e.target.value) || 0))}
                      placeholder="0" className="rounded-xl text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Scopus Indexed</label>
                    <Input
                      type="number" min={0} max={500}
                      value={profile.scopusPubs || ''}
                      onChange={e => updateProfile('scopusPubs', Math.min(500, parseInt(e.target.value) || 0))}
                      placeholder="0" className="rounded-xl text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Conference Papers</label>
                    <Input
                      type="number" min={0} max={500}
                      value={profile.conferencePapers || ''}
                      onChange={e => updateProfile('conferencePapers', Math.min(500, parseInt(e.target.value) || 0))}
                      placeholder="0" className="rounded-xl text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Books/Chapters</label>
                    <Input
                      type="number" min={0} max={100}
                      value={profile.booksChapters || ''}
                      onChange={e => updateProfile('booksChapters', Math.min(100, parseInt(e.target.value) || 0))}
                      placeholder="0" className="rounded-xl text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Online Presence */}
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-foreground">Online Presence</h2>
                    <p className="text-muted-foreground text-xs">Check all that apply</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'hasGoogleScholar' as const, label: 'Google Scholar Profile', icon: '🎓' },
                    { key: 'hasOrcid' as const, label: 'ORCID ID', icon: '🔗' },
                    { key: 'hasResearchGate' as const, label: 'ResearchGate', icon: '🔬' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => updateProfile(item.key, !profile[item.key])}
                      className={cn(
                        'px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2',
                        profile[item.key]
                          ? 'bg-gold/15 border-gold/30 text-foreground'
                          : 'bg-card border-border text-muted-foreground hover:border-gold/20'
                      )}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                      {profile[item.key] && <CheckCircle2 className="h-4 w-4 text-gold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  className="bg-gold text-gold-foreground hover:bg-gold/90 text-lg px-12 py-6 rounded-xl font-semibold shadow-[0_0_30px_hsl(38_55%_58%/0.3)] gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze My Research Impact
                </Button>
                <p className="text-muted-foreground text-xs mt-3">Powered by AI · Takes ~10 seconds · Free</p>
              </div>
            </ScrollSection>
          </div>
        </section>
      )}

      {/* ── Analyzing State ── */}
      {step === 'analyzing' && (
        <section className="py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="h-10 w-10 text-gold animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-3">Analyzing Your Research Impact...</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our AI is benchmarking your metrics against national averages and crafting personalized recommendations.
            </p>
            <div className="flex justify-center gap-2 mt-8">
              {['Benchmarking', 'Analyzing gaps', 'Building roadmap'].map((t, i) => (
                <Badge key={t} variant="outline" className="animate-pulse text-muted-foreground" style={{ animationDelay: `${i * 0.5}s` }}>
                  {t}...
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Results ── */}
      {step === 'results' && analysis && (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">

            {/* Impact Score + Tier */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Score Ring */}
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold mb-4">Research Impact Score</p>
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                    <circle
                      cx="60" cy="60" r="52"
                      stroke="hsl(var(--gold))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(analysis.impactScore / 100) * 327} 327`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-serif text-4xl font-bold text-foreground">{analysis.impactScore}</span>
                    <span className="text-muted-foreground text-xs">/100</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{analysis.summary}</p>
              </div>

              {/* Tier Card */}
              <div className={cn(
                'rounded-2xl p-8 border bg-gradient-to-br flex flex-col justify-center items-center text-center',
                TIER_COLORS[analysis.tier] || TIER_COLORS['Emerging Researcher']
              )}>
                <span className="text-5xl mb-4">{analysis.tierEmoji}</span>
                <h3 className="font-serif text-2xl font-bold mb-2">{analysis.tier}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">{analysis.motivationalMessage}</p>
              </div>
            </div>

            {/* Benchmark Metrics */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <MetricBar label="h-index" current={analysis.benchmarks.hIndex.current} avg={analysis.benchmarks.hIndex.nationalAvg} percentile={analysis.benchmarks.hIndex.percentile} />
              <MetricBar label="i10-index" current={analysis.benchmarks.i10Index.current} avg={analysis.benchmarks.i10Index.nationalAvg} percentile={analysis.benchmarks.i10Index.percentile} />
              <MetricBar label="Total Citations" current={analysis.benchmarks.citations.current} avg={analysis.benchmarks.citations.nationalAvg} percentile={analysis.benchmarks.citations.percentile} />
            </div>

            {/* UGC-API Connection */}
            <div className="bg-gold/5 border border-gold/20 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">UGC API Score & CAS Promotion Connection</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{analysis.ugcApiConnection}</p>
                  <Link to="/tools/api-score" className="inline-flex items-center gap-1 text-gold text-sm font-semibold mt-3 hover:underline">
                    Calculate Your API Score <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-accent" />
                <h3 className="font-serif text-lg font-bold text-foreground">⚡ Quick Wins — Start Today</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {analysis.quickWins.map((win, i) => (
                  <div key={i} className="flex items-start gap-2 bg-card border border-border rounded-xl p-3">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm">{win}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Recommendations */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Target className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground">Growth Roadmap</h2>
                  <p className="text-muted-foreground text-xs">Personalized recommendations sorted by impact · Each shows estimated improvement</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, i) => {
                    const CatIcon = CATEGORY_ICONS[rec.category] || Lightbulb;
                    return (
                      <div key={i} className="bg-card border border-border rounded-2xl p-5 hover:border-gold/20 transition-all group">
                        <div className="flex items-start gap-4">
                          {/* Priority number */}
                          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                            <span className="font-serif text-lg font-bold text-gold">#{i + 1}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border gap-1">
                                <CatIcon className="h-3 w-3" />
                                {rec.category}
                              </Badge>
                              <Badge className={cn('text-[10px] px-2 py-0.5 border', DIFFICULTY_COLORS[rec.difficulty] || '')}>
                                {rec.difficulty}
                              </Badge>
                              <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {rec.timeframe}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-serif text-base font-bold text-foreground mb-1">{rec.title}</h3>

                            {/* Description */}
                            <p className="text-muted-foreground text-sm leading-relaxed mb-3">{rec.description}</p>

                            {/* Estimated Impact */}
                            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5">
                              <TrendingUp className="h-4 w-4 text-accent" />
                              <span className="text-accent text-sm font-semibold">Estimated Impact: {rec.estimatedImpact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Re-analyze + CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 pb-8">
              <Button
                variant="outline"
                onClick={() => { setStep('input'); setAnalysis(null); }}
                className="rounded-xl gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Modify & Re-Analyze
              </Button>
              <Link to="/tools/api-score">
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2">
                  Calculate API Score <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/tools/academic-cv">
                <Button variant="outline" className="rounded-xl gap-2">
                  Generate Academic CV <FileText className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  <strong className="text-foreground/70">Disclaimer:</strong> This analysis uses AI-generated benchmarks and recommendations for educational guidance only. 
                  Actual national averages may vary by discipline and institution type. Impact estimates are approximate. 
                  Always verify metrics from your official Google Scholar profile.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {!embedded && <Footer />}
    </div>
  );
}
