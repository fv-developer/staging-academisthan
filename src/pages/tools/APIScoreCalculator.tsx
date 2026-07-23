import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator, BookOpen, FlaskConical, Award, ChevronDown, ChevronUp,
  Info, RotateCcw, CheckCircle2, AlertTriangle, Sparkles, Download, Printer, Settings, Upload, FileText, ShieldCheck, X, FileCheck, Layers, Scale
} from 'lucide-react';
import { APIScoreCertificateModal } from '@/components/tools/APIScoreCertificateModal';
import { useToolResultSaver } from '@/hooks/useToolResultSaver';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';



/* =====================================================================
   FRAMEWORK REGISTRY — Gazette Defaults + Customizable Values (FW)
   Supports UGC Regulations 2018 (CAS) and UGC 2010 / 2nd Amendment 2013 (PBAS)
===================================================================== */
const DEF = {
  f18: {
    paperBase: { sci: 8, hum: 10 },
    aug: { aug0: 5, aug1: 10, aug12: 15, aug25: 20, aug510: 25, aug10p: 30 },
    items: {
      bkI: 12, bkN: 10, chE: 5, edI: 10, edN: 8, trC: 3, trB: 8,
      ped: 5, curr: 2, mo20: 20, moCr: 5, moMod: 5, moSme: 2, moCo: 8, moCoCr: 2,
      ec12: 12, ecMod: 5, ecCon: 2, ecEd: 10,
      phdA: 10, phdS: 5, mpg: 2, pcA: 10, pcB: 5, poA: 5, poB: 2, cons: 3,
      patI: 10, patN: 7, polI: 10, polN: 7, polS: 4, awI: 7, awN: 5,
      l7: 7, l5: 5, l3: 3, l2: 2
    },
    capShare: 30, teachGood: 80, teachSat: 70, actGood: 3, target: 0
  },
  f13: {
    paperBase: 15,
    aug: { pIdx: 5, pI12: 10, pI25: 15, pI510: 25 },
    items: {
      pNR: 10, pCP: 10,
      b50: 50, b25: 25, b15: 15, ch10: 10, ch5: 5, ch3: 3,
      prA: 20, prB: 15, prC: 10, qeMaj: 20, qeMin: 10, outI: 50, outN: 30,
      dMph: 3, dPhA: 10, dPhS: 7,
      tc2w: 20, tc1w: 10, ppI: 10, ppN: 7.5, ppR: 5, ppL: 3, ilI: 10, ilN: 5,
      h4cPer: 2
    },
    sub: { s1: 100, s2: 30, s3: 20, s6: 30, e1: 30, fbMax: 10 },
    caps: { IIIA: 30, IIIB: 25, IIIC: 20, IIID: 10, IIIE: 15 },
    consultDiv: { sci: 10, hum: 2 }, consultPer: 10,
    min: { cI: 100, cII: 20, comb: 150 }
  }
};

const FIELDS: [string, string, string, string][] = [
  ["f13", "items.prA", "III-C project — tier (a) major", "fixed13"],
  ["f13", "items.prB", "III-C project — tier (b) major", "fixed13"],
  ["f13", "items.prC", "III-C project — tier (c) minor", "fixed13"],
  ["f13", "items.qeMaj", "III-C quality evaluation — major", "fixed13"],
  ["f13", "items.qeMin", "III-C quality evaluation — minor", "fixed13"],
  ["f13", "items.outI", "III-C output — International", "fixed13"],
  ["f13", "items.outN", "III-C output — National", "fixed13"],
  ["f13", "paperBase", "III-A refereed paper base", "fixed13"],
  ["f13", "aug.pIdx", "III-A augmentation — indexed", "fixed13"],
  ["f13", "aug.pI12", "III-A augmentation — IF 1–2", "fixed13"],
  ["f13", "aug.pI25", "III-A augmentation — IF 2–5", "fixed13"],
  ["f13", "aug.pI510", "III-A augmentation — IF 5–10", "fixed13"],
  ["f13", "items.pNR", "III-A non-refereed journal", "fixed13"],
  ["f13", "items.pCP", "III-A conference proceedings", "fixed13"],
  ["f13", "items.b50", "III-B book — International", "fixed13"],
  ["f13", "items.b25", "III-B book — National / Govt.", "fixed13"],
  ["f13", "items.b15", "III-B book — local", "fixed13"],
  ["f13", "items.ch10", "III-B chapter — International", "fixed13"],
  ["f13", "items.ch5", "III-B chapter — National", "fixed13"],
  ["f13", "items.ch3", "III-B chapter — local", "fixed13"],
  ["f13", "items.dMph", "III-D M.Phil. awarded", "fixed13"],
  ["f13", "items.dPhA", "III-D Ph.D. awarded", "fixed13"],
  ["f13", "items.dPhS", "III-D Ph.D. thesis submitted", "fixed13"],
  ["f13", "items.tc2w", "III-E course ≥ 2 weeks", "fixed13"],
  ["f13", "items.tc1w", "III-E course 1 week", "fixed13"],
  ["f13", "items.ppI", "III-E paper — International", "fixed13"],
  ["f13", "items.ppN", "III-E paper — National", "fixed13"],
  ["f13", "items.ppR", "III-E paper — Regional/State", "fixed13"],
  ["f13", "items.ppL", "III-E paper — Local/University", "fixed13"],
  ["f13", "items.ilI", "III-E invited lecture — International", "fixed13"],
  ["f13", "items.ilN", "III-E invited lecture — National", "fixed13"],
  ["f13", "caps.IIIA", "Cap % — III-A", "fixed13"],
  ["f13", "caps.IIIB", "Cap % — III-B", "fixed13"],
  ["f13", "caps.IIIC", "Cap % — III-C", "fixed13"],
  ["f13", "caps.IIID", "Cap % — III-D", "fixed13"],
  ["f13", "caps.IIIE", "Cap % — III-E", "fixed13"],
  ["f13", "sub.s1", "Cat I sub-total 1 max (teaching hours)", "weight13"],
  ["f13", "sub.s2", "Cat I sub-total 2 max (supervision)", "weight13"],
  ["f13", "sub.s3", "Cat I sub-total 3 max (exam duties)", "weight13"],
  ["f13", "items.h4cPer", "Cat I 4-C points per course", "weight13"],
  ["f13", "sub.fbMax", "Cat I 4-C maximum", "weight13"],
  ["f13", "sub.s6", "Cat II sub-total 6 max (admin hours)", "weight13"],
  ["f13", "sub.e1", "III-E(i) courses sub-cap", "fixed13"],
  ["f13", "min.cI", "Minimum — Category I", "minUp"],
  ["f13", "min.cII", "Minimum — Category II", "minUp"],
  ["f13", "min.comb", "Minimum — Categories I + II", "minUp"],
  ["f18", "paperBase.sci", "Cat 1 paper base — science stream", "adopt18"],
  ["f18", "paperBase.hum", "Cat 1 paper base — humanities stream", "adopt18"],
  ["f18", "aug.aug0", "Cat 1 augmentation — no IF", "adopt18"],
  ["f18", "aug.aug1", "Cat 1 augmentation — IF < 1", "adopt18"],
  ["f18", "aug.aug12", "Cat 1 augmentation — IF 1–2", "adopt18"],
  ["f18", "aug.aug25", "Cat 1 augmentation — IF 2–5", "adopt18"],
  ["f18", "aug.aug510", "Cat 1 augmentation — IF 5–10", "adopt18"],
  ["f18", "aug.aug10p", "Cat 1 augmentation — IF > 10", "adopt18"],
  ["f18", "items.bkI", "Cat 2 book — International", "adopt18"],
  ["f18", "items.bkN", "Cat 2 book — National", "adopt18"],
  ["f18", "items.chE", "Cat 2 chapter in edited book", "adopt18"],
  ["f18", "items.edI", "Cat 2 editor — International", "adopt18"],
  ["f18", "items.edN", "Cat 2 editor — National", "adopt18"],
  ["f18", "items.trC", "Cat 2 translation — chapter/paper", "adopt18"],
  ["f18", "items.trB", "Cat 2 translation — book", "adopt18"],
  ["f18", "items.ped", "Cat 3 innovative pedagogy", "adopt18"],
  ["f18", "items.curr", "Cat 3 new curricula/course", "adopt18"],
  ["f18", "items.mo20", "Cat 3 complete 4-credit MOOC", "adopt18"],
  ["f18", "items.moCr", "Cat 3 lesser-credit MOOC (per credit)", "adopt18"],
  ["f18", "items.moMod", "Cat 3 MOOC module/lecture", "adopt18"],
  ["f18", "items.moSme", "Cat 3 MOOC content writer/SME", "adopt18"],
  ["f18", "items.moCo", "Cat 3 MOOC coordinator (4-credit)", "adopt18"],
  ["f18", "items.moCoCr", "Cat 3 coordinator lesser-credit (per credit)", "adopt18"],
  ["f18", "items.ec12", "Cat 3 complete e-content course", "adopt18"],
  ["f18", "items.ecMod", "Cat 3 e-content module", "adopt18"],
  ["f18", "items.ecCon", "Cat 3 e-content contribution", "adopt18"],
  ["f18", "items.ecEd", "Cat 3 e-content editor", "adopt18"],
  ["f18", "items.phdA", "Cat 4 Ph.D. awarded", "adopt18"],
  ["f18", "items.phdS", "Cat 4 Ph.D. thesis submitted", "adopt18"],
  ["f18", "items.mpg", "Cat 4 M.Phil./P.G. dissertation", "adopt18"],
  ["f18", "items.pcA", "Cat 4 project completed > ₹10 L", "adopt18"],
  ["f18", "items.pcB", "Cat 4 project completed < ₹10 L", "adopt18"],
  ["f18", "items.poA", "Cat 4 project ongoing > ₹10 L", "adopt18"],
  ["f18", "items.poB", "Cat 4 project ongoing < ₹10 L", "adopt18"],
  ["f18", "items.cons", "Cat 4 consultancy", "adopt18"],
  ["f18", "items.patI", "Cat 5 patent — International", "adopt18"],
  ["f18", "items.patN", "Cat 5 patent — National", "adopt18"],
  ["f18", "items.polI", "Cat 5 policy — International", "adopt18"],
  ["f18", "items.polN", "Cat 5 policy — Central Govt.", "adopt18"],
  ["f18", "items.polS", "Cat 5 policy — State Govt.", "adopt18"],
  ["f18", "items.awI", "Cat 5 award — International", "adopt18"],
  ["f18", "items.awN", "Cat 5 award — National", "adopt18"],
  ["f18", "items.l7", "Cat 6 lecture — International abroad", "adopt18"],
  ["f18", "items.l5", "Cat 6 lecture — International in-country", "adopt18"],
  ["f18", "items.l3", "Cat 6 lecture — National", "adopt18"],
  ["f18", "items.l2", "Cat 6 lecture — State/University", "adopt18"],
  ["f18", "capShare", "Cat 5(b)+6 cap — % of research score", "adopt18"],
  ["f18", "teachGood", "Table 1 teaching threshold — Good (%)", "adopt18"],
  ["f18", "teachSat", "Table 1 teaching threshold — Satisfactory (%)", "adopt18"],
  ["f18", "actGood", "Table 1 activities for Good (count)", "adopt18"],
  ["f18", "target", "Institution minimum research score (screening target; 0 = none)", "minUp"]
];

