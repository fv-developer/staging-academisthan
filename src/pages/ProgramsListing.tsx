import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap, Clock, BookOpen, Play, Award, ChevronRight, Star,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  course: 'Online Course',
  webinar: 'Webinar',
  seminar: 'Seminar',
  workshop: 'Workshop',
  fdp: 'FDP',
};

const typeColors: Record<string, string> = {
  course: 'bg-gold/15 text-gold border-gold/20',
  webinar: 'bg-accent/15 text-accent border-accent/20',
  seminar: 'bg-teal/15 text-teal border-teal/20',
  workshop: 'bg-primary/10 text-primary border-primary/20',
  fdp: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface AcademicProgram {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  level: string | null;
  category: string | null;
  image_url: string | null;
  is_published: boolean | number;
  prerequisites: string | null;
  learning_outcomes: string | null;
  program_type: string;
  is_featured: boolean | number;
  cover_image_url?: string | null;
  duration_hours: number;
}

interface ProgramEnrollment {
  id: string;
  program_id: string;
  user_id: string;
  status: string;
  progress_percentage: number;
  progress_percent?: number;
  enrolled_at: string;
}

export default function ProgramsListing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background website-page flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero */}
        <div className="relative pt-20 pb-16 bg-gradient-to-b from-navy via-navy/95 to-background overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 max-w-5xl relative z-10 pt-12 text-center">
            <Badge className="bg-gold/15 text-gold border-gold/20 mb-4">
              <GraduationCap className="w-3.5 h-3.5 mr-1" /> Academisthan Programs
            </Badge>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-warm mb-4">
              Upskill with Certified Programs
            </h1>
            <p className="text-warm/60 text-base md:text-lg max-w-2xl mx-auto">
              Pre-recorded courses, live webinars & workshops — complete at your pace. 
              Earn government-recognized certificates automatically upon completion.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-lg py-16 text-center">
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-gold/10 border border-gold/25 rounded-full flex items-center justify-center mx-auto text-gold">
              <BookOpen className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-lg font-bold text-foreground">Fellow Workspace Program Catalog</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Academisthan certified academic programs are accessible exclusively inside the Fellow Workspace. 
                Join as a Fellow or sign in to explore and enroll in available programs.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <Link to="/dashboard">
                  <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl text-xs font-semibold py-2.5">
                    Go to Fellow Workspace
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/signin">
                    <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl text-xs font-semibold py-2.5">
                      Sign In to Workspace
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button variant="outline" className="w-full rounded-xl text-xs font-semibold py-2.5">
                      Become a Fellow
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
