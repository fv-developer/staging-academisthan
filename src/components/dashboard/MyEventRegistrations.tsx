import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Ticket, CheckCircle, MapPin } from 'lucide-react';

export function MyEventRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });
      setRegistrations(regs || []);

      if (regs && regs.length > 0) {
        const eventIds = [...new Set(regs.map((r) => r.event_id))];
        const { data: evts } = await supabase
          .from('events')
          .select('id, title, event_date, location, event_type')
          .in('id', eventIds);
        const map: Record<string, any> = {};
        (evts || []).forEach((e: any) => { map[e.id] = e; });
        setEvents(map);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return null;
  if (registrations.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gold" /> My Event Registrations
      </h3>
      <div className="space-y-3">
        {registrations.map((reg) => {
          const evt = events[reg.event_id];
          if (!evt) return null;
          return (
            <div key={reg.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${reg.attended ? 'bg-accent/10' : 'bg-gold/10'} flex items-center justify-center shrink-0`}>
                  {reg.attended ? <CheckCircle className="w-4 h-4 text-accent" /> : <Calendar className="w-4 h-4 text-gold" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{evt.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {reg.attended && <Badge className="bg-accent/10 text-accent border-0 text-[9px]">Attended</Badge>}
                  </div>
                </div>
              </div>
              <Link to={`/event-pass/${reg.pass_code}`}>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-gold hover:text-gold gap-1">
                  <Ticket className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">Pass</span>
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
