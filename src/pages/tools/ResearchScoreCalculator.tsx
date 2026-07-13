import { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FlaskConical, BookOpen, GraduationCap, FileText, Award,
  RotateCcw, Info, TrendingUp, Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';

const SECTIONS = [
  {
    id: 'publications',
    title: 'Publications',
    icon: BookOpen,
    color: 'bg-gold/15 text-gold',
    items: [
      { id: 'journal_intl', label: 'Papers in international peer-reviewed journals', points: 15, hint: 'Scopus / WoS indexed' },
      { id: 'journal_national', label: 'Papers in national peer-reviewed journals', points: 10, hint: 'UGC-CARE list' },
      { id: 'conf_intl', label: 'International conference proceedings', points: 7, hint: 'Full paper in published proceedings' },
      { id: 'conf_national', label: 'National conference proceedings', points: 5, hint: 'Full paper in published proceedings' },
    ],
  },
  {
    id: 'books',
    title: 'Books & Chapters',
    icon: FileText,
    color: 'bg-accent/15 text-accent',
    items: [
      { id: 'book_sole', label: 'Sole-authored book (international publisher)', points: 50, hint: 'Springer, Elsevier, Wiley, etc.' },
      { id: 'book_co', label: 'Co-authored book / Edited volume', points: 25, hint: 'With ISBN' },
      { id: 'chapter', label: 'Book chapters in edited volumes', points: 10, hint: 'Reputed publisher with ISBN' },
    ],
  },
  {
    id: 'projects',
    title: 'Research Projects & Grants',
    icon: FlaskConical,
    color: 'bg-navy/80 text-warm',
    items: [
      { id: 'major_completed', label: 'Major project completed (>₹5L)', points: 20, hint: 'UGC / DST / ICSSR / DBT funded' },
      { id: 'major_ongoing', label: 'Major project ongoing', points: 10, hint: 'Currently funded and active' },
      { id: 'minor_completed', label: 'Minor project completed (<₹5L)', points: 10, hint: 'University / UGC minor grants' },
      { id: 'consultancy_proj', label: 'Consultancy / Sponsored project', points: 10, hint: 'Industry or govt. sponsored' },
    ],
  },
  {
    id: 'guidance',
    title: 'Research Guidance',
    icon: GraduationCap,
    color: 'bg-gold/10 text-gold',
    items: [
      { id: 'phd_awarded', label: 'Ph.D. students awarded degree', points: 15, hint: 'Per student awarded' },
      { id: 'phd_enrolled', label: 'Ph.D. students enrolled (thesis submitted)', points: 10, hint: 'Per student' },
      { id: 'mphil_awarded', label: 'M.Phil. students awarded / dissertations guided', points: 5, hint: 'Per student' },
    ],
  },
  {
    id: 'innovation',
    title: 'Patents & Innovation',
    icon: Lightbulb,
    color: 'bg-accent/10 text-accent',
    items: [
      { id: 'patent_granted', label: 'Patent granted (international)', points: 30, hint: 'USPTO, EPO, etc.' },
      { id: 'patent_national', label: 'Patent granted (national)', points: 20, hint: 'Indian Patent Office' },
      { id: 'patent_filed', label: 'Patent filed / published', points: 10, hint: 'Application published' },
      { id: 'policy_doc', label: 'Policy document / Award for innovation', points: 10, hint: 'Government adopted / recognized' },
    ],
  },
];

export default function ResearchScoreCalculator({ embedded }: { embedded?: boolean }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { ref: heroRef } = useScrollAnimation();
  const { saveResult } = useToolResultSaver();
  const lastSavedScore = useRef<number | null>(null);

  const updateCount = (id: string, value: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const sectionScores = useMemo(() => {
    return SECTIONS.map(sec => ({
      id: sec.id,
      score: sec.items.reduce((sum, item) => sum + (counts[item.id] || 0) * item.points, 0),
    }));
  }, [counts]);

  const totalScore = sectionScores.reduce((s, sec) => s + sec.score, 0);

  const getRating = (score: number) => {
    if (score >= 400) return { label: 'Outstanding', color: 'text-accent', emoji: '🏆' };
    if (score >= 250) return { label: 'Excellent', color: 'text-gold', emoji: '⭐' };
    if (score >= 150) return { label: 'Very Good', color: 'text-foreground', emoji: '👍' };
    if (score >= 80) return { label: 'Good', color: 'text-muted-foreground', emoji: '📈' };
    return { label: 'Developing', color: 'text-muted-foreground', emoji: '🌱' };
  };

  // Auto-save when score changes (debounced)
  useEffect(() => {
    if (totalScore === 0 || totalScore === lastSavedScore.current) return;
    const timer = setTimeout(() => {
      lastSavedScore.current = totalScore;
      const secScoreMap = Object.fromEntries(sectionScores.map(s => [s.id, s.score]));
      saveResult({
        toolType: 'research_score',
        toolName: 'Research Score Calculator',
        inputData: counts,
        resultData: { sectionScores: secScoreMap, rating: getRating(totalScore).label },
        score: totalScore,
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [totalScore]);

  const rating = getRating(totalScore);

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}
      
      <section className={cn("relative overflow-hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background")}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <FlaskConical className="h-4 w-4 text-accent" />
            <span className="text-accent text-sm font-medium">Research Analytics</span>
          </div>
          <h1 className={cn("font-serif font-bold mb-2", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
            Research Score <span className="text-gradient-gold">Calculator</span>
          </h1>
          <p className={cn("mx-auto", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg max-w-2xl text-warm/60")}>
            Quantify your research output across publications, projects, guidance, and innovation. 
            Enter the count of each activity to see your weighted research score.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left — Sections */}
            <div className="lg:col-span-2 space-y-6">
              {SECTIONS.map(sec => {
                const Icon = sec.icon;
                const secScore = sectionScores.find(s => s.id === sec.id)?.score || 0;

                return (
                  <div key={sec.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-4 p-5 md:p-6 border-b border-border">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', sec.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-foreground">{sec.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-foreground font-mono">{secScore}</span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>

                    <div className="px-5 md:px-6 py-4 space-y-4">
                      {sec.items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium text-foreground">{item.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.hint} · <span className="font-mono text-gold">{item.points} pts</span> each
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => updateCount(item.id, (counts[item.id] || 0) - 1)}
                              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground font-bold transition-colors"
                            >
                              −
                            </button>
                            <Input
                              type="number"
                              min={0}
                              value={counts[item.id] || ''}
                              onChange={(e) => updateCount(item.id, parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="w-16 rounded-xl text-center font-mono text-sm"
                            />
                            <button
                              onClick={() => updateCount(item.id, (counts[item.id] || 0) + 1)}
                              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground font-bold transition-colors"
                            >
                              +
                            </button>
                            <span className="text-xs text-muted-foreground font-mono w-14 text-right">
                              = {(counts[item.id] || 0) * item.points}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center">
                <Button onClick={() => setCounts({})} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-4 w-4" /> Reset All
                </Button>
              </div>
            </div>

            {/* Right — Score Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <div className="bg-gradient-to-br from-[hsl(228,45%,16%)] to-[hsl(228,35%,22%)] rounded-2xl p-6 border border-gold/20 text-center">
                  <span className="text-gold/60 text-xs tracking-[0.2em] uppercase">Research Score</span>
                  <div className="my-6">
                    <span className="text-5xl font-bold text-warm font-mono">{totalScore}</span>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-2xl">{rating.emoji}</span>
                      <span className={cn('text-lg font-serif font-bold', rating.color)}>{rating.label}</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3 text-left">
                    {SECTIONS.map(sec => {
                      const s = sectionScores.find(ss => ss.id === sec.id);
                      return (
                        <div key={sec.id} className="flex justify-between text-sm">
                          <span className="text-warm/60">{sec.title}</span>
                          <span className="text-warm/80 font-mono font-bold">{s?.score || 0}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                      <span className="text-gold font-semibold">Total</span>
                      <span className="text-gold font-mono font-bold">{totalScore}</span>
                    </div>
                  </div>
                </div>

                {/* Benchmarks */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" /> Score Benchmarks
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Outstanding', min: 400, color: 'text-accent' },
                      { label: 'Excellent', min: 250, color: 'text-gold' },
                      { label: 'Very Good', min: 150, color: 'text-foreground' },
                      { label: 'Good', min: 80, color: 'text-muted-foreground' },
                    ].map(b => (
                      <div key={b.label} className="flex items-center justify-between">
                        <span className={b.color}>{b.label}</span>
                        <span className="text-muted-foreground font-mono">≥ {b.min} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Note:</strong> Scores are indicative based on general UGC weightings. 
                    Actual scores may vary per university regulations. For joint publications, 
                    points may be divided by number of authors.
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