const getP = (o: any, p: string) => p.split(".").reduce((a, k) => a?.[k], o);
const setP = (o: any, p: string, v: any) => {
  const ks = p.split(".");
  const last = ks.pop()!;
  const target = ks.reduce((a, k) => a[k], o);
  if (target) target[last] = v;
};

const ACTIVITIES = [
  { id: "a2a", t: "2-A · Administrative responsibilities", h: "Head, Chairperson, Dean, Director, Convenor, Coordinator, Warden, etc. — each position held = 1 activity (office order as evidence)." },
  { id: "a2b", t: "2-B · Examination & evaluation duties", h: "Question-paper setting, invigilation, flying squad, CS/ACS/Custodian, CAP Director, Unfair-Means & Grievance Committees, internal/external assessment, revaluation, result preparation, thesis evaluation — each duty discharged = 1 activity." },
  { id: "a2c", t: "2-C · Student-related co-curricular, extension & field-based activities", h: "Educational tours, field work/visits & extension; centre visits; 4-week internships; student seminars, cultural, sports, NCC, NSS & community service; mentoring a student group." },
  { id: "a2d", t: "2-D · Organising seminars / conferences / workshops", h: "Including other college / university activities — each event organised = 1 activity." },
  { id: "a2e", t: "2-E · Actively guiding Ph.D. students", h: "Registered and/or awarded candidates." },
  { id: "a2f", t: "2-F · Conducting minor or major research project", h: "Sponsored by national or international agencies — above or below ₹10 lakhs." },
  { id: "a2g", t: "2-G · At least one single or joint publication", h: "In peer-reviewed or UGC-listed journals." }
];

const CATS18 = [
  {
    id: "c1", num: "1", ico: "🧪", title: "Research Papers in Peer-Reviewed / UGC-Listed Journals",
    sub: "Per-paper value = faculty base + impact-factor augmentation, scaled by authorship.", auth: true, kind: "papers",
    det: "Evidence: copy of publication with ISSN, journal indexing / impact factor proof (Clarivate list). Verified figures entered by the committee prevail."
  },
  {
    id: "c2", num: "2", ico: "📚", title: "Publications other than Research Papers",
    sub: "Books, chapters, editorships and translation works — scaled by authorship.", auth: true,
    det: "Evidence: title/copyright pages showing ISBN/ISSN, publisher tier and authorship position.", items: [
      { id: "bkI", t: "(2)(a)(i) Book — International publisher", h: "With ISSN / ISBN." },
      { id: "bkN", t: "(2)(a)(i) Book — National publisher", h: "With ISSN / ISBN." },
      { id: "chE", t: "(2)(a)(ii) Chapter in an edited book", h: "With ISSN / ISBN." },
      { id: "edI", t: "(2)(a)(iii) Editor of book — International publisher", h: "Per book." },
      { id: "edN", t: "(2)(a)(iii) Editor of book — National publisher", h: "Per book." },
      { id: "trC", t: "(2)(b) Translation — chapter or research paper", h: "Indian & foreign languages, by qualified faculty." },
      { id: "trB", t: "(2)(b) Translation — book", h: "Indian & foreign languages, by qualified faculty." }
    ]
  },
  {
    id: "c3", num: "3", ico: "💻", title: "ICT-Mediated Pedagogy, Content & New Courses / Curricula",
    sub: "Innovative pedagogy, curricula, MOOCs and e-content. Authorship scaling applies to e-content (3-D) only.", auth: false,
    det: "Evidence: approval date from authority, implementation date, ICT resource links (per proforma columns); MOOC credits from course records.", items: [
      { id: "ped", t: "(3)(a) Development of innovative pedagogy", h: "Per innovation." },
      { id: "curr", t: "(3)(b) Design of new curricula / courses", h: "Per curriculum or course." },
      { id: "mo20", t: "(3)(c)(i) Complete MOOC in 4 quadrants — 4-credit course", h: "Per course." },
      { id: "moCr", t: "(3)(c)(i) Lesser-credit MOOC — total credits", h: "Marks per credit; enter total credits.", unit: "credits" },
      { id: "moMod", t: "(3)(c)(ii) MOOC module / lecture (4-quadrant)", h: "Per module or lecture." },
      { id: "moSme", t: "(3)(c)(iii) Content writer / subject-matter expert", h: "Per MOOC module (at least one quadrant)." },
      { id: "moCo", t: "(3)(c)(iv) Course coordinator — 4-credit MOOC", h: "Per course." },
      { id: "moCoCr", t: "(3)(c)(iv) Coordinator, lesser-credit MOOC — total credits", h: "Marks per credit; enter total credits.", unit: "credits" },
      { id: "ec12", t: "(3)(d)(i) Complete e-content course / e-book (4 quadrants)", h: "Per course — authorship applies.", auth: true },
      { id: "ecMod", t: "(3)(d)(ii) E-content module (4 quadrants)", h: "Per module — authorship applies.", auth: true },
      { id: "ecCon", t: "(3)(d)(iii) Contribution to an e-content module", h: "At least one quadrant — authorship applies.", auth: true },
      { id: "ecEd", t: "(3)(d)(iv) Editor of e-content — complete course / paper / e-book", h: "Per course — authorship applies.", auth: true }
    ]
  },
  {
    id: "c4", num: "4", ico: "🎓", title: "Research Guidance, Projects & Consultancy",
    sub: "Joint supervision at 70% each; joint projects (PI & Co-PI) at 50% each, per the UGC notes.", auth: false,
    det: "Evidence: Ph.D. award / submission letters, project sanction & completion certificates, consultancy orders (per gazette evidence list).", items: [
      { id: "phdA", t: "(4)(a) Ph.D. — degree awarded", h: "Per degree awarded.", dual: { mult: 0.70, cap: "Joint ×0.70" } },
      { id: "phdS", t: "(4)(a) Ph.D. — thesis submitted", h: "Per thesis submitted.", dual: { mult: 0.70, cap: "Joint ×0.70" } },
      { id: "mpg", t: "(4)(a) M.Phil. / P.G. dissertation — awarded", h: "Per degree awarded.", dual: { mult: 0.70, cap: "Joint ×0.70" } },
      { id: "pcA", t: "(4)(b) Project completed — above ₹10 lakhs", h: "Per project.", dual: { mult: 0.50, cap: "Co-PI ×0.50" } },
      { id: "pcB", t: "(4)(b) Project completed — below ₹10 lakhs", h: "Per project.", dual: { mult: 0.50, cap: "Co-PI ×0.50" } },
      { id: "poA", t: "(4)(c) Project ongoing — above ₹10 lakhs", h: "Per project.", dual: { mult: 0.50, cap: "Co-PI ×0.50" } },
      { id: "poB", t: "(4)(c) Project ongoing — below ₹10 lakhs", h: "Per project.", dual: { mult: 0.50, cap: "Co-PI ×0.50" } },
      { id: "cons", t: "(4)(d) Consultancy", h: "Per consultancy project." }
    ]
  },
  {
    id: "c5", num: "5", ico: "🏅", title: "Patents · Policy Documents · Awards / Fellowships",
    sub: "Policy documents (5-b) fall under the combined cap with Category 6.", auth: false,
    det: "Evidence: patent filing/approval letters, acceptance of the policy document by the receiving body, award citations.", items: [
      { id: "patI", t: "(5)(a) Patent — International", h: "Per patent." },
      { id: "patN", t: "(5)(a) Patent — National", h: "Per patent." },
      { id: "polI", t: "(5)(b) Policy document — International body", h: "UNO / UNESCO / World Bank / IMF etc.", cap: true },
      { id: "polN", t: "(5)(b) Policy document — Central Government", h: "Per document.", cap: true },
      { id: "polS", t: "(5)(b) Policy document — State Government", h: "Per document.", cap: true },
      { id: "awI", t: "(5)(c) Award / Fellowship — International", h: "Each." },
      { id: "awN", t: "(5)(c) Award / Fellowship — National", h: "Each." }
    ]
  },
  {
    id: "c6", num: "6", ico: "🎤", title: "Invited Lectures · Resource Person · Paper Presentations",
    sub: "A paper presented and also published in proceedings is counted once. Falls under the cap with 5-b.", auth: false, capAll: true,
    det: "Evidence: invitation/participation certificates stating level (International abroad / in-country / National / State-University).", items: [
      { id: "l7", t: "International — abroad", h: "Per seminar / conference." },
      { id: "l5", t: "International — within the country", h: "Per seminar / conference." },
      { id: "l3", t: "National level", h: "Per seminar / conference." },
      { id: "l2", t: "State / University level", h: "Per seminar / conference." }
    ]
  }
];

