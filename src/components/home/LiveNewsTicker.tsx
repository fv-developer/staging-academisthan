import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/api-client';
import { ScrollSection } from '@/components/ScrollSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Newspaper, Pin, ExternalLink, ArrowRight, Clock,
  Landmark, Briefcase, Megaphone, GraduationCap, CalendarDays,
} from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; icon: string; style: string }> = {
  ugc_update: { label: 'UGC', icon: '🏛️', style: 'bg-primary/10 text-primary border-primary/20' },
  job_opening: { label: 'Jobs', icon: '💼', style: 'bg-accent/10 text-accent border-accent/20' },
  event: { label: 'Events', icon: '📅', style: 'bg-gold/15 text-gold border-gold/30' },
  scholarship: { label: 'Grants', icon: '🎓', style: 'bg-teal/10 text-teal border-teal/20' },
  announcement: { label: 'News', icon: '📢', style: 'bg-secondary/40 text-secondary-foreground border-secondary/50' },
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function LiveNewsTicker() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['homepage_news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!news || news.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <ScrollSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </span>
            <span className="text-gold text-sm font-semibold">Live Updates</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
            Latest <span className="text-gradient-gold">News</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            UGC circulars, faculty positions, gazette notifications, and education news — all from official sources
          </p>
        </ScrollSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((item, i) => {
            const meta = CATEGORY_META[item.category];
            return (
              <ScrollSection key={item.id} animation="fade-up" delay={i * 80}>
                <a
                  href={item.source_url || '#'}
                  target={item.source_url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`group block rounded-2xl border p-5 h-full transition-all hover:shadow-lg hover:-translate-y-1 ${
                    item.is_pinned
                      ? 'border-gold/30 bg-gold/5 hover:border-gold/50'
                      : 'border-border bg-card hover:border-gold/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold uppercase tracking-wider">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] px-2 py-0 font-semibold ${meta?.style || ''}`}>
                      {meta?.icon} {meta?.label || item.category}
                    </Badge>
                  </div>

                  <h3 className="font-serif text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{relativeTime(item.published_at)}</span>
                    </div>
                    {item.source_name && (
                      <span className="flex items-center gap-1">
                        {item.source_name}
                        {item.source_url && <ExternalLink className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </a>
              </ScrollSection>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/news">
            <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 rounded-xl px-8 gap-2">
              View All News & Updates <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
