import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper, Pin, ExternalLink, ChevronDown,
  Landmark, Briefcase, Megaphone, GraduationCap, CalendarDays,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Newspaper },
  { key: 'ugc_update', label: 'UGC', icon: Landmark },
  { key: 'job_opening', label: 'Jobs', icon: Briefcase },
  { key: 'event', label: 'Events', icon: CalendarDays },
  { key: 'scholarship', label: 'Grants', icon: GraduationCap },
  { key: 'announcement', label: 'News', icon: Megaphone },
] as const;

const CATEGORY_STYLES: Record<string, string> = {
  ugc_update: 'bg-primary/10 text-primary border-primary/20',
  job_opening: 'bg-accent/10 text-accent border-accent/20',
  event: 'bg-gold/15 text-gold-foreground border-gold/30',
  scholarship: 'bg-teal/10 text-teal border-teal/20',
  announcement: 'bg-secondary/40 text-secondary-foreground border-secondary/50',
};

const PAGE_SIZE = 6;

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function categoryLabel(cat: string) {
  return CATEGORIES.find((c) => c.key === cat)?.label || cat;
}

export function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: news, isLoading } = useQuery({
    queryKey: ['news_updates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = news?.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  ) ?? [];

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">News & Updates</h2>
          <p className="text-muted-foreground text-xs">Latest from UGC, AICTE, and academia</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setVisibleCount(PAGE_SIZE); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-gold text-gold-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No updates in this category yet</p>
        </div>
      )}

      {/* News cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {visible.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Show more */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className="w-4 h-4" />
            Show More
          </Button>
        </div>
      )}
    </div>
  );
}

function NewsCard({ item }: { item: any }) {
  const isPinned = item.is_pinned;

  return (
    <a
      href={item.source_url || '#'}
      target={item.source_url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className={`group block rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isPinned
          ? 'border-gold/30 bg-gold/5 hover:border-gold/50'
          : 'border-border bg-background hover:border-gold/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Top row: pinned badge + category */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {!!isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-wider">
                <Pin className="w-3 h-3" />
                Pinned
              </span>
            )}
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0 font-semibold ${CATEGORY_STYLES[item.category] || ''}`}
            >
              {categoryLabel(item.category)}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-serif text-sm font-bold text-foreground leading-snug mb-1 group-hover:text-gold transition-colors line-clamp-2">
            {item.title}
          </h3>

          {/* Summary */}
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
            {item.summary}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{relativeTime(item.published_at)}</span>
            {item.source_name && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  {item.source_name}
                  {item.source_url && <ExternalLink className="w-3 h-3" />}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
