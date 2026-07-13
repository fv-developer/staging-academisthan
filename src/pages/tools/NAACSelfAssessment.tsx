import { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ClipboardCheck, Sparkles, AlertTriangle, RotateCcw, Info, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';

/* NAAC Criterion 3 (Research, Innovations and Extension) — simplified weights
   Indicative only; institutional NAAC weights vary by HEI type.            */

const METRICS = [
  { id: 'm3_1_1',  label: '3.1.1  Sanctioned research projects (₹L per year)',                weight: 1.0,  hint: 'Sum of grant amounts in last 5 yrs' },
  { id: 'm3_2_1',  label: '3.2.1  Innovation ecosystem (workshops/seminars conducted)',       weight: 2.0,  hint: 'Number per year average' },
  { id: 'm3_3_1',  label: '3.3.1  Code of ethics, plagiarism, etc. (Y=10 / N=0)',             weight: 1.0,  hint: 'Self-rate compliance (0-10)' },
  { id: 'm3_3_2',  label: '3.3.2  Awards / recognitions for research',                        weight: 1.5,  hint: 'Count in last 5 years' },
  { id: 'm3_4_1',  label: '3.4.1  Extension activities (NSS/NCC/community)',                  weight: 1.0,  hint: 'Number conducted in last 5 yrs' },
  { id: 'm3_4_2',  label: '3.4.2  Awards for extension activities',                           weight: 1.0,  hint: 'Count from govt/recognised bodies' },
  { id: 'm3_4_3',  label: '3.4.3  Collaborative extension programs',                          weight: 1.0,  hint: 'Number per year average' },
  { id: 'm3_5_1',  label: '3.5.1  Linkages with industry / academia (MoUs)',                  weight: 1.5,  hint: 'Active MoUs/collaborations' },
  { id: 'm3_5_2',  label: '3.5.2  Functional MoUs (national/international)',                  weight: 1.5,  hint: 'Number with measurable activity' },
  { id: 'm3_1_2',  label: '3.1.2  Teachers with research grants (%)',                         weight: 2.0,  hint: '% faculty with funded projects' },
  { id: 'm3_1_3',  label: '3.1.3  Seminars / workshops on IPR / innovation conducted',        weight: 1.0,  hint: 'Count in last 5 yrs' },
  { id: 'm3_2_2',  label: '3.2.2  Number of papers published in UGC-CARE/Scopus/WoS',         weight: 2.5,  hint: 'Cumulative count' },
];

export default function NAACSelfAssessment() {
  const [values, setValues] = useState<Record<string, number>>({});
  const { ref: heroRef } = useScrollAnimation();
  const { saveResult } = useToolResultSaver();
  const lastSaved = useRef<number | null>(null);

  const update = (id: string, v: number) => setValues(prev => ({ ...prev, [id]: Math.max(0, v) }));
  const reset = () => setValues({});

  const totalScore = useMemo(() => {
    return METRICS.reduce((sum, m) => sum + (values[m.id] || 0) * m.weight, 0);
  }, [values]);

  const grade = useMemo(() => {
    if (totalScore >= 150) return { letter: 'A++', label: 'Outstanding', color: 'text-accent' };
    if (totalScore >= 100) return { letter: 'A+',  label: 'Excellent',  color: 'text-gold' };
    if (totalScore >= 70)  return { letter: 'A',   label: 'Very Good',  color: 'text-foreground' };
    if (totalScore >= 40)  return { letter: 'B+',  label: 'Good',       color: 'text-muted-foreground' };
    return { letter: 'B', label: 'Developing', color: 'text-muted-foreground' };
  }, [totalScore]);

  useEffect(() => {
    if (totalScore === 0 || totalScore === lastSaved.current) return;
    const t = setTimeout(() => {
      lastSaved.current = totalScore;
      saveResult({
        toolType: 'naac_criterion_3',
        toolName: 'NAAC Criterion 3 Self-Assessment',
        inputData: values,
        resultData: { grade: grade.letter },
        score: Math.round(totalScore),
      });
    }, 3000);
    return () => clearTimeout(t);
  }, [totalScore]);

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <ClipboardCheck className="h-4 w-4 text-accent" />
            <span className="text-accent text-sm font-medium">NAAC SSR · Criterion 3</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-4">
            NAAC Self- <span className="text-gradient-gold">Assessment</span>
          </h1>
          <p className="text-warm/60 text-lg max-w-2xl mx-auto">
            Indicative score for NAAC Criterion 3 — Research, Innovation & Extension. Use this for IQAC prep
            before submitting your formal SSR.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-8 space-y-4">
              <div className="bg-gold/5 border border-gold/15 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                <span>Enter cumulative values from the last 5 academic years. Self-declared; not verified.</span>
              </div>

              {METRICS.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-border/50 pb-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-medium text-foreground">{m.label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.hint} · weight ×{m.weight}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={values[m.id] || ''}
                    onChange={(e) => update(m.id, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 rounded-xl text-center font-mono text-sm shrink-0"
                  />
                </div>
              ))}

              <div className="flex justify-center pt-4">
                <Button onClick={reset} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </div>

            <div>
              <div className="sticky top-28 space-y-6">
                <div className="bg-gradient-to-br from-[hsl(228,45%,16%)] to-[hsl(228,35%,22%)] rounded-2xl p-6 border border-gold/20 text-center">
                  <span className="text-gold/60 text-xs tracking-[0.2em] uppercase">Criterion 3 Score</span>
                  <div className="my-6">
                    <span className="text-5xl font-bold text-warm font-mono">{Math.round(totalScore)}</span>
                    <p className={cn('font-serif text-lg font-bold mt-2', grade.color)}>
                      Indicative Grade: {grade.letter}
                    </p>
                    <p className="text-warm/40 text-xs mt-1">{grade.label}</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" /> Grade Benchmarks
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { g: 'A++', min: 150, c: 'text-accent' },
                      { g: 'A+',  min: 100, c: 'text-gold' },
                      { g: 'A',   min: 70,  c: 'text-foreground' },
                      { g: 'B+',  min: 40,  c: 'text-muted-foreground' },
                    ].map(b => (
                      <div key={b.g} className="flex justify-between">
                        <span className={b.c}>{b.g}</span>
                        <span className="text-muted-foreground font-mono">≥ {b.min}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                  <p className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                    <strong className="text-foreground/70">Disclaimer</strong>
                  </p>
                  <p className="mt-1">
                    Indicative tool only. Actual NAAC grade is determined by the
                    Assessment & Accreditation team based on official SSR submission, DVV clarification,
                    and Peer Team Visit. Visit <a href="https://www.naac.gov.in" target="_blank" rel="noopener noreferrer" className="text-gold underline">naac.gov.in</a> for official manuals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
