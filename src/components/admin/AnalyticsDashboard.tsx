import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api-client';
import { Users, FileText, Newspaper, Eye, Wrench, TrendingUp, Calendar, Award, GraduationCap, UserCheck, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Stat = { label: string; value: number | string; icon: any; color: string };

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [certStats, setCertStats] = useState<any[]>([]);
  const [programStats, setProgramStats] = useState<any[]>([]);
  const [eventRegStats, setEventRegStats] = useState<any[]>([]);
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalUsers },
        { count: totalBlogs },
        { count: publishedBlogs },
        { count: totalNews },
        { count: totalEvents },
        { count: totalToolUses },
        { count: totalViews },
        { count: todayViews },
        { count: totalCerts },
        { count: totalEnrollments },
        { count: completedEnrollments },
        { count: totalEventRegs },
        { count: attendedEventRegs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('news_updates').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('tool_results').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view')
          .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
        supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('attended', true),
      ]);

      setStats([
        { label: 'Total Fellows', value: totalUsers || 0, icon: Users, color: 'bg-gold/15 text-gold' },
        { label: 'Certificates Issued', value: totalCerts || 0, icon: Award, color: 'bg-accent/15 text-accent' },
        { label: 'Program Enrollments', value: totalEnrollments || 0, icon: GraduationCap, color: 'bg-teal/15 text-teal' },
        { label: 'Programs Completed', value: completedEnrollments || 0, icon: UserCheck, color: 'bg-gold/15 text-gold' },
        { label: 'Event Registrations', value: totalEventRegs || 0, icon: Calendar, color: 'bg-accent/15 text-accent' },
        { label: 'Events Attended', value: attendedEventRegs || 0, icon: UserCheck, color: 'bg-teal/15 text-teal' },
        { label: 'Page Views', value: totalViews || 0, icon: Eye, color: 'bg-gold/15 text-gold' },
        { label: 'Today\'s Views', value: todayViews || 0, icon: TrendingUp, color: 'bg-accent/15 text-accent' },
        { label: 'Blog Posts', value: `${publishedBlogs || 0}/${totalBlogs || 0}`, icon: FileText, color: 'bg-teal/15 text-teal' },
        { label: 'News Items', value: totalNews || 0, icon: Newspaper, color: 'bg-gold/15 text-gold' },
        { label: 'Events Created', value: totalEvents || 0, icon: Calendar, color: 'bg-accent/15 text-accent' },
        { label: 'Tool Uses', value: totalToolUses || 0, icon: Wrench, color: 'bg-teal/15 text-teal' },
      ]);

      // Program-wise stats
      const { data: programs } = await supabase.from('programs').select('id, title');
      if (programs && programs.length > 0) {
        const pStats = [];
        for (const prog of programs) {
          const [{ count: enrolled }, { count: completed }, { count: certified }] = await Promise.all([
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('program_id', prog.id),
            supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('program_id', prog.id).eq('status', 'completed'),
            supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('program_id', prog.id),
          ]);
          pStats.push({ title: prog.title, enrolled: enrolled || 0, completed: completed || 0, certified: certified || 0 });
        }
        setProgramStats(pStats);
      }

      // Event-wise registration stats
      const { data: events } = await supabase.from('events').select('id, title, event_date').order('event_date', { ascending: false }).limit(10);
      if (events && events.length > 0) {
        const eStats = [];
        for (const evt of events) {
          const [{ count: registered }, { count: attended }] = await Promise.all([
            supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', evt.id),
            supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', evt.id).eq('attended', true),
          ]);
          eStats.push({ title: evt.title, date: evt.event_date, registered: registered || 0, attended: attended || 0 });
        }
        setEventRegStats(eStats);
      }

      // Recent certificates
      const { data: certs } = await supabase
        .from('certificates')
        .select('*')
        .order('issued_at', { ascending: false })
        .limit(10);
      setRecentCerts(certs || []);

      // Recent page views
      const { data: recent } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'page_view')
        .order('created_at', { ascending: false })
        .limit(8);
      setRecentViews(recent || []);

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div>
        <h4 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gold" /> Platform Overview
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-muted/30 border border-border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Program-wise Breakdown */}
      {programStats.length > 0 && (
        <div>
          <h4 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gold" /> Program-wise Stats
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Program</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Enrolled</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Completed</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Certified</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Rate</th>
                </tr>
              </thead>
              <tbody>
                {programStats.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground truncate max-w-[200px]">{p.title}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{p.enrolled}</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className="text-[10px]">{p.completed}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge className="bg-gold/15 text-gold border-0 text-[10px]">{p.certified}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground text-xs">
                      {p.enrolled > 0 ? `${Math.round((p.completed / p.enrolled) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Event Registration Breakdown */}
      {eventRegStats.length > 0 && (
        <div>
          <h4 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold" /> Event Registration Stats
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Event</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Registered</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Attended</th>
                </tr>
              </thead>
              <tbody>
                {eventRegStats.map((e, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground truncate max-w-[200px]">{e.title}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground text-xs">
                      {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant="outline" className="text-[10px]">{e.registered}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge className="bg-accent/15 text-accent border-0 text-[10px]">{e.attended}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Certificates */}
      {recentCerts.length > 0 && (
        <div>
          <h4 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-gold" /> Recent Certificates Issued
          </h4>
          <div className="space-y-1.5">
            {recentCerts.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cert.certificate_type === 'participation' ? 'bg-teal/15' : 'bg-gold/15'}`}>
                    <Award className={`w-3 h-3 ${cert.certificate_type === 'participation' ? 'text-teal' : 'text-gold'}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">{cert.holder_name}</span>
                  <Badge variant="outline" className="text-[9px] shrink-0">{cert.certificate_type}</Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] text-muted-foreground font-mono">{cert.certificate_number}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Page Views */}
      <div>
        <h4 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gold" /> Recent Page Views
        </h4>
        {recentViews.length > 0 ? (
          <div className="space-y-1.5">
            {recentViews.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                <span className="text-xs text-foreground truncate flex-1 min-w-0">{v.page_path || '/'}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {new Date(v.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No page views recorded yet.</p>
        )}
      </div>
    </div>
  );
}
