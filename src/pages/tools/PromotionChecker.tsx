import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Award, CheckCircle2, XCircle, ArrowRight, Sparkles, RotateCcw, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';

/* ─────────────────────────────────────────────────────────────
   CAS Eligibility Checker — UGC Regulations 2018 (4th Amendment)
   Academic Levels 10 → 14 (replaces old AGP 6000/7000/8000 nomenclature)
   ───────────────────────────────────────────────────────────── */

type Stage = {
  id: string;
  label: string;
  from: string;
  to: string;
  minYears: number;
  criteria: {
    label: string; key: string; type: 'number' | 'boolean'; required: number | boolean; hint: string;
  }[];
};

const STAGES: Stage[] = [
  {
    id: 'L10_L11',
    label: 'Level 10 → Level 11',
    from: 'Assistant Professor (entry)',
    to: 'Assistant Professor (mid)',
    minYears: 4,
    criteria: [
      { label: 'Years of service at Level 10', key: 'years', type: 'number', required: 4, hint: 'Minimum 4 years' },
      { label: 'Teaching score (% — UGC Table 2)', key: 'teaching', type: 'number', required: 75, hint: 'Minimum 75% — self-appraisal + student feedback' },
      { label: 'Completed Orientation programme (1 month)', key: 'orientation', type: 'boolean', required: true, hint: 'UGC-HRDC orientation' },
      { label: 'Completed 1 Refresher / FDP', key: 'refresher1', type: 'boolean', required: true, hint: 'Min 2 weeks' },
    ],
  },
  {
    id: 'L11_L12',
    label: 'Level 11 → Level 12',
    from: 'Assistant Professor (mid)',
    to: 'Assistant Professor (senior)',
    minYears: 5,
    criteria: [
      { label: 'Years at Level 11', key: 'years', type: 'number', required: 5, hint: 'Minimum 5 years' },
      { label: 'Teaching score (%)', key: 'teaching', type: 'number', required: 75, hint: '≥ 75% per UGC Table 2' },
      { label: 'Completed 2 Refresher / FDPs', key: 'refresher2', type: 'boolean', required: true, hint: 'Min 2 weeks each' },
      { label: 'Research score (UGC Table 3A pts)', key: 'research', type: 'number', required: 20, hint: 'Cumulative — publications + projects' },
    ],
  },
  {
    id: 'L12_L13A',
    label: 'Level 12 → Level 13A (Associate Professor)',
    from: 'Assistant Professor (senior)',
    to: 'Associate Professor',
    minYears: 3,
    criteria: [
      { label: 'Years at Level 12', key: 'years', type: 'number', required: 3, hint: 'Minimum 3 years' },
      { label: 'Teaching score (%)', key: 'teaching', type: 'number', required: 75, hint: '≥ 75% per UGC Table 2' },
      { label: 'Ph.D. awarded', key: 'phd', type: 'boolean', required: true, hint: 'Mandatory under UGC 2018' },
      { label: 'Total UGC-CARE / Scopus publications', key: 'pubs', type: 'number', required: 7, hint: 'Minimum 7 across career' },
      { label: 'Research score (UGC Table 3A pts)', key: 'research', type: 'number', required: 75, hint: 'Cumulative' },
      { label: 'Completed 1 Refresher / FDP (last cycle)', key: 'refresher1', type: 'boolean', required: true, hint: 'During current cycle' },
    ],
  },
  {
    id: 'L13A_L14',
    label: 'Level 13A → Level 14 (Professor)',
    from: 'Associate Professor',
    to: 'Professor',
    minYears: 3,
    criteria: [
      { label: 'Years as Associate Professor', key: 'years', type: 'number', required: 3, hint: 'Minimum 3 years at L13A' },
      { label: 'Teaching score (%)', key: 'teaching', type: 'number', required: 75, hint: '≥ 75%' },
      { label: 'Total UGC-CARE / Scopus publications', key: 'pubs', type: 'number', required: 10, hint: 'Minimum 10 across career' },
      { label: 'Research score (UGC Table 3A pts)', key: 'research', type: 'number', required: 120, hint: 'Cumulative' },
      { label: 'Ph.D. students supervised (awarded)', key: 'phdGuided', type: 'number', required: 1, hint: 'Minimum 1' },
    ],
  },
];

