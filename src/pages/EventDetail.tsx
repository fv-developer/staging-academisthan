import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, CheckCircle, ArrowLeft, Ticket, Share2, ExternalLink } from 'lucide-react';

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      setEvent(evt);

      if (evt && user) {
        const { data: reg } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', evt.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setRegistration(reg);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [slug, user]);

  const handleRegister = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }
    if (!event) return;
    setRegistering(true);
    const { data: reg, error } = await supabase
      .from('event_registrations')
      .insert({ event_id: event.id, user_id: user.id })
      .select('*')
      .single();
    setRegistering(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
    } else {
      setRegistration(reg);
      toast({ title: 'Registered! 🎉', description: 'Your event pass with QR code is ready.' });
    }
  };

  const shareEvent = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!' });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const eventTypeLabel: Record<string, string> = {
    webinar: 'Webinar', seminar: 'Seminar', conference: 'Conference',
    workshop: 'Workshop', awards: 'Awards', roundtable: 'Roundtable', fdp: 'FDP',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center website-page">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background website-page">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">Event Not Found</h1>
          <Link to="/upcoming-events"><Button className="mt-6 rounded-xl">Browse Events</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const canonical = `https://academisthan.org/upcoming-events/${event.slug}`;
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.title,
    startDate: event.event_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.location?.toLowerCase().includes('online')
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.venue || event.location
      ? { '@type': 'Place', name: event.venue || event.location, address: event.location || '' }
      : { '@type': 'VirtualLocation', url: canonical },
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    organizer: { '@type': 'Organization', name: 'Academisthan', url: 'https://academisthan.org' },
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Helmet>
        <title>{event.title} | Academisthan Events</title>
        <meta name="description" content={(event.description || event.title).slice(0, 155)} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:url" content={canonical} />
        {event.cover_image_url && <meta property="og:image" content={event.cover_image_url} />}
        <script type="application/ld+json">{JSON.stringify(eventSchema)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          {event.cover_image_url ? (
            <>
              <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-primary to-navy" />
          )}
        </div>
        <div className="container relative mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <Link to="/upcoming-events" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Events
            </Link>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-gold/20 text-gold border-0">{eventTypeLabel[event.event_type] || event.event_type}</Badge>
              {event.is_featured && <Badge className="bg-accent/20 text-accent border-0">Featured</Badge>}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-warm leading-tight">{event.title}</h1>
            <div className="flex flex-wrap gap-5 mt-6 text-warm/60 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> {formatDate(event.event_date)}</div>
              {event.location && <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> {event.location}</div>}
              {event.venue && <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> {event.venue}</div>}
            </div>
          </ScrollSection>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Flyer */}
            {event.flyer_image_url && (
              <ScrollSection>
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
                  <img src={event.flyer_image_url} alt={`${event.title} flyer`} className="w-full" />
                </div>
              </ScrollSection>
            )}

            {/* Description */}
            {event.description && (
              <ScrollSection>
                <h2 className="font-serif text-xl font-bold text-foreground mb-4">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </ScrollSection>
            )}

            {/* Full Content */}
            {event.content && (
              <ScrollSection>
                <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: event.content.replace(/\n/g, '<br />') }} />
              </ScrollSection>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Register / Pass Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24">
              {registration ? (
                <>
                  <div className="flex items-center gap-2 text-accent font-semibold">
                    <CheckCircle className="w-5 h-5" /> You're Registered!
                  </div>
                  <Link to={`/event-pass/${registration.pass_code}`}>
                    <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2">
                      <Ticket className="w-4 h-4" /> View Your Event Pass
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="font-serif font-bold text-foreground">Register for this Event</h3>
                  <p className="text-muted-foreground text-sm">Get your QR code entry pass and receive a participation certificate after attending.</p>
                  {user ? (
                    <Button onClick={handleRegister} disabled={registering} className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl">
                      {registering ? 'Registering...' : 'Register Now'}
                    </Button>
                  ) : (
                    <Link to="/auth/signin">
                      <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl">Sign In to Register</Button>
                    </Link>
                  )}
                </>
              )}

              <Button onClick={shareEvent} variant="outline" className="w-full rounded-xl gap-2">
                <Share2 className="w-4 h-4" /> Share Event
              </Button>

              {event.registration_url && (
                <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full rounded-xl gap-2">
                    <ExternalLink className="w-4 h-4" /> External Link
                  </Button>
                </a>
              )}
            </div>

            {/* Event Details Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-foreground text-sm">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{eventTypeLabel[event.event_type] || event.event_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">{new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                {event.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">{event.location}</span>
                  </div>
                )}
                {event.max_attendees && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium text-foreground">{event.max_attendees} seats</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
