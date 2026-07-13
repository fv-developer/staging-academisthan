import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useAuth } from '@/contexts/AuthContext';
import { connections as connectionsApi } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, MapPin, Building2, BookOpen, GraduationCap,
  Award, ExternalLink, Globe, Linkedin, Mail, Shield,
  Sparkles, Filter, ChevronDown, User, CheckCircle2, Phone,
  Clock, ShieldAlert, Check, X, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DESIGNATIONS = ['All', 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Dean', 'HOD', 'Director'];
const STATES = ['All', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Kerala'];

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null) {
  const colors = [
    'from-gold/30 to-gold/10',
    'from-accent/30 to-accent/10',
    'from-primary/30 to-primary/10',
    'from-teal/30 to-teal/10',
    'from-gold/20 to-accent/20',
  ];
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(12);
  const { ref: heroRef } = useScrollAnimation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: fellows, isLoading, refetch } = useQuery({
    queryKey: ['fellow-directory', profile?.id],
    queryFn: () => connectionsApi.getDirectory(),
  });

  const filtered = (fellows || []).filter((f: any) => {
    const matchesSearch = !searchQuery ||
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesignation = designationFilter === 'All' ||
      f.designation?.toLowerCase().includes(designationFilter.toLowerCase());
    const matchesState = stateFilter === 'All' ||
      f.state?.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesDesignation && matchesState;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const totalFellows = fellows?.length || 0;
  const totalInstitutions = new Set((fellows || []).map((f: any) => f.institution).filter(Boolean)).size;
  const totalStates = new Set((fellows || []).map((f: any) => f.state).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-background website-page text-foreground">
      <Navbar />

      {/* Cinematic Hero */}
      <section className="relative pt-28 pb-20 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-16 left-[15%] w-80 h-80 bg-gold/8 rounded-full blur-[120px]" />
          <div className="absolute top-32 right-[10%] w-72 h-72 bg-accent/6 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-gold/4 rounded-full blur-[80px]" />
          <div className="absolute top-20 right-[8%] opacity-[0.03]">
            <Users className="w-56 h-56 text-warm" />
          </div>
        </div>

        <div ref={heroRef} className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <Shield className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold tracking-wide">Fellow Network</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-5 leading-tight">
              Fellow <span className="text-gradient-gold">Directory</span>
            </h1>
            <p className="text-warm/55 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover and connect with India's finest academic minds — professors, researchers, 
              and educators who are Academisthan Fellows shaping the future of higher education.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
                placeholder="Search by name, institution, specialization..."
                className="h-14 pl-12 pr-6 rounded-2xl bg-card border-2 border-border text-foreground placeholder:text-muted-foreground text-base focus:border-gold focus:bg-card shadow-sm"
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-10">
            {[
              { value: totalFellows, label: 'Fellows' },
              { value: totalInstitutions, label: 'Institutions' },
              { value: totalStates, label: 'States' },
            ].map(stat => (
              <div key={stat.label} className="text-center bg-card/80 rounded-xl py-3 backdrop-blur-sm border border-border shadow-sm">
                <div className="text-2xl font-bold text-gold font-mono">{stat.value}</div>
                <div className="text-muted-foreground text-[10px] tracking-wider uppercase mt-0.5 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Filter:</span>
            </div>
            <select
              value={designationFilter}
              onChange={e => { setDesignationFilter(e.target.value); setVisibleCount(12); }}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-gold/40 focus:outline-none"
            >
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Designations' : d}</option>)}
            </select>
            <select
              value={stateFilter}
              onChange={e => { setStateFilter(e.target.value); setVisibleCount(12); }}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:border-gold/40 focus:outline-none"
            >
              {STATES.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
            </select>
            {(designationFilter !== 'All' || stateFilter !== 'All') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDesignationFilter('All'); setStateFilter('All'); }}
                className="h-9 text-xs text-gold hover:text-gold/80"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Skeleton Loaders */}
          {isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl p-6 text-center space-y-4 shadow-sm">
                  <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                  <Skeleton className="h-3 w-5/6 mx-auto" />
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border max-w-xl mx-auto">
              <Users className="h-10 w-10 text-muted-foreground/45 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">No Fellows Found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                No approved fellows match your filter settings. Try adjusting search or filters.
              </p>
            </div>
          )}

          {/* Fellow Cards */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visible.map(fellow => (
                <FellowCard 
                  key={fellow.id} 
                  fellow={fellow} 
                  currentUserId={profile?.id} 
                  onActionSuccess={refetch} 
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(c => c + 12)}
                className="rounded-xl gap-2"
              >
                <ChevronDown className="h-4 w-4" /> Show More Fellows
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[hsl(228,45%,12%)] to-[hsl(228,45%,16%)]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Sparkles className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm mb-4">
              Join the <span className="text-gradient-gold">Fellowship</span>
            </h2>
            <p className="text-warm/50 text-lg mb-8">
              Become part of India's most prestigious academic community. Get your membership card, 
              access exclusive tools, and connect with fellow educators across the nation.
            </p>
            <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 h-12 px-8 rounded-xl text-base font-semibold shadow-lg">
              <a href="/auth/signup">Become a Fellow</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* Fellow Card component */
function FellowCard({ 
  fellow, 
  currentUserId, 
  onActionSuccess 
}: { 
  fellow: any; 
  currentUserId?: string; 
  onActionSuccess: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  // Send request mutation
  const sendRequestMutation = useMutation({
    mutationFn: () => connectionsApi.sendRequest(fellow.id),
    onSuccess: () => {
      toast({ title: 'Connection request sent successfully! 🤝' });
      onActionSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to send request', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setActionLoading(false),
  });

  // Respond to request mutation
  const respondMutation = useMutation({
    mutationFn: (status: 'accepted' | 'rejected') => 
      connectionsApi.respond(fellow.connection_id, status),
    onSuccess: (_, status) => {
      toast({ 
        title: status === 'accepted' 
          ? 'Connection request accepted! 🎉' 
          : 'Connection request declined.' 
      });
      onActionSuccess();
    },
    onError: (err: any) => {
      toast({ title: 'Failed to respond', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setActionLoading(false),
  });

  const handleConnectAction = () => {
    if (!currentUserId) {
      toast({ title: 'Sign In Required', description: 'Please sign in as a Fellow to network.' });
      navigate('/auth/signin');
      return;
    }
    setActionLoading(true);
    sendRequestMutation.mutate();
  };

  const handleRespond = (status: 'accepted' | 'rejected') => {
    setActionLoading(true);
    respondMutation.mutate(status);
  };

  const isPendingSent = fellow.connection_status === 'pending' && fellow.sender_id === currentUserId;
  const isPendingReceived = fellow.connection_status === 'pending' && fellow.receiver_id === currentUserId;
  const isConnected = fellow.connection_status === 'accepted';

  return (
    <div className="group bg-white border border-slate-100 rounded-3xl p-6 hover:border-gold/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[380px]">
      <div className="flex flex-col flex-grow">
        {/* Top Header Section (Left aligned next to avatar) */}
        <div className="flex gap-4 items-center mb-5 text-left">
          <div className={cn(
            'w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br text-foreground font-serif font-bold text-lg overflow-hidden border',
            getAvatarColor(fellow.full_name)
          )}>
            {fellow.avatar_url ? (
              <img src={fellow.avatar_url} alt={fellow.full_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(fellow.full_name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-base font-bold text-slate-900 group-hover:text-gold transition-colors line-clamp-1">
              {fellow.full_name || 'Fellow'}
            </h3>
            {fellow.designation && (
              <p className="text-gold text-xs font-semibold mb-0.5 line-clamp-1">{fellow.designation}</p>
            )}
            {fellow.department && (
              <p className="text-slate-500 text-xs line-clamp-1">{fellow.department}</p>
            )}
          </div>
        </div>

        {/* Details Grid Section */}
        <div className="space-y-4 text-left flex-grow">
          {/* Institution Row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50 flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Institution</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{fellow.institution || 'N/A'}</p>
            </div>
          </div>

          {/* Specialization Row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50 flex-shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Specialization</p>
              <p className="text-xs font-semibold text-slate-700 truncate">{fellow.specialization || 'N/A'}</p>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50 flex-shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Location</p>
              <p className="text-xs font-semibold text-slate-700 truncate">
                {[fellow.city, fellow.state].filter(Boolean).join(', ') || 'N/A'}
              </p>
            </div>
          </div>

          {/* Connected Details */}
          {isConnected && fellow.email && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50 flex-shrink-0">
                <Mail className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  <a href={`mailto:${fellow.email}`} className="hover:text-gold transition-colors">{fellow.email}</a>
                </p>
              </div>
            </div>
          )}

          {isConnected && fellow.phone && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100/50 flex-shrink-0">
                <Phone className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Phone</p>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  <a href={`tel:${fellow.phone}`} className="hover:text-gold transition-colors">{fellow.phone}</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Connect Button Action */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        {isConnected ? (
          <Button disabled className="w-full bg-green-50 hover:bg-green-50 text-green-700 rounded-xl text-xs font-bold h-11 border border-green-200 gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Connected
          </Button>
        ) : isPendingSent ? (
          <Button disabled className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-xs gap-1.5 h-11 font-bold">
            <Clock className="w-3.5 h-3.5" />
            Request Sent
          </Button>
        ) : isPendingReceived ? (
          <div className="flex gap-2">
            <Button 
              size="sm"
              disabled={actionLoading}
              onClick={() => handleRespond('accepted')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-11 font-bold gap-1.5 shadow-sm"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Accept
            </Button>
            <Button 
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleRespond('rejected')}
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs h-11 font-bold gap-1.5 shadow-sm bg-white"
            >
              <X className="w-3.5 h-3.5" />
              Decline
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={handleConnectAction}
            className="w-full bg-[#8B1538] hover:bg-[#6B1028] text-white rounded-xl text-xs font-bold h-11 shadow-sm gap-1.5"
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
