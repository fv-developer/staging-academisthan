import { useState, useEffect } from 'react';
import { connections as connectionsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Filter, Trash2, Users, CheckCircle2, Clock,
  Loader2, RefreshCw, XCircle, ArrowRightRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [connectionsList, statsData] = await Promise.all([
        connectionsApi.getAdminConnectionsList(),
        connectionsApi.getAdminStats()
      ]);
      setConnections(connectionsList || []);
      if (statsData?.stats) {
        setStats(statsData.stats);
      }
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: 'Failed to load connection management data', 
        description: err.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAdminRemove = async (connectionId: string, senderName: string, receiverName: string) => {
    if (!window.confirm(`Are you sure you want to remove the connection between ${senderName} and ${receiverName}?`)) {
      return;
    }
    
    setActionLoading(connectionId);
    try {
      await connectionsApi.adminRemoveConnection(connectionId);
      toast({ title: 'Connection removed successfully by admin.' });
      await fetchAdminData();
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

  // Filter & Search logic
  const filteredConnections = connections.filter((conn) => {
    const matchesSearch = 
      conn.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.sender_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.receiver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.receiver_email?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || conn.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-bold text-foreground">Fellow Connections Management</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor and manage professional connection requests between fellows.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdminData}
          disabled={loading}
          className="h-8 gap-1.5 rounded-lg border-gold/20 text-gold hover:bg-gold/10 text-xs"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Reload
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: stats.total, icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Accepted Connections', value: stats.accepted, icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Rejected Requests', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-700 border-red-100' }
        ].map((card) => (
          <div key={card.label} className={cn("border rounded-xl p-4 flex items-center justify-between bg-white shadow-sm", card.color)}>
            <div>
              <p className="text-lg font-bold font-mono">{card.value}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{card.label}</p>
            </div>
            <card.icon className="w-5 h-5 opacity-70" />
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by sender or receiver (name or email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50/50 text-xs border border-slate-200"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'accepted', 'pending', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "h-10 rounded-xl text-xs px-3 font-semibold",
                statusFilter === status
                  ? "bg-gold/10 text-gold border-gold/30 hover:bg-gold/15"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {status.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Data Table / List */}
      {loading && connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm">Fetching connections logs...</p>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-white">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-xs text-foreground mb-1">No connections found</h4>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
            No connection records matches your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Sent Request (Sender)</th>
                  <th className="p-4">Direction</th>
                  <th className="p-4">Target Fellow (Receiver)</th>
                  <th className="p-4">Connection Activity</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredConnections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sender */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{conn.sender_name}</div>
                      <div className="text-[10px] text-slate-400">{conn.sender_email}</div>
                      <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 py-0.5 mt-1 inline-block font-medium">
                        Sent Request
                      </span>
                    </td>
                    
                    {/* Direction */}
                    <td className="p-4 text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <span>→</span>
                      </div>
                    </td>
                    
                    {/* Receiver */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{conn.receiver_name}</div>
                      <div className="text-[10px] text-slate-400">{conn.receiver_email}</div>
                    </td>
                    
                    {/* Status / Activity */}
                    <td className="p-4">
                      {conn.status === 'accepted' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border bg-green-50 text-green-700 border-green-200/50 w-fit">
                            ACCEPTED
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Accepted by {conn.receiver_name}
                          </span>
                        </div>
                      ) : conn.status === 'pending' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border bg-amber-50 text-amber-700 border-amber-200/50 w-fit">
                            PENDING
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Waiting for {conn.receiver_name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border bg-red-50 text-red-700 border-red-200/50 w-fit">
                            REJECTED
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Declined by {conn.receiver_name}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* Date */}
                    <td className="p-4 text-slate-500 text-[10px]">
                      {new Date(conn.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    
                    {/* Actions */}
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === conn.id}
                        onClick={() => handleAdminRemove(conn.id, conn.sender_name, conn.receiver_name)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg"
                      >
                        {actionLoading === conn.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
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
