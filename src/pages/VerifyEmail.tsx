import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, Loader2, Mail, ArrowRight } from 'lucide-react';
import api from '@/lib/api-client';
import logo from '@/assets/academisthan-logo-official.png';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const data = await api.auth.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect to signin after 4 seconds
        setTimeout(() => {
          navigate('/auth/signin');
        }, 4000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please request a new verification link.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background image with blur and overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
        style={{ 
          backgroundImage: `linear-gradient(rgba(10, 15, 30, 0.88), rgba(10, 15, 30, 0.92)), url(${cinematicCampus})`,
          transform: 'scale(1.02)',
        }}
      />
      
      {/* Subtle glowing accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Academisthan Logo" className="h-10 w-10 animate-pulse" />
          <span className="font-serif text-xl font-bold text-gold tracking-wide">Academisthan</span>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gold/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-gold animate-spin" />
              <Loader2 className="w-8 h-8 text-gold animate-pulse" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Verifying Fellowship
            </h1>
            <p className="text-slate-600 max-w-sm">
              Securing your credentials and activating your profiles on the Academisthan portal. Please wait...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-in zoom-in duration-500">
              <ShieldCheck className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-3 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Fellowship Verified! 🎉
            </h1>
            <p className="text-slate-600 mb-6 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              Your account has been successfully authenticated. Welcome to India's premier academic fellowship network.
            </p>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3 mb-8 text-emerald-500 text-sm max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              Redirecting you to the sign-in portal in a moment...
            </div>
            <Link to="/auth/signin" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-semibold py-6 rounded-xl shadow-lg shadow-gold/20 flex items-center justify-center gap-2 group">
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.25)] animate-in zoom-in duration-500">
              <ShieldAlert className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 mb-3 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Verification Failed
            </h1>
            <p className="text-slate-600 mb-8 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              {message}
            </p>
            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <Link to="/auth/resend-verification" className="block w-full">
                <Button className="w-full bg-gold hover:bg-gold/90 text-gold-foreground font-semibold py-6 rounded-xl shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Request New Verification Link
                </Button>
              </Link>
              <Link to="/auth/signin" className="block w-full">
                <Button variant="outline" className="w-full py-6 rounded-xl border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Footer Brand Info */}
        <p className="text-xs text-slate-400 mt-10">
          © {new Date().getFullYear()} Academisthan. All rights reserved.
        </p>

      </div>
    </div>
  );
}
