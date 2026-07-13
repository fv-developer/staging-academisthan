import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  Trophy, Plus, Trash2, BookOpen, FlaskConical, Award,
  GraduationCap, Globe, Lightbulb, Heart, Users, Sparkles,
  Save, RotateCcw, Download, Star, TrendingUp, Zap,
  CheckCircle2, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Contribution Categories ── */
const CONTRIBUTION_CATEGORIES = [
  {
    id: 'publications',
    title: 'Research Publications',
    icon: BookOpen,
    color: 'bg-gold/15 text-gold',
    placeholder: 'e.g. "Published paper on AI in Education in IEEE Transactions, Impact Factor 8.2, 2025"',
    impactLevels: ['National', 'International', 'Highly Cited'],
  },
  {
    id: 'projects',
    title: 'Research Projects & Grants',
    icon: FlaskConical,
    color: 'bg-accent/15 text-accent',
    placeholder: 'e.g. "Principal Investigator — DST-SERB Project on ML for Healthcare, ₹25L, 2023-2026"',
    impactLevels: ['Minor Grant', 'Major Grant', 'Industry Sponsored'],
  },
  {
    id: 'patents',
    title: 'Patents & Innovation',
    icon: Lightbulb,
    color: 'bg-teal/15 text-teal',
    placeholder: 'e.g. "Patent Granted — Smart Attendance System Using AI, Indian Patent Office, 2024"',
    impactLevels: ['Filed', 'Published', 'Granted'],
  },
  {
    id: 'awards',
    title: 'Awards & Recognition',
    icon: Award,
    color: 'bg-gold/20 text-gold',
    placeholder: 'e.g. "Best Teacher Award — Maharashtra State Government, 2024"',
    impactLevels: ['Institutional', 'State', 'National', 'International'],
  },
  {
    id: 'supervision',
    title: 'Research Supervision',
    icon: GraduationCap,
    color: 'bg-primary/15 text-primary',
    placeholder: 'e.g. "Ph.D. Awarded — Dr. Ravi Kumar, Topic: Deep Learning in NLP, 2025"',
    impactLevels: ['M.Phil.', 'Ph.D. Enrolled', 'Ph.D. Awarded'],
  },
  {
    id: 'community',
    title: 'Community & Extension',
    icon: Heart,
    color: 'bg-accent/10 text-accent',
    placeholder: 'e.g. "Organized NSS Camp for Digital Literacy in Rural Maharashtra, 500+ beneficiaries, 2025"',
    impactLevels: ['Local', 'State', 'National'],
  },
  {
    id: 'leadership',
    title: 'Academic Leadership',
    icon: Users,
    color: 'bg-navy/80 text-warm',
    placeholder: 'e.g. "Dean, Faculty of Science — University of Mumbai, 2023-present"',
    impactLevels: ['Department', 'Faculty', 'University', 'National Body'],
  },
  {
    id: 'invited',
    title: 'Invited Talks & Keynotes',
    icon: Globe,
    color: 'bg-gold/10 text-gold',
    placeholder: 'e.g. "Keynote Speaker — International Conference on NEP 2020, New Delhi, 2025"',
    impactLevels: ['Workshop', 'National Conference', 'International Conference'],
  },
];

type ContributionEntry = {
  id: string;
  text: string;
  impact: string;
  year: string;
};

type ContributionData = Record<string, ContributionEntry[]>;

