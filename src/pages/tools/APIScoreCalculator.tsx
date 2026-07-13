import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator, BookOpen, FlaskConical, Award, ChevronDown, ChevronUp,
  Info, RotateCcw, CheckCircle2, AlertTriangle, Sparkles,
} from 'lucide-react';
import { APIScoreCertificateModal } from '@/components/tools/APIScoreCertificateModal';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';

/* ─────────────────────────────────────────────────────────────
   UGC Regulations 2018 — Academic & Research Score Calculator
   Based on:
     • Table 2  → Teaching Performance (max 100, target 75%)
     • Table 3A → Research Score (cumulative points)
   Legacy 2010 API framework removed — university PBAS now uses
   minimum qualifications + research score for promotion.
   ───────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    id: 'teaching',
    title: 'Teaching Performance (UGC Table 2)',
    subtitle: 'Self-appraisal & student feedback. Each item scored 0–20 (max 100). UGC requires ≥ 75% for CAS promotion.',
    icon: BookOpen,
    color: 'bg-gold/15 text-gold',
    maxScore: 100,
    items: [
      { id: 't_classes',   label: 'Classes engaged (% of allotted load)',     max: 20, hint: '≥ 80% earns full marks' },
      { id: 't_feedback',  label: 'Student feedback score',                    max: 20, hint: 'Anonymous course-end feedback rating' },
      { id: 't_result',    label: 'Result of students (pass %)',               max: 20, hint: 'Internal/university exam outcomes' },
      { id: 't_innovation',label: 'Innovative teaching (ICT, flipped, blended)', max: 20, hint: 'Verified evidence required' },
      { id: 't_eval',      label: 'Examination & evaluation duties',           max: 20, hint: 'Paper setting, invigilation, evaluation' },
    ],
  },
  {
    id: 'research',
    title: 'Research Score (UGC Table 3A)',
    subtitle: 'Cumulative points across publications, projects, patents, supervision and e-content (no upper cap).',
    icon: FlaskConical,
    color: 'bg-accent/15 text-accent',
    maxScore: 200,
    items: [
      { id: 'r_journal_care',   label: 'Papers — UGC-CARE / Scopus / WoS journals (8 pts each)',          max: 200, hint: 'Enter total points: count × 8' },
      { id: 'r_journal_other',  label: 'Papers — other peer-reviewed journals (5 pts each)',              max: 100, hint: 'Enter total points: count × 5' },
      { id: 'r_book_intl',      label: 'Book — international publisher (12 pts each)',                    max: 60,  hint: 'Springer, Elsevier, Wiley etc.' },
      { id: 'r_book_natl',      label: 'Book — national publisher (10 pts each)',                         max: 50,  hint: 'With ISBN, reputed publisher' },
      { id: 'r_chapter',        label: 'Book chapter (5 pts each)',                                       max: 50,  hint: 'In edited volume with ISBN' },
      { id: 'r_phd_awarded',    label: 'Ph.D. supervised — awarded (10 pts each)',                        max: 50,  hint: 'Per student awarded degree' },
      { id: 'r_phd_submitted',  label: 'Ph.D. — thesis submitted (7 pts each)',                           max: 35,  hint: 'Per student' },
      { id: 'r_project_major',  label: 'Major sponsored project — completed (10 pts each)',               max: 30,  hint: '> ₹10L, UGC/DST/ICSSR/DBT funded' },
      { id: 'r_project_minor',  label: 'Minor project / consultancy (5 pts each)',                        max: 25,  hint: '< ₹10L or industry consultancy' },
      { id: 'r_patent_intl',    label: 'Patent granted — international (10 pts each)',                    max: 30,  hint: 'USPTO, EPO, JPO etc.' },
      { id: 'r_patent_natl',    label: 'Patent granted — national (7 pts each)',                          max: 28,  hint: 'Indian Patent Office' },
      { id: 'r_mooc',           label: 'MOOC (4+ weeks, UGC SWAYAM, 20 pts each)',                        max: 40,  hint: 'Developed & launched' },
      { id: 'r_econtent',       label: 'e-Content module / video lecture (4 pts each)',                   max: 40,  hint: 'On approved platform' },
    ],
  },
  {
    id: 'other',
    title: 'Other Academic Contributions',
    subtitle: 'Extension, professional development, awards and administrative service.',
    icon: Award,
    color: 'bg-navy/80 text-warm',
    maxScore: 50,
    items: [
      { id: 'o_fdp',     label: 'FDP / Refresher / MOOC completed (5 pts each, 2-week+)', max: 25, hint: 'UGC-HRDC, ARPIT, MMTTC etc.' },
      { id: 'o_extn',    label: 'Extension activities (NSS / NCC / community)',           max: 10, hint: 'Documented field work' },
      { id: 'o_awards',  label: 'Awards & recognitions (state / national / intl.)',      max: 10, hint: 'Issued by recognised body' },
      { id: 'o_admin',   label: 'Administrative / governance roles (BoS, IQAC, Dean)',    max: 5,  hint: 'Documented appointment' },
    ],
  },
];

/* UGC 2018 Academic Level promotion thresholds (Table 3) */
const PROMOTION_LEVELS = [
  {
    label: 'Level 10 → Level 11',
    track: 'Assistant Professor (entry → 4 yrs)',
    teachingMin: 75, researchMin: 0, otherMin: 0,
    notes: '4 yrs service · Orientation + 1 Refresher · 1 publication preferred',
  },
  {
    label: 'Level 11 → Level 12',
    track: 'Assistant Professor (mid-career, 5 yrs)',
    teachingMin: 75, researchMin: 20, otherMin: 5,
    notes: '5 yrs at L11 · 2 Refresher/FDPs · cumulative publications encouraged',
  },
  {
    label: 'Level 12 → Level 13A (Associate Professor)',
    track: 'Asst → Associate Professor',
    teachingMin: 75, researchMin: 75, otherMin: 10,
    notes: '3 yrs at L12 · Ph.D. mandatory · 7 publications · 1 Refresher',
  },
  {
    label: 'Level 13A → Level 14 (Professor)',
    track: 'Associate → Professor',
    teachingMin: 75, researchMin: 120, otherMin: 10,
    notes: '3 yrs as Associate · 10 publications · 1 Ph.D. supervised',
  },
];

