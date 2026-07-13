import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';
import { DRAFT_2025_HIGHLIGHTS, DRAFT_2025_STATUS, UGC_DOCS } from '@/lib/ugcRegulations';

export default function DraftRegulations2025() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold mb-4">
            <Sparkles className="h-3 w-3" /> Draft · Not yet notified
          </div>
          <h1 className="font-playfair text-3xl sm:text-4xl font-black text-gold mb-3">
            UGC Draft Regulations 2025
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Minimum Qualifications for Appointment & Promotion of Teachers and Academic Staff in Universities and Colleges, and Measures for the Maintenance of Standards in Higher Education.
          </p>
        </header>

        <section className="mb-8 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{DRAFT_2025_STATUS}</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-playfair font-black text-gold mb-4">What changes</h2>
          <ul className="space-y-4">
            {DRAFT_2025_HIGHLIGHTS.map(h => (
              <li key={h.title} className="rounded-lg border border-border bg-card/60 p-4">
                <p className="font-semibold text-foreground text-sm">{h.title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{h.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-playfair font-black text-gold mb-4">Official sources</h2>
          <ul className="space-y-2">
            <DocLink href={UGC_DOCS.draft2025} label="Draft UGC Regulations 2025 (Ministry of Education PDF)" />
            <DocLink href={UGC_DOCS.reg2018} label="UGC Regulations 2018 (currently in force)" />
            <DocLink href={UGC_DOCS.amendment2016} label="UGC 4th Amendment 2016 (API framework)" />
            <DocLink href={UGC_DOCS.casExtensionNotice} label="UGC Public Notice — CAS regime choice" />
            <DocLink href={UGC_DOCS.careWithdrawalNotice} label="UGC Public Notice — CARE list withdrawal (Feb 2024)" />
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-muted/30 p-5 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Disclaimer: </strong>
          This page summarises a <em>draft</em> regulation released by UGC for public feedback. Until the Gazette notification is issued, all CAS, API and promotion decisions continue to follow UGC 2010 (4th Amendment 2016) and UGC 2018. Academisthan Foundation accepts no liability for any decision taken on the basis of draft text. Always cross-check with your university's IQAC and the official UGC notification.
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
      >
        {label} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}