export default function NotableContributions({ embedded }: { embedded?: boolean }) {
  const { profile } = useAuth();
  const { ref: heroRef } = useScrollAnimation();
  const [data, setData] = useState<ContributionData>({});
  const [expandedCats, setExpandedCats] = useState<string[]>(['publications']);

  const addEntry = (catId: string) => {
    setData(prev => ({
      ...prev,
      [catId]: [...(prev[catId] || []), { id: crypto.randomUUID(), text: '', impact: '', year: new Date().getFullYear().toString() }],
    }));
    if (!expandedCats.includes(catId)) setExpandedCats(prev => [...prev, catId]);
  };

  const updateEntry = (catId: string, entryId: string, field: keyof ContributionEntry, value: string) => {
    setData(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).map(e => e.id === entryId ? { ...e, [field]: value } : e),
    }));
  };

  const removeEntry = (catId: string, entryId: string) => {
    setData(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).filter(e => e.id !== entryId),
    }));
  };

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const stats = useMemo(() => {
    let total = 0;
    let filledCats = 0;
    CONTRIBUTION_CATEGORIES.forEach(cat => {
      const entries = (data[cat.id] || []).filter(e => e.text.trim());
      total += entries.length;
      if (entries.length > 0) filledCats++;
    });
    return { total, filledCats };
  }, [data]);

  const impactScore = useMemo(() => {
    let score = 0;
    CONTRIBUTION_CATEGORIES.forEach(cat => {
      (data[cat.id] || []).filter(e => e.text.trim()).forEach(entry => {
        const levelIndex = cat.impactLevels.indexOf(entry.impact);
        score += (levelIndex + 1) * 10 || 5;
      });
    });
    return score;
  }, [data]);

  const getScoreLabel = (score: number) => {
    if (score >= 300) return { label: 'Distinguished Scholar', emoji: '🏆', color: 'text-gold' };
    if (score >= 200) return { label: 'Eminent Contributor', emoji: '⭐', color: 'text-accent' };
    if (score >= 100) return { label: 'Active Contributor', emoji: '📈', color: 'text-foreground' };
    if (score >= 30) return { label: 'Growing Scholar', emoji: '🌱', color: 'text-muted-foreground' };
    return { label: 'Getting Started', emoji: '✨', color: 'text-muted-foreground' };
  };

  const scoreInfo = getScoreLabel(impactScore);

  const resetAll = () => setData({});

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}

      {/* ── Hero ── */}
      <section className={cn("relative overflow-hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-20 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background")}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 right-[20%] w-80 h-80 bg-gold/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-[15%] w-64 h-64 bg-accent/6 rounded-full blur-[100px]" />
          <div className="absolute top-24 left-[5%] opacity-[0.03]">
            <Trophy className="w-48 h-48 text-warm" />
          </div>
        </div>

        <div ref={heroRef} className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <Trophy className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold tracking-wide">Academic Portfolio</span>
            </div>
            <h1 className={cn("font-serif font-bold mb-2 leading-tight", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
              Notable <span className="text-gradient-gold">Contributions</span>
            </h1>
            <p className={cn("mx-auto leading-relaxed", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg md:text-xl max-w-2xl text-warm/55")}>
              Document your academic journey — research publications, patents, awards, leadership roles, 
              and community impact. Build your scholarly portfolio and track your impact score.
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left — Categories */}
            <div className="lg:col-span-2 space-y-5">
              {CONTRIBUTION_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const entries = data[cat.id] || [];
                const filledCount = entries.filter(e => e.text.trim()).length;
                const isExpanded = expandedCats.includes(cat.id);

                return (
                  <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', cat.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base font-bold text-foreground">{cat.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {filledCount > 0 && (
                          <Badge variant="outline" className="text-[10px] border-gold/30 text-gold font-bold">
                            {filledCount} {filledCount === 1 ? 'entry' : 'entries'}
                          </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Entries */}
                    {isExpanded && (
                      <div className="border-t border-border px-5 md:px-6 py-4 space-y-4">
                        {entries.map((entry, i) => (
                          <div key={entry.id} className="bg-muted/30 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0 font-mono">{i + 1}.</span>
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={entry.text}
                                  onChange={(e) => updateEntry(cat.id, entry.id, 'text', e.target.value)}
                                  placeholder={cat.placeholder}
                                  className="rounded-xl text-sm"
                                  maxLength={500}
                                />
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <select
                                      value={entry.impact}
                                      onChange={(e) => updateEntry(cat.id, entry.id, 'impact', e.target.value)}
                                      className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-gold/40 focus:outline-none"
                                    >
                                      <option value="">Impact Level</option>
                                      {cat.impactLevels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <Input
                                    value={entry.year}
                                    onChange={(e) => updateEntry(cat.id, entry.id, 'year', e.target.value)}
                                    placeholder="Year"
                                    className="w-20 rounded-xl text-xs text-center"
                                    maxLength={4}
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={() => removeEntry(cat.id, entry.id)}
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 w-9"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          onClick={() => addEntry(cat.id)}
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl gap-1.5 border-dashed border-gold/30 text-gold hover:bg-gold/5"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add {cat.title}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-center">
                <Button onClick={resetAll} variant="outline" className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-4 w-4" /> Reset All
                </Button>
              </div>
            </div>

            {/* Right — Impact Dashboard */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Impact Score */}
                <div className="bg-gradient-to-br from-[hsl(228,45%,16%)] to-[hsl(228,35%,22%)] rounded-2xl p-6 border border-gold/20 text-center">
                  <span className="text-gold/60 text-xs tracking-[0.2em] uppercase">Impact Score</span>
                  <div className="my-5">
                    <span className="text-5xl font-bold text-warm font-mono">{impactScore}</span>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-2xl">{scoreInfo.emoji}</span>
                      <span className={cn('text-sm font-serif font-bold', scoreInfo.color)}>{scoreInfo.label}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/5 rounded-xl p-3">
                      <span className="text-2xl font-bold text-warm font-mono">{stats.total}</span>
                      <p className="text-warm/40 text-[10px] mt-0.5">Contributions</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <span className="text-2xl font-bold text-warm font-mono">{stats.filledCats}</span>
                      <p className="text-warm/40 text-[10px] mt-0.5">Categories</p>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  <div className="space-y-2 text-left mt-5">
                    {CONTRIBUTION_CATEGORIES.map(cat => {
                      const count = (data[cat.id] || []).filter(e => e.text.trim()).length;
                      if (count === 0) return null;
                      return (
                        <div key={cat.id} className="flex items-center justify-between text-xs">
                          <span className="text-warm/50">{cat.title}</span>
                          <span className="text-warm/80 font-mono font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Score Benchmarks */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold" /> Impact Levels
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Distinguished Scholar', min: 300, emoji: '🏆' },
                      { label: 'Eminent Contributor', min: 200, emoji: '⭐' },
                      { label: 'Active Contributor', min: 100, emoji: '📈' },
                      { label: 'Growing Scholar', min: 30, emoji: '🌱' },
                    ].map(b => (
                      <div key={b.label} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>{b.emoji}</span>
                          <span className={impactScore >= b.min ? 'text-foreground font-medium' : 'text-muted-foreground'}>{b.label}</span>
                        </span>
                        <span className="text-muted-foreground font-mono">≥ {b.min}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-gold/5 border border-gold/15 rounded-2xl p-5">
                  <h3 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" /> Pro Tips
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      Include journal Impact Factor and indexing (Scopus, WoS)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      Mention funding amount for research projects
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      Add patent numbers and filing dates
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                      Quantify community impact (beneficiaries)
                    </li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Note:</strong> This tool helps you organize and showcase your academic contributions.
                    Data is stored locally in your browser. Use the Academic CV Generator to include these in your formal CV.
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

