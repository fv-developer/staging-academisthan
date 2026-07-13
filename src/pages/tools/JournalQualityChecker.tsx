import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, BookOpen, AlertTriangle, CheckCircle2, ExternalLink, Loader2, Info, Sparkles,
} from 'lucide-react';
import { z } from 'zod';

const querySchema = z.object({
  query: z.string().trim().min(3, 'Enter a journal name, DOI, or ISSN (min 3 chars)').max(300, 'Max 300 characters'),
});

type Result = {
  summary: string;
  indexedIn: string[];
  ugcCare: 'yes' | 'no' | 'unknown';
  scopus: 'yes' | 'no' | 'unknown';
  webOfScience: 'yes' | 'no' | 'unknown';
  predatoryRisk: 'low' | 'medium' | 'high' | 'unknown';
  sources: string[];
};

export default function JournalQualityChecker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { ref: heroRef } = useScrollAnimation();
  const { toast } = useToast();

  const checkJournal = async () => {
    const parsed = querySchema.safeParse({ query });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('journal-quality', {
        body: { query: parsed.data.query },
      });

      if (fnErr) throw fnErr;
      if (data?.result) {
        setResult(data.result as Result);
      } else {
        // Graceful fallback
        setResult({
          summary: `Unable to fetch live indexing data for "${parsed.data.query}". Please verify manually using the official UGC-CARE portal and Scopus/WoS source lists linked below.`,
          indexedIn: [],
          ugcCare: 'unknown',
          scopus: 'unknown',
          webOfScience: 'unknown',
          predatoryRisk: 'unknown',
          sources: [
            'https://ugccare.unipune.ac.in/',
            'https://www.scopus.com/sources',
            'https://mjl.clarivate.com/',
          ],
        });
      }
    } catch (e: any) {
      toast({ title: 'Lookup failed', description: e?.message || 'Try again later', variant: 'destructive' });
      setError('Service temporarily unavailable. Please use the official portals linked below.');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'yes') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Listed</Badge>;
    if (status === 'no') return <Badge variant="destructive">Not listed</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>;
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/3 w-72 h-72 bg-gold/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-4">
            <Search className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">AI-Powered Lookup</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-4">
            Journal Quality <span className="text-gradient-gold">Checker</span>
          </h1>
          <p className="text-warm/60 text-lg max-w-2xl mx-auto">
            Check if a journal is UGC-CARE listed, Scopus indexed, or Web of Science indexed —
            and get a predatory-journal risk assessment before you submit.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <Label htmlFor="journal-query" className="text-sm font-medium">Journal name, DOI, or ISSN</Label>
            <div className="flex gap-3 mt-2">
              <Input
                id="journal-query"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 300))}
                placeholder='e.g. "IEEE Transactions on Education" or "ISSN 1939-1382"'
                className="rounded-xl flex-1"
                onKeyDown={(e) => e.key === 'Enter' && checkJournal()}
                maxLength={300}
              />
              <Button
                onClick={checkJournal}
                disabled={loading}
                className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 gap-2 px-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Check
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>

          {result && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
              <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" /> Indexing Status
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">UGC-CARE</p>
                  {statusBadge(result.ugcCare)}
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Scopus</p>
                  {statusBadge(result.scopus)}
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Web of Science</p>
                  {statusBadge(result.webOfScience)}
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${
                result.predatoryRisk === 'high' ? 'bg-destructive/10 border-destructive/30' :
                result.predatoryRisk === 'medium' ? 'bg-gold/10 border-gold/30' :
                result.predatoryRisk === 'low' ? 'bg-emerald-500/10 border-emerald-500/30' :
                'bg-muted/30 border-border'
              }`}>
                <p className="text-sm font-semibold flex items-center gap-2">
                  {result.predatoryRisk === 'low'
                    ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Predatory risk: Low</>
                    : result.predatoryRisk === 'high'
                      ? <><AlertTriangle className="h-4 w-4 text-destructive" /> Predatory risk: HIGH — investigate further</>
                      : <><Info className="h-4 w-4 text-muted-foreground" /> Predatory risk: {result.predatoryRisk}</>}
                </p>
              </div>

              {result.sources?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Verify on official portals:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map(s => (
                      <a key={s} href={s} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline inline-flex items-center gap-1">
                        {new URL(s).hostname.replace('www.', '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
              <strong className="text-foreground/70">Disclaimer</strong>
            </p>
            <p className="mt-1">
              AI-interpreted result. Always cross-verify on the official
              <a href="https://ugccare.unipune.ac.in/" className="text-gold underline mx-1" target="_blank" rel="noopener noreferrer">UGC-CARE portal</a>,
              <a href="https://www.scopus.com/sources" className="text-gold underline mx-1" target="_blank" rel="noopener noreferrer">Scopus Source List</a>, and
              <a href="https://mjl.clarivate.com/" className="text-gold underline mx-1" target="_blank" rel="noopener noreferrer">Clarivate Master Journal List</a>
              before submission. Academisthan Foundation is not responsible for publication decisions made based on this tool.
            </p>
          </div>

          <div className="bg-gold/5 border border-gold/15 rounded-2xl p-5">
            <h3 className="font-serif text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" /> Red flags of predatory journals
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Promises publication within days/weeks of submission</li>
              <li>• Charges high APC without clear editorial process</li>
              <li>• Editorial board members unverifiable or lack credentials</li>
              <li>• Spam-style email invitations to publish</li>
              <li>• Not listed on UGC-CARE / Scopus / WoS / DOAJ</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
