import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { FDP_REQUIREMENTS } from '@/lib/ugcRegulations';

export type FDPEntry = {
  id: string;
  name: string;
  sponsor: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  type: 'orientation-21' | 'refresher' | 'short-fdp' | 'research-methodology';
};

interface Props {
  stageId: keyof typeof FDP_REQUIREMENTS;
  entries: FDPEntry[];
  onChange: (entries: FDPEntry[]) => void;
}

export function FDPTracker({ stageId, entries, onChange }: Props) {
  const req = FDP_REQUIREMENTS[stageId];

  const counts = useMemo(() => {
    const orientation = entries.filter(e => e.type === 'orientation-21' && e.durationDays >= 21).length;
    const refresher = entries.filter(
      e => (e.type === 'refresher' || e.type === 'research-methodology') && e.durationDays >= 7
    ).length;
    return { orientation, refresher };
  }, [entries]);

  const orientationMet = counts.orientation >= req.orientation21Day;
  const refresherMet = counts.refresher >= req.refresher;

  const add = () => {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        name: '',
        sponsor: '',
        startDate: '',
        endDate: '',
        durationDays: 0,
        type: 'refresher',
      },
    ]);
  };

  const update = (id: string, patch: Partial<FDPEntry>) => {
    onChange(entries.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(entries.filter(e => e.id !== id));

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2.5">
          <GraduationCap className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Orientation / Refresher / FDP Tracker
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Stage requirement ({req.label}):{' '}
              {req.orientation21Day > 0 && (
                <span>
                  <strong>{req.orientation21Day} × 21-day Orientation</strong>
                  {req.refresher > 0 ? ' · ' : ''}
                </span>
              )}
              {req.refresher > 0 && (
                <strong>
                  {req.refresher} × Refresher / RM Workshop (≥7 days each)
                </strong>
              )}
            </p>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatusPill ok={orientationMet} label={`21-day Orientation: ${counts.orientation}/${req.orientation21Day}`} />
        <StatusPill ok={refresherMet} label={`Refresher / RM: ${counts.refresher}/${req.refresher}`} />
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No programmes added yet. Click <strong>Add</strong> to record an orientation, refresher or FDP.
        </p>
      )}

      <div className="space-y-3">
        {entries.map((e, idx) => (
          <div key={e.id} className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Programme {idx + 1}</span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Programme name</Label>
                <Input
                  value={e.name}
                  onChange={ev => update(e.id, { name: ev.target.value })}
                  placeholder="e.g. Orientation Programme on Teaching Methodology"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[11px]">Sponsoring body</Label>
                <Input
                  value={e.sponsor}
                  onChange={ev => update(e.id, { sponsor: ev.target.value })}
                  placeholder="e.g. UGC-HRDC, Mumbai University"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[11px]">Type</Label>
                <select
                  value={e.type}
                  onChange={ev => update(e.id, { type: ev.target.value as FDPEntry['type'] })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="orientation-21">21-day Orientation</option>
                  <option value="refresher">Refresher (≥7 days)</option>
                  <option value="research-methodology">Research Methodology Workshop</option>
                  <option value="short-fdp">Short FDP (&lt;7 days)</option>
                </select>
              </div>
              <div>
                <Label className="text-[11px]">Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={e.durationDays || ''}
                  onChange={ev => update(e.id, { durationDays: Number(ev.target.value) || 0 })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[11px]">Start date</Label>
                <Input
                  type="date"
                  value={e.startDate}
                  onChange={ev => update(e.id, { startDate: ev.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-[11px]">End date</Label>
                <Input
                  type="date"
                  value={e.endDate}
                  onChange={ev => update(e.id, { endDate: ev.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 border ' +
        (ok
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400')
      }
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
}
