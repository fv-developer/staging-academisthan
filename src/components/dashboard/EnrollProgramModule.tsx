import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { programs } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap, Clock, Award, BookOpen, CheckCircle2, ChevronRight, Loader2, ArrowRight
} from 'lucide-react';

export default function EnrollProgramModule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progList, enrollList] = await Promise.all([
        programs.getAll(),
        programs.getEnrollments()
      ]);
      
      // Filter for published programs
      const published = (progList || []).filter((p: any) => p.is_published === 1 || p.is_published === true);
      setAllPrograms(published);
      setMyEnrollments(enrollList || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to load programs data', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (programId: string) => {
    setEnrollingId(programId);
    try {
      await programs.enrollUser(programId);
      toast({ 
        title: 'Enrolled successfully! 🎓', 
        description: 'You have been enrolled in this academic program. You can start completing modules.' 
      });
      // Refresh enrollments
      const enrollList = await programs.getEnrollments();
      setMyEnrollments(enrollList || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Enrollment failed', description: err.message, variant: 'destructive' });
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading && allPrograms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm">Loading active programs...</p>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 space-y-6">
      <div>
        <h3 className="font-serif text-base font-bold text-foreground">Available Programs</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Explore courses and programs published by the Academisthan administration.</p>
      </div>

      {allPrograms.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/25">
            <GraduationCap className="w-5 h-5 text-gold" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-foreground">No programs available</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              There are no active programs published at this moment. Please check back later.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {allPrograms.map((prog) => {
            const enrollment = myEnrollments.find((e: any) => e.program_id === prog.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress_percentage || 0;
            const isCompleted = enrollment?.status === 'completed' || progress >= 100;

            return (
              <div 
                key={prog.id} 
                className="bg-card border border-border rounded-2xl p-4 md:p-5 hover:border-gold/30 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex gap-4 items-start">
                  {isEnrolled ? (
                    <Link to={`/dashboard?program=${prog.slug}`} className="shrink-0">
                      {prog.image_url ? (
                        <img src={prog.image_url} alt="Cover" className="w-16 h-16 rounded-xl object-cover border border-border hover:opacity-85 transition-opacity" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 text-gold hover:bg-gold/15 transition-colors">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                      )}
                    </Link>
                  ) : (
                    prog.image_url ? (
                      <img src={prog.image_url} alt="Cover" className="w-16 h-16 rounded-xl object-cover border border-border shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0 text-gold">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                    )
                  )}
                  <div className="space-y-1">
                    <h4 className="font-serif text-sm font-bold text-foreground leading-tight">
                      {isEnrolled ? (
                        <Link to={`/dashboard?program=${prog.slug}`} className="hover:text-gold hover:underline transition-colors">
                          {prog.title}
                        </Link>
                      ) : (
                        prog.title
                      )}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-lg leading-normal">{prog.description}</p>
                    
                    <div className="flex flex-wrap gap-3 items-center pt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {prog.duration || 'Self-paced'}
                      </span>
                      {prog.level && (
                        <span className="flex items-center gap-1 capitalize bg-muted px-2 py-0.5 rounded-md">
                          {prog.level}
                        </span>
                      )}
                      {prog.category && (
                        <span className="flex items-center gap-1 bg-gold/10 text-gold/90 px-2 py-0.5 rounded-md">
                          {prog.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto shrink-0 flex flex-col items-stretch md:items-end gap-2">
                  {isEnrolled ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                      <div className="space-y-1.5 min-w-[140px] flex-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground flex items-center gap-1">
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <BookOpen className="w-3.5 h-3.5 text-gold" />
                            )}
                            {isCompleted ? 'Completed' : 'Enrolled'}
                          </span>
                          <span className="font-bold text-foreground">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <Button asChild size="sm" className="rounded-xl bg-navy hover:bg-navy/95 text-warm text-xs px-4 h-9 shadow-sm shrink-0">
                        <Link to={`/dashboard?program=${prog.slug}`}>
                          {isCompleted ? 'Review' : 'Resume'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleEnroll(prog.id)}
                      disabled={enrollingId === prog.id}
                      className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-5 text-xs gap-1.5 w-full md:w-auto"
                    >
                      {enrollingId === prog.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enrolling...
                        </>
                      ) : (
                        <>
                          Enroll Now <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
