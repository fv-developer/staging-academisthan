import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type RoleEntry = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
};

export function UserManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string | null; email: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [inviting, setInviting] = useState(false);

  const fetchRoles = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    const roleData = (data || []) as RoleEntry[];
    setRoles(roleData);

    // Fetch profiles for these users
    const userIds = [...new Set(roleData.map((r) => r.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      (profileData || []).forEach((p: any) => {
        profileMap[p.id] = { full_name: p.full_name, email: p.email };
      });
      setProfiles(profileMap);
    }

    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const inviteAdmin = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Enter an email address', variant: 'destructive' });
      return;
    }
    setInviting(true);

    // Find user by email in profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', inviteEmail.trim().toLowerCase())
      .single();

    if (!profileData) {
      toast({ title: 'User not found', description: 'This email must first sign up as a fellow.', variant: 'destructive' });
      setInviting(false);
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: profileData.id,
        role: inviteRole,
        invited_by: user?.id,
      });

    setInviting(false);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'User already has this role', variant: 'destructive' });
      } else {
        toast({ title: 'Error assigning role', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: `${inviteRole === 'super_admin' ? 'Super Admin' : 'Admin'} role assigned! ✨` });
      setInviteEmail('');
      fetchRoles();
    }
  };

  const removeRole = async (roleId: string, roleUserId: string) => {
    if (roleUserId === user?.id) {
      toast({ title: "You can't remove your own role", variant: 'destructive' });
      return;
    }
    if (!confirm('Remove this role?')) return;
    await supabase.from('user_roles').delete().eq('id', roleId);
    fetchRoles();
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-muted/30 border border-border rounded-xl p-5">
        <h4 className="font-serif font-bold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gold" /> Invite Admin
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          The user must already be registered as a fellow. Enter their email to assign a role.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="rounded-xl flex-1"
            type="email"
          />
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'super_admin')}>
            <SelectTrigger className="rounded-xl w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={inviteAdmin} disabled={inviting} className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 gap-2">
            <UserPlus className="w-4 h-4" /> {inviting ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
      </div>

      {/* Roles list */}
      <div className="space-y-2">
        <h4 className="font-serif font-bold text-foreground text-sm">Current Admins & Super Admins</h4>
        {roles.map((entry) => {
          const p = profiles[entry.user_id];
          return (
            <div key={entry.id} className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                  {entry.role === 'super_admin' ? <ShieldCheck className="w-4 h-4 text-gold" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{p?.email || entry.user_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={entry.role === 'super_admin' ? 'bg-gold/15 text-gold border-gold/20' : 'bg-muted text-muted-foreground'}>
                  {entry.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
                {entry.user_id !== user?.id && (
                  <Button variant="ghost" size="sm" onClick={() => removeRole(entry.id, entry.user_id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {roles.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">No admin roles assigned yet.</p>
        )}
      </div>
    </div>
  );
}
