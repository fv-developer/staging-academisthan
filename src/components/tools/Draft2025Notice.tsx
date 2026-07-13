import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';
import { DRAFT_2025_HIGHLIGHTS, DRAFT_2025_STATUS, UGC_DOCS } from '@/lib/ugcRegulations';

interface Props {
  defaultOpen?: boolean;
  variant?: 'default' | 'compact';
}

export function Draft2025Notice({ defaultOpen = false, variant = 'default' }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-accent/5 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start sm:items-center justify-between gap-3 text-left"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Draft UGC Regulations 2025 — Awareness Only
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Released 6-Jan-2025 by the Ministry of Education. <span className="text-gold/90 font-medium">Not yet notified.</span> This tool still uses the regulations currently in force.
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-background/50 border border-border/60 p-3">
            <AlertCircle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {DRAFT_2025_STATUS}
            </p>
          </div>

          {variant === 'default' && (
            <ul className="space-y-2.5">
              {DRAFT_2025_HIGHLIGHTS.map(h => (
                <li key={h.title} className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-gold/40">
                  <p className="font-semibold text-foreground/90">{h.title}</p>
                  <p className="mt-0.5">{h.detail}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={UGC_DOCS.draft2025}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
            >
              Official Draft PDF (MoE) <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/regulations/draft-2025"
              className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
            >
              Full summary on Academisthan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
