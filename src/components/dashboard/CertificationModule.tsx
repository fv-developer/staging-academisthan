import { useState, useEffect } from 'react';
import { tools } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Award, Calendar, Download, AlertCircle, Loader2, CheckCircle2, Clock
} from 'lucide-react';

const FRIENDLY_TOOL_NAMES: Record<string, string> = {
  api_score: 'UGC Academic & Research Score Certification',
  research_score: 'Research Score Certification',
  promotion_check: 'CAS Promotion Eligibility Certification',
  scholar_impact: 'Google Scholar Impact Certification',
  naac_criterion_3: 'NAAC Self-Assessment (Criterion 3) Certification',
};

export default function CertificationModule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resList, certList] = await Promise.all([
        tools.getResults(),
        tools.getCertifications()
      ]);
      setResults(resList || []);
      setCertificates(certList || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to load certifications', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (cert: any, toolName: string) => {
    try {
      // Log download activity
      await tools.logDownload(cert.id, toolName);
      
      // Open PDF url
      if (cert.pdf_url) {
        window.open(cert.pdf_url, '_blank');
      } else {
        toast({ title: 'Download error', description: 'Certificate PDF file URL not found.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to log download', description: err.message, variant: 'destructive' });
    }
  };

  if (loading && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm">Fetching certifications and results...</p>
      </div>
    );
  }

  // Map results to submissions with status
  const submissions = results.map(r => {
    // A certificate matches if certificate_type matches 'tool_' + tool_name
    const cert = certificates.find(c => c.certificate_type === `tool_${r.tool_name}` || (c.certificate_type === 'tool' && c.pdf_url?.includes(r.tool_name)));
    return {
      id: r.id,
      tool_name: r.tool_name,
      certificateName: FRIENDLY_TOOL_NAMES[r.tool_name] || `${r.tool_name.replace('_', ' ').toUpperCase()} Certification`,
      submissionDate: r.created_at,
      score: r.score,
      status: cert ? 'Approved' : 'Pending Review',
      certificate: cert || null
    };
  });

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div>
        <h3 className="font-serif text-base font-bold text-foreground">Teacher Tools Certifications</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Track evaluations submitted for official Academisthan certification credentials.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/25">
            <Award className="w-5 h-5 text-gold" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-foreground">No certifications found</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Complete any evaluation (like the UGC API Score Calculator) and save your results to submit it for administrator certification.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[9px]">
                  <th className="p-4">Certificate Name</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{sub.certificateName}</div>
                      {sub.score !== null && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">Score: {sub.score} points</div>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(sub.submissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      {sub.status === 'Approved' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {sub.certificate ? (
                        <Button
                          onClick={() => handleDownload(sub.certificate, sub.tool_name)}
                          size="sm"
                          className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-8 gap-1.5 text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic pr-2">Awaiting Approval</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
