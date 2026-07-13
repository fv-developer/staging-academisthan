import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, ExternalLink, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function UpcomingEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });
      setEvents(data || []);

      if (user) {
        const eventIds = (data || []).map((e: any) => e.id);
        if (eventIds.length > 0) {
          const { data: regs } = await supabase
            .from('event_registrations')
            .select('event_id')
            .eq('user_id', user.id)
            .in('event_id', eventIds);
          const regMap: Record<string, boolean> = {};
          (regs || []).forEach((r: any) => { regMap[r.event_id] = true; });
          setRegistrations(regMap);
        }
      }
      setLoading(false);
    };
    fetchEvents();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to register', description: 'You need to be a registered teacher to attend events.', variant: 'destructive' });
      return;
    }
    setRegistering(eventId);
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: user.id });
    setRegistering(null);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      setRegistrations((prev) => ({ ...prev, [eventId]: true }));
      toast({ title: 'Registered successfully! 🎉', description: 'You will receive a participation certificate after attending.' });
    }
  };

  // Also show past events for reference
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  useEffect(() => {
    const fetchPast = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .lt('event_date', new Date().toISOString())
        .order('event_date', { ascending: false })
        .limit(6);
      setPastEvents(data || []);
    };
    fetchPast();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const eventTypeLabel: Record<string, string> = {
    webinar: 'Webinar', seminar: 'Seminar', conference: 'Conference',
    workshop: 'Workshop', awards: 'Awards', roundtable: 'Roundtable', fdp: 'FDP',
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-primary to-navy" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection>
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Seminars · Webinars · Workshops</span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm mt-4">
              Upcoming <span className="text-gradient-gold">Events</span>
            </h1>
            <p className="text-warm/60 mt-4 text-lg max-w-2xl mx-auto">
              Register for upcoming seminars, webinars and workshops. Participate and receive an official certificate from Academisthan Foundation.
            </p>
            {!user && (
              <Link to="/auth/signin">
                <Button className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8">
                  Sign In to Register
                </Button>
              </Link>
            )}
          </ScrollSection>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollSection>
            <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Upcoming Events</h2>
          </ScrollSection>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming events at the moment.</p>
              <p className="text-muted-foreground text-sm mt-1">Check back soon or browse our past events below.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <ScrollSection key={event.id}>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/30 transition-colors">
                    <div className="flex flex-col md:flex-row">
                      {event.cover_image_url && (
                        <div className="md:w-72 h-48 md:h-auto shrink-0">
                          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-gold border-gold/30">
                            {eventTypeLabel[event.event_type] || event.event_type}
                          </Badge>
                          {event.is_featured && <Badge className="bg-gold/15 text-gold border-0">Featured</Badge>}
                        </div>
                        <Link to={`/upcoming-events/${event.slug}`} className="hover:text-gold transition-colors">
                          <h3 className="font-serif text-xl font-bold text-foreground">{event.title}</h3>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gold" /> {formatDate(event.event_date)}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gold" /> {event.location}
                            </div>
                          )}
                          {event.max_attendees && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-gold" /> {event.max_attendees} seats
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          {registrations[event.id] ? (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" /> Registered
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleRegister(event.id)}
                              disabled={registering === event.id}
                              className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-6"
                            >
                              {registering === event.id ? 'Registering...' : 'Register Now'}
                            </Button>
                          )}
                          {event.registration_url && (
                            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="text-gold text-sm font-semibold hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3.5 h-3.5" /> Join Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Past Events Link */}
      {pastEvents.length > 0 && (
        <section className="py-16 bg-navy/5">
          <div className="container mx-auto px-4 max-w-5xl">
            <ScrollSection>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-2xl font-bold text-foreground">Past Events</h2>
                <Link to="/events" className="text-gold text-sm font-semibold hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event) => (
                <div key={event.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <Badge variant="outline" className="text-xs">{eventTypeLabel[event.event_type] || event.event_type}</Badge>
                  <h3 className="font-serif text-sm font-bold text-foreground">{event.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-gold" /> {formatDate(event.event_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
