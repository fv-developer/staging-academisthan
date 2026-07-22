import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, KeyRound, Shield } from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';
import heritageHall from '@/assets/hero/heritage-hall.jpg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Cinematic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={heritageHall} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsla(228,45%,12%,0.92), hsla(228,45%,15%,0.8))' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Academisthan" className="h-10 w-10" />
            <span className="font-serif text-xl font-bold text-gold">Academisthan</span>
          </Link>

          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-6">
              <KeyRound className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-serif text-4xl font-bold text-warm leading-tight mb-4">
              Don't Worry,<br />
              <span className="text-gradient-gold">We've Got You</span>
            </h2>
            <p className="text-warm/60 leading-relaxed">
              Happens to the best of us. We'll help you reset your password 
              and get back to your academic journey in no time.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: '🔐', text: 'Secure password reset via email' },
                { icon: '⚡', text: 'Instant link delivery' },
                { icon: '🛡️', text: 'Your data remains protected' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-warm/60 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-warm/30 text-xs">
            "The end-product of education should be a free creative man." — Dr. Sarvepalli Radhakrishnan
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Academisthan" className="h-8 w-8" />
              <span className="font-serif text-lg font-bold" style={{ color: 'hsl(38,55%,58%)' }}>Academisthan</span>
            </Link>
          </div>

          {sent ? (
            <div className="text-center" style={{ animation: 'scaleIn 0.6s ease-out forwards' }}>
              <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-gold" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-3">Check Your Email</h1>
              <p className="text-muted-foreground text-sm mb-2 max-w-sm mx-auto">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <p className="text-muted-foreground text-xs mb-8">Don't see it? Check your spam folder.</p>
              
              <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-left">
                <h4 className="font-serif text-sm font-bold text-foreground mb-3">What to do next:</h4>
                <div className="space-y-2">
                  {['Open the email from Academisthan', 'Click the reset password link', 'Choose a new strong password'].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                        <span className="text-gold text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/auth/signin">
                <Button variant="outline" className="rounded-xl gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Forgot Password
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your email and we'll send you a secure reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="priya@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border bg-card"
                    required
                    maxLength={254}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl font-semibold shadow-[0_4px_20px_hsl(38_55%_58%/0.3)]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gold-foreground border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                <Link to="/auth/signin" className="text-gold hover:text-gold/80 font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
