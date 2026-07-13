import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '@/lib/api-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [userType, setUserType] = useState<'fellow' | 'institution' | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      const data = await auth.verifyEmail(token);
      
      setStatus('success');
      setMessage(data.message || 'Email verified successfully!');
      setUserType('fellow');
      
      toast({
        title: 'Email Verified! ✓',
        description: 'You can now sign in to your account.',
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/auth/signin');
      }, 3000);
    } catch (err: any) {
      console.error('Verification error:', err);
      const errMsg = err.message || 'An error occurred during verification. Please try again.';
      if (errMsg.toLowerCase().includes('expired')) {
        setStatus('expired');
      } else {
        setStatus('error');
      }
      setMessage(errMsg);
    }
  };

  const handleResendEmail = () => {
    navigate('/auth/resend-verification');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-16">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-lg">
            {/* Loading State */}
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Verifying Your Email
                </h1>
                <p className="text-sm text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Email Verified Successfully!
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Redirecting to sign in page in 3 seconds...
                  </p>
                  <Button 
                    onClick={() => navigate('/auth/signin')} 
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90 gap-2"
                  >
                    Sign In Now <ArrowRight className="w-4 h-4" />
                  </Button>
                  {userType === 'fellow' && (
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      variant="outline"
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                  )}
                  {userType === 'institution' && (
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      variant="outline"
                      className="w-full"
                    >
                      Go to Institution Dashboard
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Verification Failed
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleResendEmail} 
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90 gap-2"
                  >
                    <Mail className="w-4 h-4" /> Request New Verification Email
                  </Button>
                  <Button 
                    onClick={() => navigate('/contact')} 
                    variant="outline"
                    className="w-full"
                  >
                    Contact Support
                  </Button>
                </div>
              </>
            )}

            {/* Expired State */}
            {status === 'expired' && (
              <>
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-orange-500" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  Verification Link Expired
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  This verification link has expired. Verification links are valid for 48 hours.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleResendEmail} 
                    className="w-full bg-gold text-gold-foreground hover:bg-gold/90 gap-2"
                  >
                    <Mail className="w-4 h-4" /> Request New Verification Email
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Need help? <a href="/contact" className="text-gold hover:underline">Contact us</a>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Having trouble? Make sure you're using the latest verification email and that the link hasn't expired.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
