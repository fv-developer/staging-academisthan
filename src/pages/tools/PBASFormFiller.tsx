import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/api-client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, RefreshCw, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

type ToolResult = {
  id: string;
  tool_type: string;
  tool_name: string;
  score: number | null;
  result_data: any;
  created_at: string;
};

export default function PBASFormFiller() {
  const { user, profile } = useAuth();
  const { ref: heroRef } = useScrollAnimation();
  const { toast } = useToast();
  const [history, setHistory] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [meta, setMeta] = useState({
    assessmentYear: new Date().getFullYear().toString(),
    designation: profile?.designation || '',
    department: profile?.department || '',
    institution: profile?.institution || '',
    pan: '',
    epfNo: '',
    declaration: 'I hereby declare that the information furnished above is true to the best of my knowledge and belief.',
  });

  useEffect(() => {
    if (user) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tool_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data as ToolResult[]) || []);
    setLoading(false);
  };

  const latestApi = history.find(h => h.tool_type === 'api_score');
  const latestResearch = history.find(h => h.tool_type === 'research_score');
  const latestPromo = history.find(h => h.tool_type === 'promotion_check');

  const generatePDF = () => {
    if (!profile) {
      toast({ title: 'Sign in required', description: 'Please sign in to generate PBAS form', variant: 'destructive' });
      return;
    }

    const isProfileComplete = profile && ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'].every(f => {
      const val = (profile as any)[f];
      return val && typeof val === 'string' && val.trim();
    });
    if (profile.membership_status !== 'active' && !isProfileComplete) {
      toast({
        title: 'Fellowship Required',
        description: 'Generating PBAS Draft PDFs requires an active Fellow membership.',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(26, 39, 68);
    doc.text('PERFORMANCE-BASED APPRAISAL SYSTEM (PBAS)', w / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Pre-filled Self-Appraisal Performa · UGC Regulations 2018', w / 2, y, { align: 'center' });
    y += 4;
    doc.setDrawColor(176, 141, 76);
    doc.line(20, y, w - 20, y);
    y += 8;

    const field = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 50);
      doc.text(value || '—', 90, y);
      y += 6;
      if (y > 275) { doc.addPage(); y = 20; }
    };

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26, 39, 68);
    doc.text('A. Personal Particulars', 20, y); y += 6;
    field('Name', (profile as any).full_name || '');
    field('Membership ID', (profile as any).membership_id || '');
    field('Designation', meta.designation);
    field('Department', meta.department);
    field('Institution', meta.institution);
    field('Email', (profile as any).email || '');
    field('Phone', (profile as any).phone || '');
    field('PAN', meta.pan);
    field('EPF/Employee No.', meta.epfNo);
    field('Assessment Year', meta.assessmentYear);

    y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26, 39, 68);
    doc.text('B. Academic Scores (Auto-pulled from Academisthan Tools)', 20, y); y += 6;

    if (latestApi) {
      const d = latestApi.result_data || {};
      field('UGC 2018 Total Score', `${latestApi.score} / 350`);
      if (d.categoryScores?.teaching != null) field('Teaching Performance (Table 2)', `${d.categoryScores.teaching} / 100`);
      if (d.categoryScores?.research != null) field('Research Score (Table 3A)', `${d.categoryScores.research} / 200`);
      if (d.categoryScores?.other != null) field('Other Contributions', `${d.categoryScores.other} / 50`);
      field('Date of Assessment', new Date(latestApi.created_at).toLocaleDateString('en-IN'));
    } else {
      field('UGC 2018 Score', 'Not yet calculated — use API Score Calculator');
    }

    if (latestResearch) {
      y += 2;
      field('Standalone Research Score', `${latestResearch.score} pts`);
    }
    if (latestPromo) {
      y += 2;
      field('Last CAS Check', `${latestPromo.result_data?.stage || ''} — ${latestPromo.result_data?.eligible ? 'Eligible' : 'Pending'}`);
    }

    if (y > 240) { doc.addPage(); y = 20; }
    y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26, 39, 68);
    doc.text('C. Declaration', 20, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
    const declarationLines = doc.splitTextToSize(meta.declaration, w - 40);
    doc.text(declarationLines, 20, y); y += declarationLines.length * 4 + 12;

    doc.text('Signature: ____________________', 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, w - 60, y);
    y += 12;

    // Disclaimer
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    const disc = 'DISCLAIMER: This is a self-declared pre-filled draft generated from data entered by the user in Academisthan tools. ' +
      'It is NOT an official PBAS form and has NOT been verified by Academisthan Foundation, UGC, or any regulatory body. ' +
      'Final PBAS submission must be on the format prescribed by your university IQAC, signed and verified with documentary evidence. ' +
      'Academisthan Foundation bears no responsibility for decisions made based on this draft.';
    const discLines = doc.splitTextToSize(disc, w - 40);
    doc.text(discLines, 20, 285);

    doc.save(`PBAS-Draft-${(profile as any).membership_id || 'ACAD'}-${meta.assessmentYear}.pdf`);
    toast({ title: 'PBAS draft downloaded' });
  };

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-gold/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-4">
            <FileText className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">PBAS Pre-fill Draft</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-4">
            PBAS Form <span className="text-gradient-gold">Auto-Filler</span>
          </h1>
          <p className="text-warm/60 text-lg max-w-2xl mx-auto">
            Generate a pre-filled PBAS Performa draft using your saved Academisthan tool results.
            Print, review, sign, and submit to your university IQAC.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {!user && (
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 text-sm text-foreground">
              Please <a href="/auth/signin" className="text-gold underline">sign in</a> as a Fellow to use this tool — your saved tool results are required to pre-fill the form.
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" /> Required Form Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Assessment Year</Label>
                <Input value={meta.assessmentYear} onChange={(e) => setMeta({ ...meta, assessmentYear: e.target.value.slice(0, 4) })} className="rounded-xl" maxLength={4} />
              </div>
              <div>
                <Label className="text-xs">Designation</Label>
                <Input value={meta.designation} onChange={(e) => setMeta({ ...meta, designation: e.target.value.slice(0, 100) })} className="rounded-xl" maxLength={100} />
              </div>
              <div>
                <Label className="text-xs">Department</Label>
                <Input value={meta.department} onChange={(e) => setMeta({ ...meta, department: e.target.value.slice(0, 100) })} className="rounded-xl" maxLength={100} />
              </div>
              <div>
                <Label className="text-xs">Institution</Label>
                <Input value={meta.institution} onChange={(e) => setMeta({ ...meta, institution: e.target.value.slice(0, 200) })} className="rounded-xl" maxLength={200} />
              </div>
              <div>
                <Label className="text-xs">PAN</Label>
                <Input value={meta.pan} onChange={(e) => setMeta({ ...meta, pan: e.target.value.toUpperCase().slice(0, 10) })} className="rounded-xl font-mono" maxLength={10} />
              </div>
              <div>
                <Label className="text-xs">EPF / Employee Number</Label>
                <Input value={meta.epfNo} onChange={(e) => setMeta({ ...meta, epfNo: e.target.value.slice(0, 30) })} className="rounded-xl" maxLength={30} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Declaration text</Label>
                <Textarea
                  value={meta.declaration}
                  onChange={(e) => setMeta({ ...meta, declaration: e.target.value.slice(0, 500) })}
                  className="rounded-xl resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {user && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gold" /> Saved Tool Results (Auto-pull)
                </h2>
                <Button onClick={fetchHistory} variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Refresh
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="UGC 2018 Total Score" value={latestApi ? `${latestApi.score} / 350 (${new Date(latestApi.created_at).toLocaleDateString('en-IN')})` : '—'} />
                <Row label="Research Score (standalone)" value={latestResearch ? `${latestResearch.score} pts` : '—'} />
                <Row label="Last CAS Eligibility Check" value={latestPromo ? `${latestPromo.result_data?.stage || ''}` : '—'} />
              </div>
              {!latestApi && (
                <p className="text-xs text-muted-foreground mt-3">
                  Tip: visit the <a href="/tools/api-score" className="text-gold underline">UGC Score Calculator</a> first — your score will auto-save and pre-fill here.
                </p>
              )}
            </div>
          )}

          <Button
            onClick={generatePDF}
            disabled={!user}
            className="w-full rounded-xl h-12 bg-gold text-gold-foreground hover:bg-gold/90 text-base font-semibold gap-2"
          >
            <Download className="h-5 w-5" /> Generate PBAS Draft PDF
          </Button>

          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
              <strong className="text-foreground/70">Important</strong>
            </p>
            <p className="mt-1">
              This generates a <strong>draft only</strong>. Each university uses its own PBAS format prescribed by the
              IQAC. Use this PDF as a starting point — copy the values into your official Performa,
              attach documentary evidence, and obtain HoD/Principal signatures before submission.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/30">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="outline" className="font-mono text-xs">{value}</Badge>
    </div>
  );
}
