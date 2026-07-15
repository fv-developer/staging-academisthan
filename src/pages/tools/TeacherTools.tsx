import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  Calculator, TrendingUp, Award, FileText, BookOpen, Microscope,
  Clock, ArrowRight, Sparkles, BarChart3, ChevronRight, History,
  ArrowUpRight, ArrowDownRight, Minus, Star, Shield, Search, ClipboardCheck, FileCheck2,
} from 'lucide-react';

const tools = [
  {
    id: 'api-score',
    name: 'UGC Academic & Research Score',
    description: 'Calculate Teaching + Research Score under current UGC Regulations 2018 (Tables 2 & 3A). Replaces the legacy 2010 API.',
    icon: Calculator,
    href: '/tools/api-score',
    color: 'from-blue-500/20 to-blue-600/20',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    toolType: 'api_score',
  },
  {
    id: 'promotion-check',
    name: 'CAS Promotion Checker (2018)',
    description: 'Check eligibility for CAS promotion across UGC Academic Levels 10 → 14.',
    icon: Award,
    href: '/tools/promotion-check',
    color: 'from-amber-500/20 to-amber-600/20',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    toolType: 'promotion_check',
  },
  {
    id: 'research-score',
    name: 'Research Score Calculator',
    description: 'Standalone UGC Table 3A research-score calculator with weighted journal tiers.',
    icon: Microscope,
    href: '/tools/research-score',
    color: 'from-emerald-500/20 to-emerald-600/20',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    toolType: 'research_score',
  },
  {
    id: 'journal-checker',
    name: 'Journal Quality Checker',
    description: 'Check if a journal is UGC-CARE / Scopus / WoS listed and get a predatory-risk flag.',
    icon: Search,
    href: '/tools/journal-checker',
    color: 'from-cyan-500/20 to-cyan-600/20',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    toolType: 'journal_check',
    featured: true,
  },
  {
    id: 'naac-self-assessment',
    name: 'NAAC Self-Assessment',
    description: 'Indicative score for NAAC Criterion 3 (Research, Innovation & Extension) — for IQAC prep.',
    icon: ClipboardCheck,
    href: '/tools/naac-self-assessment',
    color: 'from-teal-500/20 to-teal-600/20',
    borderColor: 'border-teal-500/30',
    iconColor: 'text-teal-400',
    toolType: 'naac_criterion_3',
  },
  {
    id: 'pbas-form',
    name: 'PBAS Form Auto-Filler',
    description: 'Generate a pre-filled PBAS draft using your saved tool results — ready to review and sign.',
    icon: FileCheck2,
    href: '/tools/pbas-form',
    color: 'from-orange-500/20 to-orange-600/20',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400',
    toolType: 'pbas_draft',
  },
  {
    id: 'plagiarism-disclosure',
    name: 'Plagiarism & AI Disclosure',
    description: 'Generate a UGC 2018 compliant similarity + Generative-AI disclosure statement (PDF).',
    icon: Shield,
    href: '/tools/plagiarism-disclosure',
    color: 'from-red-500/20 to-red-600/20',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    toolType: 'plagiarism_disclosure',
  },
  {
    id: 'notable-contributions',
    name: 'Notable Contributions',
    description: 'Document and evaluate your notable academic contributions.',
    icon: Star,
    href: '/tools/notable-contributions',
    color: 'from-purple-500/20 to-purple-600/20',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    toolType: 'notable_contributions',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV Generator',
    description: 'Generate a professional CV from your profile — export as PDF or DOCX.',
    icon: FileText,
    href: '/tools/academic-cv',
    color: 'from-rose-500/20 to-rose-600/20',
    borderColor: 'border-rose-500/30',
    iconColor: 'text-rose-400',
    toolType: 'academic_cv',
  },
  {
    id: 'scholar-impact',
    name: 'Scholar Impact Analyzer',
    description: 'AI-powered analysis of your research impact with growth recommendations.',
    icon: Sparkles,
    href: '/tools/scholar-impact',
    color: 'from-gold/20 to-yellow-600/20',
    borderColor: 'border-gold/30',
    iconColor: 'text-gold',
    toolType: 'scholar_impact',
    featured: true,
  },
];

