import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateCertificatePDF } from '@/lib/certificate';
import { Award, Download, GraduationCap, Calendar } from 'lucide-react';

export function MyCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [programs, setPrograms] = useState<Record<string, any>>({});
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: certs } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      setCertificates(certs || []);

      if (certs && certs.length > 0) {
        // Fetch program names
        const programIds = [...new Set(certs.filter((c) => c.program_id).map((c) => c.program_id))];
        if (programIds.length > 0) {
          const { data: progs } = await supabase
            .from('programs')
            .select('id, title, program_type')
            .in('id', programIds);
          const map: Record<string, any> = {};
          (progs || []).forEach((p: any) => { map[p.id] = p; });
          setPrograms(map);
        }

        // Fetch event names
        const eventIds = [...new Set(certs.filter((c) => c.event_id).map((c) => c.event_id))];
        if (eventIds.length > 0) {
          const { data: evts } = await supabase
            .from('events')
            .select('id, title, event_type')
            .in('id', eventIds);
          const map: Record<string, any> = {};
          (evts || []).forEach((e: any) => { map[e.id] = e; });
          setEvents(map);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleDownload = (cert: any) => {
    const prog = cert.program_id ? programs[cert.program_id] : null;
    const evt = cert.event_id ? events[cert.event_id] : null;
    const title = prog?.title || evt?.title || 'Program';

    generateCertificatePDF({
      holderName: cert.holder_name,
      programTitle: title,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.issued_at,
      certificateType: cert.certificate_type,
    });
  };

  if (loading) return null;
  if (certificates.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
      <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-gold" /> My Certificates
      </h3>
      <div className="space-y-3">
        {certificates.map((cert) => {
          const prog = cert.program_id ? programs[cert.program_id] : null;
          const evt = cert.event_id ? events[cert.event_id] : null;
          const title = prog?.title || evt?.title || 'Program';
          const isEvent = !!cert.event_id;

          return (
            <div key={cert.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${isEvent ? 'bg-teal/10' : 'bg-gold/10'} flex items-center justify-center shrink-0`}>
                  {isEvent ? <Calendar className="w-4 h-4 text-teal" /> : <GraduationCap className="w-4 h-4 text-gold" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono">{cert.certificate_number}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {cert.certificate_type}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button onClick={() => handleDownload(cert)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-gold hover:text-gold">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
