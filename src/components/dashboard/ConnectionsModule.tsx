import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connections as connectionsApi, profiles as profilesApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Mail, Phone, MapPin, Building2, GraduationCap,
  Clock, Check, X, Loader2, Save, Trash2, ShieldAlert, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConnectionsModule() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'my-connections' | 'pending-requests' | 'sent-requests'>('my-connections');
  const [loading, setLoading] = useState(true);
  const [myConnections, setMyConnections] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  
  // Work email state
  const [workEmail, setWorkEmail] = useState(profile?.work_email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sync workEmail state with profile when it loads/changes
  useEffect(() => {
    if (profile?.work_email !== undefined) {
      setWorkEmail(profile.work_email || '');
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connectionsList, requestsList, sentList] = await Promise.all([
        connectionsApi.getConnections(),
        connectionsApi.getReceivedRequests(),
        connectionsApi.getSentRequests()
      ]);
      setMyConnections(connectionsList || []);
      setPendingRequests(requestsList || []);
      setSentRequests(sentList || []);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to load connections data', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (connectionId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to cancel your connection request to ${name}?`)) {
      return;
    }
    
    setActionLoading(connectionId);
    try {
      await connectionsApi.cancelRequest(connectionId);
      toast({ title: `Cancelled connection request to ${name}.` });
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to cancel request', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWorkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSavingEmail(true);
    try {
      await profilesApi.update(profile.id, { work_email: workEmail.trim() || null });
      toast({ title: 'Work email updated! 🚀' });
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to update work email', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleRespond = async (connectionId: string, status: 'accepted' | 'rejected') => {
    setActionLoading(connectionId);
    try {
      await connectionsApi.respond(connectionId, status);
      toast({ 
        title: status === 'accepted' 
          ? 'Connection request accepted! 🎉' 
          : 'Connection request declined.' 
      });
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to respond to request', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveConnection = async (connectionId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove your connection with ${name}?`)) {
      return;
    }
    
    setActionLoading(connectionId);
    try {
      await connectionsApi.removeConnection(connectionId);
      toast({ title: `Removed connection with ${name}.` });
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to remove connection', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && myConnections.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm font-medium">Loading Connections...</p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      {/* Title */}
      <div>
        <h3 className="font-serif text-base font-bold text-slate-900">Fellow Connections</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Network and collaborate with other approved Academisthan Fellows.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Main section: Tabs & lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('my-connections')}
              className={cn(
                "pb-3 text-xs font-semibold px-4 border-b-2 transition-all flex items-center gap-1.5",
                activeTab === 'my-connections'
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-slate-950"
              )}
            >
              My Connections
              <span className="bg-slate-100 text-slate-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {myConnections.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pending-requests')}
              className={cn(
                "pb-3 text-xs font-semibold px-4 border-b-2 transition-all flex items-center gap-1.5",
                activeTab === 'pending-requests'
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-slate-950"
              )}
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="bg-[#8B1538] text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent-requests')}
              className={cn(
                "pb-3 text-xs font-semibold px-4 border-b-2 transition-all flex items-center gap-1.5",
                activeTab === 'sent-requests'
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-slate-950"
              )}
            >
              Sent Requests
              <span className="bg-slate-100 text-slate-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {sentRequests.length}
              </span>
            </button>
          </div>

          {/* TAB 1: My Connections */}
          {activeTab === 'my-connections' && (
            <div className="space-y-3">
              {myConnections.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100/50">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">No connections yet</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Build your network by sending connection requests from the <a href="/directory" className="text-gold font-semibold hover:underline">Fellow Directory</a>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {myConnections.map((conn) => (
                    <div 
                      key={conn.connection_id} 
                      className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex gap-3 items-start text-left mb-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gold/15 text-gold border flex items-center justify-center font-serif font-bold overflow-hidden">
                          {conn.avatar_url ? (
                            <img src={conn.avatar_url} alt={conn.full_name} className="w-full h-full object-cover" />
                          ) : (
                            conn.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{conn.full_name}</h4>
                          <p className="text-gold text-[10px] font-semibold truncate">{conn.designation || 'Educator'}</p>
                          <p className="text-slate-500 text-[10px] truncate">{conn.department} • {conn.institution}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 border-t border-slate-50 pt-3 text-left">
                        {conn.email && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <a href={`mailto:${conn.email}`} className="truncate hover:text-gold hover:underline transition-colors">{conn.email}</a>
                          </div>
                        )}
                        {conn.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <a href={`tel:${conn.phone}`} className="hover:text-gold hover:underline transition-colors">{conn.phone}</a>
                          </div>
                        )}
                        {(conn.city || conn.state) && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{[conn.city, conn.state].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === conn.connection_id}
                          onClick={() => handleRemoveConnection(conn.connection_id, conn.full_name)}
                          className="text-destructive hover:bg-destructive/10 text-[10px] font-semibold gap-1.5 h-8 rounded-lg"
                        >
                          {actionLoading === conn.connection_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Remove Connection
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Pending Requests */}
          {activeTab === 'pending-requests' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100/50">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">No pending requests</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      You do not have any incoming connection requests at the moment.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <div 
                      key={req.connection_id} 
                      className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex gap-3 items-start text-left mb-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gold/15 text-gold border flex items-center justify-center font-serif font-bold overflow-hidden">
                          {req.avatar_url ? (
                            <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                          ) : (
                            req.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{req.full_name}</h4>
                          <p className="text-gold text-[10px] font-semibold truncate">{req.designation || 'Educator'}</p>
                          <p className="text-slate-500 text-[10px] truncate">{req.department} • {req.institution}</p>
                          <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground mt-1 bg-slate-50 rounded-full px-2 py-0.5 border">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-2 pt-3 border-t border-slate-50">
                        <Button 
                          size="sm"
                          disabled={actionLoading === req.connection_id}
                          onClick={() => handleRespond(req.connection_id, 'accepted')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] h-9 font-bold gap-1 shadow-sm"
                        >
                          {actionLoading === req.connection_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Accept
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === req.connection_id}
                          onClick={() => handleRespond(req.connection_id, 'rejected')}
                          className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-[10px] h-9 font-bold gap-1 shadow-sm bg-white"
                        >
                          <X className="w-3 h-3" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sent Requests */}
          {activeTab === 'sent-requests' && (
            <div className="space-y-3">
              {sentRequests.length === 0 ? (
                <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100/50">
                    <Send className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-foreground">No sent requests</h4>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      You have not sent any connection requests yet. Find fellows in the <a href="/directory" className="text-gold font-semibold hover:underline">Fellow Directory</a>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                  {sentRequests.map((req) => (
                    <div 
                      key={req.connection_id} 
                      className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex gap-3 items-start text-left mb-4">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gold/15 text-gold border flex items-center justify-center font-serif font-bold overflow-hidden">
                          {req.avatar_url ? (
                            <img src={req.avatar_url} alt={req.full_name} className="w-full h-full object-cover" />
                          ) : (
                            req.full_name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{req.full_name}</h4>
                          <p className="text-gold text-[10px] font-semibold truncate">{req.designation || 'Educator'}</p>
                          <p className="text-slate-500 text-[10px] truncate">{req.department} • {req.institution}</p>
                          <div className="flex flex-wrap gap-2 items-center mt-2">
                            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground bg-slate-50 rounded-full px-2 py-0.5 border">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className={cn(
                              "inline-flex items-center text-[9px] font-semibold rounded-full px-2 py-0.5 border",
                              req.status === 'accepted' && "bg-green-50 text-green-700 border-green-200",
                              req.status === 'pending' && "bg-amber-50 text-amber-700 border-amber-200",
                              req.status === 'rejected' && "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {req.status === 'pending' && (
                        <div className="mt-2 pt-3 border-t border-slate-50 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === req.connection_id}
                            onClick={() => handleCancelRequest(req.connection_id, req.full_name)}
                            className="text-destructive hover:bg-destructive/10 text-[10px] font-semibold gap-1.5 h-8 rounded-lg"
                          >
                            {actionLoading === req.connection_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            Cancel Request
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Work Email configuration */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 text-left">
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              Connection Settings
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
              Configure how you share your contact details. By default, your account registration email is shared with approved connections.
            </p>
            
            <form onSubmit={handleSaveWorkEmail} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Work Email Address (Optional)
                </label>
                <Input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="e.g. professor.name@university.edu"
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs px-3 focus-visible:ring-gold focus:bg-white"
                />
              </div>
              <p className="text-[9px] text-slate-400 italic">
                If provided, this work email will be shared in Fellow Connections. Otherwise, your registration email will be shared.
              </p>
              <Button
                type="submit"
                disabled={savingEmail || workEmail.trim() === (profile?.work_email || '')}
                className="w-full bg-[#8B1538] hover:bg-[#6B1028] text-white rounded-xl text-[11px] font-bold h-10 shadow-sm gap-1.5"
              >
                {savingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Email Settings
              </Button>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left flex gap-2.5">
            <ShieldAlert className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="text-[10px] font-bold text-slate-700">Privacy Protection</h5>
              <p className="text-[9.5px] text-slate-500 leading-relaxed">
                Your phone number and email address are encrypted and hidden from the public directories. They are only shared with fellows whose connection requests you have explicitly accepted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
