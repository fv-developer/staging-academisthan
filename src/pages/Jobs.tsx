import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { supabase } from '@/lib/api-client';
import {
  Briefcase, Search, ExternalLink, MapPin, Clock, Building2,
  GraduationCap, FlaskConical, FileText, TrendingUp, Filter,
  ChevronDown, IndianRupee, Award, Sparkles, Globe, CalendarClock,
  AlertTriangle, Users, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Types & Constants ── */
type SubCategory = 'all' | 'faculty' | 'research' | 'grant' | 'fellowship' | 'cfp' | 'admin';

const SUB_CATEGORIES: { key: SubCategory; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'All Opportunities', icon: Sparkles, color: 'bg-gold/15 text-gold' },
  { key: 'faculty', label: 'Faculty Positions', icon: Building2, color: 'bg-primary/15 text-primary' },
  { key: 'research', label: 'Research Posts', icon: FlaskConical, color: 'bg-accent/15 text-accent' },
  { key: 'grant', label: 'Grants & Funding', icon: IndianRupee, color: 'bg-gold/15 text-gold' },
  { key: 'fellowship', label: 'Fellowships', icon: Award, color: 'bg-teal/15 text-teal' },
  { key: 'cfp', label: 'Call for Papers', icon: BookOpen, color: 'bg-secondary/30 text-secondary-foreground' },
  { key: 'admin', label: 'Administrative', icon: Users, color: 'bg-muted text-muted-foreground' },
];

