import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, Check, X, ShieldAlert } from 'lucide-react';

export function EmailChangeRequestsManager() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/email-change-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch email requests');
      setRequests(data);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error fetching requests', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;
    if (actionType === 'reject' && !adminNotes.trim()) {
      toast({ title: 'Rejection reason required', description: 'Please provide notes/reason for rejection.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/email-change-requests/${selectedRequest.id}/${actionType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ adminNotes: adminNotes.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process request');
      
      toast({ title: `Email change request ${actionType}d! ✨` });
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
        <span className="text-muted-foreground text-sm">Loading email change requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-gold" />
        <h3 className="font-serif font-bold text-foreground">Email Change Requests</h3>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Full Name</TableHead>
              <TableHead>Current Email</TableHead>
              <TableHead>New Requested Email</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No email change requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const statusColor = 
                  req.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                  req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                  'bg-amber-500/10 text-amber-555';

                return (
                  <TableRow key={req.id}>
                    <TableCell className="pl-6 font-medium text-foreground">{req.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{req.old_email}</TableCell>
                    <TableCell className="font-semibold text-gold">{req.new_email}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor} hover:${statusColor} border-none font-bold text-[10px] px-2 py-0.5 rounded-full`}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate" title={req.admin_notes || ''}>
                      {req.admin_notes || '—'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approve');
                              setAdminNotes('');
                            }}
                            size="sm"
                            className="h-7 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg px-2.5"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('reject');
                              setAdminNotes('');
                            }}
                            size="sm"
                            variant="destructive"
                            className="h-7 text-white text-[10px] font-bold rounded-lg px-2.5"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${actionType === 'approve' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground capitalize">{actionType} Request</h3>
                <p className="text-xs text-muted-foreground">For user {selectedRequest.full_name}</p>
              </div>
            </div>

            <div className="text-sm space-y-2 py-2">
              <p className="text-muted-foreground">
                Are you sure you want to <span className="font-bold text-foreground uppercase">{actionType}</span> the email change to:
              </p>
              <p className="font-mono font-bold text-gold text-center py-2 bg-muted/30 rounded-xl">
                {selectedRequest.new_email}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{actionType === 'approve' ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}</Label>
              <Input
                placeholder={actionType === 'approve' ? 'Approved by admin' : 'Provide reason...'}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                disabled={isSubmitting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={isSubmitting || (actionType === 'reject' && !adminNotes.trim())}
                className={`rounded-xl ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
