import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, ExternalLink, Search, ChevronDown, Clock,
  Sparkles, Pin, Landmark, Shield, FileText, Scale,
  GraduationCap, Building2, CheckCircle2, AlertCircle,
  Star, ArrowRight, Globe, Info, Award, MapPin, List,
  ChevronRight, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';

/* ─── Static Guidelines ─── */
const UGC_GUIDELINES = [
  {
    title: 'UGC Regulations on Conferment of Autonomous Status',
    body: 'Colleges accredited by NAAC with a minimum "A" grade (CGPA of 3.01 and above) are eligible for autonomous status. UGC provides guidelines for governance, curriculum design, and examination.',
    authority: 'UGC', status: 'Active',
    url: 'https://www.ugc.gov.in/page/autonomous-colleges.aspx', icon: Landmark,
  },
  {
    title: 'Graded Autonomy under UGC Regulations 2023',
    body: 'UGC introduced graded autonomy — Category I & II institutions get academic, administrative, and financial autonomy. NAAC-accredited colleges with valid scores can apply through a streamlined process.',
    authority: 'UGC', status: 'Active', url: 'https://www.ugc.gov.in', icon: Star,
  },
  {
    title: 'NAAC Accreditation Framework for Autonomous Colleges',
    body: 'NAAC evaluates autonomous colleges on 7 criteria including curricular aspects, teaching-learning, research, infrastructure, governance, and innovation. A minimum A grade is required to retain autonomous status.',
    authority: 'NAAC', status: 'Active', url: 'https://www.naac.gov.in', icon: Award,
  },
  {
    title: 'Academic Bank of Credits (ABC) for Autonomous Institutions',
    body: 'Autonomous colleges must register with ABC and ensure credit transferability. Students can accumulate credits across institutions, enabling flexible and multidisciplinary education under NEP 2020.',
    authority: 'UGC / NEP', status: 'Active', url: 'https://www.abc.gov.in', icon: GraduationCap,
  },
  {
    title: 'Curriculum Design Framework for Autonomous Colleges',
    body: 'Autonomous colleges have the freedom to design their own syllabus, introduce new courses, and adopt innovative pedagogies. They must however follow UGC-mandated credit frameworks and learning outcomes.',
    authority: 'UGC', status: 'Active', url: 'https://www.ugc.gov.in', icon: BookOpen,
  },
  {
    title: 'NEP 2020: Institutional Autonomy & Multidisciplinary Education',
    body: 'NEP 2020 envisions all higher education institutions becoming autonomous by 2035. It promotes multidisciplinary education, flexible curricula, and institutional governance reform for autonomous colleges.',
    authority: 'MoE / NEP', status: 'Policy', url: 'https://www.education.gov.in/nep', icon: Shield,
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-teal/15 text-teal border-teal/25',
  Policy: 'bg-gold/15 text-gold border-gold/25',
  Draft: 'bg-accent/15 text-accent border-accent/25',
};

const NAAC_COLORS: Record<string, string> = {
  'A++': 'bg-teal/15 text-teal border-teal/30',
  'A+': 'bg-primary/15 text-primary border-primary/30',
  'A': 'bg-gold/15 text-gold border-gold/30',
  'B++': 'bg-muted text-muted-foreground border-border',
  'B+': 'bg-muted text-muted-foreground border-border',
};

const PAGE_SIZE = 12;

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

type DirectoryCollege = {
  id: string;
  college_name: string;
  state: string;
  city: string | null;
  affiliated_university: string | null;
  naac_grade: string | null;
  autonomous_since: number | null;
  website: string | null;
  institution_type: string | null;
};

export default function AutonomousColleges() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<'directory' | 'guidelines' | 'news'>('directory');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  // Fetch news
  const { data: news, isLoading } = useQuery({
    queryKey: ['autonomous_news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .eq('category', 'autonomous')
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch directory
  const { data: colleges, isLoading: dirLoading } = useQuery({
    queryKey: ['autonomous_directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_colleges_directory' as any)
        .select('*')
        .eq('is_active', true)
        .order('state')
        .order('college_name');
      if (error) throw error;
      return (data as any as DirectoryCollege[]) ?? [];
    },
  });

  // Derive states and universities
  const states = useMemo(() => {
    if (!colleges) return [];
    const s = [...new Set(colleges.map(c => c.state))].sort();
    return s;
  }, [colleges]);

  const universities = useMemo(() => {
    if (!colleges) return [];
    let filtered = colleges;
    if (selectedState) filtered = filtered.filter(c => c.state === selectedState);
    const u = [...new Set(filtered.map(c => c.affiliated_university).filter(Boolean))].sort() as string[];
    return u;
  }, [colleges, selectedState]);

  // Filter directory
  const filteredColleges = useMemo(() => {
    if (!colleges) return [];
    let result = colleges;
    if (selectedState) result = result.filter(c => c.state === selectedState);
    if (selectedUniversity) result = result.filter(c => c.affiliated_university === selectedUniversity);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.college_name.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.affiliated_university || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [colleges, selectedState, selectedUniversity, searchQuery]);

  // Group by state then university
  const groupedByState = useMemo(() => {
    const map = new Map<string, Map<string, DirectoryCollege[]>>();
    for (const c of filteredColleges) {
      const uni = c.affiliated_university || 'Other';
      if (!map.has(c.state)) map.set(c.state, new Map());
      const uniMap = map.get(c.state)!;
      if (!uniMap.has(uni)) uniMap.set(uni, []);
      uniMap.get(uni)!.push(c);
    }
    return map;
  }, [filteredColleges]);

  const filtered = news?.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
  }) ?? [];

  const filteredGuidelines = UGC_GUIDELINES.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || g.body.toLowerCase().includes(q);
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Navbar />

      {/* ════ HERO ════ */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <img src={cinematicCampus} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-background" />
        <div className="container relative mx-auto px-4 pt-16 pb-8">
          <ScrollSection animation="fade-up">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-semibold">Directory • Guidelines • News</span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight">
                Autonomous <span className="text-gradient-gold">Colleges</span>
              </h1>
              <p className="text-warm/60 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
                Complete state-wise directory, UGC guidelines, NAAC frameworks, and the latest news —
                everything autonomous colleges need in one place.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 mt-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold font-mono">{colleges?.length ?? 0}</p>
                  <p className="text-warm/40 text-xs uppercase tracking-wider">Colleges</p>
                </div>
                <div className="w-px h-8 bg-warm/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary font-mono">{states.length}</p>
                  <p className="text-warm/40 text-xs uppercase tracking-wider">States</p>
                </div>
                <div className="w-px h-8 bg-warm/10" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent font-mono">{news?.length ?? 0}</p>
                  <p className="text-warm/40 text-xs uppercase tracking-wider">News</p>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ════ MAIN ════ */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Search + Tabs */}
          <div className="mb-10">
            <div className="relative max-w-lg mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search colleges, universities, states..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="pl-12 py-6 rounded-2xl text-base border-border bg-card"
              />
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              {([
                { key: 'directory' as const, label: '🏫 College Directory', count: filteredColleges.length },
                { key: 'guidelines' as const, label: '📋 Guidelines', count: filteredGuidelines.length },
                { key: 'news' as const, label: '📰 Latest News', count: filtered.length },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    activeTab === tab.key
                      ? 'bg-gold text-gold-foreground shadow-lg shadow-gold/20'
                      : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    'ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    activeTab === tab.key ? 'bg-gold-foreground/20' : 'bg-muted'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Directory Tab ── */}
          {activeTab === 'directory' && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-8">
                {/* State filter */}
                <div className="relative">
                  <select
                    value={selectedState || ''}
                    onChange={(e) => { setSelectedState(e.target.value || null); setSelectedUniversity(null); }}
                    className="appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-foreground cursor-pointer hover:border-gold/30 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="">All States ({states.length})</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* University filter */}
                {universities.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedUniversity || ''}
                      onChange={(e) => setSelectedUniversity(e.target.value || null)}
                      className="appearance-none bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-foreground cursor-pointer hover:border-gold/30 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/30 max-w-xs truncate"
                    >
                      <option value="">All Universities ({universities.length})</option>
                      {universities.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <GraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}

                {(selectedState || selectedUniversity) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setSelectedState(null); setSelectedUniversity(null); }}
                  >
                    Clear filters ✕
                  </Button>
                )}
              </div>

              {dirLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredColleges.length === 0 ? (
                <div className="text-center py-16">
                  <Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">No colleges found</h3>
                  <p className="text-muted-foreground">Try changing your search or filter criteria.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Array.from(groupedByState.entries()).map(([state, uniMap]) => (
                    <div key={state} className="rounded-2xl border border-border bg-card overflow-hidden">
                      {/* State Header */}
                      <div className="bg-gradient-to-r from-gold/10 via-transparent to-transparent px-6 py-4 border-b border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-foreground">{state}</h3>
                          <p className="text-xs text-muted-foreground">
                            {Array.from(uniMap.values()).flat().length} autonomous college{Array.from(uniMap.values()).flat().length > 1 ? 's' : ''} · {uniMap.size} universit{uniMap.size > 1 ? 'ies' : 'y'}
                          </p>
                        </div>
                      </div>

                      {/* Universities within state */}
                      <div className="divide-y divide-border">
                        {Array.from(uniMap.entries()).map(([uni, colls]) => (
                          <div key={uni} className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-bold text-foreground">{uni}</h4>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                                {colls.length}
                              </Badge>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {colls.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-gold/20 transition-colors group"
                                >
                                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <Building2 className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-serif text-sm font-bold text-foreground group-hover:text-gold transition-colors truncate">
                                        {c.college_name}
                                      </h5>
                                      {c.naac_grade && (
                                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 font-bold', NAAC_COLORS[c.naac_grade] || 'bg-muted text-muted-foreground')}>
                                          NAAC {c.naac_grade}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                      {c.city && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" /> {c.city}
                                        </span>
                                      )}
                                      {c.autonomous_since && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> Since {c.autonomous_since}
                                        </span>
                                      )}
                                      {c.website && (
                                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gold hover:underline">
                                          <Globe className="w-3 h-3" /> Website
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Showing <strong className="text-foreground">{filteredColleges.length}</strong> autonomous colleges across{' '}
                  <strong className="text-foreground">{groupedByState.size}</strong> states.
                  This directory is updated regularly from UGC and NAAC official sources.
                </p>
              </div>
            </div>
          )}

          {/* ── Guidelines Tab ── */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              {filteredGuidelines.map((g, i) => {
                const Icon = g.icon;
                return (
                  <a
                    key={i} href={g.url} target="_blank" rel="noopener noreferrer"
                    className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-[10px] px-2 py-0 font-semibold', STATUS_STYLES[g.status])}>
                            {g.status === 'Active' && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                            {g.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-muted text-muted-foreground">
                            {g.authority}
                          </Badge>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors">
                          {g.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{g.body}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-gold transition-colors shrink-0 mt-1" />
                    </div>
                  </a>
                );
              })}

              {filteredGuidelines.length === 0 && (
                <div className="text-center py-16">
                  <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">No guidelines match your search</p>
                </div>
              )}
            </div>
          )}

          {/* ── News Tab ── */}
          {activeTab === 'news' && (
            <>
              {isLoading && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16">
                  <Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">No autonomous college news yet</h3>
                  <p className="text-muted-foreground mb-4">News will be automatically aggregated from UGC, NAAC, and media sources.</p>
                  <Link to="/news">
                    <Button variant="outline" className="rounded-xl gap-2">
                      Browse All News <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}

              {visible.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visible.map((item) => {
                    const isAI = item.source_name?.includes('AI Curated');
                    return (
                      <a
                        key={item.id}
                        href={item.source_url || '#'}
                        target={item.source_url ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/20 h-full"
                      >
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-lg">🏫</span>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-primary/10 text-primary border-primary/20">
                            Autonomous
                          </Badge>
                          {isAI && (
                            <Badge className="text-[9px] bg-gold/10 text-gold border-gold/20 px-1.5 py-0 ml-auto">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-serif text-base font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-3 flex-1">
                          {item.summary}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-auto pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{relativeTime(item.published_at)}</span>
                          </div>
                          {item.source_name && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              {item.source_name}
                              {item.source_url && <ExternalLink className="w-3 h-3 text-gold/60 shrink-0" />}
                            </span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center mt-10">
                  <Button
                    variant="outline" size="lg"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-2xl gap-2 px-8"
                  >
                    <ChevronDown className="w-4 h-4" /> Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ════ INFO ════ */}
      <section className="py-10 border-t border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-2">About This Section</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  This section provides a comprehensive <strong>state-wise directory</strong> of autonomous colleges in India,
                  along with guidelines, regulations, and news. The directory is regularly updated from
                  <strong> UGC</strong>, <strong>NAAC</strong>, and <strong>AICTE</strong> official sources.
                  AI-curated summaries are provided for informational purposes — always refer to original sources for official versions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
