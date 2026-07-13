import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Search, Globe, MapPin, Award, Users, GraduationCap,
  Eye, Trash2, CheckCircle2, XCircle,
} from 'lucide-react';

type Institution = {
  id: string;
  institution_name: string;
  institution_type: string;
  representative_name: string;
  representative_email: string;
  city: string | null;
  state: string | null;
  naac_grade: string | null;
  membership_id: string | null;
  membership_status: string;
  student_count: number | null;
  faculty_count: number | null;
  created_at: string;
  logo_url: string | null;
  website: string | null;
};

export function InstitutionManager() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchInstitutions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setInstitutions(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('institutions').update({ membership_status: newStatus } as any).eq('id', id);
    if (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } else {
      toast({ title: `Institution ${newStatus === 'active' ? 'activated' : 'suspended'}` });
      fetchInstitutions();
    }
  };

  const deleteInstitution = async (id: string) => {
    if (!confirm('Delete this institution permanently?')) return;
    const { error } = await supabase.from('institutions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    } else {
      toast({ title: 'Institution deleted' });
      fetchInstitutions();
    }
  };

  const filtered = institutions.filter(i =>
    i.institution_name.toLowerCase().includes(search.toLowerCase()) ||
    i.representative_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      college: 'College', university: 'University', autonomous_college: 'Autonomous',
      deemed_university: 'Deemed Univ.', private_institution: 'Private', k12_school: 'K-12 School',
    };
    return map[t] || t;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">Institution Memberships</h3>
          <p className="text-xs text-muted-foreground">{institutions.length} registered institutions</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions..." className="pl-9 rounded-xl" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-8">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No institutions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inst) => (
            <div key={inst.id} className="bg-background border border-border rounded-xl p-4 hover:border-gold/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {inst.logo_url ? (
                    <img src={inst.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain border border-border bg-card shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif font-bold text-foreground text-sm truncate">{inst.institution_name}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel(inst.institution_type)}</Badge>
                      <Badge variant={inst.membership_status === 'active' ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                        {inst.membership_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rep: {inst.representative_name} · {inst.representative_email}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {inst.membership_id && (
                        <span className="text-[10px] font-mono text-gold font-bold">{inst.membership_id}</span>
                      )}
                      {(inst.city || inst.state) && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {[inst.city, inst.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {inst.naac_grade && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Award className="w-3 h-3" /> NAAC {inst.naac_grade}
                        </span>
                      )}
                      {inst.student_count && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" /> {inst.student_count.toLocaleString()} students
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(inst.id, inst.membership_status)}>
                    {inst.membership_status === 'active' ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteInstitution(inst.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
