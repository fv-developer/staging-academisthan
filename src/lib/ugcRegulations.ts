/* ─────────────────────────────────────────────────────────────
   UGC Regulations — Single Source of Truth
   All CAS / API / Research-Score tools import constants from here
   to avoid drift. Update in ONE place when notifications change.
   ───────────────────────────────────────────────────────────── */

export const UGC_DOCS = {
  reg2010:
    'https://www.ugc.gov.in/oldpdf/regulations/englishfinalugcregulationfinal10.pdf',
  amendment2016:
    'https://www.ugc.gov.in/pdfnews/1864909_4th-Amendment-Regulations-2016.pdf',
  reg2018:
    'https://www.ugc.gov.in/pdfnews/4033931_UGC-Regulation_min_Qualification_Jul2018.pdf',
  draft2025:
    'https://www.education.gov.in/sites/upload_files/mhrd/files/Draft_UGC_Regulations_2025.pdf',
  careWithdrawalNotice:
    'https://www.ugc.gov.in/pdfnews/0413555_Public-Notice-CARE.pdf',
  casExtensionNotice:
    'https://www.ugc.gov.in/pdfnews/9201534_PN-CAS-Promotions.pdf',
  pbasAnnexureII:
    'https://www.ugc.gov.in/pdfnews/4033931_UGC-Regulation_min_Qualification_Jul2018.pdf',
} as const;

/* ── Research-Score thresholds (2018 framework) ── */
export const RESEARCH_SCORE_THRESHOLDS = {
  associateProfessor: 70,   // Stage 3 → AL 13A
  professor: 120,           // AL 13A → AL 14
} as const;

/* ── Faculty discipline base scores (Appendix II, Table 2) ── */
export const FACULTY_BASE_SCORE = {
  science: 8,               // Sciences / Engineering / Agriculture / Medical
  humanities: 10,           // Humanities / Languages / Social Sciences / Arts / Commerce
} as const;

/* ── Impact-factor augmentation ── */
export const IF_AUGMENTATION = {
  'no-if': 5,
  'lt-1': 10,
  '1-2': 15,
  '2-5': 20,
  '5-10': 25,
  'gt-10': 30,
} as const;

/* ── FDP / Orientation minimums by stage ── */
export const FDP_REQUIREMENTS = {
  L10_L11: { orientation21Day: 1, refresher: 0, label: 'Stage 1 → 2' },
  L11_L12: { orientation21Day: 0, refresher: 2, label: 'Stage 2 → 3' },
  L12_L13A: { orientation21Day: 0, refresher: 1, label: 'Stage 3 → Associate' },
  L13A_L14: { orientation21Day: 0, refresher: 1, label: 'Associate → Professor' },
} as const;

/* ── Regime selector cut-off ──
   UGC has allowed candidates whose assessment period began
   before 18-July-2018 to CHOOSE between the 2010/2016 (API)
   regime and the 2018 (Research Score) regime. */
export const REGIME_CUTOFF_DATE = new Date('2018-07-18');

export type Regime = 'api-2010-2016' | 'research-2018';

export interface RegimeRecommendation {
  primary: Regime;
  allowChoice: boolean;
  rationale: string;
  notice: string;
}

export function recommendRegime(opts: {
  assessmentPeriodStart: Date | null;
  lastPromotionDate: Date | null;
}): RegimeRecommendation {
  const ref = opts.assessmentPeriodStart ?? opts.lastPromotionDate;
  if (!ref) {
    return {
      primary: 'research-2018',
      allowChoice: false,
      rationale: 'No assessment-period date provided — defaulting to current (2018) framework.',
      notice: 'Enter your last promotion or assessment-period start date for an accurate recommendation.',
    };
  }
  if (ref < REGIME_CUTOFF_DATE) {
    return {
      primary: 'api-2010-2016',
      allowChoice: true,
      rationale: `Assessment period began before 18-July-2018 (${ref.toLocaleDateString('en-IN')}). UGC permits you to opt for either regime.`,
      notice: 'UGC Public Notice (CAS extension) permits candidates with pre-2018 assessment periods to choose between the 2010/2016 API framework and the 2018 Research Score framework. Pick whichever yields the higher eligibility — but stick with one regime for the full assessment cycle.',
    };
  }
  return {
    primary: 'research-2018',
    allowChoice: false,
    rationale: `Assessment period began on/after 18-July-2018 (${ref.toLocaleDateString('en-IN')}). The 2018 Research Score framework applies.`,
    notice: 'Use the Research Score Calculator and the Promotion Checker (2018 track). The API 2010/2016 framework no longer applies to your case.',
  };
}

/* ── Draft 2025 — proposed (NOT yet notified) ──
   Source: UGC Notification No. F. 6-1/2025 (Regulations
   Feedback), released 6-Jan-2025 by MoE. Subject to revision. */
export const DRAFT_2025_HIGHLIGHTS = [
  {
    title: 'NET no longer mandatory for ME/MTech holders',
    detail: 'Candidates with ME/MTech (and equivalent) gain direct eligibility for Assistant Professor in cognate disciplines; PhD-in-discipline route widened.',
  },
  {
    title: 'Notional / contractual service counted for CAS',
    detail: 'Service rendered on contract, guest or notional basis can now count toward CAS eligibility, subject to verification.',
  },
  {
    title: 'API score concept formally retired',
    detail: 'Numeric API tables removed. Promotion decisions move to a qualitative "Notable Contributions" framework + research output.',
  },
  {
    title: 'Discipline-agnostic recruitment',
    detail: 'Faculty may be recruited in disciplines different from their undergraduate background, provided PhD/PG is in the cognate discipline.',
  },
  {
    title: 'New VC eligibility tracks',
    detail: 'Vice-Chancellor eligibility broadened to include industry leaders, senior bureaucrats (PSU/govt) and accomplished researchers, alongside the traditional academic track.',
  },
  {
    title: 'Stronger Indian-language & interdisciplinary weight',
    detail: 'Teaching, research and notable contributions in Indian languages and interdisciplinary domains carry explicit weightage (aligned with NEP 2020).',
  },
] as const;

export const DRAFT_2025_STATUS =
  'Draft released 6-Jan-2025 by Ministry of Education for public feedback. NOT YET NOTIFIED. Current CAS / API / promotion decisions continue to follow UGC 2010 (4th Amendment 2016) and UGC 2018.';
