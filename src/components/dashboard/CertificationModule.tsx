import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tools as toolsApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateCertificatePDF } from '@/lib/certificate';
import { generateAPIScoreCertificate, type APIScoreCertificateData } from '@/lib/apiScoreCertificate';
import {
  Award,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Eye,
  RotateCw,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FRIENDLY_TOOL_NAMES: Record<string, string> = {
  'UGC Academic & Research Score Calculator': 'UGC Academic & Research Score Certification',
  'Research Score Calculator': 'Research Score Certification',
  'CAS Promotion Checker (UGC 2018)': 'CAS Promotion Eligibility Certification',
  'Scholar Impact Analyzer': 'Google Scholar Impact Certification',
  'NAAC Self-Assessment (Criterion 3)': 'NAAC Self-Assessment (Criterion 3) Certification',
};

export default function CertificationModule() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await toolsApi.getResults();
      setHistory(data || []);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Failed to load test history',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePdfAction = (item: any, action: 'view' | 'download') => {
    const friendlyName = FRIENDLY_TOOL_NAMES[item.tool_name] || item.tool_name;
    const certNum = item.certificate_number || `ACAD-CERT-${item.id.slice(0, 6).toUpperCase()}`;
    const issuedAt = item.certificate_issued_at || item.created_at;

    if (item.tool_name && item.tool_name.includes('Academic & Research Score')) {
      try {
        const resData = typeof item.result_data === 'string' ? JSON.parse(item.result_data) : item.result_data;
        const catScores = resData?.categoryScores || {};
        
        const certData: APIScoreCertificateData = {
          holderName: profile?.full_name || 'Fellow',
          membershipId: profile?.membership_id || `ACAD-${item.id.slice(0, 6).toUpperCase()}`,
          totalScore: item.score || 0,
          maxScore: 350,
          cat1Score: catScores.teaching || 0,
          cat1Max: 100,
          cat2Score: catScores.research || 0,
          cat2Max: 200,
          cat3Score: catScores.other || 0,
          cat3Max: 50,
          designation: profile?.designation || undefined,
          institution: profile?.institution || undefined,
          date: issuedAt,
        };

        const doc = generateAPIScoreCertificate(certData);
        if (action === 'view') {
          doc.output('dataurlnewwindow');
        } else {
          doc.save(`UGC-Academic-Research-Score-${certNum}.pdf`);
        }

        toast({
          title: action === 'view' ? '✓ Opening Preview' : '✓ Downloading Certificate',
          description: `Certificate ${certNum} generated successfully.`,
          duration: 2000,
        });
        return;
      } catch (err) {
        console.error('Failed to generate UGC Score PDF scorecard, fallback to normal PDF:', err);
      }
    }

    generateCertificatePDF({
      holderName: profile?.full_name || 'Fellow',
      programTitle: friendlyName,
      certificateNumber: certNum,
      issuedAt: issuedAt,
      certificateType: 'Certification',
    }, action);

    toast({
      title: action === 'view' ? '✓ Opening Preview' : '✓ Downloading Certificate',
      description: `Certificate ${certNum} generated successfully.`,
      duration: 2000,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await toolsApi.deleteResult(id);
      toast({
        title: 'Record deleted',
        description: 'Test history record was deleted successfully.',
      });
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getFriendlyName = (name: string) => {
    return FRIENDLY_TOOL_NAMES[name] || name;
  };

  const getToolUrl = (name: string) => {
    if (name.includes('Academic') || name.includes('api_score')) return '/tools/api-score';
    if (name.includes('CAS') || name.includes('promotion')) return '/tools/promotion-check';
    if (name.includes('Research') || name.includes('research')) return '/tools/research-score';
    if (name.includes('Scholar') || name.includes('scholar')) return '/tools/scholar-impact';
    if (name.includes('NAAC') || name.includes('naac')) return '/tools/naac-self-assessment';
    return '/tools';
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h3 className="font-serif text-base font-bold text-foreground">Teacher Tools Certifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track evaluations completed and download official certifications.</p>
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-xs">Fetching certifications and history...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3 bg-muted/10">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/25">
                <Award className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-foreground">No test attempts recorded</h4>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  You have not attempted any Teacher Tools Certification tests yet. Complete any evaluation tool to save your results here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[9px]">
                        <th className="p-4">Test Name</th>
                        <th className="p-4">Attempt Date & Time</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Result</th>
                        <th className="p-4">Certificate Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {history.map((item) => {
                        const isPass = item.result === 'Pass';
                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-foreground max-w-[200px] lg:max-w-[320px] truncate" title={getFriendlyName(item.tool_name)}>
                                {getFriendlyName(item.tool_name)}
                              </div>
                              {item.certificate_number && (
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  No. {item.certificate_number}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-muted-foreground font-medium">
                              {new Date(item.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })} &middot; {new Date(item.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4 font-semibold text-foreground">
                              {item.score !== null ? `${item.score} pts` : 'N/A'}
                            </td>
                            <td className="p-4">
                              {isPass ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[10px] gap-1 px-2.5">
                                  <CheckCircle2 className="w-3 h-3" /> PASS
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 font-semibold text-[10px] gap-1 px-2.5">
                                  <XCircle className="w-3 h-3" /> FAIL
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {item.certificate_status === 'Issued' ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[10px] gap-1 px-2.5">
                                  Issued
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic font-medium">N/A</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPass && (
                                  <>
                                    <Button
                                      onClick={() => handlePdfAction(item, 'view')}
                                      variant="ghost"
                                      size="sm"
                                      title="View PDF"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handlePdfAction(item, 'download')}
                                      variant="ghost"
                                      size="sm"
                                      title="Download PDF"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                
                                <Link to={getToolUrl(item.tool_name)}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Retake Test"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-teal"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </Button>
                                </Link>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      title="Delete Record"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl max-w-sm">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-serif text-sm">Delete Test Record?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs">
                                        This will permanently remove this attempt and its certificate from the system. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl text-xs h-9">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(item.id)}
                                        className="rounded-xl text-xs h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Flex Cards View */}
              <div className="block md:hidden space-y-3">
                {history.map((item) => {
                  const isPass = item.result === 'Pass';
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm hover:border-gold/30 transition-colors">
                      {/* Header info */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-foreground truncate" title={getFriendlyName(item.tool_name)}>
                            {getFriendlyName(item.tool_name)}
                          </h4>
                          {item.certificate_number && (
                            <span className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40 mt-1 inline-block">
                              No. {item.certificate_number}
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {isPass ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[9px] px-2 py-0.5">
                              PASS
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 font-semibold text-[9px] px-2 py-0.5">
                              FAIL
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-y border-border/40 py-2">
                        <div>
                          <span className="font-medium text-foreground">Score: </span>
                          <span className="font-bold text-foreground">{item.score !== null ? `${item.score} pts` : 'N/A'}</span>
                        </div>
                        <div>
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })} &middot; {new Date(item.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {item.certificate_status === 'Issued' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 font-semibold text-[9px] px-2 py-0.5">
                              Certificate Issued
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No Certificate</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isPass && (
                            <>
                              <Button
                                onClick={() => handlePdfAction(item, 'view')}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                onClick={() => handlePdfAction(item, 'download')}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Link to={getToolUrl(item.tool_name)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-teal"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[340px] rounded-2xl border-gold/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm font-bold text-foreground">Delete Result?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                  This action is permanent and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 mt-4 justify-end">
                                <AlertDialogCancel className="rounded-xl text-xs h-8 px-3 mt-0">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs h-8 px-3"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
