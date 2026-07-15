import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { supabase } from '@/lib/api-client';
import {
  ShieldCheck, Search, CheckCircle2, XCircle, User,
  Building2, MapPin, GraduationCap, Calendar, Award, BookOpen,
  CreditCard, Sparkles, ArrowRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerifyCertificate() {
  const [membershipId, setMembershipId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [searchId, setSearchId] = useState('');
  const { ref: heroRef } = useScrollAnimation();

  const { data: result, isLoading, isFetched } = useQuery({
    queryKey: ['verify-certificate', searchId],
    queryFn: async () => {
      if (!searchId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, designation, department, institution, city, state, membership_id, membership_status, created_at, specialization')
        .eq('membership_id', searchId)
        .eq('membership_status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!searchId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = membershipId.trim().toUpperCase();
    if (cleaned) {
      setSearchId(cleaned);
      setSearchTriggered(true);
    }
  };

  const isVerified = searchTriggered && isFetched && result !== null;
  const isNotFound = searchTriggered && isFetched && result === null && !isLoading;

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/6 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 right-[15%] w-64 h-64 bg-accent/5 rounded-full blur-[100px]" />
          <div className="absolute top-24 left-[8%] opacity-[0.03]">
            <ShieldCheck className="w-48 h-48 text-warm" />
          </div>
        </div>

        <div ref={heroRef} className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-5 py-2 mb-6">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-accent text-sm font-semibold tracking-wide">Verification Portal</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-5 leading-tight">
              Verify <span className="text-gradient-gold">Certificate</span>
            </h1>
            <p className="text-warm/55 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Enter an Academisthan membership ID to verify the authenticity of a fellow's 
              certificate and membership status in real-time.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm/30" />
              <Input
                type="text"
                value={membershipId}
                onChange={(e) => { setMembershipId(e.target.value); setSearchTriggered(false); }}
                placeholder="Enter Membership ID (e.g. ACAD-2026-00001)"
                className="h-14 pl-12 pr-36 rounded-2xl bg-white/5 border-gold/15 text-warm placeholder:text-warm/25 text-base backdrop-blur-sm focus:border-gold/40 focus:bg-white/8 font-mono"
              />
              <Button
                type="submit"
                disabled={!membershipId.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl h-10 px-6 font-semibold"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Result ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 text-gold mx-auto animate-spin mb-4" />
              <p className="text-muted-foreground">Verifying membership...</p>
            </div>
          )}

          {/* Verified */}
          {isVerified && result && (
            <div className="space-y-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {/* Success header */}
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/15 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-accent" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                  ✅ Certificate Verified
                </h2>
                <p className="text-muted-foreground text-sm">
                  This membership ID belongs to an active Academisthan Fellow
                </p>
              </div>

              {/* Verified Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(228,45%,16%)] via-[hsl(228,45%,20%)] to-[hsl(228,35%,25%)] p-8 border border-gold/20 shadow-[0_20px_60px_hsl(228_45%_16%/0.5)]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold/3 rounded-full blur-2xl" />
                <div className="absolute top-4 right-4 opacity-10">
                  <ShieldCheck className="w-16 h-16 text-gold" />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-gold/50 text-[10px] tracking-[0.3em] uppercase font-medium">Academisthan</span>
                      <h3 className="font-serif text-lg text-gold font-bold mt-0.5">Fellow Certificate</h3>
                    </div>
                    <Badge className="bg-accent/15 text-accent border-accent/30 text-xs font-bold">
                      Active ✓
                    </Badge>
                  </div>

                  {/* Name */}
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-warm">{result.full_name}</h2>
                    <p className="text-warm/50 text-sm mt-1">
                      {result.designation}{result.institution ? ` · ${result.institution}` : ''}
                    </p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {result.department && (
                      <DetailItem icon={BookOpen} label="Department" value={result.department} />
                    )}
                    {result.specialization && (
                      <DetailItem icon={Sparkles} label="Specialization" value={result.specialization} />
                    )}
                    {(result.city || result.state) && (
                      <DetailItem icon={MapPin} label="Location" value={[result.city, result.state].filter(Boolean).join(', ')} />
                    )}
                    <DetailItem
                      icon={Calendar}
                      label="Member Since"
                      value={new Date(result.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    />
                  </div>

                  {/* Member ID */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-warm/30 text-[10px] uppercase tracking-wider">Member ID</span>
                      <p className="font-mono text-gold text-lg font-bold tracking-wider mt-0.5">
                        {result.membership_id}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-gold" />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Verified on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Not Found */}
          {isNotFound && (
            <div className="text-center py-12 animate-fade-up">
              <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                Certificate Not Found
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                No active membership found for <span className="font-mono text-foreground font-medium">"{searchId}"</span>. 
                Please check the ID and try again, or contact us if you believe this is an error.
              </p>
              <Button asChild variant="outline" className="rounded-xl gap-2">
                <a href="/contact">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}

          {/* Initial state */}
          {!searchTriggered && !isLoading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">Enter a Membership ID</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                The membership ID is printed on every Academisthan Fellow certificate. 
                It follows the format <span className="font-mono text-foreground">ACAD-YYYY-XXXXX</span>.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-foreground text-center mb-8">How Verification Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Enter ID', desc: 'Type the membership ID from the fellow certificate', icon: Search },
              { step: '02', title: 'Database Check', desc: 'We verify against our secure membership database in real-time', icon: ShieldCheck },
              { step: '03', title: 'Get Result', desc: 'Instantly see the fellow\'s verified details and membership status', icon: CheckCircle2 },
            ].map(item => (
              <div key={item.step} className="bg-card border border-border rounded-2xl p-6 text-center hover:border-gold/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-gold" />
                </div>
                <span className="text-gold font-mono text-xs font-bold">STEP {item.step}</span>
                <h3 className="font-serif text-base font-bold text-foreground mt-2 mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-warm/30 mt-0.5 shrink-0" />
      <div>
        <span className="text-warm/30 text-[10px] uppercase tracking-wider">{label}</span>
        <p className="text-warm/80 text-sm">{value}</p>
      </div>
    </div>
  );
}

