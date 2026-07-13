import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { recommendRegime, type Regime } from '@/lib/ugcRegulations';
import { Link } from 'react-router-dom';

interface Props {
  onChoose?: (regime: Regime) => void;
}

export function RegimeSelector({ onChoose }: Props) {
  const [assessmentStart, setAssessmentStart] = useState('');
  const [lastPromotion, setLastPromotion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const rec = useMemo(
    () =>
      recommendRegime({
        assessmentPeriodStart: assessmentStart ? new Date(assessmentStart) : null,
        lastPromotionDate: lastPromotion ? new Date(lastPromotion) : null,
      }),
    [assessmentStart, lastPromotion]
  );

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-2.5">
        <Compass className="h-5 w-5 text-gold shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Which CAS regime applies to me?
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            UGC permits candidates whose assessment period began <strong>before 18-July-2018</strong> to
            choose between the legacy <strong>2010/2016 (API)</strong> framework and the current
            <strong> 2018 (Research Score)</strong> framework. Pick whichever yields the higher eligibility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="lastPromo" className="text-xs">Last promotion date</Label>
          <Input
            id="lastPromo"
            type="date"
            value={lastPromotion}
            onChange={e => setLastPromotion(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="assessStart" className="text-xs">Assessment period start (optional)</Label>
          <Input
            id="assessStart"
            type="date"
            value={assessmentStart}
            onChange={e => setAssessmentStart(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setSubmitted(true)}
        disabled={!assessmentStart && !lastPromotion}
      >
        Recommend regime <ArrowRight className="h-4 w-4 ml-1.5" />
      </Button>

      {submitted && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Recommended: {rec.primary === 'api-2010-2016'
                  ? 'UGC 2010 (4th Amendment 2016) — API framework'
                  : 'UGC 2018 — Research Score framework'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{rec.notice}</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {rec.primary === 'api-2010-2016' || rec.allowChoice ? (
              <Button
                asChild
                size="sm"
                variant={rec.primary === 'api-2010-2016' ? 'default' : 'outline'}
                onClick={() => onChoose?.('api-2010-2016')}
              >
                <Link to="/tools/api-score">Open API Calculator (2010/2016)</Link>
              </Button>
            ) : null}
            {rec.primary === 'research-2018' || rec.allowChoice ? (
              <Button
                asChild
                size="sm"
                variant={rec.primary === 'research-2018' ? 'default' : 'outline'}
                onClick={() => onChoose?.('research-2018')}
              >
                <Link to="/tools/research-score">Open Research Score (2018)</Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
