import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper, Pin, ExternalLink, ChevronDown, Search,
  Landmark, Briefcase, Megaphone, GraduationCap, CalendarDays,
  Clock, ArrowRight, FileText, Scale, Bell, Sparkles,
  Globe, BookOpen, TrendingUp, Tv, Shield, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';

/* ─── Categories ─── */
const CATEGORIES = [
  { key: 'all', label: 'All Updates', icon: Newspaper, emoji: '📰', desc: 'Everything in one feed' },
  { key: 'ugc_update', label: 'UGC / AICTE / NAAC', icon: Landmark, emoji: '🏛️', desc: 'Official circulars & orders' },
  { key: 'regulation', label: 'Policy & Rules', icon: Shield, emoji: '📋', desc: 'NEP, regulations, frameworks' },
  { key: 'gazette', label: 'Gazette', icon: FileText, emoji: '📜', desc: 'Government notifications' },
  { key: 'promotions', label: 'Promotions & CAS', icon: TrendingUp, emoji: '📈', desc: 'Career advancement & API scores' },
  { key: 'naac_update', label: 'NAAC Updates', icon: Star, emoji: '⭐', desc: 'Accreditation news' },
  { key: 'pay_commission', label: 'Pay & Salary', icon: Briefcase, emoji: '💰', desc: 'Pay commission & revisions' },
  { key: 'nep_update', label: 'NEP 2020', icon: BookOpen, emoji: '📚', desc: 'NEP implementation updates' },
  { key: 'research_update', label: 'PhD & Research', icon: GraduationCap, emoji: '🔬', desc: 'Research regulations & funding' },
  { key: 'announcement', label: 'Education News', icon: Megaphone, emoji: '📢', desc: 'Latest developments' },
  { key: 'media', label: 'In the Media', icon: Tv, emoji: '📺', desc: 'Press & media coverage' },
  { key: 'job_opening', label: 'Faculty Openings', icon: Briefcase, emoji: '💼', desc: 'Teaching positions' },
  { key: 'scholarship', label: 'Grants & Fellowships', icon: GraduationCap, emoji: '🎓', desc: 'Funding opportunities' },
  { key: 'event', label: 'Events & Webinars', icon: CalendarDays, emoji: '📅', desc: 'Upcoming programmes' },
] as const;

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  ugc_update: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', emoji: '🏛️' },
  regulation: { bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/30', emoji: '📋' },
  gazette: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20', emoji: '📜' },
  promotions: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', emoji: '📈' },
  naac_update: { bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/30', emoji: '⭐' },
  pay_commission: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20', emoji: '💰' },
  nep_update: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', emoji: '📚' },
  research_update: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', emoji: '🔬' },
  announcement: { bg: 'bg-secondary/40', text: 'text-secondary-foreground', border: 'border-secondary/50', emoji: '📢' },
  media: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', emoji: '📺' },
  job_opening: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', emoji: '💼' },
  event: { bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/30', emoji: '📅' },
  scholarship: { bg: 'bg-teal/10', text: 'text-teal', border: 'border-teal/20', emoji: '🎓' },
  autonomous: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', emoji: '🏫' },
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

function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.key === cat)?.label || cat;
}

export default function News() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: news, isLoading } = useQuery({
    queryKey: ['public_news_updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = news?.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.source_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  }) ?? [];

  const pinned = filtered.filter((item) => item.is_pinned);
  const regular = filtered.filter((item) => !item.is_pinned);
  const visible = regular.slice(0, visibleCount);
  const hasMore = visibleCount < regular.length;

  // Stats
  const totalCount = news?.length ?? 0;
  const todayCount = news?.filter(n => {
    const diff = Date.now() - new Date(n.published_at).getTime();
    return diff < 86400000;
  }).length ?? 0;
  const sourcesCount = new Set(news?.map(n => n.source_name)).size;

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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
                <Sparkles className="h-4 w-4 text-gold" />
                <span className="text-gold text-sm font-semibold">AI-Powered • Auto-Updated</span>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight">
                Education <span className="text-gradient-gold">Intelligence Hub</span>
              </h1>
              <p className="text-warm/60 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
                UGC circulars, gazette notifications, education policy, faculty jobs, grants,
                and media coverage — aggregated from official sources and curated by AI.
              </p>

              {/* Live stats */}
              <div className="flex items-center justify-center gap-6 mt-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gold font-mono">{totalCount}</p>
                  <p className="text-warm/80 text-xs uppercase tracking-wider font-semibold">Updates</p>
                </div>
                <div className="w-px h-8 bg-warm/20" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent font-mono">{todayCount}</p>
                  <p className="text-warm/80 text-xs uppercase tracking-wider font-semibold">Today</p>
                </div>
                <div className="w-px h-8 bg-warm/20" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal font-mono">{sourcesCount}</p>
                  <p className="text-warm/80 text-xs uppercase tracking-wider font-semibold">Sources</p>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ════ MAIN CONTENT ════ */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Search + Filters */}
          <div className="mb-10 space-y-6">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search news, circulars, regulations, jobs..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="pl-12 py-6 rounded-2xl text-base border-2 border-border bg-card placeholder:text-muted-foreground focus:border-gold shadow-sm"
              />
            </div>

            {/* Category Chips — single horizontal row on desktop, wrap on mobile */}
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.key;
                const count = cat.key === 'all'
                  ? news?.length ?? 0
                  : news?.filter(n => n.category === cat.key).length ?? 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setVisibleCount(PAGE_SIZE); }}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                      active
                        ? 'bg-gold text-gold-foreground shadow-md shadow-gold/20'
                        : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        'text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5',
                        active ? 'bg-gold-foreground/20 text-gold-foreground' : 'bg-muted-foreground/10 text-muted-foreground'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Autonomous Colleges Hub — dedicated page link */}
            <div className="flex justify-center">
              <Link
                to="/autonomous"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
              >
                🏫 Autonomous Colleges Hub <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-muted-foreground text-sm mb-6">
              Showing <span className="text-foreground font-semibold">{filtered.length}</span> updates
              {activeCategory !== 'all' && ` in ${categoryLabel(activeCategory)}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          )}

          {/* Loading */}
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

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <Newspaper className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">No updates found</h3>
              <p className="text-muted-foreground">Try a different category or search term</p>
            </div>
          )}

          {/* Pinned items */}
          {pinned.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Pin className="w-4 h-4 text-gold" />
                <span className="text-sm font-bold text-gold uppercase tracking-wider">Breaking & Pinned</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {pinned.map((item) => (
                  <PinnedNewsCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Regular news grid — 3 columns */}
          {visible.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-2xl gap-2 px-8"
              >
                <ChevronDown className="w-4 h-4" />
                Load More Updates
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ════ SOURCES INFO ════ */}
      <section className="py-10 border-t border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sources card */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold" /> Our Sources
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'UGC India', icon: '🏛️' },
                  { name: 'AICTE', icon: '🏗️' },
                  { name: 'NAAC', icon: '⭐' },
                  { name: 'eGazette India', icon: '📜' },
                  { name: 'Ministry of Education', icon: '🇮🇳' },
                  { name: 'Times of India', icon: '📰' },
                  { name: 'NDTV Education', icon: '📺' },
                  { name: 'The Hindu', icon: '📰' },
                  { name: 'India Today', icon: '📺' },
                  { name: 'University World News', icon: '🌍' },
                ].map(s => (
                  <div key={s.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{s.icon}</span> {s.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground mb-2">Sources & Disclaimer</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    News and updates are aggregated from official sources including <strong>UGC</strong>,
                    <strong> AICTE</strong>, <strong>eGazette of India</strong>,
                    <strong> Ministry of Education</strong>, and leading education media.
                    AI-curated summaries are provided for informational purposes.
                    For official versions, always refer to the original source linked with each update.
                    Academisthan is not affiliated with any government body.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Pinned News Card ─── */
function PinnedNewsCard({ item }: { item: any }) {
  const style = CATEGORY_STYLES[item.category];
  const isAI = item.source_name?.includes('AI Curated');
  return (
    <a
      href={item.source_url || '#'}
      target={item.source_url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group block rounded-2xl border-2 border-gold/30 bg-gold/5 p-6 transition-all hover:shadow-xl hover:shadow-gold/10 hover:-translate-y-1 hover:border-gold/50"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Pin className="w-3.5 h-3.5 text-gold" />
        <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Pinned</span>
        {isAI && (
          <Badge className="text-[9px] bg-gold/15 text-gold border-gold/25 px-1.5 py-0">
            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Curated
          </Badge>
        )}
        <Badge variant="outline" className={cn('text-[10px] px-2 py-0 font-semibold ml-auto', style?.bg, style?.text, style?.border)}>
          {style?.emoji} {categoryLabel(item.category)}
        </Badge>
      </div>
      <h3 className="font-serif text-lg font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
        {item.title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4">
        {item.summary}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{relativeTime(item.published_at)}</span>
        </div>
        {item.source_name && (
          <span className="flex items-center gap-1 text-gold/70">
            {item.source_name} <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </div>
    </a>
  );
}

/* ─── Regular News Card ─── */
function NewsCard({ item }: { item: any }) {
  const style = CATEGORY_STYLES[item.category];
  const isAI = item.source_name?.includes('AI Curated');
  return (
    <a
      href={item.source_url || '#'}
      target={item.source_url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-gold/20 h-full"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-lg">{style?.emoji || '📰'}</span>
        <Badge variant="outline" className={cn('text-[10px] px-2 py-0 font-semibold', style?.bg, style?.text, style?.border)}>
          {categoryLabel(item.category)}
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
}