export default function APIScoreCalculator({ embedded }: { embedded?: boolean }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expandedCats, setExpandedCats] = useState<string[]>(['teaching']);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const { ref: heroRef } = useScrollAnimation();
  const { saveResult } = useToolResultSaver();
  const lastSavedScore = useRef<number | null>(null);

  const updateScore = (itemId: string, value: number) => {
    setScores(prev => ({ ...prev, [itemId]: value }));
  };

  const categoryScores = useMemo(() => {
    return CATEGORIES.map(cat => {
      const rawTotal = cat.items.reduce((sum, item) => {
        const val = Math.min(scores[item.id] || 0, item.max);
        return sum + val;
      }, 0);
      return { id: cat.id, score: Math.min(rawTotal, cat.maxScore), max: cat.maxScore };
    });
  }, [scores]);

  const totalScore = categoryScores.reduce((s, c) => s + c.score, 0);
  const maxPossible = CATEGORIES.reduce((s, c) => s + c.maxScore, 0);
  const percentage = Math.round((totalScore / maxPossible) * 100);

  useEffect(() => {
    if (totalScore === 0 || totalScore === lastSavedScore.current) return;
    const timer = setTimeout(() => {
      lastSavedScore.current = totalScore;
      const catScoreMap = Object.fromEntries(categoryScores.map(c => [c.id, c.score]));
      saveResult({
        toolType: 'api_score',
        toolName: 'UGC Academic & Research Score Calculator (2018)',
        inputData: scores,
        resultData: { categoryScores: catScoreMap, percentage, framework: 'UGC-2018' },
        score: totalScore,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [totalScore]);

  const resetAll = () => setScores({});
  const toggleCategory = (catId: string) =>
    setExpandedCats(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
  const getCatScore = (catId: string) => categoryScores.find(c => c.id === catId);

  const teachingScore = getCatScore('teaching')?.score || 0;
  const researchScore = getCatScore('research')?.score || 0;
  const otherScore = getCatScore('other')?.score || 0;

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}

      <section className={cn("relative overflow-hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background")}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gold/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-4">
            <Calculator className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">UGC 2018 Regulations · 4th Amendment</span>
          </div>
          <h1 className={cn("font-serif font-bold mb-2", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
            Academic & Research <span className="text-gradient-gold">Score Calculator</span>
          </h1>
          <p className={cn("mx-auto", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg max-w-2xl text-warm/60")}>
            Calculate your Teaching Performance + Research Score under the current UGC 2018 framework
            (Tables 2 &amp; 3A) used for CAS promotion across Academic Levels 10 → 14.
          </p>
          <p className={cn("text-xs mt-3 max-w-xl mx-auto", embedded ? "text-gold/95" : "text-gold/70")}>
            Replaces the legacy 2010 API points system. All values entered are self-declared.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {CATEGORIES.map(cat => {
                const catScore = getCatScore(cat.id);
                const isExpanded = expandedCats.includes(cat.id);
                const Icon = cat.icon;
                const pct = catScore ? Math.round((catScore.score / catScore.max) * 100) : 0;

                return (
                  <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', cat.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base md:text-lg font-bold text-foreground">{cat.title}</h3>
                        <p className="text-muted-foreground text-xs mt-0.5">{cat.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-foreground">{catScore?.score || 0}</span>
                          <span className="text-muted-foreground text-sm">/{cat.maxScore}</span>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center">
                          <span className={cn('text-xs font-bold', pct >= 60 ? 'text-accent' : pct >= 30 ? 'text-gold' : 'text-muted-foreground')}>{pct}%</span>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-5 md:px-6 py-4 space-y-4">
                        <div className="bg-gold/5 border border-gold/15 rounded-lg p-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <Info className="h-3 w-3 text-gold shrink-0 mt-0.5" />
                          <span>Self-declared values — not verified by Academisthan or UGC. Maintain documentary evidence per your IQAC.</span>
                        </div>
                        {cat.items.map(item => (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm font-medium text-foreground">{item.label}</Label>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Info className="h-3 w-3" /> {item.hint} · Max: {item.max}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                min={0}
                                max={item.max}
                                value={scores[item.id] || ''}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.min(item.max, parseInt(e.target.value) || 0));
                                  updateScore(item.id, v);
                                }}
                                placeholder="0"
                                className="w-20 rounded-xl text-center font-mono text-sm"
                              />
                              <span className="text-xs text-muted-foreground w-8">/ {item.max}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-center">
                <Button onClick={resetAll} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-4 w-4" /> Reset All Scores
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <div className="bg-gradient-to-br from-[hsl(228,45%,16%)] to-[hsl(228,35%,22%)] rounded-2xl p-6 border border-gold/20 text-center">
                  <span className="text-gold/60 text-xs tracking-[0.2em] uppercase">Your UGC Score</span>
                  <div className="relative w-36 h-36 mx-auto my-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(228,25%,25%)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke="hsl(38,55%,58%)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(percentage / 100) * 327} 327`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-warm font-mono">{totalScore}</span>
                      <span className="text-warm/40 text-xs">/ {maxPossible}</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    {CATEGORIES.map(cat => {
                      const cs = getCatScore(cat.id);
                      const labelShort = cat.id === 'teaching' ? 'Teaching' : cat.id === 'research' ? 'Research' : 'Other';
                      return (
                        <div key={cat.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-warm/60">{labelShort}</span>
                            <span className="text-warm/80 font-mono">{cs?.score || 0}/{cat.maxScore}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                cat.id === 'teaching' ? 'bg-gold' : cat.id === 'research' ? 'bg-accent' : 'bg-warm/60'
                              )}
                              style={{ width: `${cs ? (cs.score / cs.max) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalScore > 0 && (
                    <div className="space-y-3 mt-4">
                      <Button
                        onClick={() => setCertModalOpen(true)}
                        className="w-full rounded-xl h-11 bg-gold text-gold-foreground hover:bg-gold/90 font-semibold gap-2"
                      >
                        <Award className="h-4 w-4" /> Get Your Certificate
                      </Button>
                      
                      <Link to="/tools/api-scores/history" className="block">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl h-11 font-semibold gap-2 border-gold/30 hover:bg-gold/10"
                        >
                          <Sparkles className="h-4 w-4" /> View Score History
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <APIScoreCertificateModal
                  open={certModalOpen}
                  onOpenChange={setCertModalOpen}
                  totalScore={totalScore}
                  maxScore={maxPossible}
                  cat1Score={teachingScore}
                  cat1Max={100}
                  cat2Score={researchScore}
                  cat2Max={200}
                  cat3Score={otherScore}
                  cat3Max={50}
                />

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" /> CAS Promotion Eligibility
                  </h3>
                  <div className="space-y-3">
                    {PROMOTION_LEVELS.map(level => {
                      const teachingPct = (teachingScore / 100) * 100;
                      const eligible =
                        teachingPct >= level.teachingMin &&
                        researchScore >= level.researchMin &&
                        otherScore >= level.otherMin;

                      return (
                        <div key={level.label} className="flex items-start gap-2">
                          {eligible ? (
                            <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-gold/60 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className={cn('text-xs font-semibold', eligible ? 'text-accent' : 'text-foreground')}>
                              {level.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{level.track}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{level.notes}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                    <strong className="text-foreground/70">Important Disclaimer</strong>
                  </p>
                  <p>
                    Indicative <strong>self-assessment</strong> based on UGC Regulations 2018 (4th Amendment).
                    All values are self-declared and not verified by Academisthan Foundation, UGC, MSBSVET or any regulatory body.
                  </p>
                  <p>
                    Final API / Research Score is determined by your university's <strong>IQAC and Statutory Selection Committee</strong>.
                    Always cross-check with the latest <a href="https://www.ugc.gov.in" target="_blank" rel="noopener noreferrer" className="text-gold underline">UGC notifications</a> and
                    your institution's PBAS rubric. Academisthan Foundation bears <strong>no responsibility</strong> for decisions made based on this tool.
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
