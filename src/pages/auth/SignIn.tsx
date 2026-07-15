import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!email) return;
    setResending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: 'Verification email sent! ✉️', description: 'Please check your inbox.' });
      } else {
        toast({ title: 'Resend failed', description: result.error || 'Failed to resend verification email.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Resend failed', description: err.message, variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      if (error.message.includes('verify your email')) {
        setShowResend(true);
      }
    } else {
      toast({ title: 'Welcome back! 🎓' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Cinematic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={cinematicCampus} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsla(228,45%,12%,0.92), hsla(228,45%,15%,0.8))' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Academisthan" className="h-10 w-10" />
            <span className="font-serif text-xl font-bold text-gold">Academisthan</span>
          </Link>

          <div className="max-w-md">
            <h2 className="font-serif text-4xl font-bold text-warm leading-tight mb-4">
              Welcome Back,<br />
              <span className="text-gradient-gold">Fellow</span>
            </h2>
            <p className="text-warm/60 leading-relaxed">
              Continue your journey with Academisthan. Access your dashboard, 
              tools, and connect with fellow educators.
            </p>
          </div>

          <p className="text-warm/30 text-xs">
            "The end-product of education should be a free creative man." — Dr. Sarvepalli Radhakrishnan
          </p>
        </div>
      </div>

      {/* Right — Sign in form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Academisthan" className="h-8 w-8" />
              <span className="font-serif text-lg font-bold" style={{ color: 'hsl(38,55%,58%)' }}>Academisthan</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
              Sign In
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your Fellow dashboard
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/auth/forgot-password" className="text-xs text-gold hover:text-gold/80 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pr-12"
                  required
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl font-semibold text-base shadow-[0_4px_20px_hsl(38_55%_58%/0.3)]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gold-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {showResend && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <span>Didn't receive the email?</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={resending}
                onClick={handleResendVerification}
                className="text-gold font-bold hover:text-gold/90 hover:underline p-0 h-auto text-xs"
              >
                {resending ? 'Sending...' : 'Resend Verification'}
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Not a Fellow yet?{' '}
            <Link to="/auth/signup" className="text-gold hover:text-gold/80 font-medium transition-colors">
              Become a Fellow
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-3">Are you registering on behalf of an institution?</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/institution-register')}
              className="w-full h-11 border-gold/30 hover:border-gold hover:bg-gold/5 text-gold rounded-xl font-medium text-sm transition-all"
            >
              Register Your Institution
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
