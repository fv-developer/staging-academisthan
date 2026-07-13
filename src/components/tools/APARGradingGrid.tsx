import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export type APARGrade = 'Excellent' | 'Good' | 'Satisfactory' | 'Unsatisfactory' | '';

interface Props {
  years: number;
  requiredCount: number;
  values: APARGrade[];
  onChange: (next: APARGrade[]) => void;
}

const GRADES: APARGrade[] = ['Excellent', 'Good', 'Satisfactory', 'Unsatisfactory'];

const isPass = (g: APARGrade) => g === 'Excellent' || g === 'Good' || g === 'Satisfactory';

export function APARGradingGrid({ years, requiredCount, values, onChange }: Props) {
  const safeValues: APARGrade[] = Array.from({ length: years }, (_, i) => values[i] || '');
  const passCount = safeValues.filter(isPass).length;
  const met = passCount >= requiredCount;

  const set = (i: number, v: APARGrade) => {
    const next = [...safeValues];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-border p-4 bg-card/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Label className="text-sm font-semibold text-foreground">
            APAR Grading per Assessment Year
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            UGC 2018 requires <strong>Good</strong> or <strong>Satisfactory</strong> in at least{' '}
            <strong>{requiredCount} of {years}</strong> assessment years.
          </p>
        </div>
        <div className={cn(
          'shrink-0 text-xs font-mono px-2 py-1 rounded-md flex items-center gap-1',
          met ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
        )}>
          {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {passCount}/{requiredCount}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {safeValues.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">Year {i + 1}</span>
            <select
              value={val}
              onChange={(e) => set(i, e.target.value as APARGrade)}
              className={cn(
                'flex-1 rounded-lg bg-background border border-border px-2 py-1.5 text-xs font-medium',
                val === 'Unsatisfactory' && 'border-destructive/40 text-destructive',
                isPass(val) && 'border-accent/40 text-accent'
              )}
            >
              <option value="">— select —</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
