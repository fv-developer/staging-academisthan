import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api-client';

export default function ResendVerification() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({ title: 'Please enter your email address', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await api.auth.resendVerification(email);
      setSent(true);
      toast({ title: 'Verification email sent! ✉️', description: 'Check your inbox.' });
    } catch (error: any) {
      toast({
        title: 'Failed to send email',
        description: error.response?.data?.error || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-20 pb-12 bg-gradient-to-b from-navy via-navy/95 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--gold)) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 max-w-2xl relative z-10 pt-8 text-center">
          <Mail className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-warm mb-3">
            Resend Verification Email
          </h1>
          <p className="text-warm/50 text-sm">
            Enter your email address to receive a new verification link
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-md pb-16 -mt-4 relative">
        {!sent ? (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl"
              >
                {loading ? 'Sending...' : 'Send Verification Email'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <Link to="/auth/signin" className="text-sm text-muted-foreground hover:text-gold flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Check Your Email!</h2>
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              The link will expire in 24 hours. Click the link in the email to verify your account.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setSent(false)}
                variant="outline"
                className="w-full rounded-xl"
              >
                Send to Different Email
              </Button>
              <Link to="/auth/signin">
                <Button variant="outline" className="w-full rounded-xl">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
