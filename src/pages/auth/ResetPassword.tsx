import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle, Lock, ShieldCheck } from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';
import libraryGrand from '@/assets/hero/library-grand.jpg';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      navigate('/auth/signin');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center" style={{ animation: 'scaleIn 0.6s ease-out forwards' }}>
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">Password Updated!</h1>
          <p className="text-muted-foreground text-sm mb-2">Your password has been successfully changed.</p>
          <p className="text-muted-foreground text-xs">Redirecting to your dashboard...</p>
          <div className="mt-6">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Password strength indicator
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-destructive', 'bg-gold', 'bg-accent'];

  return (
    <div className="min-h-screen flex">
      {/* Left — Cinematic */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={libraryGrand} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsla(228,45%,12%,0.92), hsla(228,45%,15%,0.8))' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Academisthan" className="h-10 w-10" />
            <span className="font-serif text-xl font-bold text-gold">Academisthan</span>
          </Link>

          <div className="max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-serif text-4xl font-bold text-warm leading-tight mb-4">
              Almost There,<br />
              <span className="text-gradient-gold">Stay Secure</span>
            </h2>
            <p className="text-warm/60 leading-relaxed">
              Choose a strong password to keep your Academisthan account safe. 
              We recommend using a mix of letters, numbers, and symbols.
            </p>
          </div>

          <p className="text-warm/30 text-xs">
            "Teachers should be the best minds in the country." — Dr. Sarvepalli Radhakrishnan
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

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Set New Password</h1>
            <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pr-12"
                  required
                  minLength={6}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= level ? strengthColors[strength] : 'bg-muted'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold ${strength === 3 ? 'text-accent' : strength === 2 ? 'text-gold' : 'text-destructive'}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-12 rounded-xl border-border bg-card ${confirmPassword && confirmPassword !== password ? 'border-destructive' : ''}`}
                required
                minLength={6}
                maxLength={72}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-destructive text-[11px]">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || password !== confirmPassword}
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl font-semibold shadow-[0_4px_20px_hsl(38_55%_58%/0.3)]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gold-foreground border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Update Password
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
