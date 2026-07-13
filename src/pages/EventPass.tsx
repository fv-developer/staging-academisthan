import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Shield, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EventPass() {
  const { passCode } = useParams();
  const { user } = useAuth();
  const [registration, setRegistration] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPass = async () => {
      if (!passCode) { setNotFound(true); setLoading(false); return; }

      const { data: reg } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('pass_code', passCode)
        .single();

      if (!reg) { setNotFound(true); setLoading(false); return; }
      setRegistration(reg);

      const [{ data: evt }, { data: prof }] = await Promise.all([
        supabase.from('events').select('*').eq('id', reg.event_id).single(),
        supabase.from('profiles').select('*').eq('id', reg.user_id).single(),
      ]);

      setEvent(evt);
      setProfile(prof);
      setLoading(false);
    };
    fetchPass();
  }, [passCode]);

  const verifyUrl = `${window.location.origin}/event-pass/${passCode}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center website-page">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background website-page">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">Pass Not Found</h1>
          <p className="text-muted-foreground mt-2">This event pass does not exist or has been removed.</p>
          <Link to="/upcoming-events"><Button className="mt-6 rounded-xl">Browse Events</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-lg">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Event Pass Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-gold/30 bg-gradient-to-b from-[hsl(228,45%,14%)] via-[hsl(228,45%,18%)] to-[hsl(228,35%,22%)] shadow-[0_30px_80px_hsl(228_45%_16%/0.6)]">
            {/* Decorative top strip */}
            <div className="h-2 bg-gradient-to-r from-gold via-gold/80 to-gold" />

            {/* Header */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gold/50 text-[10px] tracking-[0.4em] uppercase font-medium">Academisthan Foundation</span>
                  <p className="text-gold text-xs font-semibold mt-0.5">MSBSVET Recognised Institution</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
              </div>
            </div>

            {/* Event Title */}
            <div className="px-8 pb-6">
              <h2 className="font-serif text-2xl font-bold text-warm leading-tight">{event?.title}</h2>
              <div className="flex flex-wrap gap-4 mt-4 text-warm/50 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gold" /> {event?.event_date ? formatDate(event.event_date) : '—'}
                </div>
                {event?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gold" /> {event.location}
                  </div>
                )}
              </div>
              {event?.event_date && (
                <p className="text-warm/40 text-xs mt-1">Time: {formatTime(event.event_date)}</p>
              )}
            </div>

            {/* Dashed divider */}
            <div className="px-4">
              <div className="border-t-2 border-dashed border-gold/15" />
            </div>

            {/* Attendee Info */}
            <div className="px-8 py-6 flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <span className="text-warm/30 text-[10px] uppercase tracking-wider">Attendee</span>
                  <p className="font-serif text-lg font-bold text-warm truncate">{profile?.full_name || 'Teacher'}</p>
                </div>
                <div>
                  <span className="text-warm/30 text-[10px] uppercase tracking-wider">Institution</span>
                  <p className="text-warm/70 text-sm truncate">{profile?.institution || '—'}</p>
                </div>
                <div>
                  <span className="text-warm/30 text-[10px] uppercase tracking-wider">Member ID</span>
                  <p className="text-gold text-sm font-mono font-bold">{profile?.membership_id || '—'}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="shrink-0 bg-white p-3 rounded-2xl shadow-lg">
                <QRCodeSVG
                  value={verifyUrl}
                  size={120}
                  level="H"
                  fgColor="#1a2340"
                  bgColor="#ffffff"
                  imageSettings={{
                    src: '',
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
            </div>

            {/* Status */}
            <div className="px-8 pb-6">
              {registration?.attended ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/15 border border-accent/20">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-accent text-sm font-semibold">Attendance Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20">
                  <Shield className="w-5 h-5 text-gold" />
                  <span className="text-gold text-sm font-semibold">Valid Entry Pass</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-6">
              <p className="text-warm/25 text-[10px] text-center">
                Pass Code: {passCode} · Show this QR at the venue for entry · academisthan.lovable.app
              </p>
            </div>

            {/* Bottom strip */}
            <div className="h-1.5 bg-gradient-to-r from-gold via-gold/60 to-gold" />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