const CATS13 = [
  {
    id: "k1", key: "CI", ico: "📖", title: "Category I — Teaching, Learning & Evaluation Related Activities",
    sub: "Hours-based model table · maximum 180 · minimum 100 required for promotion.", kind: "cat1"
  },
  {
    id: "k2", key: "CII", ico: "🤝", title: "Category II — Co-curricular, Extension & Professional Development",
    sub: "Committee-graded and hours-based items · maximum 70 · minimum 20 required.", kind: "cat2"
  },
  {
    id: "k3", key: "IIIA", ico: "🧪", title: "Category III-A — Research Papers (Journals)",
    sub: "Refereed base + impact-factor augmentation · authorship 60/40 split · capped vs total API claimed.", kind: "IIIA"
  },
  {
    id: "k4", key: "IIIB", ico: "📚", title: "Category III-B — Research Publications (Books, Chapters)",
    sub: "Publisher-tiered values · authorship 60/40 split · capped vs total API claimed.", kind: "items",
    det: "Evidence: title/copyright pages with ISBN/ISSN and publisher tier; directory numbers for knowledge-based volumes.", items: [
      { id: "b50", t: "Text / reference book — International publisher (established peer review)", h: "Per sole-author book.", auth: true },
      { id: "b25", t: "Subject book — National publisher / State & Central Govt. publication", h: "Per sole-author book, with ISBN/ISSN.", auth: true },
      { id: "b15", t: "Subject book — other local publisher", h: "Per sole-author book, with ISBN/ISSN.", auth: true },
      { id: "ch10", t: "Chapter — International publisher", h: "Per chapter · incl. chapters in knowledge-based volumes.", auth: true },
      { id: "ch5", t: "Chapter — Indian / National publisher", h: "Per chapter · incl. knowledge-based volumes with directory numbers.", auth: true },
      { id: "ch3", t: "Chapter — other local publisher", h: "Per chapter in edited books.", auth: true }
    ]
  },
  {
    id: "k5", key: "IIIC", ico: "🔬", title: "Category III-C — Research Projects",
    sub: "Sponsored, consultancy, quality evaluation and outputs · capped vs total API claimed.", kind: "IIIC"
  },
  {
    id: "k6", key: "IIID", ico: "🎓", title: "Category III-D — Research Guidance",
    sub: "Degrees awarded / theses submitted · capped vs total API claimed.", kind: "items",
    det: "Evidence: students' award / submission letters from the university.", items: [
      { id: "dMph", t: "M.Phil. — degree awarded only", h: "Per candidate." },
      { id: "dPhA", t: "Ph.D. — degree awarded", h: "Per candidate." },
      { id: "dPhS", t: "Ph.D. — thesis submitted", h: "Per candidate." }
    ]
  },
  {
    id: "k7", key: "IIIE", ico: "🎤", title: "Category III-E — Training Courses & Conference / Seminar Papers",
    sub: "Courses sub-capped within the category · whole category capped vs total API claimed.", kind: "IIIE"
  }
];

const fmt = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return (r % 1 === 0) ? String(r) : r.toFixed(r * 10 % 1 === 0 ? 1 : 2);
};
const GN: Record<string, string> = { G: "Good", S: "Satisfactory", N: "Not satisfactory" };

interface APIScoreCalculatorProps {
  embedded?: boolean;
}