export default function PromotionChecker({ embedded }: { embedded?: boolean }) {
  const [selectedStage, setSelectedStage] = useState<string>('L10_L11');
  const [inputs, setInputs] = useState<Record<string, number | boolean>>({});
  const [showResult, setShowResult] = useState(false);
  const { ref: heroRef } = useScrollAnimation();
  const { saveResult } = useToolResultSaver();

  const stage = STAGES.find(s => s.id === selectedStage)!;

  const updateInput = (key: string, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setShowResult(false);
  };

  const results = useMemo(() => {
    return stage.criteria.map(c => {
      const val = inputs[c.key];
      if (c.type === 'boolean') {
        return { ...c, met: val === true, status: (val === true ? 'pass' : 'fail') as 'pass' | 'fail' };
      }
      const numVal = typeof val === 'number' ? val : 0;
      return { ...c, met: numVal >= (c.required as number), status: (numVal >= (c.required as number) ? 'pass' : 'fail') as 'pass' | 'fail' };
    });
  }, [inputs, stage]);

  const allMet = results.every(r => r.met);
  const failCount = results.filter(r => r.status === 'fail').length;

  const reset = () => { setInputs({}); setShowResult(false); };

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}

      <section className={cn("relative overflow-hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background")}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Award className="h-4 w-4 text-accent" />
            <span className="text-accent text-sm font-medium">UGC 2018 · 4th Amendment</span>
          </div>
          <h1 className={cn("font-serif font-bold mb-2", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
            CAS Promotion <span className="text-gradient-gold">Eligibility Checker</span>
          </h1>
          <p className={cn("mx-auto", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg max-w-2xl text-warm/60")}>
            Check eligibility for Career Advancement Scheme promotions across UGC Academic Levels 10 → 14
            under the current 2018 Regulations.
          </p>
          <Link to="/resources/cas-promotion-faq" className={cn("inline-flex items-center gap-1 text-gold hover:underline", embedded ? "text-xs mt-2" : "text-sm mt-3")}>
            Read full CAS Promotion Guide <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedStage(s.id); reset(); }}
                className={cn(
                  'rounded-xl p-4 border text-left transition-all',
                  selectedStage === s.id
                    ? 'bg-gold/10 border-gold/40 shadow-lg'
                    : 'bg-card border-border hover:border-gold/20'
                )}
              >
                <span className="text-xs text-muted-foreground">{s.from}</span>
                <ArrowRight className="h-3 w-3 text-gold my-1" />
                <span className="text-sm font-bold text-foreground">{s.to}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{s.minYears} yrs min</p>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">{stage.label}</h2>
                    <p className="text-muted-foreground text-xs mt-1">{stage.from} → {stage.to}</p>
                  </div>
                  <Button onClick={reset} variant="ghost" size="sm" className="rounded-xl gap-1 text-muted-foreground">
                    <RotateCcw className="h-3 w-3" /> Reset
                  </Button>
                </div>

                <div className="space-y-5">
                  {stage.criteria.map(c => (
                    <div key={c.key} className={cn(
                      'rounded-xl border p-4 transition-colors',
                      showResult && results.find(r => r.key === c.key)?.status === 'fail'
                        ? 'border-destructive/30 bg-destructive/5'
                        : showResult && results.find(r => r.key === c.key)?.status === 'pass'
                          ? 'border-accent/30 bg-accent/5'
                          : 'border-border'
                    )}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-foreground">{c.label}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.hint}</p>
                        </div>
                        {c.type === 'number' ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Input
                              type="number"
                              min={0}
                              value={typeof inputs[c.key] === 'number' ? (inputs[c.key] as number) : ''}
                              onChange={(e) => updateInput(c.key, Math.max(0, parseInt(e.target.value) || 0))}
                              placeholder="0"
                              className="w-20 rounded-xl text-center font-mono text-sm"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">≥ {c.required as number}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateInput(c.key, !inputs[c.key])}
                            className={cn(
                              'w-14 h-8 rounded-full border-2 transition-all flex items-center px-1 shrink-0',
                              inputs[c.key] ? 'bg-accent/20 border-accent' : 'bg-muted border-border'
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded-full transition-all',
                              inputs[c.key] ? 'translate-x-[22px] bg-accent' : 'translate-x-0 bg-muted-foreground/40'
                            )} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setShowResult(true);
                    saveResult({
                      toolType: 'promotion_check',
                      toolName: 'CAS Promotion Checker (UGC 2018)',
                      inputData: { stage: selectedStage, ...inputs } as Record<string, unknown>,
                      resultData: { eligible: results.every(r => r.met), stage: stage.label, framework: 'UGC-2018' },
                      score: results.filter(r => r.met).length,
                    });
                  }}
                  className="w-full mt-6 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl h-12 text-base font-semibold gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" /> Check Eligibility
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-28 space-y-6">
                {showResult ? (
                  <div className={cn(
                    'rounded-2xl p-6 border text-center',
                    allMet ? 'bg-accent/10 border-accent/30' : 'bg-destructive/5 border-destructive/20'
                  )}>
                    <div className={cn(
                      'w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center',
                      allMet ? 'bg-accent/20' : 'bg-destructive/10'
                    )}>
                      {allMet ? <CheckCircle2 className="h-10 w-10 text-accent" /> : <XCircle className="h-10 w-10 text-destructive" />}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                      {allMet ? 'Eligible! 🎉' : 'Not Yet Eligible'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {allMet
                        ? `You meet the indicative criteria for promotion to ${stage.to}.`
                        : `${failCount} criterion${failCount > 1 ? 'a' : ''} not met.`
                      }
                    </p>

                    <div className="text-left space-y-2 mt-4">
                      {results.map(r => (
                        <div key={r.key} className="flex items-center gap-2 text-sm">
                          {r.status === 'pass'
                            ? <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                            : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          <span className={cn(r.status === 'fail' ? 'text-destructive' : 'text-foreground')}>
                            {r.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-2">Ready to Check?</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill the criteria and click "Check Eligibility".
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Indicative only.</strong> Based on UGC Regulations 2018 (4th Amendment).
                    Your university's IQAC and Statutory Selection Committee make the final determination.
                    Self-declared values are not verified by Academisthan Foundation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!embedded && <Footer />}
    </div>
  );
}
