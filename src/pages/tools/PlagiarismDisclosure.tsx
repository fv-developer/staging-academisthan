import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { Shield, Download, AlertTriangle, Info } from 'lucide-react';
import { z } from 'zod';
import jsPDF from 'jspdf';

const schema = z.object({
  authorName:  z.string().trim().min(2, 'Required').max(150),
  workTitle:   z.string().trim().min(3, 'Required').max(300),
  workType:    z.string().min(1, 'Required'),
  similarity:  z.coerce.number().min(0).max(100),
  software:    z.string().min(1, 'Required'),
  aiUsed:      z.enum(['none', 'limited', 'substantial']),
  aiDetails:   z.string().max(1000).optional(),
  institution: z.string().trim().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

const WORK_TYPES = ['Research Paper', 'Thesis (Ph.D.)', 'Thesis (M.Phil.)', 'Dissertation (M.Sc./M.A.)', 'Book Chapter', 'Conference Paper', 'Project Report'];
const SOFTWARE = ['Turnitin', 'iThenticate', 'Urkund / Ouriginal', 'DrillBit', 'Plagscan', 'Copyleaks', 'Other'];

export default function PlagiarismDisclosure() {
  const { profile } = useAuth();
  const { ref: heroRef } = useScrollAnimation();
  const { toast } = useToast();

  const [form, setForm] = useState<Partial<FormData>>({
    authorName: profile?.full_name || '',
    institution: profile?.institution || '',
    similarity: 0,
    aiUsed: 'none',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (k: keyof FormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const generatePDF = () => {
    const isProfileComplete = profile && ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'].every(f => {
      const val = (profile as any)[f];
      return val && typeof val === 'string' && val.trim();
    });
    if (profile?.membership_status !== 'active' && !isProfileComplete) {
      toast({
        title: 'Fellowship Required',
        description: 'Generating Disclosure PDFs requires an active Fellow membership.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast({ title: 'Please fix the errors', variant: 'destructive' });
      return;
    }
    setErrors({});
    const d = parsed.data;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    let y = 22;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(26, 39, 68);
    doc.text('DISCLOSURE STATEMENT', w / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text('Plagiarism Check & AI Assistance Declaration', w / 2, y, { align: 'center' });
    y += 3;
    doc.text('As required under UGC (Promotion of Academic Integrity) Regulations, 2018', w / 2, y, { align: 'center' });
    y += 5;
    doc.setDrawColor(176, 141, 76); doc.line(20, y, w - 20, y); y += 10;

    const section = (n: string, body: string) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 39, 68);
      doc.text(n, 20, y); y += 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 40, 50);
      const lines = doc.splitTextToSize(body, w - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 4;
      if (y > 260) { doc.addPage(); y = 20; }
    };

    section('1. Author', d.authorName);
    if (d.institution) section('2. Institution', d.institution);
    section(`${d.institution ? '3' : '2'}. Title of Work`, d.workTitle);
    section(`${d.institution ? '4' : '3'}. Type of Work`, d.workType);

    section(`${d.institution ? '5' : '4'}. Plagiarism Check`,
      `The above work has been checked for similarity using ${d.software}. ` +
      `The similarity index reported is ${d.similarity}%, which is within the limits prescribed by ` +
      `UGC Regulation 6 (a) for the applicable category of work. A signed plagiarism report from the ` +
      `${d.software} software is attached/available on demand.`);

    const aiText = d.aiUsed === 'none'
      ? 'I declare that NO Generative AI / Large Language Model tools were used in the conception, drafting, or analysis of this work.'
      : d.aiUsed === 'limited'
        ? `I declare that Generative AI / LLM tools were used in a LIMITED capacity (e.g. grammar checking, copy-editing, formatting) and not for substantive content generation. ${d.aiDetails || ''}`
        : `I declare that Generative AI / LLM tools were used SUBSTANTIALLY for parts of this work. Details: ${d.aiDetails || 'Not specified'}. All AI-generated content has been reviewed, verified for factual accuracy, and is appropriately cited where required.`;
    section(`${d.institution ? '6' : '5'}. AI Assistance Disclosure`, aiText);

    section(`${d.institution ? '7' : '6'}. Declaration`,
      `I, ${d.authorName}, hereby declare that the above information is true to the best of my knowledge. ` +
      `I take full responsibility for the originality of this work and the accuracy of this disclosure. ` +
      `I understand that any misrepresentation may attract action under UGC Regulations, 2018 and ` +
      `applicable institutional policies.`);

    y += 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(40, 40, 50);
    doc.text('Signature: ____________________', 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, w - 60, y);
    y += 6;
    doc.text('Place: ____________________', 20, y);

    // Disclaimer
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    const disc = 'TEMPLATE NOTICE: This disclosure statement is generated from author-declared inputs by Academisthan Foundation. ' +
      'It is a template only and does NOT replace your university\'s official plagiarism certificate or AI-disclosure form. ' +
      'Verify the latest UGC Regulations and institutional formats before submission. Academisthan does not verify any data entered.';
    const discLines = doc.splitTextToSize(disc, w - 40);
    doc.text(discLines, 20, 285);

    doc.save(`Disclosure-${d.authorName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
    toast({ title: 'Disclosure statement downloaded' });
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-accent text-sm font-medium">UGC 2018 Academic Integrity</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-4">
            Plagiarism & AI <span className="text-gradient-gold">Disclosure</span>
          </h1>
          <p className="text-warm/60 text-lg max-w-2xl mx-auto">
            Generate a compliant disclosure statement covering similarity-index and Generative AI usage —
            required by most universities under UGC Regulations 2018 and 2023 AI guidance.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
            <Field label="Author Name *" error={errors.authorName}>
              <Input value={form.authorName || ''} onChange={(e) => update('authorName', e.target.value.slice(0, 150))} className="rounded-xl" maxLength={150} />
            </Field>

            <Field label="Institution (optional)">
              <Input value={form.institution || ''} onChange={(e) => update('institution', e.target.value.slice(0, 200))} className="rounded-xl" maxLength={200} />
            </Field>

            <Field label="Title of Work *" error={errors.workTitle}>
              <Input value={form.workTitle || ''} onChange={(e) => update('workTitle', e.target.value.slice(0, 300))} className="rounded-xl" maxLength={300} />
            </Field>

            <Field label="Type of Work *" error={errors.workType}>
              <select
                value={form.workType || ''}
                onChange={(e) => update('workType', e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
              >
                <option value="">Select type…</option>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Similarity Index % *" error={errors.similarity}>
                <Input type="number" min={0} max={100} value={form.similarity ?? 0} onChange={(e) => update('similarity', Number(e.target.value))} className="rounded-xl font-mono" />
              </Field>
              <Field label="Plagiarism Software Used *" error={errors.software}>
                <select
                  value={form.software || ''}
                  onChange={(e) => update('software', e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {SOFTWARE.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Generative AI / LLM Use *">
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'limited', 'substantial'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => update('aiUsed', opt)}
                    className={`rounded-xl p-2 text-xs border capitalize ${
                      form.aiUsed === opt ? 'bg-gold/10 border-gold/40 text-gold font-semibold' : 'bg-muted/30 border-border text-muted-foreground'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>

            {form.aiUsed !== 'none' && (
              <Field label="AI Usage Details">
                <Textarea
                  value={form.aiDetails || ''}
                  onChange={(e) => update('aiDetails', e.target.value.slice(0, 1000))}
                  placeholder="Describe which AI tools, for which sections, and how outputs were verified…"
                  className="rounded-xl resize-none"
                  rows={3}
                  maxLength={1000}
                />
              </Field>
            )}

            <Button
              onClick={generatePDF}
              className="w-full rounded-xl h-12 bg-gold text-gold-foreground hover:bg-gold/90 text-base font-semibold gap-2"
            >
              <Download className="h-5 w-5" /> Generate Disclosure PDF
            </Button>
          </div>

          <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 text-foreground/80 font-semibold mb-1">
              <Info className="h-3.5 w-3.5 text-gold" /> UGC Similarity Limits (Regulation 6)
            </p>
            <ul className="space-y-0.5 ml-5">
              <li>• Up to 10% — minor & acceptable</li>
              <li>• 10–40% — level 1 violation, revise & resubmit</li>
              <li>• 40–60% — level 2 violation, debarred from submission for 1 yr</li>
              <li>• Above 60% — level 3 violation, registration cancelled</li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
              <strong className="text-foreground/70">Disclaimer</strong>
            </p>
            <p className="mt-1">
              This is a <strong>template</strong> only. Verify the latest <a href="https://www.ugc.gov.in" target="_blank" rel="noopener noreferrer" className="text-gold underline">UGC Regulations</a> and
              your institution's official disclosure format before submission. Academisthan does not verify any data entered and bears no responsibility for academic integrity decisions.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {error}</p>}
    </div>
  );
}
