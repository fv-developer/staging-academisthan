import { AlertTriangle } from 'lucide-react';

interface Props {
  framework: 'UGC-2010-2016' | 'UGC-2018';
  retrievedOn?: string;
}

const FRAMEWORK_LABEL: Record<Props['framework'], string> = {
  'UGC-2010-2016': 'UGC Regulations, 2010 (4th Amendment, 2016) — Legacy framework',
  'UGC-2018': 'UGC Regulations, 2018 — Current framework',
};

const FRAMEWORK_LINK: Record<Props['framework'], string> = {
  'UGC-2010-2016': 'https://www.ugc.gov.in/oldpdf/regulations/englishfinalugcregulationfinal10.pdf',
  'UGC-2018': 'https://www.ugc.gov.in/pdfnews/4033931_UGC-Regulation_min_Qualification_Jul2018.pdf',
};

export function RegulationDisclaimer({ framework, retrievedOn = 'June 2026' }: Props) {
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
      <p className="flex items-start gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
        <strong className="text-foreground/80">Legal Disclaimer — Read Carefully</strong>
      </p>
      <p>
        This tool implements <strong>{FRAMEWORK_LABEL[framework]}</strong> as published by the
        University Grants Commission of India (retrieved {retrievedOn}). It is an{' '}
        <strong>indicative self-assessment</strong>; all values are self-declared and are not
        verified by Academisthan Foundation, UGC, MSBSVET or any regulatory authority.
      </p>
      <p>
        Final eligibility, scoring and promotion decisions rest exclusively with your university's{' '}
        <strong>IQAC, PBAS authority and Statutory Selection Committee</strong>. Always cross-check
        with the latest{' '}
        <a href={FRAMEWORK_LINK[framework]} target="_blank" rel="noopener noreferrer" className="text-gold underline">
          official UGC notification
        </a>{' '}
        and your institution's PBAS rubric. Academisthan Foundation accepts{' '}
        <strong>no liability</strong> for any administrative, financial or career decision taken on
        the basis of this calculator.
      </p>
    </div>
  );
}
