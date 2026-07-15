import { useEffect, useState } from 'react';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle2, XCircle, Clock, FileCheck2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

type Run = {
  id: string;
  function_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  items_created: number;
  error_message: string | null;
};

const JOBS = [
  { name: 'auto-content-generator', label: 'News (6 categories) + Gazette interpretations', schedule: 'Daily 06:00 IST', maxStaleHours: 36 },
  { name: 'scrape-news', label: 'Jobs · Grants · Fellowships · CFP', schedule: 'Every 4 hours', maxStaleHours: 8 },
  { name: 'scrape-gazette', label: 'UGC · AICTE · NAAC · e-Gazette notices', schedule: 'Daily 08:00 IST', maxStaleHours: 36 },
  { name: 'auto-blog-generator', label: 'AI Blog (Morning Brief + Deep Read)', schedule: 'Daily 07:30 & 17:30 IST', maxStaleHours: 30 },
  { name: 'update-autonomous-colleges', label: 'UGC Autonomous Directory', schedule: 'Weekly Sun 03:00 IST', maxStaleHours: 24 * 8 },
  { name: 'content-cleanup', label: 'Expire old news/jobs', schedule: 'Daily 02:00 IST', maxStaleHours: 30 },
  { name: 'automation-healthcheck', label: 'Health monitor', schedule: 'Hourly', maxStaleHours: 3 },
];

export function AutomationDashboard() {
  const { toast } = useToast();
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingBlogs, setPendingBlogs] = useState(0);
  const [stats, setStats] = useState<Record<string, { success7d: number; total7d: number; items7d: number }>>({});

  const load = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await supabase.from('automation_runs').select('*').order('started_at', { ascending: false }).limit(200);
    setRuns((data as Run[]) || []);
    const { data: week } = await supabase.from('automation_runs').select('function_name,status,items_created').gte('started_at', sevenDaysAgo);
    const s: Record<string, { success7d: number; total7d: number; items7d: number }> = {};
    (week || []).forEach((r: any) => {
      const k = r.function_name;
      s[k] = s[k] || { success7d: 0, total7d: 0, items7d: 0 };
      s[k].total7d++;
      if (r.status === 'success') s[k].success7d++;
      s[k].items7d += r.items_created || 0;
    });
    setStats(s);
    const { count } = await supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('review_status', 'pending_review');
    setPendingBlogs(count || 0);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const runNow = async (fn: string) => {
    setBusy(fn);
    try {
      const { error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast({ title: 'Triggered', description: `${fn} is running in the background.` });
      setTimeout(load, 4000);
    } catch (e: any) {
      toast({ title: 'Failed', description: String(e?.message ?? e), variant: 'destructive' });
    } finally { setBusy(null); }
  };

  const lastRun = (fn: string) => runs.find((r) => r.function_name === fn);
  const isStale = (fn: string, maxStaleHours: number) => {
    const last = lastRun(fn);
    if (!last) return true;
    return (Date.now() - new Date(last.started_at).getTime()) / 3600000 > maxStaleHours;
  };

  const staleCount = JOBS.filter(j => isStale(j.name, j.maxStaleHours)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">Automation</h3>
          <p className="text-xs text-muted-foreground">Scheduled content pipelines · live status & 7-day reliability</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {staleCount > 0 && (
            <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />{staleCount} pipeline{staleCount > 1 ? 's' : ''} stale
            </Badge>
          )}
          {pendingBlogs > 0 && (
            <Link to="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLButtonElement>('[data-tab="pending-blogs"]')?.click(); }}>
              <Badge className="bg-gold/15 text-gold border-gold/30 gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5" />{pendingBlogs} AI blog{pendingBlogs > 1 ? 's' : ''} awaiting review
              </Badge>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {JOBS.map((j) => {
          const last = lastRun(j.name);
          const stale = isStale(j.name, j.maxStaleHours);
          const stat = stats[j.name] || { success7d: 0, total7d: 0, items7d: 0 };
          const successRate = stat.total7d ? Math.round((stat.success7d / stat.total7d) * 100) : null;
          return (
            <Card key={j.name} className={`p-4 flex items-center justify-between gap-4 flex-wrap ${stale ? 'border-destructive/40' : ''}`}>
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground text-sm">{j.label}</span>
                  {last?.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {last?.status === 'failed' && <XCircle className="w-4 h-4 text-destructive" />}
                  {last?.status === 'running' && <Clock className="w-4 h-4 text-gold animate-pulse" />}
                  {stale && <Badge variant="destructive" className="text-[10px] py-0">stale</Badge>}
                  {successRate !== null && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      {successRate}% · {stat.items7d} items / 7d
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {j.schedule} · <code className="text-[10px]">{j.name}</code>
                </div>
                {last && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Last: {new Date(last.started_at).toLocaleString()} ·{' '}
                    <span className={last.status === 'failed' ? 'text-destructive' : 'text-foreground'}>{last.status}</span>{' '}
                    · {last.items_created} item(s)
                    {last.error_message && (
                      <div className="text-destructive mt-0.5 line-clamp-2">{last.error_message}</div>
                    )}
                  </div>
                )}
                {!last && <div className="text-xs text-destructive mt-1">Never ran. Click "Run now" to verify wiring.</div>}
              </div>
              <Button size="sm" variant="outline" onClick={() => runNow(j.name)} disabled={busy === j.name} className="gap-1.5">
                <Play className="w-3.5 h-3.5" />{busy === j.name ? 'Running...' : 'Run now'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
