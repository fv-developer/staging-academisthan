import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Users, Award, ChevronDown, ChevronUp } from 'lucide-react';

export function EventAttendanceManager() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, any[]>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const loadRegistrations = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(eventId);

    const { data: regs } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });

    setRegistrations((prev) => ({ ...prev, [eventId]: regs || [] }));

    // Load profile names
    const userIds = (regs || []).map((r: any) => r.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email, institution')
        .in('id', userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles((prev) => ({ ...prev, ...map }));
    }
  };

  const markAttended = async (reg: any, eventTitle: string) => {
    setProcessing(reg.id);

    // Generate certificate
    const { data: certNumData } = await supabase.rpc('generate_certificate_number');
    const certNumber = certNumData || `ACAD-CERT-${Date.now()}`;
    const profile = profiles[reg.user_id];

    const { data: cert, error: certErr } = await supabase
      .from('certificates')
      .insert({
        user_id: reg.user_id,
        certificate_number: certNumber,
        holder_name: profile?.full_name || 'Participant',
        certificate_type: 'participation',
        event_id: reg.event_id,
      })
      .select('id')
      .single();

    if (certErr) {
      toast({ title: 'Certificate creation failed', description: certErr.message, variant: 'destructive' });
      setProcessing(null);
      return;
    }

    // Update registration
    const { error } = await supabase
      .from('event_registrations')
      .update({ attended: true, certificate_id: cert.id })
      .eq('id', reg.id);

    setProcessing(null);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Marked as attended ✅`, description: `Participation certificate issued to ${profile?.full_name || 'participant'}` });
      loadRegistrations(reg.event_id);
    }
  };

  const markAllAttended = async (eventId: string) => {
    const regs = registrations[eventId]?.filter((r: any) => !r.attended) || [];
    if (regs.length === 0) return;
    if (!confirm(`Mark ${regs.length} participant(s) as attended and issue certificates?`)) return;

    const event = events.find((e: any) => e.id === eventId);
    setProcessing('bulk');

    for (const reg of regs) {
      await markAttended(reg, event?.title || 'Event');
    }
    setProcessing(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-3 mt-6">
      <h4 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
        <Users className="w-4 h-4 text-gold" /> Event Registrations & Attendance
      </h4>

      {events.map((event) => {
        const regs = registrations[event.id] || [];
        const attendedCount = regs.filter((r: any) => r.attended).length;
        const isExpanded = expandedEvent === event.id;

        return (
          <div key={event.id} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => loadRegistrations(event.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {isExpanded && regs.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">{attendedCount}/{regs.length} attended</Badge>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                {regs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No registrations yet.</p>
                ) : (
                  <>
                    <div className="flex justify-end mb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllAttended(event.id)}
                        disabled={processing === 'bulk' || regs.every((r: any) => r.attended)}
                        className="rounded-xl text-xs gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark All Attended
                      </Button>
                    </div>
                    {regs.map((reg: any) => {
                      const profile = profiles[reg.user_id];
                      return (
                        <div key={reg.id} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{profile?.email} · {profile?.institution || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {reg.attended ? (
                              <div className="flex items-center gap-1 text-accent text-xs font-semibold">
                                <Award className="w-3.5 h-3.5" /> Certified
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAttended(reg, event.title)}
                                disabled={processing === reg.id}
                                className="text-xs h-7 px-2 text-gold hover:text-gold"
                              >
                                {processing === reg.id ? '...' : 'Mark Attended'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