function getCategoryInfo(sub: string | null) {
  return SUB_CATEGORIES.find(s => s.key === sub) || SUB_CATEGORIES[1];
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function deadlineStatus(lastDate: string | null): { label: string; color: string; urgent: boolean } | null {
  if (!lastDate) return null;
  const diff = new Date(lastDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: 'Expired', color: 'bg-destructive/15 text-destructive border-destructive/30', urgent: false };
  if (days === 0) return { label: 'Last day!', color: 'bg-destructive/15 text-destructive border-destructive/30', urgent: true };
  if (days <= 3) return { label: `${days}d left`, color: 'bg-destructive/15 text-destructive border-destructive/30', urgent: true };
  if (days <= 7) return { label: `${days}d left`, color: 'bg-gold/15 text-gold border-gold/30', urgent: false };
  if (days <= 30) return { label: `${days}d left`, color: 'bg-accent/15 text-accent border-accent/30', urgent: false };
  return { label: new Date(lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), color: 'bg-muted text-muted-foreground border-border', urgent: false };
}

const PAGE_SIZE = 12;

export default function Jobs() {
  const [activeType, setActiveType] = useState<SubCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { ref: heroRef } = useScrollAnimation();

  const { data: allJobs, isLoading } = useQuery({
    queryKey: ['jobs-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .in('category', ['jobs', 'grant', 'fellowship'])
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Group by sub-category for stats
  const stats = useMemo(() => {
    if (!allJobs) return {};
    const counts: Record<string, number> = {};
    allJobs.forEach(j => {
      const sub = j.job_sub_category || 'faculty';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [allJobs]);

  const filtered = useMemo(() => {
    return (allJobs || []).filter(job => {
      const sub = job.job_sub_category || 'faculty';
      const matchesType = activeType === 'all' || sub === activeType;
      const matchesSearch = !searchQuery ||
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allJobs, activeType, searchQuery]);

  // Group filtered by organization
  const groupedByOrg = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach(job => {
      const org = job.organization || 'Other';
      if (!map.has(org)) map.set(org, []);
      map.get(org)!.push(job);
    });
    return map;
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* ── Cinematic Hero ── */}
      <section className="relative pt-28 pb-20 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-[10%] w-80 h-80 bg-gold/8 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-[15%] w-64 h-64 bg-accent/6 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-gold/5 rounded-full blur-[80px]" />
        </div>

        <div ref={heroRef} className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <Briefcase className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold tracking-wide">Smart Career Hub</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-5 leading-tight">
              Jobs, Grants &<br />
              <span className="text-gradient-gold">Opportunities</span>
            </h1>
            <p className="text-warm/55 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-curated faculty positions, research grants, fellowships, and call for papers
              from UGC, CSIR, DST, ICSSR and universities — refreshed daily with smart deadline tracking.
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search positions, institutions, locations..."
                className="h-14 pl-12 pr-6 rounded-2xl bg-card border-2 border-border text-foreground placeholder:text-muted-foreground text-base focus:border-gold focus:bg-card shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {SUB_CATEGORIES.filter(s => s.key !== 'all').map(cat => (
              <button
                key={cat.key}
                onClick={() => { setActiveType(cat.key); setPage(1); }}
                className={cn(
                  'rounded-xl p-3 text-center transition-all border',
                  activeType === cat.key
                    ? 'bg-gold/10 border-gold/30 shadow-sm'
                    : 'bg-card border-border hover:border-gold/20'
                )}
              >
                <cat.icon className={cn('h-5 w-5 mx-auto mb-1', activeType === cat.key ? 'text-gold' : 'text-muted-foreground')} />
                <div className="text-2xl font-bold text-foreground">{stats[cat.key] || 0}</div>
                <div className="text-[10px] text-muted-foreground font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter + Grid ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Type filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide">
            {SUB_CATEGORIES.map(type => {
              const Icon = type.icon;
              const isActive = activeType === type.key;
              return (
                <button
                  key={type.key}
                  onClick={() => { setActiveType(type.key); setPage(1); }}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border',
                    isActive
                      ? 'bg-gold text-gold-foreground border-gold shadow-lg shadow-gold/20'
                      : 'bg-card text-muted-foreground border-border hover:border-gold/30 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                  {type.key !== 'all' && stats[type.key] ? (
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-md', isActive ? 'bg-white/20' : 'bg-muted')}>
                      {stats[type.key]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-bold">{filtered.length}</span> opportunities found
              {groupedByOrg.size > 0 && (
                <span className="text-muted-foreground"> across <span className="font-semibold text-foreground">{groupedByOrg.size}</span> organizations</span>
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Refreshed daily · Expired listings auto-removed
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">No opportunities found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchQuery ? 'Try different keywords or clear the search filter.' : 'New opportunities are scraped daily. Check back soon!'}
              </p>
            </div>
          )}

          {/* Job Cards Grid */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-9 h-9 rounded-xl text-sm font-medium transition-all',
                        page === pageNum
                          ? 'bg-gold text-gold-foreground shadow-md'
                          : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-16 bg-gradient-to-br from-[hsl(228,45%,12%)] to-[hsl(228,45%,16%)]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-6">
              <Globe className="h-8 w-8 text-gold" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm mb-4">
              Never Miss an <span className="text-gradient-gold">Opportunity</span>
            </h2>
            <p className="text-warm/50 text-lg mb-8">
              Join Academisthan as a Fellow to get personalized job alerts, application tracking,
              and priority access to exclusive academic opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-8 rounded-xl text-base font-semibold shadow-lg">
                <a href="/auth/signup">Become a Fellow</a>
              </Button>
              <Button asChild className="h-12 px-8 rounded-xl text-base bg-warm/10 border border-warm/30 text-warm hover:bg-warm/20 hover:border-gold hover:text-gold backdrop-blur-sm">
                <a href="/programs">Explore Programs</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal */}
      <section className="py-6 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            <strong>Disclaimer:</strong> Job listings and grant information are AI-aggregated from publicly available sources.
            Expired listings are automatically removed. Always verify details with the official source before applying.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Job Card Component ── */
function JobCard({ job }: { job: any }) {
  const catInfo = getCategoryInfo(job.job_sub_category);
  const Icon = catInfo.icon;
  const deadline = deadlineStatus(job.last_date);

  return (
    <a
      href={job.source_url || '#'}
      target={job.source_url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={cn(
        'group block bg-card border rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1',
        job.is_pinned
          ? 'border-gold/30 shadow-gold/5 shadow-md'
          : deadline?.urgent
            ? 'border-destructive/20 hover:border-destructive/40'
            : 'border-border hover:border-gold/20'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', catInfo.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {job.is_pinned && (
            <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px] font-bold">
              ⭐ Featured
            </Badge>
          )}
          {deadline && (
            <Badge variant="outline" className={cn('text-[10px] font-bold', deadline.color)}>
              {deadline.urgent && <AlertTriangle className="w-3 h-3 mr-0.5" />}
              {deadline.label}
            </Badge>
          )}
        </div>
      </div>

      <h3 className="font-serif text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
        {job.title}
      </h3>

      {/* Organization & Location */}
      {(job.organization || job.location) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 text-[11px] text-muted-foreground">
          {job.organization && (
            <span className="flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              {job.organization}
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {job.location}
            </span>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3">
        {job.summary}
      </p>

      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border">
          {catInfo.label}
        </Badge>
        {job.source_name && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border">
            {job.source_name}
          </Badge>
        )}
      </div>

      {/* Last date + Apply */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {relativeTime(job.published_at)}
          </span>
          {job.last_date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Deadline: {new Date(job.last_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        {job.source_url && (
          <span className="text-[11px] text-gold font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Apply <ExternalLink className="h-3 w-3" />
          </span>
        )}
      </div>
    </a>
  );
}
