import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateAPIScoreCertificate, type APIScoreCertificateData } from '@/lib/apiScoreCertificate';
import {
  Download, Share2, Lock, Award, Sparkles, AlertTriangle,
  MessageCircle, Linkedin, Twitter, Copy, Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalScore: number;
  maxScore: number;
  cat1Score: number;
  cat1Max: number;
  cat2Score: number;
  cat2Max: number;
  cat3Score: number;
  cat3Max: number;
}

export function APIScoreCertificateModal({
  open, onOpenChange,
  totalScore, maxScore,
  cat1Score, cat1Max,
  cat2Score, cat2Max,
  cat3Score, cat3Max,
}: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getGrade = () => {
    if (percentage >= 80) return { label: 'Outstanding', emoji: '🏆', color: 'text-gold' };
    if (percentage >= 60) return { label: 'Excellent', emoji: '⭐', color: 'text-accent' };
    if (percentage >= 40) return { label: 'Good', emoji: '👍', color: 'text-blue-400' };
    return { label: 'Developing', emoji: '📈', color: 'text-muted-foreground' };
  };

  const grade = getGrade();

  const handleDownload = () => {
    if (!user || !profile) return;

    const certData: APIScoreCertificateData = {
      holderName: (profile as any).full_name || 'Educator',
      membershipId: (profile as any).membership_id || 'ACAD-XXXXX',
      totalScore,
      maxScore,
      cat1Score, cat1Max,
      cat2Score, cat2Max,
      cat3Score, cat3Max,
      designation: (profile as any).designation || undefined,
      department: (profile as any).department || undefined,
      institution: (profile as any).institution || undefined,
      date: new Date().toISOString(),
    };

    const doc = generateAPIScoreCertificate(certData);
    doc.save(`API-Score-Certificate-${(profile as any).membership_id || 'ACAD'}.pdf`);
    setDownloaded(true);
    toast({ title: 'Certificate downloaded! 🎉' });
  };

  const shareText = `I self-assessed ${totalScore}/${maxScore} (${percentage}%) on the UGC 2018 Academic & Research Score Calculator by Academisthan! Check your score 👉 https://academisthan.org/tools/api-score`;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://academisthan.com/tools/api-score')}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-gold/20">
        {/* Header with score preview */}
        <div className="bg-gradient-to-br from-[hsl(228,45%,14%)] to-[hsl(228,35%,20%)] p-6 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-3 py-1 mb-4">
            <Award className="h-3.5 w-3.5 text-gold" />
            <span className="text-gold text-xs font-semibold">UGC 2018 Self-Assessment Certificate</span>
          </div>

          <div className="relative w-28 h-28 mx-auto my-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(228,25%,25%)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="hsl(38,55%,58%)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 327} 327`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-warm font-mono">{totalScore}</span>
              <span className="text-warm/40 text-[10px]">/ {maxScore}</span>
            </div>
          </div>

          <p className={cn('text-lg font-bold flex items-center justify-center gap-2', grade.color)}>
            {grade.emoji} {grade.label}
          </p>
          <p className="text-warm/40 text-xs mt-1">
            Teaching: {cat1Score}/{cat1Max} · Research: {cat2Score}/{cat2Max} · Other: {cat3Score}/{cat3Max}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {user ? (
            <>
              {/* Self-declaration notice */}
              <div className="bg-gold/5 border border-gold/15 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground/70 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-gold" /> Self-Assessment Certificate (UGC 2018)
                </p>
                <p>
                  By downloading, you confirm that values are <strong>self-declared</strong> and
                  not verified by Academisthan, UGC or MSBSVET. The certificate is for
                  <strong> personal reference only</strong> — final score is determined by your university IQAC.
                </p>
              </div>

              {/* Download button */}
              <Button
                onClick={handleDownload}
                className="w-full rounded-xl h-12 bg-gold text-gold-foreground hover:bg-gold/90 text-base font-semibold gap-2"
              >
                <Download className="h-5 w-5" />
                {downloaded ? 'Download Again' : 'Download Certificate PDF'}
              </Button>

              {downloaded && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-center">
                  <p className="text-accent text-sm font-medium flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" /> Share with your colleagues!
                  </p>
                </div>
              )}

              {/* Share buttons */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-gold" /> Share your score
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">WhatsApp</span>
                  </button>
                  <button
                    onClick={handleLinkedIn}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors"
                  >
                    <Linkedin className="h-5 w-5 text-blue-500" />
                    <span className="text-[10px] text-muted-foreground">LinkedIn</span>
                  </button>
                  <button
                    onClick={handleTwitter}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-sky-500/10 hover:border-sky-500/30 transition-colors"
                  >
                    <Twitter className="h-5 w-5 text-sky-500" />
                    <span className="text-[10px] text-muted-foreground">Twitter</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-gold/10 hover:border-gold/30 transition-colors"
                  >
                    {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5 text-gold" />}
                    <span className="text-[10px] text-muted-foreground">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Sign-up gate */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gold/10 rounded-2xl flex items-center justify-center">
                <Lock className="h-8 w-8 text-gold" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-1">
                  Sign up to download your certificate
                </h3>
                <p className="text-sm text-muted-foreground">
                  Become an Academisthan Fellow (free!) to download your branded API Score Certificate and track your progress.
                </p>
              </div>
              <div className="flex gap-3">
                <Link to="/auth/signin" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl border-gold/30 text-gold hover:bg-gold/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup" className="flex-1">
                  <Button className="w-full rounded-xl bg-gold text-gold-foreground hover:bg-gold/90">
                    Become a Fellow
                  </Button>
                </Link>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Free forever · No credit card · Takes 30 seconds
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
