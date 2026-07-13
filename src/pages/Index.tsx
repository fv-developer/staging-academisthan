import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useCountUp';
import { Button } from '@/components/ui/button';
import {
  Calculator, Award, BookOpen, Briefcase, GraduationCap,
  TrendingUp, Users, MapPin, Star, ChevronRight, FileText,
  Shield, Lightbulb, ArrowRight, Sparkles, Trophy, Target,
  ChevronLeft,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

import { LiveNewsTicker } from '@/components/home/LiveNewsTicker';

import teacherClassroom from '@/assets/teacher-classroom.jpg';
import library from '@/assets/library.jpg';
import conference from '@/assets/conference.jpg';
import testimonialsBg from '@/assets/testimonials-bg.jpg';
import convocation from '@/assets/convocation.jpg';
import research from '@/assets/research.jpg';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import aiEducatorsStage from '@/assets/events/ai-educators-stage.jpg';

/* ─── Stats Counter ─── */
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const count = useCountUp(value, 2200, isVisible);
  return (
    <div ref={ref} className="text-center">
      <div className="font-serif text-4xl md:text-5xl font-bold text-gold">
        {count}{suffix}
      </div>
      <div className="text-foreground/60 text-sm mt-2 font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

/* ─── Program Card ─── */
function ProgramCard({ title, desc, icon: Icon, image, href }: { title: string; desc: string; icon: any; image: string; href: string }) {
  return (
    <Link to={href} className="block">
      <div className="group relative overflow-hidden rounded-2xl h-[380px] cursor-pointer">
        <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-serif text-xl font-bold text-warm">{title}</h3>
          <p className="text-warm/60 text-sm leading-relaxed">{desc}</p>
          <div className="flex items-center gap-1 text-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View program details <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Tool Card ─── */
function ToolCard({ title, desc, icon: Icon, href, accent }: { title: string; desc: string; icon: any; href: string; accent: string }) {
  return (
    <Link to={href} className="group block h-full">
      <div className={`relative overflow-hidden rounded-2xl p-6 h-full border border-gold/10 bg-navy/50 backdrop-blur-sm hover:border-gold/30 transition-all duration-300 hover:shadow-[0_0_30px_hsl(38_55%_58%/0.1)]`}>
        <div className={`w-14 h-14 rounded-2xl ${accent} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
          <Icon className="h-7 w-7 text-warm" />
        </div>
        <h3 className="font-serif text-lg font-bold text-warm mb-2">{title}</h3>
        <p className="text-warm/50 text-sm leading-relaxed">{desc}</p>
        <div className="flex items-center gap-1 text-gold text-sm font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          Try Now <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

/* ─── Rank Step ─── */
function RankStep({ rank, range, active }: { rank: string; range: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${active ? 'bg-gold/20 border border-gold/30' : 'bg-navy/30 border border-transparent'}`}>
      <div className={`w-3 h-3 rounded-full ${active ? 'bg-gold shadow-[0_0_10px_hsl(38_55%_58%/0.5)]' : 'bg-warm/20'}`} />
      <div>
        <div className={`font-serif font-bold ${active ? 'text-gold' : 'text-warm/60'}`}>{rank}</div>
        <div className="text-warm/40 text-xs">{range}</div>
      </div>
    </div>
  );
}

/* ─── Testimonial ─── */
function TestimonialCard({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4 h-full">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-gold text-gold" />
        ))}
      </div>
      <p className="text-warm/70 text-sm leading-relaxed italic">"{quote}"</p>
      <div>
        <div className="font-serif font-bold text-warm text-sm">{name}</div>
        <div className="text-warm/40 text-xs">{role}</div>
      </div>
    </div>
  );
}

/* ─── Hero Section (MKES University Style — Single Cinematic Image) ─── */
function HeroSection() {
  const [current, setCurrent] = useState(0);

  const captions = [
    { heading: 'A New Age of', highlight: 'Learning', sub: 'Where innovation meets education. Academisthan is reimagining academic excellence with future-first programs.' },
    { heading: 'Where Quality is a', highlight: 'Journey', sub: 'Celebrating Academic Excellence across India with our growing community of educators.' },
    { heading: 'Empowering Educators,', highlight: 'Transforming', sub: 'Knowledge that transforms — building the future of Indian education, one educator at a time.' },
    { heading: 'The Platform for', highlight: 'Excellence', sub: 'India\'s premier academic community driving research, recognition, and reform.' },
    { heading: 'A Free Creative', highlight: 'Mind', sub: '"The end-product of education should be a free creative man, who can battle against historical circumstances and adversities of nature." — Dr. Sarvepalli Radhakrishnan' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % captions.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Single cinematic background with Ken Burns */}
      <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
        <img
          src={cinematicCampus}
          alt="Academisthan Campus"
          className="w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
          width={1920}
          height={1080}
        />
      </div>

      {/* Cinematic overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, hsla(228,45%,12%,0.85), hsla(228,45%,15%,0.7), hsla(228,45%,12%,0.9))',
        }}
      />

      {/* Floating decorative orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-gold/10 rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/5 rounded-full animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Centered content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Big Academisthan name */}
        <h1
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-black text-gradient-gold leading-[1.05] mb-4"
          style={{ animation: 'fadeUp 1s ease-out forwards', opacity: 0 }}
        >
          Academisthan
          <span className="sr-only"> — Empowering India's Educators</span>
        </h1>

        {/* Rotating captions */}
        <div key={`heading-${current}`} style={{ animation: 'fadeUp 0.8s 0.3s ease-out forwards', opacity: 0 }}>
          <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-warm/80 font-medium mb-6">
            {captions[current].heading}{' '}
            <span className="text-gradient-gold italic">{captions[current].highlight}</span>
          </p>
        </div>

        <p
          key={`sub-${current}`}
          className="text-lg md:text-xl text-warm/50 max-w-2xl mx-auto mb-6 leading-relaxed"
          style={{ animation: 'fadeUp 1s 0.6s ease-out forwards', opacity: 0 }}
        >
          {captions[current].sub}
        </p>

        {/* Slogan */}
        <div className="mb-10" style={{ animation: 'fadeUp 1s 0.8s ease-out forwards', opacity: 0 }}>
          <p className="text-gold/80 text-lg md:text-xl font-serif font-semibold tracking-wide max-w-xl mx-auto">
            Of the Teachers · By the Teachers · For the Teachers
          </p>
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          style={{ animation: 'fadeUp 0.8s 1s ease-out forwards', opacity: 0 }}
        >
          <Link to="/auth/signup">
            <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-base px-8 py-6 rounded-full font-semibold shadow-[0_4px_30px_hsl(38_55%_58%/0.3)] transition-all inline-flex items-center gap-2">
              Become a Fellow <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/tools/api-score">
            <Button size="lg" className="bg-warm/10 border border-warm/30 text-warm hover:bg-warm/20 hover:border-gold hover:text-gold text-base px-8 py-6 rounded-full font-medium backdrop-blur-sm transition-colors">
              Calculate API Score
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-warm/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-gold rounded-full" style={{ animation: 'scrollBounce 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
}

/* ─── getProgramIcon Helper ─── */
const getProgramIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('ai')) return Lightbulb;
  if (t.includes('research') || t.includes('methodology')) return BookOpen;
  return Target;
};

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function Index() {
  const staticPrograms = [
    {
      title: "AI for Educators",
      desc: "Master AI tools for teaching, research, and administration with cutting-edge techniques",
      icon: Lightbulb,
      image: aiEducatorsStage,
      href: "/programs/ai-for-educators",
    },
    {
      title: "Research Methodology Workshop",
      desc: "Master modern research methods, paper writing, and journal publication strategies",
      icon: BookOpen,
      image: research,
      href: "/events",
    },
    {
      title: "NEP 2020 Implementation",
      desc: "Hands-on training for implementing Outcome-Based Education and curriculum design",
      icon: Target,
      image: teacherClassroom,
      href: "/programs/nep-2020-roundtable",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Navbar />

      {/* ════ HERO — IIT/IIM Style Full-Bleed Slideshow ════ */}
      <HeroSection />

      {/* ════ MISSION & VISION ════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={library} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 to-navy/80" />
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollSection animation="slide-right">
              <span className="text-gold text-sm font-semibold tracking-widest uppercase">Our Mission</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4 leading-tight">
                Empowering India's <span className="text-gradient-gold">Educators</span> for Tomorrow
              </h2>
              <p className="text-warm/60 mt-6 leading-relaxed text-lg">
                Academisthan is a dedicated platform for college and university teachers in India. 
                We simplify complex regulatory requirements, track career growth, and offer elite 
                training programs. Our goal is to digitize and streamline professional development 
                so teachers can focus on what they do best: teaching.
              </p>
              <div className="flex gap-4 mt-8">
                <Link to="/about">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl">
                    Our Story <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </ScrollSection>

            <ScrollSection animation="slide-left" delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: 'UGC Compliant Tools', desc: 'Scores calculated per official regulations' },
                  { icon: TrendingUp, label: 'Career Growth', desc: 'Track progress from Assistant Prof to Professor' },
                  { icon: FileText, label: 'Auto PDF Resume', desc: 'Beautiful academic CV, always updated' },
                  { icon: Lightbulb, label: 'Daily Updates', desc: 'Latest notices, jobs & opportunities' },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-5 space-y-2 hover:border-gold/30 transition-all">
                    <item.icon className="h-8 w-8 text-gold" />
                    <h4 className="font-serif font-bold text-warm text-sm">{item.label}</h4>
                    <p className="text-warm/50 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="relative py-20 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={500} suffix="+" label="Fellows" />
            <StatCounter value={25} suffix="+" label="Programs" />
            <StatCounter value={15} suffix="+" label="States" />
            <StatCounter value={10000} suffix="+" label="Tools Used" />
          </div>
        </div>
      </section>

      {/* ════ FEATURED PROGRAMS ════ */}
      <section className="relative py-24 bg-navy">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Programs</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              Elevate Your <span className="text-gradient-gold">Teaching</span>
            </h2>
            <p className="text-warm/50 mt-4 max-w-2xl mx-auto">
              Curated programs designed to enhance your academic portfolio and career trajectory
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-6">
            {staticPrograms.map((prog, index) => (
              <ScrollSection key={prog.title} animation="fade-up" delay={index * 150}>
                <ProgramCard
                  title={prog.title}
                  desc={prog.desc}
                  icon={prog.icon}
                  image={prog.image}
                  href={prog.href}
                />
              </ScrollSection>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/programs">
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 rounded-xl px-8">
                View All Programs <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ════ TEACHER TOOLS ════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={teacherClassroom} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/95" />
        <div className="container relative mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">Free Tools</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              Smart Tools for <span className="text-gradient-gold">Smart Educators</span>
            </h2>
            <p className="text-warm/50 mt-4 max-w-2xl mx-auto">
              No login required. Calculate your scores, check eligibility, and plan your career in minutes.
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ScrollSection animation="fade-up" delay={0}>
              <ToolCard
                title="UGC API Score Calculator"
                desc="Calculate your Academic Performance Indicator score per UGC Table-2 regulations with step-by-step guidance"
                icon={Calculator}
                href="/tools/api-score"
                accent="bg-gold/20"
              />
            </ScrollSection>
            <ScrollSection animation="fade-up" delay={100}>
              <ToolCard
                title="CAS Promotion Checker"
                desc="Check your eligibility for Career Advancement Scheme promotion and find what's missing"
                icon={TrendingUp}
                href="/tools/promotion-check"
                accent="bg-teal/20"
              />
            </ScrollSection>
            <ScrollSection animation="fade-up" delay={200}>
              <ToolCard
                title="Research Score Calculator"
                desc="Get your weighted research score from publications, projects, patents, and PhD guidance"
                icon={Target}
                href="/tools/research-score"
                accent="bg-gold/20"
              />
            </ScrollSection>
            <ScrollSection animation="fade-up" delay={300}>
              <ToolCard
                title="Notable Contributions (2025)"
                desc="Evaluate if you meet the new UGC 2025 'Notable Contributions' requirement"
                icon={Award}
                href="/tools/notable-contributions"
                accent="bg-teal/20"
              />
            </ScrollSection>
            <ScrollSection animation="fade-up" delay={400}>
              <ToolCard
                title="Digital Readiness Assessment"
                desc="Test your readiness for online and blended teaching with instant, shareable results"
                icon={Lightbulb}
                href="/tools/digital-readiness"
                accent="bg-gold/20"
              />
            </ScrollSection>
            <ScrollSection animation="fade-up" delay={500}>
              <ToolCard
                title="Teaching Competency Quiz"
                desc="Assess your pedagogy, technology integration, and communication skills"
                icon={Star}
                href="/tools/competency-quiz"
                accent="bg-teal/20"
              />
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ EDUSCORE ════ */}
      <section className="relative py-24 bg-gradient-to-br from-navy via-primary to-navy">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollSection animation="slide-right">
              <span className="text-gold text-sm font-semibold tracking-widest uppercase">EduScore™</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4 leading-tight">
                Your Academic <span className="text-gradient-gold">Identity</span>, Quantified
              </h2>
              <p className="text-warm/60 mt-6 leading-relaxed">
                EduScore is your comprehensive academic performance metric. Add achievements, publications, 
                and certifications — watch your score grow and unlock higher ranks. Download a beautiful PDF resume anytime.
              </p>
              <div className="flex gap-4 mt-8">
                <Link to="/auth/signup">
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl">
                    Get Your EduScore <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </ScrollSection>

            <ScrollSection animation="slide-left" delay={200}>
              <div className="space-y-3">
                <RankStep rank="Academisthan Luminary" range="90-100 points" active={false} />
                <RankStep rank="Distinguished Scholar" range="70-89 points" active={false} />
                <RankStep rank="Accomplished Educator" range="50-69 points" active={true} />
                <RankStep rank="Developing Scholar" range="25-49 points" active={false} />
                <RankStep rank="Emerging Educator" range="0-24 points" active={false} />
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ LIVE NEWS & UPDATES ════ */}
      <LiveNewsTicker />



      {/* ════ RESOURCES & REGULATORY ════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">Resources Hub</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4">
              Everything You <span className="text-gradient-gold">Need</span>
            </h2>
          </ScrollSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'UGC', color: 'bg-gold/10 hover:bg-gold/20 border-gold/20' },
              { name: 'AICTE', color: 'bg-teal/10 hover:bg-teal/20 border-teal/20' },
              { name: 'NAAC', color: 'bg-gold/10 hover:bg-gold/20 border-gold/20' },
              { name: 'NIRF', color: 'bg-teal/10 hover:bg-teal/20 border-teal/20' },
              { name: 'NBA', color: 'bg-gold/10 hover:bg-gold/20 border-gold/20' },
              { name: 'NCTE', color: 'bg-teal/10 hover:bg-teal/20 border-teal/20' },
              { name: 'MoE', color: 'bg-gold/10 hover:bg-gold/20 border-gold/20' },
              { name: 'eGazette', color: 'bg-teal/10 hover:bg-teal/20 border-teal/20' },
            ].map((org) => (
              <ScrollSection key={org.name} animation="scale-in">
                <div className={`rounded-xl border p-6 text-center cursor-pointer transition-all ${org.color}`}>
                  <span className="font-serif text-2xl font-bold text-foreground">{org.name}</span>
                  <p className="text-muted-foreground text-xs mt-2">Official Links & Updates</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={testimonialsBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="container relative mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Testimonials</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              What Our <span className="text-gradient-gold">Fellows</span> Say
            </h2>
          </ScrollSection>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Dr. Priya Sharma"
                  role="Associate Professor, Delhi University"
                  quote="The API Score Calculator saved me hours. I finally understand my exact position for CAS promotion. The EduScore system keeps me motivated to publish more."
                />
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Prof. Rajesh Kumar"
                  role="Assistant Professor, BHU"
                  quote="Academisthan's PDF resume generator is incredible. I downloaded my academic CV and it was perfectly formatted — no more spending weekends updating my resume."
                />
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Dr. Meena Iyer"
                  role="Professor, Mumbai University"
                  quote="The daily job updates and UGC notice scraping keep me informed without checking 10 different websites. This is exactly what Indian educators needed."
                />
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Dr. Anand Patel"
                  role="Assistant Professor, IIT Bombay"
                  quote="The research score calculator helped me identify gaps in my publication strategy. The tool's recommendations were spot-on for improving my API score."
                />
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Prof. Lakshmi Reddy"
                  role="Associate Professor, University of Hyderabad"
                  quote="Academisthan's teacher tools suite is a game-changer. From promotion checks to CV generation, everything I need is in one place. Highly recommended!"
                />
              </CarouselItem>
              <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <TestimonialCard
                  name="Dr. Vikram Singh"
                  role="Professor, Jawaharlal Nehru University"
                  quote="The grant alerts and call for papers notifications have been invaluable. I've never missed a funding opportunity since joining Academisthan."
                />
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20" />
            <CarouselNext className="hidden md:flex -right-12 bg-gold/10 border-gold/30 text-gold hover:bg-gold/20" />
          </Carousel>
        </div>
      </section>

      {/* ════ DAILY DOSE ════ */}
      <section className="py-16 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/20">
              <Lightbulb className="h-5 w-5 text-gold" />
              <span className="text-foreground font-semibold text-sm">Today's Regulation Tip</span>
            </div>
            <p className="text-muted-foreground mt-6 max-w-3xl mx-auto text-lg leading-relaxed">
              Under UGC Regulations 2018, an Assistant Professor needs a minimum API score of 300 from Category III 
              (Research & Academic Contributions) for promotion to Associate Professor after 8 years of service. 
              Publications in UGC-CARE listed journals carry the highest weightage.
            </p>
            <Link to="/resources/cas-promotion-faq" className="inline-flex items-center gap-2 text-gold font-semibold mt-4 hover:underline">
              Read More Tips <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollSection>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="relative py-32 overflow-hidden">
        <img src={teacherClassroom} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection animation="scale-in">
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight">
              Join India's <span className="text-gradient-gold">Premier</span><br />Educator Community
            </h2>
            <p className="text-warm/60 mt-6 text-lg max-w-2xl mx-auto">
              Get your EduScore, access free tools, receive daily updates, and download your professional academic CV.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-lg px-10 py-6 rounded-xl font-semibold shadow-[0_0_30px_hsl(38_55%_58%/0.3)]">
                  Become an Academisthan Fellow
                  <GraduationCap className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-warm/30 text-sm mt-6">Free to join. No credit card required.</p>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