type ToolResult = {
  id: string;
  tool_type: string;
  tool_name: string;
  score: number | null;
  result_data: Record<string, unknown>;
  created_at: string;
};

export default function TeacherTools() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tool_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory((data as ToolResult[]) || []);
    setLoading(false);
  };

  // Group history by tool type for progress tracking
  const getToolHistory = (toolType: string) =>
    history.filter((h) => h.tool_type === toolType);

  const getLatestScore = (toolType: string) => {
    const results = getToolHistory(toolType);
    return results.length > 0 ? results[0] : null;
  };

  const getScoreTrend = (toolType: string) => {
    const results = getToolHistory(toolType);
    if (results.length < 2) return null;
    const latest = results[0].score ?? 0;
    const previous = results[1].score ?? 0;
    return latest - previous;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-navy" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(var(--gold) / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, hsl(var(--teal) / 0.2) 0%, transparent 50%)',
        }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-gold/10 text-gold border-gold/20">
              <Shield className="h-3 w-3 mr-1" /> Teacher Productivity Suite
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-warm mb-4">
              Teacher Tools
            </h1>
            <p className="text-warm/60 text-lg max-w-2xl mx-auto">
              Powerful calculators, analyzers, and generators designed exclusively for Indian educators.
              Track your progress over time and get AI-powered recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => {
              const latest = user ? getLatestScore(tool.toolType) : null;
              const trend = user ? getScoreTrend(tool.toolType) : null;
              const count = user ? getToolHistory(tool.toolType).length : 0;

              return (
                <Link
                  key={tool.id}
                  to={tool.href}
                  className={cn(
                    'group relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                    'bg-gradient-to-br',
                    tool.color,
                    tool.borderColor,
                    tool.featured && 'ring-2 ring-gold/30 md:col-span-2 lg:col-span-1'
                  )}
                >
                  {tool.featured && (
                    <Badge className="absolute top-3 right-3 bg-gold/20 text-gold border-gold/30 text-xs">
                      AI Powered
                    </Badge>
                  )}

                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', tool.color.replace('/20', '/30'))}>
                    <tool.icon className={cn('h-6 w-6', tool.iconColor)} />
                  </div>

                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Score & History (if signed in) */}
                  {user && latest && (
                    <div className="border-t border-border/50 pt-3 mt-auto space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Latest Score</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{latest.score ?? '—'}</span>
                          {trend !== null && (
                            <span className={cn('flex items-center text-xs font-medium',
                              trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'
                            )}>
                              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {Math.abs(trend).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{count} calculation{count !== 1 ? 's' : ''}</span>
                        <span>{formatDate(latest.created_at)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gold/70 group-hover:text-gold mt-3 transition-colors">
                    Open Tool <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* History Section (signed-in only) */}
      {user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
                  <History className="h-6 w-6 text-gold" /> Your Progress History
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Track how your scores have evolved over time
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No History Yet</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  Use any of the tools above and your results will be saved here automatically so you can track your progress.
                </p>
                <Link to="/tools/api-score">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                    Start with API Score Calculator <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 20).map((result) => {
                  const tool = tools.find((t) => t.toolType === result.tool_type);
                  const Icon = tool?.icon || BookOpen;
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tool?.color || 'bg-muted')}>
                        <Icon className={cn('h-5 w-5', tool?.iconColor || 'text-muted-foreground')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{result.tool_name}</p>
                        <p className="text-muted-foreground text-xs">{formatDate(result.created_at)}</p>
                      </div>
                      {result.score !== null && (
                        <div className="text-right">
                          <p className="font-bold text-foreground">{result.score}</p>
                          <p className="text-muted-foreground text-xs">Score</p>
                        </div>
                      )}
                      <Link to={tool?.href || '/tools'}>
                        <Button variant="ghost" size="sm" className="text-gold hover:text-gold hover:bg-gold/10">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA for non-signed-in */}
      {!user && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-lg mx-auto rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-8">
              <TrendingUp className="h-10 w-10 text-gold mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Track Your Progress</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Sign in to save your calculator results, track improvements over time, and get personalized AI recommendations.
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/auth/signin">
                  <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">Sign In</Button>
                </Link>
                <Link to="/auth/signup">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90">Become a Fellow</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
