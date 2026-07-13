import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

const faqs = [
  {
    q: 'How do I calculate my API score for CAS promotion?',
    a: 'Your Academic Performance Indicator (API) score under UGC CAS is calculated across three categories: Teaching & Learning (Category I, max 75 marks/year), Professional Development & Co-curricular activities (Category II), and Research & Academic Contributions (Category III). Use the Academisthan API Score Calculator to enter your annual scores — it tallies them against the UGC 2018 CAS thresholds and tells you which stage you qualify for.',
  },
  {
    q: 'What is the minimum API score for promotion from Assistant Professor Stage 1 to Stage 2?',
    a: 'To move from Assistant Professor (Academic Level 10) to Senior Assistant Professor (Academic Level 11), you need at least four years of service in Stage 1, completion of an Orientation and a Refresher Course, satisfactory annual performance with API scores meeting Category I (Teaching) and Category II/III combined minimum thresholds notified by your university.',
  },
  {
    q: 'What is required to promote from Stage 2 to Stage 3 (Associate Professor)?',
    a: 'Promotion from Senior Assistant Professor (Level 11) to Associate Professor (Level 13A) requires a Ph.D., 9 years of service in the relevant cadre, three publications in UGC-CARE listed journals during the assessment period, and a satisfactory recommendation by the Selection Committee (Screening-cum-Evaluation) along with completion of mandatory refresher courses.',
  },
  {
    q: 'How do I promote from Associate Professor to Professor (Stage 4)?',
    a: 'For promotion from Associate Professor (Level 13A) to Professor (Level 14), you need 10 years as Associate Professor, ten publications in UGC-CARE journals after Ph.D., supervision of research scholars, and selection through a Selection Committee with subject experts. The API/Research Score is evaluated using UGC 2018 Table 2.',
  },
  {
    q: 'Which journals count for UGC API research score?',
    a: 'Only journals listed in the UGC-CARE Reference List qualify. Web of Science / Scopus indexed journals carry the highest weight. Predatory, beall-listed, or removed journals are not counted. Verify each publication on ugccare.unipune.ac.in before submitting your CAS form.',
  },
  {
    q: 'Do online FDPs count for Category II refresher requirements?',
    a: 'Yes — UGC HRDC and Pandit Madan Mohan Malaviya National Mission on Teachers and Teaching (PMMMNMTT) accredited online FDPs of two weeks duration count as Refresher Courses for CAS purposes. Always retain the completion certificate with HRDC code.',
  },
  {
    q: 'Is the Academisthan API Score Calculator legally valid for submission?',
    a: 'The calculator gives you an indicative self-assessment based on UGC Regulations 2018. The final API score is determined by your institution\'s Internal Quality Assurance Cell (IQAC) and Selection Committee. Use our certificate as a preparation aid — not as a regulatory document.',
  },
];

const stages = [
  { from: 'Assistant Professor — Stage 1', to: 'Senior Asst. Prof. — Stage 2', service: '4 years', key: 'Orientation + 1 Refresher + satisfactory API' },
  { from: 'Senior Asst. Prof. — Stage 2', to: 'Associate Professor — Stage 3', service: '5 years', key: 'Ph.D. + 3 CARE publications + Selection Committee' },
  { from: 'Associate Professor — Stage 3', to: 'Professor — Stage 4', service: '3 years', key: '10 CARE publications + research supervision' },
  { from: 'Professor — Stage 4', to: 'Senior Professor — Stage 5', service: '10 years', key: 'Outstanding contribution + Expert Committee' },
];

export default function CASPromotionFAQ() {
  const canonical = 'https://academisthan.org/resources/cas-promotion-faq';
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>CAS Promotion Guide & API Score Calculation — UGC 2018 FAQ</title>
        <meta name="description" content="Step-by-step guide to UGC CAS promotion for Assistant Professors. Learn how to calculate your API score, eligibility for Stage 1 to 5, and CARE journal rules." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="CAS Promotion Guide & API Score Calculation" />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      <article className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <p className="text-sm text-gold font-semibold tracking-widest uppercase mb-3">For Educators</p>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            Step-by-Step Guide to CAS Promotion for Assistant Professors
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
            A complete reference on calculating your API score and clearing each CAS stage under
            UGC Regulations 2018 — written for Indian college and university teachers.
          </p>

          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 mb-10 flex gap-3">
            <Calculator className="w-6 h-6 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">Skip the spreadsheet</p>
              <p className="text-sm text-muted-foreground mb-3">
                Use our free API Score Calculator to get an instant self-assessment and a shareable certificate.
              </p>
              <Link to="/tools/api-score">
                <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2">
                  Calculate my API score <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-12 mb-4">
            The four CAS stages at a glance
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border mb-12">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-4 font-semibold text-foreground">From</th>
                  <th className="p-4 font-semibold text-foreground">To</th>
                  <th className="p-4 font-semibold text-foreground">Min. service</th>
                  <th className="p-4 font-semibold text-foreground">Key requirement</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.from} className="border-t border-border">
                    <td className="p-4 text-foreground">{s.from}</td>
                    <td className="p-4 text-foreground">{s.to}</td>
                    <td className="p-4 text-muted-foreground">{s.service}</td>
                    <td className="p-4 text-muted-foreground">{s.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
            Documents to keep ready
          </h2>
          <ul className="space-y-3 mb-12">
            {[
              'Annual Self-Appraisal forms with API scores for each year of the assessment period',
              'Orientation & Refresher Course certificates (UGC-HRDC accredited)',
              'List of publications with UGC-CARE / Scopus / Web of Science IDs',
              'Ph.D. award notification and thesis acceptance letter',
              'Research supervision records (M.Phil. / Ph.D. scholars)',
              'Conference, seminar, and workshop attendance proofs',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-4 mb-12">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:border-gold/30 transition-colors">
                <summary className="cursor-pointer font-semibold text-foreground flex items-start justify-between gap-4">
                  <span>{f.q}</span>
                  <FileText className="w-4 h-4 text-gold shrink-0 mt-1 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-5 flex gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p>
              This guide summarises the UGC (Minimum Qualifications for Appointment of Teachers
              and Other Academic Staff in Universities and Colleges) Regulations, 2018, and
              subsequent amendments. Always cross-check your institution&apos;s statutes and the
              latest UGC notifications before submitting your CAS application.
            </p>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