export function APIScoreCalculator({ embedded = false }: APIScoreCalculatorProps) {
  const [fw, setFw] = useState<'f18' | 'f13'>('f18');
  const [faculty, setFaculty] = useState<'sci' | 'hum'>('hum');
  const [auth18, setAuth18] = useState<'sole' | 'first' | 'joint'>('sole');
  const [auth13, setAuth13] = useState<'sole' | 'lead1' | 'lead2' | 'co'>('sole');
  const [nAuth, setNAuth] = useState<number>(4);



  // Teaching workload rows for 2018 Table 1-A
  const [tchRows, setTchRows] = useState<Array<{ id: number; course: string; asg: string; tkn: string }>>([
    { id: 1, course: '', asg: '', tkn: '' }
  ]);

  // Form inputs state
  const [values, setValues] = useState<Record<string, number>>({});
  
  // Custom FW overrides
  const [FW, setFW] = useState<any>(JSON.parse(JSON.stringify(DEF)));
  const [profName, setProfName] = useState('');
  
  // UI Accordion States
  const [openAccs, setOpenAccs] = useState<Record<string, boolean>>({
    accStudio: false,
    accT1: true,
    c1: true,
    k1: true
  });

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const { saveResult } = useToolResultSaver();
  const { ref: heroRef } = useScrollAnimation();


  const handleInputChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setValues(prev => ({
      ...prev,
      [id]: isNaN(num) || num < 0 ? 0 : num
    }));
  };

  const V = (id: string) => values[id] || 0;

  const auth13Mult = useMemo(() => {
    if (auth13 === "sole") return 1.0;
    if (auth13 === "lead1") return 0.60;
    if (auth13 === "lead2") return 0.30;
    const n = Math.max(3, nAuth || 4);
    return 0.40 / (n - 2);
  }, [auth13, nAuth]);

  const AUTH18_M: Record<string, number> = { sole: 1.00, first: 0.70, joint: 0.30 };

  // Calculations for 2018
  const s18 = useMemo(() => {
    const F = FW.f18;
    const base = F.paperBase[faculty];
    const am = AUTH18_M[auth18];

    let asg = 0, tkn = 0;
    tchRows.forEach(row => {
      const a = parseFloat(row.asg) || 0;
      const t = parseFloat(row.tkn) || 0;
      asg += a;
      tkn += t;
    });

    let tg: string | null = null;
    let pct: number | null = null;
    if (asg > 0) {
      pct = (tkn / asg) * 100;
      tg = pct >= F.teachGood ? "G" : pct >= F.teachSat ? "S" : "N";
    }

    let actN = 0;
    ACTIVITIES.forEach(a => { actN += V(a.id); });
    const ag = actN >= F.actGood ? "G" : actN >= 1 ? "S" : "N";

    let og: string | null = null;
    if (tg !== null) {
      og = (tg === "G" && (ag === "G" || ag === "S")) ? "G" : (tg === "S" && (ag === "G" || ag === "S")) ? "S" : "N";
    }

    const catVals: Record<string, number> = {};
    const capPool: Record<string, number> = {};

    CATS18.forEach(c => {
      let sum = 0, cap = 0;
      if (c.kind === "papers") {
        Object.entries(F.aug).forEach(([k, aug]: [string, any]) => {
          const per = (base + aug) * am;
          const v = V(k) * per;
          sum += v;
        });
      } else {
        c.items.forEach((it: any) => {
          const pts = F.items[it.id];
          let v = 0;
          if (it.dual) {
            v = V(it.id + "_s") * pts + V(it.id + "_j") * pts * it.dual.mult;
          } else {
            v = V(it.id) * pts * ((c.auth || it.auth) ? am : 1);
          }
          sum += v;
          if (c.capAll || it.cap) cap += v;
        });
      }
      catVals[c.id] = sum;
      capPool[c.id] = cap;
    });

    const raw = Object.values(catVals).reduce((a, b) => a + b, 0);
    const pool = Object.values(capPool).reduce((a, b) => a + b, 0);
    const rest = raw - pool;
    const cs = F.capShare / 100;
    const allowed = rest * (cs / (1 - cs));
    const cappedPool = Math.min(pool, allowed);
    const total = rest + cappedPool;
    const used = CATS18.filter(c => catVals[c.id] > 0).length;

    return { mode: "f18", catVals, total, raw, pool, cappedPool, used, tg, ag, og, pct, actN, base, am, target: F.target };
  }, [values, FW, faculty, auth18, tchRows]);

  // Calculations for 2013
  const s13 = useMemo(() => {
    const F = FW.f13;
    const am = auth13Mult;

    const a1 = V("h1ai"), a2 = V("h1aii"), a3 = V("h1aiii");
    const c1c = Math.min(V("h1c"), 0.5 * (a1 + a2 + a3));
    const st1 = Math.min((a1 + a2 + a3 + V("h1b") + c1c) / 10, F.sub.s1);
    const st2 = Math.min(V("h2") / 10, F.sub.s2);
    const st3 = Math.min((V("h3a") + V("h3b") + V("h3c")) / 10, F.sub.s3);
    const g4a = V("g4a"), g4b = V("g4b");
    const h4c = Math.min(V("h4c") * F.items.h4cPer, F.sub.fbMax);
    const catI = st1 + st2 + st3 + g4a + g4b + h4c;

    const g5a = V("g5a"), g5b = V("g5b"), g5c = V("g5c"), g7 = V("g7");
    const st6 = Math.min((V("h6a") + V("h6b")) / 10, F.sub.s6);
    const catII = g5a + g5b + g5c + st6 + g7;

    let IIIA = V("p15") * F.paperBase * am;
    Object.entries(F.aug).forEach(([k, aug]: [string, any]) => {
      IIIA += V(k) * (F.paperBase + aug) * am;
    });
    IIIA += V("pNR") * F.items.pNR * am + V("pCP") * F.items.pCP * am;

    let IIIB = 0;
    const catIIIB = CATS13.find(c => c.key === "IIIB");
    catIIIB?.items?.forEach(it => {
      IIIB += V(it.id) * F.items[it.id] * am;
    });

    const div = F.consultDiv[faculty];
    const consV = Math.floor(V("consAmt") / div) * F.consultPer;
    let IIIC = consV;
    ["prA", "prB", "prC", "qeMaj", "qeMin", "outI", "outN"].forEach(id => {
      IIIC += V(id) * F.items[id];
    });

    let IIID = 0;
    ["dMph", "dPhA", "dPhS"].forEach(id => {
      IIID += V(id) * F.items[id];
    });

    const e1raw = V("tc2w") * F.items.tc2w + V("tc1w") * F.items.tc1w;
    const e1 = Math.min(e1raw, F.sub.e1);
    let IIIE = e1;
    ["ppI", "ppN", "ppR", "ppL", "ilI", "ilN"].forEach(id => {
      IIIE += V(id) * F.items[id];
    });

    const IIIraw: Record<string, number> = { IIIA, IIIB, IIIC, IIID, IIIE };
    const grandClaim = catI + catII + IIIA + IIIB + IIIC + IIID + IIIE;
    const IIIcap: Record<string, number> = {};
    const trims: Record<string, number> = {};

    Object.entries(IIIraw).forEach(([k, v]) => {
      const lim = (F.caps[k] / 100) * grandClaim;
      IIIcap[k] = Math.min(v, lim);
      if (v > lim + 0.001) trims[k] = v - lim;
    });

    const catIII = Object.values(IIIcap).reduce((a, b) => a + b, 0);
    const total = catI + catII + catIII;

    return { mode: "f13", catI, catII, IIIraw, IIIcap, trims, catIII, total, grandClaim, min: F.min };
  }, [values, FW, faculty, auth13Mult]);

  const currentScore = fw === 'f18' ? s18.total : s13.total;

  // Compliance deviations check
  const rubricDeviations = useMemo(() => {
    const dev: any[] = [];
    FIELDS.forEach(([fwk, path, label, guard]) => {
      const d = getP(DEF[fwk], path);
      const c = getP(FW[fwk], path);
      if (Math.abs(d - c) > 1e-9) dev.push({ fwk, path, label, guard, def: d, cur: c });
    });
    return dev;
  }, [FW]);

  const nonCompliantCount = useMemo(() => {
    return rubricDeviations.filter(d => d.guard === "fixed13" || (d.guard === "minUp" && d.cur < d.def)).length;
  }, [rubricDeviations]);

  // Auto-save tool result on calculation change
  useEffect(() => {
    if (currentScore > 0) {
      saveResult({
        toolType: 'api_score',
        toolName: 'UGC API Score Calculator',
        inputData: {
          framework: fw,
          faculty,
          auth18,
          auth13,
          nAuth,
          values
        },
        resultData: {
          frameworkLabel: fw === 'f18' ? 'UGC 2018 (CAS)' : 'UGC 2010/2013 (PBAS)',
          facultyStream: faculty === 'sci' ? 'Sciences / Engineering' : 'Humanities / Arts',
          table1Grading: fw === 'f18' ? s18.og : null,
          customRubric: rubricDeviations.length > 0 ? (profName || 'Custom Institution Rubric') : 'Gazette Defaults',
          maxScore: fw === 'f18' ? 200 : 300,
          percentage: Math.round((currentScore / (fw === 'f18' ? 200 : 300)) * 100)
        },
        score: currentScore
      });
    }
  }, [currentScore, fw, faculty, rubricDeviations, profName]);

  const toggleAccordion = (key: string) => {
    setOpenAccs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRubricInput = (fwk: string, path: string, val: string) => {
    const v = parseFloat(val);
    if (!isNaN(v) && v >= 0) {
      setFW((prev: any) => {
        const next = JSON.parse(JSON.stringify(prev));
        setP(next[fwk], path, v);
        return next;
      });
    }
  };

  const handleResetAll = () => {
    if (window.confirm("Reset all entered scores across both frameworks? (Rubric settings will be kept.)")) {
      setValues({});
      setTchRows([{ id: 1, course: '', asg: '', tkn: '' }]);
    }
  };

  const handleResetRubric = () => {
    if (window.confirm("Reset all rubric values to UGC Gazette defaults?")) {
      setFW(JSON.parse(JSON.stringify(DEF)));
      setProfName('');
    }
  };


  const isTestGiven = useMemo(() => {
    if (currentScore > 0) return true;
    if (Object.keys(values).some(k => (values[k] || 0) > 0)) return true;
    if (fw === 'f18') {
      const hasTchInput = tchRows.some(r => (r.course || '').trim() !== '' || (r.asg || '').trim() !== '' || (r.tkn || '').trim() !== '');
      if (hasTchInput) return true;
      const hasActivities = ACTIVITIES.some(a => (values[a.id] || 0) > 0);
      if (hasActivities) return true;
    }
    return false;
  }, [currentScore, values, fw, tchRows]);

  return (
    <div className={cn("min-h-screen bg-[#FDFBF7] text-slate-800", embedded ? "p-0" : "pt-0")}>
      {!embedded && <Navbar />}

      {/* Hero Section */}
      <section ref={heroRef} className={cn("relative overflow-hidden text-center", embedded ? "pt-4 pb-0 bg-transparent text-slate-800" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background text-slate-100")}>
        {!embedded && (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-10 left-20 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
          </div>
        )}
        <div className="max-w-4xl mx-auto space-y-3.5 px-4 relative z-10">
          <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-1.5", embedded ? "bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold uppercase tracking-widest" : "bg-accent/10 border border-accent/20 text-accent text-sm font-medium")}>
            <Award className="h-4 w-4" />
            <span>India-Wide · UGC CAS Assessment Frameworks · Institution-Customizable</span>
          </div>
          <h1 className={cn("font-serif font-bold tracking-tight mb-2", embedded ? "text-2xl text-slate-900" : "text-[50px] leading-tight text-warm")}>
            API Score <span className="text-gradient-gold inline-block">Calculator</span>
          </h1>
          <p className={cn("mx-auto leading-relaxed", embedded ? "text-xs md:text-sm max-w-xl text-slate-600" : "text-lg max-w-2xl text-warm/60")}>
            Pan-India self-assessment for teacher promotion under the Career Advancement Scheme — with gazette-curated scoring-determination guidance and a compliance-guarded Rubric Studio for university-specific adaptations.
          </p>
          <div className={cn("mx-auto space-y-1 mt-3", embedded ? "text-[10px] text-slate-500" : "text-sm text-warm/50")}>
            <p><strong>UGC Regulations 2018</strong> (Gazette 18-07-2018) — Operative National Standard · <strong>UGC 2010 / 2nd Amendment 2013</strong> — Legacy API</p>
          </div>
        </div>
      </section>


      {/* Main Content Wrap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form & Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Framework & Global Config */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
              <Layers className="w-4 h-4" /> Assessment Framework
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-900 mb-2 block">Choose the regulation regime for this assessment period</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFw('f18')}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all",
                    fw === 'f18'
                      ? "bg-slate-900 border-slate-900 text-amber-200 shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="font-bold text-sm">UGC 2018 — CAS</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Current national standard · graded Table 1 + Research Score Table 2</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFw('f13')}
                  className={cn(
                    "p-3.5 rounded-xl border text-left transition-all",
                    fw === 'f13'
                      ? "bg-slate-900 border-slate-900 text-amber-200 shadow-md"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="font-bold text-sm">UGC 2010 · 2nd Amendment 2013</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Legacy point system · Categories I, II & III</div>
                </button>
              </div>
            </div>



            {/* Faculty Stream */}
            <div className="border-t border-slate-100 pt-4">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Faculty Stream</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFaculty('sci')}
                  className={cn(
                    "p-3 rounded-xl border text-left text-xs font-semibold transition-all",
                    faculty === 'sci' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200 text-slate-700"
                  )}
                >
                  Engineering · Sciences · Medical · Vet
                  <span className="block text-[10px] text-slate-500 font-normal mt-0.5">2018: base 8/paper · 2013: science thresholds</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFaculty('hum')}
                  className={cn(
                    "p-3 rounded-xl border text-left text-xs font-semibold transition-all",
                    faculty === 'hum' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200 text-slate-700"
                  )}
                >
                  Arts · Humanities · Social Sciences · Commerce · Mgt
                  <span className="block text-[10px] text-slate-500 font-normal mt-0.5">2018: base 10/paper · 2013: humanities thresholds</span>
                </button>
              </div>
            </div>

            {/* Authorship Distribution */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Authorship Distribution — Publications</Label>
              {fw === 'f18' ? (
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuth18('sole')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth18 === 'sole' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      Sole author<span className="block text-[10px] opacity-75">×1.00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuth18('first')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth18 === 'first' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      First / Corresponding<span className="block text-[10px] opacity-75">×0.70</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuth18('joint')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth18 === 'joint' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      Joint co-author (3+)<span className="block text-[10px] opacity-75">×0.30</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    UGC 2018 note: two authors share <strong>70% each</strong>; more than two — First/Principal/Corresponding <strong>70%</strong>, remaining <strong>30% each</strong>. Multiplier: <strong className="text-amber-800">×{AUTH18_M[auth18].toFixed(2)}</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuth13('sole')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth13 === 'sole' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      Sole author<span className="block text-[10px] opacity-75">×1.00</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuth13('lead1')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth13 === 'lead1' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      First & Corresponding<span className="block text-[10px] opacity-75">×0.60</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuth13('lead2')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth13 === 'lead2' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      First or Corresponding<span className="block text-[10px] opacity-75">×0.30</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuth13('co')}
                      className={cn("p-2.5 rounded-xl border text-center text-xs font-semibold transition-all", auth13 === 'co' ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200")}
                    >
                      Other co-author<span className="block text-[10px] opacity-75">Shares 40%</span>
                    </button>
                  </div>
                  {auth13 === 'co' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-600 font-medium">Total number of authors:</span>
                      <Input
                        type="number"
                        min={3}
                        value={nAuth}
                        onChange={e => setNAuth(parseInt(e.target.value) || 3)}
                        className="w-20 h-8 text-xs text-center rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">
                    Multiplier applied: <strong className="text-amber-800">×{auth13Mult.toFixed(4)}</strong>
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRulesModal(true)}
              className="w-full text-xs font-semibold rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 gap-1.5"
            >
              <FileCheck className="w-4 h-4 text-amber-600" /> Scoring Rules & Evidence Guide
            </Button>
          </div>

          {/* Rubric Studio Accordion */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleAccordion('accStudio')}
              className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base">Rubric Studio — Institution Customization</h3>
                  <p className="text-xs text-slate-500">Adapt weightages, minima and values to your university statutes.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                  {rubricDeviations.length === 0 ? "Gazette Defaults" : `${rubricDeviations.length} custom value(s)`}
                </span>
                {openAccs.accStudio ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>

            {openAccs.accStudio && (
              <div className="p-6 border-t border-slate-100 space-y-4">
                <Input
                  placeholder="Institution profile name (e.g. XYZ University — CAS Rubric 2026)"
                  value={profName}
                  onChange={e => setProfName(e.target.value)}
                  className="text-xs rounded-xl h-10"
                />

                <div className="space-y-4 text-xs">
                  {["weight13", "minUp", "adopt18", "fixed13"].map(g => (
                    <div key={g} className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        {g === "fixed13" ? "UGC 2013 — Appendix-III Scores & Caps (Gazette-Fixed)" :
                         g === "weight13" ? "UGC 2013 — Category I & II Internal Weightages (Adjustable)" :
                         g === "minUp" ? "Minimum Required Scores & Screening Targets (May Only Increase)" :
                         "UGC 2018 — Values (Adaptable via University Statute)"}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FIELDS.filter(f => f[3] === g).map(([fwk, path, label, guard]) => {
                          const def = getP(DEF[fwk], path);
                          const cur = getP(FW[fwk], path);
                          const isDev = Math.abs(def - cur) > 1e-9;
                          const isViol = isDev && (guard === "fixed13" || (guard === "minUp" && cur < def));

                          return (
                            <div key={path} className={cn("p-2.5 rounded-xl border flex items-center justify-between gap-2", isViol ? "bg-rose-50 border-rose-200" : isDev ? "bg-amber-50 border-amber-200" : "bg-slate-50/50 border-slate-200")}>
                              <div className="min-w-0">
                                <span className="font-medium text-slate-800 block truncate">{label}</span>
                                <span className="text-[10px] text-slate-400">Gazette: {def}</span>
                              </div>
                              <Input
                                type="number"
                                step={0.5}
                                value={cur}
                                onChange={e => handleRubricInput(fwk, path, e.target.value)}
                                className="w-20 h-8 text-xs text-center font-bold shrink-0 rounded-lg bg-white"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compliance summary */}
                <div className={cn("p-3.5 rounded-xl border text-xs leading-relaxed", nonCompliantCount > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : rubricDeviations.length > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800")}>
                  {rubricDeviations.length === 0 ? (
                    <span className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Gazette defaults active — no deviations.</span>
                  ) : (
                    <div>
                      <span className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> {rubricDeviations.length} deviation(s) from gazette defaults ({nonCompliantCount} non-compliant).
                      </span>
                      <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[11px]">
                        {rubricDeviations.map(d => (
                          <li key={d.path}>
                            {d.label}: Gazette {d.def} → {d.cur} ({d.guard === "fixed13" ? "NON-COMPLIANT under Cl. 6.0.2" : d.guard === "minUp" && d.cur < d.def ? "NON-COMPLIANT (minimum lowered)" : "Permitted Adaptation"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" size="sm" onClick={handleResetRubric} className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl">
                    Reset to Gazette Defaults
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ENGINE 2018 */}
          {fw === 'f18' && (
            <div className="space-y-6">
              {/* Table 1 */}
              <div className="bg-white border border-[#E8E3D9] rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('accT1')}
                  className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">📖</div>
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 text-base">Table 1 — Teaching, Learning & Involvement</h3>
                      <p className="text-xs text-slate-500">Graded assessment (Good / Satisfactory / Not satisfactory)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full", s18.og === "G" ? "bg-emerald-100 text-emerald-800" : s18.og === "S" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600")}>
                      {s18.og ? GN[s18.og] : "Awaiting Input"}
                    </span>
                    {openAccs.accT1 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {openAccs.accT1 && (
                  <div className="p-6 border-t border-slate-100 space-y-6">
                    {/* 1-A Teaching */}
                    <div className="space-y-3">
                      <div className="font-bold text-xs text-amber-800 uppercase tracking-wider">1-A · Teaching Workload</div>
                      <p className="text-xs text-slate-500">Formula: (classes taught ÷ classes assigned) × 100%. Grading: ≥ 80% Good · 70–79% Satisfactory.</p>
                      
                      <div className="space-y-2">
                        {tchRows.map((row, idx) => (
                          <div key={row.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                            <Input
                              placeholder={`Course / Paper ${idx + 1}`}
                              value={row.course}
                              onChange={e => {
                                const val = e.target.value;
                                setTchRows(prev => prev.map(r => r.id === row.id ? { ...r, course: val } : r));
                              }}
                              className="col-span-5 h-9 text-xs rounded-xl"
                            />
                            <Input
                              type="number"
                              placeholder="Assigned"
                              value={row.asg}
                              onChange={e => {
                                const val = e.target.value;
                                setTchRows(prev => prev.map(r => r.id === row.id ? { ...r, asg: val } : r));
                              }}
                              className="col-span-3 h-9 text-xs text-center rounded-xl"
                            />
                            <Input
                              type="number"
                              placeholder="Taken"
                              value={row.tkn}
                              onChange={e => {
                                const val = e.target.value;
                                setTchRows(prev => prev.map(r => r.id === row.id ? { ...r, tkn: val } : r));
                              }}
                              className="col-span-3 h-9 text-xs text-center rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setTchRows(prev => prev.filter(r => r.id !== row.id))}
                              className="col-span-1 text-slate-400 hover:text-rose-600 text-center font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTchRows(prev => [...prev, { id: Date.now(), course: '', asg: '', tkn: '' }])}
                          className="text-xs rounded-xl border-dashed border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          + Add Course Row
                        </Button>
                      </div>
                    </div>

                    {/* 2 Activities */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="font-bold text-xs text-amber-800 uppercase tracking-wider">2 · Student-Related & Research Activities</div>
                      <p className="text-xs text-slate-500">Grading: ≥ 3 Good · 1–2 Satisfactory · 0 Not satisfactory.</p>
                      
                      <div className="space-y-3">
                        {ACTIVITIES.map(act => (
                          <div key={act.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">{act.t}</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">{act.h}</span>
                            </div>
                            <Input
                              type="number"
                              min={0}
                              value={V(act.id) || ''}
                              onChange={e => handleInputChange(act.id, e.target.value)}
                              placeholder="0"
                              className="w-16 h-9 text-center font-bold rounded-xl bg-white shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Table 2 Categories */}
              {CATS18.map(c => (
                <div key={c.id} className="bg-white border border-[#E8E3D9] rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(c.id)}
                    className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">{c.ico}</div>
                      <div>
                        <h3 className="font-serif font-bold text-slate-900 text-base">Category {c.num} — {c.title}</h3>
                        <p className="text-xs text-slate-500">{c.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-lg text-slate-900">
                        {fmt(s18.catVals[c.id])} <small className="text-xs font-sans text-slate-500">pts</small>
                      </span>
                      {openAccs[c.id] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {openAccs[c.id] && (
                    <div className="p-6 border-t border-slate-100 space-y-4">
                      {c.kind === "papers" ? (
                        <div className="space-y-3">
                          {Object.entries(FW.f18.aug).map(([k, aug]: [string, any]) => {
                            const labels: Record<string, string> = {
                              aug0: "Without impact factor", aug1: "Impact factor below 1", aug12: "Impact factor 1 – 2", aug25: "Impact factor 2 – 5", aug510: "Impact factor 5 – 10", aug10p: "Impact factor above 10"
                            };
                            const base = FW.f18.paperBase[faculty];
                            const am = AUTH18_M[auth18];
                            const per = (base + aug) * am;
                            const score = V(k) * per;

                            return (
                              <div key={k} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                                <div>
                                  <span className="font-bold text-slate-900 block">Papers — {labels[k]}</span>
                                  <span className="text-[11px] text-amber-800">Per paper: {fmt(per)} pts · authorship applied</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={V(k) || ''}
                                    onChange={e => handleInputChange(k, e.target.value)}
                                    placeholder="0"
                                    className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                  />
                                  <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(score)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {c.items?.map(it => {
                            const pts = FW.f18.items[it.id];
                            const am = AUTH18_M[auth18];
                            let score = 0;
                            if (it.dual) {
                              score = V(it.id + "_s") * pts + V(it.id + "_j") * pts * it.dual.mult;
                            } else {
                              score = V(it.id) * pts * ((c.auth || it.auth) ? am : 1);
                            }

                            return (
                              <div key={it.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block">{it.t}</span>
                                  <span className="text-[11px] text-slate-500 block leading-normal">{it.h}</span>
                                </div>
                                {it.dual ? (
                                  <div className="flex items-center gap-2">
                                    <div className="text-center">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={V(it.id + "_s") || ''}
                                        onChange={e => handleInputChange(it.id + "_s", e.target.value)}
                                        placeholder="0"
                                        className="w-14 h-8 text-center text-xs font-bold rounded-lg bg-white"
                                      />
                                      <span className="text-[9px] text-slate-400 block">Sole</span>
                                    </div>
                                    <div className="text-center">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={V(it.id + "_j") || ''}
                                        onChange={e => handleInputChange(it.id + "_j", e.target.value)}
                                        placeholder="0"
                                        className="w-14 h-8 text-center text-xs font-bold rounded-lg bg-white"
                                      />
                                      <span className="text-[9px] text-slate-400 block">{it.dual.cap}</span>
                                    </div>
                                    <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(score)}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={V(it.id) || ''}
                                      onChange={e => handleInputChange(it.id, e.target.value)}
                                      placeholder="0"
                                      className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                    />
                                    <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(score)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ENGINE 2013 */}
          {fw === 'f13' && (
            <div className="space-y-6">
              {CATS13.map(c => (
                <div key={c.id} className="bg-white border border-[#E8E3D9] rounded-2xl overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(c.id)}
                    className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center font-bold">{c.ico}</div>
                      <div>
                        <h3 className="font-serif font-bold text-slate-900 text-base">{c.title}</h3>
                        <p className="text-xs text-slate-500">{c.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-lg text-slate-900">
                        {fmt(c.key === "CI" ? s13.catI : c.key === "CII" ? s13.catII : s13.IIIcap[c.key] || 0)} <small className="text-xs font-sans text-slate-500">pts</small>
                      </span>
                      {openAccs[c.id] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {openAccs[c.id] && (
                    <div className="p-6 border-t border-slate-100 space-y-4">
                      {/* Render custom Category I (cat1) */}
                      {c.kind === "cat1" && (() => {
                        const st1 = Math.min((V("h1ai") + V("h1aii") + V("h1aiii") + V("h1b") + Math.min(V("h1c"), 0.5 * (V("h1ai") + V("h1aii") + V("h1aiii")))) / 10, FW.f13.sub.s1);
                        const st2 = Math.min(V("h2") / 10, FW.f13.sub.s2);
                        const st3 = Math.min((V("h3a") + V("h3b") + V("h3c")) / 10, FW.f13.sub.s3);

                        return (
                          <div className="space-y-4">
                            <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                              📋 <b>Determination & evidence:</b> Hours are computed from the official time-table or actual hours spent in the previous academic year, working days/weeks only; the institution verifies from the Time Table and attendance records. Hours beyond a sub-total cap are credited at the maximum. Graded items (4-A, 4-B) require evidence; the screening committee finalizes the grade.
                            </p>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6 first:mt-0">1 · TEACHING HOURS</div>
                            
                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">1A(i) Classroom teaching — lectures / seminars, as per allocation</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Total hours allocated per time-table for the academic year (working weeks only). Gazette example: 20 hrs/week × 16 weeks = 320 hrs per semester.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h1ai") || ''}
                                  onChange={e => handleInputChange("h1ai", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">1A(ii) Classroom teaching in excess of UGC norms</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Additional hours beyond the UGC teaching norm for your cadre (e.g., 2 hrs/week × 16 = 32).</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h1aii") || ''}
                                  onChange={e => handleInputChange("h1aii", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">1A(iii) Preparation time</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Credited as equal to actual teaching hours per the attendance register — enter actual hours taught (e.g., 275).</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h1aiii") || ''}
                                  onChange={e => handleInputChange("h1aiii", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">1B Tutorials and practicals</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Actual hours per attendance register.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h1b") || ''}
                                  onChange={e => handleInputChange("h1b", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">1C Outside-classroom interaction with students</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Capped at 0.5 × total 1A hours — the cap is applied automatically.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h1c") || ''}
                                  onChange={e => handleInputChange("h1c", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 items-center py-2 text-[12.5px] text-slate-500 font-semibold border-t border-slate-100 mt-2">
                              <span>Sub-total 1 = hours ÷ 10 (max {FW.f13.sub.s1}):</span>
                              <span className="font-bold text-slate-900 text-sm">{fmt(st1)}</span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">2 · RESEARCH SUPERVISION</div>
                            
                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">Research supervision incl. Masters thesis</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Max 1 hour per student per working week.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h2") || ''}
                                  onChange={e => handleInputChange("h2", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 items-center py-2 text-[12.5px] text-slate-500 font-semibold border-t border-slate-100 mt-2">
                              <span>Sub-total 2 = hours ÷ 10 (max {FW.f13.sub.s2}):</span>
                              <span className="font-bold text-slate-900 text-sm">{fmt(st2)}</span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">3 · EXAMINATION DUTIES</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">3A Question-paper setting, moderation & related work</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Actual hours.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h3a") || ''}
                                  onChange={e => handleInputChange("h3a", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">3B Invigilation / supervision & related examination duties</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Actual hours.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h3b") || ''}
                                  onChange={e => handleInputChange("h3b", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">3C Evaluation of answer scripts & assignments</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Internal, external and re-evaluation — max 20 minutes per full script (≈ 3 scripts / hour). Excess beyond the cap is credited at the maximum.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h3c") || ''}
                                  onChange={e => handleInputChange("h3c", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 items-center py-2 text-[12.5px] text-slate-500 font-semibold border-t border-slate-100 mt-2">
                              <span>Sub-total 3 = hours ÷ 10 (max {FW.f13.sub.s3}):</span>
                              <span className="font-bold text-slate-900 text-sm">{fmt(st3)}</span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">4 · INNOVATION & FEEDBACK</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">4A Teaching innovation</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Innovative courses and methodologies incl. bilingual/multi-lingual teaching — evidence required; committee-finalized grade.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g4a")}
                                  onChange={e => handleInputChange("g4a", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g4a"))}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">4B New teaching-learning material</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Translation, bridge material, study packs or similar student resources — committee-finalized grade.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g4b")}
                                  onChange={e => handleInputChange("g4b", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g4b"))}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">4C Anonymous students' feedback administered</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Points per course accrue on proof of administering the questionnaire, irrespective of feedback content; comments may not be used against the teacher.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h4c") || ''}
                                  onChange={e => handleInputChange("h4c", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">courses</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(Math.min(V("h4c") * FW.f13.items.h4cPer, FW.f13.sub.fbMax))}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-2 mt-6 p-4 bg-[#FBFAF6] border border-[#E8E3D9] rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">Category I total (max 180 · minimum {FW.f13.min.cI} required):</span>
                              <span className="font-serif font-bold text-base text-[#1E293B]">{fmt(s13.catI)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Render custom Category II (cat2) */}
                      {c.kind === "cat2" && (() => {
                        const st6 = Math.min((V("h6a") + V("h6b")) / 10, FW.f13.sub.s6);

                        return (
                          <div className="space-y-4">
                            <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                              ⓘ Administrative positions score by TIME under this framework, not by post: only duties requiring regular office hours (Dean, Principal, Chairperson, Convenor, Teacher-in-charge or similar) — actual hours per year ÷ 10, combined 6A+6B cap. Graded items 5A/5B/5C and 7 require evidence; the screening committee finalizes; institutions may further specify criteria.
                            </p>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6 first:mt-0">5 · CO-CURRICULAR, EXTENSION & DISSEMINATION</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">5A Discipline-related co-curricular activities</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Field work, study visits, student seminars, events, career counselling etc. — committee-finalized grade.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g5a")}
                                  onChange={e => handleInputChange("g5a", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g5a"))}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">5B Other co-curricular activities</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Cultural, sports, NSS, NCC etc. — committee-finalized grade.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g5b")}
                                  onChange={e => handleInputChange("g5b", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g5b"))}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">5C Extension and dissemination activities</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Public lectures, talks, seminars, popular writings not covered under Category III.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g5c")}
                                  onChange={e => handleInputChange("g5c", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g5c"))}</span>
                              </div>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">6 · ADMINISTRATION & COMMITTEES</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">6A Administrative responsibility</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Dean, Principal, Chairperson, Convenor, Teacher-in-charge or similar duties requiring regular office hours — actual hours spent.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h6a") || ''}
                                  onChange={e => handleInputChange("h6a", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">6B Participation in Board of Studies, academic & administrative committees</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Actual hours spent.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("h6b") || ''}
                                  onChange={e => handleInputChange("h6b", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">hrs / yr</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 items-center py-2 text-[12.5px] text-slate-500 font-semibold border-t border-slate-100 mt-2">
                              <span>Sub-total 6 = hours ÷ 10 (max {FW.f13.sub.s6}):</span>
                              <span className="font-bold text-slate-900 text-sm">{fmt(st6)}</span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">7 · CORPORATE LIFE</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">7 Overall contribution to the collective / corporate life of the institution</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Including items 5, 6 and any other contribution — committee-finalized grade.</span>
                              </div>
                              <div className="flex items-center gap-3 w-40 justify-end">
                                <select
                                  value={V("g7")}
                                  onChange={e => handleInputChange("g7", e.target.value)}
                                  className="w-28 h-9 px-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="0">— None —</option>
                                  <option value="10">Outstanding = 10</option>
                                  <option value="7">Very good = 7</option>
                                  <option value="5">Good = 5</option>
                                  <option value="3">Average = 3</option>
                                  <option value="1">Modest = 1</option>
                                </select>
                                <span className="font-bold text-amber-700 w-10 text-right">{fmt(V("g7"))}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-2 mt-6 p-4 bg-[#FBFAF6] border border-[#E8E3D9] rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">Category II total (max 70 · minimum {FW.f13.min.cII} required):</span>
                              <span className="font-serif font-bold text-base text-[#1E293B]">{fmt(s13.catII)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Render custom Category III-A (IIIA) */}
                      {c.kind === "IIIA" && (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                            ⓘ Evidence: publication copies with ISSN/ISBN; indexing and impact-factor proof per the Thomson Reuters list. Journal/publisher categorization is assessed and verified by the screening/selection committee until subject-wise lists are notified.
                          </p>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Refereed journal — not indexed</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Per paper: {fmt(FW.f13.paperBase * auth13Mult)} pts (base, no augmentation) · authorship applies</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("p15") || ''}
                                onChange={e => handleInputChange("p15", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("p15") * FW.f13.paperBase * auth13Mult)}</span>
                            </div>
                          </div>

                          {Object.keys(FW.f13.aug).map(k => {
                            const labels: Record<string, string> = {
                              pIdx: "Refereed — indexed journal",
                              pI12: "Refereed — impact factor 1 – 2",
                              pI25: "Refereed — impact factor 2 – 5",
                              pI510: "Refereed — impact factor 5 – 10"
                            };
                            const aug = FW.f13.aug[k as keyof typeof FW.f13.aug];
                            const perVal = (FW.f13.paperBase + aug) * auth13Mult;
                            const score = V(k) * perVal;

                            return (
                              <div key={k} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block">{labels[k]}</span>
                                  <span className="text-[11px] text-slate-500 block leading-normal">Per paper: {fmt(perVal)} pts · authorship applies</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={V(k) || ''}
                                    onChange={e => handleInputChange(k, e.target.value)}
                                    placeholder="0"
                                    className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                  />
                                  <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                                  <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(score)}</span>
                                </div>
                              </div>
                            );
                          })}

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Non-refereed but recognized, reputable journals / periodicals</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">With ISBN/ISSN numbers — authorship applies.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("pNR") || ''}
                                onChange={e => handleInputChange("pNR", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("pNR") * FW.f13.items.pNR * auth13Mult)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Conference proceedings — full papers</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Abstracts not included — authorship applies. A paper presented and published as proceedings accrues here, not under III-E(ii).</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("pCP") || ''}
                                onChange={e => handleInputChange("pCP", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("pCP") * FW.f13.items.pCP * auth13Mult)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Render custom Category III-C (IIIC) */}
                      {c.kind === "IIIC" && (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                            ⓘ Evidence: project sanction letters, utilization and completion certificates from the funding agency; consultancy orders with amounts; patent filing/approval letters or policy-document acceptance.
                          </p>

                          <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6 first:mt-0">III-C(i) · Sponsored projects carried out / ongoing</div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Major project — tier (a)</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">
                                {faculty === "sci" ? "Grants above ₹30 lakhs" : "Grants above ₹5 lakhs"}.
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("prA") || ''}
                                onChange={e => handleInputChange("prA", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">projects</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("prA") * FW.f13.items.prA)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Major project — tier (b)</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">
                                {faculty === "sci" ? "₹5 – 30 lakhs" : "₹3 – 5 lakhs"}.
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("prB") || ''}
                                onChange={e => handleInputChange("prB", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">projects</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("prB") * FW.f13.items.prB)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Minor project — tier (c)</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">
                                {faculty === "sci" ? "₹50,000 – 5 lakhs" : "₹25,000 – 3 lakhs"}.
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("prC") || ''}
                                onChange={e => handleInputChange("prC", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">projects</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("prC") * FW.f13.items.prC)}</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">III-C(ii) · Consultancy carried out / ongoing</div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Consultancy amount mobilized</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">
                                Points accrue per every {faculty === "sci" ? "₹10 lakhs (minimum ₹10 lakhs)" : "₹2 lakhs (minimum ₹2 lakhs)"} mobilized.
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                step={0.1}
                                value={V("consAmt") || ''}
                                onChange={e => handleInputChange("consAmt", e.target.value)}
                                placeholder="0"
                                className="w-18 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">₹ lakhs</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">
                                {fmt(Math.floor(V("consAmt") / FW.f13.consultDiv[faculty]) * FW.f13.consultPer)}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">III-C(iii) · Completed projects — quality evaluation</div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Completed project report — major</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Accepted by funding agency.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("qeMaj") || ''}
                                onChange={e => handleInputChange("qeMaj", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">projects</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("qeMaj") * FW.f13.items.qeMaj)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Completed project report — minor</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Accepted by funding agency.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("qeMin") || ''}
                                onChange={e => handleInputChange("qeMin", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">projects</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("qeMin") * FW.f13.items.qeMin)}</span>
                            </div>
                          </div>

                          <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">III-C(iv) · Project outcomes / outputs</div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Output at International level</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Patent / technology transfer / product / process, or major policy document.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("outI") || ''}
                                onChange={e => handleInputChange("outI", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">outcomes</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("outI") * FW.f13.items.outI)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block">Output at National level</span>
                              <span className="text-[11px] text-slate-500 block leading-normal">Patent / technology transfer / product / process, or major policy document of Central / State Govt. bodies.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min={0}
                                value={V("outN") || ''}
                                onChange={e => handleInputChange("outN", e.target.value)}
                                placeholder="0"
                                className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">outcomes</span>
                              <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("outN") * FW.f13.items.outN)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Render custom Category III-E (IIIE) */}
                      {c.kind === "IIIE" && (() => {
                        const stE1 = Math.min(V("tc2w") * FW.f13.items.tc2w + V("tc1w") * FW.f13.items.tc1w, FW.f13.sub.e1);

                        return (
                          <div className="space-y-4">
                            <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                              ⓘ Evidence: course completion certificates stating duration; participation/presentation certificates stating level. Papers published as full proceedings shift to III-A.
                            </p>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6 first:mt-0">III-E(i) · Training courses (sub-category capped)</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">Refresher / methodology / FDP / soft-skills programme — ≥ 2 weeks</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Refresher courses, teaching-learning-evaluation technology programmes, faculty development.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("tc2w") || ''}
                                  onChange={e => handleInputChange("tc2w", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">courses</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("tc2w") * FW.f13.items.tc2w)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">Programme — one week duration</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("tc1w") || ''}
                                  onChange={e => handleInputChange("tc1w", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">courses</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("tc1w") * FW.f13.items.tc1w)}</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 items-center py-2 text-[12.5px] text-slate-500 font-semibold border-t border-slate-100 mt-2">
                              <span>Sub-total III-E(i) (capped at {FW.f13.sub.e1}):</span>
                              <span className="font-bold text-slate-900 text-sm">{fmt(stE1)}</span>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">III-E(ii) · Papers presented in conferences / seminars / workshops</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">International conference</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Participation and presentation (oral/poster). If published as proceedings, claim under III-A instead.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ppI") || ''}
                                  onChange={e => handleInputChange("ppI", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ppI") * FW.f13.items.ppI)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">National</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ppN") || ''}
                                  onChange={e => handleInputChange("ppN", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ppN") * FW.f13.items.ppN)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">Regional / State level</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ppR") || ''}
                                  onChange={e => handleInputChange("ppR", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ppR") * FW.f13.items.ppR)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">Local — University / College level</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ppL") || ''}
                                  onChange={e => handleInputChange("ppL", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">papers</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ppL") * FW.f13.items.ppL)}</span>
                              </div>
                            </div>

                            <div className="text-[11px] font-bold text-slate-400 tracking-wider border-b border-slate-100 pb-1.5 uppercase mt-6">III-E(iv) · Invited lectures / presentations for conferences / symposia</div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">International</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ilI") || ''}
                                  onChange={e => handleInputChange("ilI", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">lectures</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ilI") * FW.f13.items.ilI)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block">National level</span>
                                <span className="text-[11px] text-slate-500 block leading-normal">Each.</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={V("ilN") || ''}
                                  onChange={e => handleInputChange("ilN", e.target.value)}
                                  placeholder="0"
                                  className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">lectures</span>
                                <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(V("ilN") * FW.f13.items.ilN)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Render standard items-mapping block for kind === "items" (Category III-B and III-D) */}
                      {c.kind === "items" && (
                        <div className="space-y-4">
                          {c.det && (
                            <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                              📋 <b>Evidence / Detail:</b> {c.det}
                            </p>
                          )}
                          {c.items?.map(it => {
                            const pts = FW.f13.items[it.id];
                            const am = auth13Mult;
                            // Fix multiplier application: only apply if the item itself or the category is configured for authorship division
                            const score = V(it.id) * pts * ((c.auth || it.auth) ? am : 1);

                            return (
                              <div key={it.id} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block">{it.t}</span>
                                  <span className="text-[11px] text-slate-500 block leading-normal">
                                    {it.h} {(c.auth || it.auth) && "· authorship multiplier applies"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={V(it.id) || ''}
                                    onChange={e => handleInputChange(it.id, e.target.value)}
                                    placeholder="0"
                                    className="w-16 h-9 text-center font-bold rounded-xl bg-white"
                                  />
                                  <span className="font-bold text-amber-700 min-w-[45px] text-right">{fmt(score)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetAll}
              className="text-xs font-semibold rounded-full text-rose-600 border-rose-200 hover:bg-rose-50 px-6 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Entered Scores
            </Button>
          </div>
        </div>

        {/* Right Sidebar: Score Card & Actions */}
        <div className="space-y-6 lg:sticky lg:top-28">
          {/* Main Score Card */}
          <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-slate-100 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#C9A15E] block">
                {fw === 'f18' ? "Academic / Research Score · Table 2" : "Total API Score · Categories I + II + III"}
              </span>
              <div className="font-serif text-5xl font-bold text-white mt-2 mb-1">
                {fmt(currentScore)}
              </div>
              
              {/* Capping Note */}
              <div className={cn("text-xs tracking-wide leading-relaxed", fw === 'f18' && s18.pool > s18.cappedPool + 0.001 ? "text-amber-400 font-medium" : "text-slate-400")}>
                {fw === 'f18' ? (
                  s18.pool > s18.cappedPool + 0.001 
                    ? `${FW.f18.capShare}% cap engaged — 5(b) + Cat 6 trimmed from ${fmt(s18.pool)} to ${fmt(s18.cappedPool)} (raw ${fmt(s18.raw)})`
                    : `Combined 5(b) + Category 6 within the ${FW.f18.capShare}% cap`
                ) : (
                  Object.keys(s13.trims || {}).length > 0
                    ? `Sub-category caps engaged: ${Object.keys(s13.trims).map(k => `${k} −${fmt(s13.trims[k])}`).join(" · ")}`
                    : "All Category III sub-caps within limits"
                )}
              </div>
            </div>

            {/* Category list / progress meters */}
            <div className="space-y-3 pt-2 text-[11px]">
              {fw === 'f18' ? (
                CATS18.map(c => {
                  const val = s18.catVals[c.id] || 0;
                  const pct = s18.raw > 0 ? (val / s18.raw) * 100 : 0;
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-300">Cat {c.num} · {c.title.replace(/&amp;/g, "&").split("—")[0].slice(0, 30)}</span>
                        <span className="font-bold text-white">{fmt(val)}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full transition-all duration-350" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                (() => {
                  const rows = [
                    ["Category I — Teaching", s13.catI],
                    ["Category II — Co-curricular", s13.catII],
                    ["III-A Papers", s13.IIIcap.IIIA],
                    ["III-B Publications", s13.IIIcap.IIIB],
                    ["III-C Projects", s13.IIIcap.IIIC],
                    ["III-D Guidance", s13.IIIcap.IIID],
                    ["III-E Training & papers", s13.IIIcap.IIIE]
                  ];
                  const mx = Math.max(s13.total, 1);
                  return rows.map(([label, v], idx) => {
                    const pct = ((v as number) / mx) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-300">{label as string}</span>
                          <span className="font-bold text-white">{fmt(v as number)}</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-350" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Threshold chips/messages for f13 */}
            {fw === 'f13' && (
              <div className="space-y-2 pt-2 text-[11px]">
                <div className={cn("p-2 rounded-lg flex justify-between font-semibold", s13.catI >= s13.min.cI ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/40 text-rose-400 border border-rose-500/20")}>
                  <span>Category I ≥ {s13.min.cI} (of 180)</span>
                  <span>{s13.catI >= s13.min.cI ? "PASSED ✓" : "FAIL ✗"}</span>
                </div>
                <div className={cn("p-2 rounded-lg flex justify-between font-semibold", s13.catII >= s13.min.cII ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/40 text-rose-400 border border-rose-500/20")}>
                  <span>Category II ≥ {s13.min.cII} (of 70)</span>
                  <span>{s13.catII >= s13.min.cII ? "PASSED ✓" : "FAIL ✗"}</span>
                </div>
                <div className={cn("p-2 rounded-lg flex justify-between font-semibold", (s13.catI + s13.catII) >= s13.min.comb ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/40 text-rose-400 border border-rose-500/20")}>
                  <span>Cat I + II ≥ {s13.min.comb} (of 250)</span>
                  <span>{(s13.catI + s13.catII) >= s13.min.comb ? "PASSED ✓" : "FAIL ✗"}</span>
                </div>
              </div>
            )}

            {/* Category Used Summary Line */}
            <div className={cn("text-center text-xs font-semibold pt-2 border-t border-slate-800", fw === 'f18' && s18.used > 0 && s18.used < 3 ? "text-amber-400" : "text-[#C9A15E]")}>
              {fw === 'f18' ? (
                `${s18.used} of 6 categories used · minimum 3 required`
              ) : (
                "Category III minima vary by stage"
              )}
            </div>

            {/* Threshold Chip */}
            {fw === 'f18' && s18.target > 0 && (
              <div className={cn("p-2.5 rounded-xl border text-xs flex justify-between font-bold", s18.total >= s18.target ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-amber-950/60 border-amber-500/40 text-amber-300")}>
                <span>Institution Target ≥ {s18.target}</span>
                <span>{s18.total >= s18.target ? "PASSED ✓" : "FAIL ✗"}</span>
              </div>
            )}
          </div>

          {/* Table 1 Grading Summary Card */}
          {fw === 'f18' && (
            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                <span>✦</span> Table 1 Grading
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Teaching (1-A)</span>
                  <span className="font-bold text-slate-800">{s18.tg ? GN[s18.tg] : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Involvement (2)</span>
                  <span className="font-bold text-slate-800">{s18.ag ? GN[s18.ag] : "—"}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold">
                  <span className="text-slate-700">Overall grading</span>
                  <span className="text-slate-900">{s18.og ? GN[s18.og] : "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* UGC Score Certificate Card */}
          {isTestGiven && (
            <div className="bg-white border border-[#E8E3D9] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
                <span>✦</span> UGC Score Certificate
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Generates and downloads your verified UGC Academic & Research Score certificate in the original format.
              </p>
              <Button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs h-11 rounded-xl shadow-lg gap-2"
              >
                <Download className="w-4 h-4" /> Download Certificate PDF
              </Button>
            </div>
          )}

          {/* Legal Disclaimer Card */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-5 shadow-sm space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Legal disclaimer — read carefully
            </div>
            <p className="text-[11px] leading-relaxed">
              Two UGC frameworks implemented verbatim: <strong>UGC Regulations 2018</strong> (Gazette 18-07-2018 — current national CAS standard) and the <strong>legacy UGC Regulations 2010, 2nd Amendment</strong> (Gazette 13-06-2013). Per the gazette, API scores are for <strong>screening purposes</strong> and have no bearing on expert assessment by the Selection Committee. Rubric Studio deviations are the adopting institution's responsibility and are compliance-flagged, not blocked. Draft UGC Regulations 2025 remain unnotified. This is an <strong>indicative, self-declared assessment</strong>; final scores rest exclusively with your institution's <strong>IQAC and Screening-cum-Evaluation / Selection Committee</strong>. No liability is accepted for decisions taken on the basis of this tool.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-slate-900">Scoring Rules & Evidence Guide</h2>
              <button type="button" onClick={() => setShowRulesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-slate-700">
              <p>Curated verbatim from UGC Gazette 13-06-2013 and UGC 2018 CAS PBAS guidelines.</p>
              <div className="space-y-2">
                <h4 className="font-bold text-amber-800">1. Administrative Positions</h4>
                <p>Holding a listed position (Head, Dean, Convenor, Warden etc.) counts as 1 activity under 2018 Table 1 §2-A upon proof of office order.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-amber-800">2. Multi-Author Publications</h4>
                <p>UGC 2018: Two authors share 70% each. First/Principal/Corresponding author receives 70%, joint co-authors receive 30% each.</p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="button" onClick={() => setShowRulesModal(false)} className="rounded-xl text-xs font-semibold">
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <APIScoreCertificateModal
        open={showCertModal}
        onOpenChange={setShowCertModal}
        totalScore={currentScore}
        maxScore={350}
        cat1Score={fw === 'f18' ? ((s18.og === 'G' || s18.og === 'S') ? 100 : 0) : Math.round(s13.catI)}
        cat1Max={100}
        cat2Score={fw === 'f18' ? Math.round(s18.total) : Math.round(s13.catII)}
        cat2Max={200}
        cat3Score={fw === 'f18' ? 0 : Math.round(s13.catIII)}
        cat3Max={50}
      />

      {!embedded && <Footer />}
    </div>
  );
}

export default APIScoreCalculator;

