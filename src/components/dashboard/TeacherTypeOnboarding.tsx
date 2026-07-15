import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, School, X, Sparkles } from 'lucide-react';

const TYPES = [
  {
    value: 'k12',
    label: 'K-12 Teacher',
    desc: 'School teacher (Primary, Secondary, Senior Secondary)',
    icon: School,
    emoji: '🏫',
  },
  {
    value: 'higher_education',
    label: 'Higher Education',
    desc: 'College / University faculty, researcher',
    icon: GraduationCap,
    emoji: '🎓',
  },
];

export function TeacherTypeOnboarding() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already set or dismissed
  if (!profile || (profile as any).teacher_type || dismissed) return null;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ teacher_type: selected } as any)
      .eq('id', profile.id);
    setSaving(false);

    if (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated! 🎉' });
      await refreshProfile();
    }
  };

  return (
    <div className="bg-gradient-to-br from-gold/5 via-card to-accent/5 border border-gold/20 rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Decorative */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-gold text-xs font-bold tracking-wider uppercase">Quick Setup</span>
        </div>
        <h3 className="font-serif text-lg font-bold text-foreground mb-1">
          What type of educator are you?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          This helps us personalize your tools and resources
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelected(t.value)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selected === t.value
                  ? 'border-gold bg-gold/10 shadow-[0_4px_15px_hsl(var(--gold)/0.15)]'
                  : 'border-border hover:border-gold/40 bg-background'
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={!selected || saving}
          className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 gap-2"
        >
          {saving ? 'Saving...' : 'Continue'} <GraduationCap className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
