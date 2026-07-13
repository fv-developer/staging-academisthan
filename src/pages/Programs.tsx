import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import {
  BookOpen, GraduationCap, Trophy, Users, Lightbulb, Target,
  ArrowRight, Clock, Calendar, MapPin, CheckCircle2, Star,
  Briefcase, Globe, Award, Sparkles, ChevronRight,
} from 'lucide-react';

import conference from '@/assets/conference.jpg';
import research from '@/assets/research.jpg';
import teacherClassroom from '@/assets/teacher-classroom.jpg';
import convocation from '@/assets/convocation.jpg';
import library from '@/assets/library.jpg';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import aiEducatorsStage from '@/assets/events/ai-educators-stage.jpg';

/* ─── Program Data ─── */
const flagshipPrograms = [
  {
    title: 'AI for Educators',
    subtitle: '30-Hour Certified Program',
    desc: 'Master AI tools for teaching, research, and administration. Co-developed with Maharashtra State Board of Skill, Vocational Education & Training (MSBSVET).',
    icon: Lightbulb,
    image: aiEducatorsStage,
    duration: '30 Hours',
    mode: 'Hybrid',
    certification: 'MSBSVET Certified',
    highlights: ['ChatGPT & Gemini for lesson planning', 'AI-powered research tools', 'Automated grading systems', 'Ethical AI in education'],
    accent: 'gold',
    href: '/programs/ai-for-educators',
  },
  {
    title: 'Research Methodology Workshop',
    subtitle: 'Intensive 5-Day Program',
    desc: 'From hypothesis formulation to UGC-CARE journal publication. Learn modern research methods, statistical analysis, and paper writing craft.',
    icon: BookOpen,
    image: research,
    duration: '5 Days',
    mode: 'In-Person',
    certification: 'Academisthan Certificate',
    highlights: ['Research design & methodology', 'SPSS & R for data analysis', 'Writing for Scopus/WoS journals', 'Plagiarism-free academic writing'],
    accent: 'teal',
    href: '/events',
  },
  {
    title: 'NEP 2020 Implementation',
    subtitle: 'Curriculum Design Masterclass',
    desc: 'Hands-on training for implementing Outcome-Based Education, credit framework, and multidisciplinary approaches under the National Education Policy.',
    icon: Target,
    image: teacherClassroom,
    duration: '3 Days',
    mode: 'Online',
    certification: 'Academisthan Certificate',
    highlights: ['OBE curriculum mapping', 'Learning outcome taxonomy', 'Credit transfer framework', 'Multidisciplinary program design'],
    accent: 'gold',
    href: '/programs/nep-2020-roundtable',
  },
];

const shortPrograms = [
  { title: 'Digital Pedagogy Essentials', desc: 'Blended learning, LMS mastery, and digital content creation for modern classrooms', icon: Globe, duration: '2 Days', mode: 'Online' },
  { title: 'Academic Leadership', desc: 'For HoDs, Deans, and aspiring academic administrators — governance, strategy, and team building', icon: Trophy, duration: '3 Days', mode: 'Hybrid' },
  { title: 'NAAC Preparation Workshop', desc: 'Complete guide to self-study reports, data validation, and peer team visits for NAAC accreditation', icon: Award, duration: '2 Days', mode: 'Online' },
  { title: 'Intellectual Property Rights', desc: 'Patents, copyrights, and technology transfer for academic researchers and innovators', icon: Briefcase, duration: '1 Day', mode: 'Online' },
  { title: 'Grant Writing Masterclass', desc: 'Write winning proposals for UGC, SERB, DST, ICMR, and international funding agencies', icon: Star, duration: '2 Days', mode: 'Hybrid' },
  { title: 'Mentorship & PhD Guidance', desc: 'Best practices for supervising doctoral students — from proposal to viva voce', icon: Users, duration: '1 Day', mode: 'Online' },
];

const stats = [
  { value: '25+', label: 'Programs Conducted' },
  { value: '7,000+', label: 'Educators Trained' },
  { value: '15+', label: 'States Covered' },
  { value: '95%', label: 'Satisfaction Rate' },
];

/* ─── Components ─── */
function FlagshipCard({ program, index }: { program: typeof flagshipPrograms[0]; index: number }) {
  const Icon = program.icon;
  const isReversed = index % 2 === 1;

  return (
    <div className={`grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-gold/10 bg-navy/40 backdrop-blur-sm hover:border-gold/25 transition-all group`}>
      {/* Image */}
      <div className={`relative h-[300px] lg:h-auto overflow-hidden ${isReversed ? 'lg:order-2' : ''}`}>
        <img src={program.image} alt={program.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="px-3 py-1 rounded-full bg-gold/20 backdrop-blur-md text-gold text-xs font-bold border border-gold/30">
            {program.certification}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 lg:p-10 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl ${program.accent === 'gold' ? 'bg-gold/15' : 'bg-teal/15'} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${program.accent === 'gold' ? 'text-gold' : 'text-teal'}`} />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-warm">{program.title}</h3>
            <p className="text-gold/70 text-sm font-medium">{program.subtitle}</p>
          </div>
        </div>

        <p className="text-warm/60 text-sm leading-relaxed mb-6">{program.desc}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mb-6">
          <span className="flex items-center gap-1.5 text-warm/50 text-xs">
            <Clock className="w-3.5 h-3.5 text-gold" /> {program.duration}
          </span>
          <span className="flex items-center gap-1.5 text-warm/50 text-xs">
            <MapPin className="w-3.5 h-3.5 text-gold" /> {program.mode}
          </span>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {program.highlights.map((h) => (
            <div key={h} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-warm/60 text-xs">{h}</span>
            </div>
          ))}
        </div>

        <Link to={program.href}>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2 w-fit">
            Learn More <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Programs() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Navbar />

      {/* ════ HERO ════ */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={library} alt="Academic Library" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsla(228,45%,12%,0.88), hsla(228,45%,15%,0.75), hsla(228,45%,12%,0.92))' }} />



        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" style={{ animation: 'fadeUp 1s ease-out forwards', opacity: 0 }}>
          <span className="text-gold text-sm tracking-[0.3em] uppercase font-semibold">Programs & Workshops</span>
          <h1 className="font-serif font-bold text-warm mt-4 leading-tight">
            Elevate Your <span className="text-gradient-gold">Academic</span> Journey
          </h1>
          <p className="text-warm/50 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Curated programs by India's leading educators — from AI mastery to research methodology, 
            designed to accelerate your career and transform your teaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10" style={{ animation: 'fadeUp 0.8s 0.5s ease-out forwards', opacity: 0 }}>
            <Link to="/auth/signup">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 px-8 py-6 rounded-full font-semibold shadow-[0_4px_30px_hsl(38_55%_58%/0.3)] gap-2">
                Enroll Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#flagship">
              <Button size="lg" className="bg-warm/10 border border-warm/30 text-warm hover:bg-warm/20 hover:border-gold hover:text-gold px-8 py-6 rounded-full backdrop-blur-sm font-semibold">
                Explore Programs
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ════ STATS BAR ════ */}
      <section className="relative py-16 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <ScrollSection key={s.label} animation="scale-in">
                <div className="text-center">
                  <div className="font-serif text-4xl md:text-5xl font-bold text-gold">{s.value}</div>
                  <div className="text-muted-foreground text-sm mt-2 font-medium tracking-wide uppercase">{s.label}</div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FLAGSHIP PROGRAMS ════ */}
      <section id="flagship" className="relative py-24 bg-navy">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Flagship Programs</span>
            <h2 className="font-serif font-bold text-warm mt-4">
              Signature <span className="text-gradient-gold">Experiences</span>
            </h2>
            <p className="text-warm/50 mt-4 max-w-2xl mx-auto">
              Intensive, certified programs developed in partnership with government bodies and leading institutions
            </p>
          </ScrollSection>

          <div className="space-y-8">
            {flagshipPrograms.map((program, i) => (
              <ScrollSection key={program.title} animation="fade-up" delay={i * 150}>
                <FlagshipCard program={program} index={i} />
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SHORT PROGRAMS ════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">Short Programs</span>
            <h2 className="font-serif font-bold text-foreground mt-4">
              Skill-Building <span className="text-gradient-gold">Workshops</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Focused, practical sessions to build specific competencies — perfect for busy educators
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortPrograms.map((program, i) => {
              const Icon = program.icon;
              return (
                <ScrollSection key={program.title} animation="fade-up" delay={i * 100}>
                  <div className="group bg-card border border-border rounded-2xl p-6 hover:border-gold/30 hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{program.duration}</span>
                          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{program.mode}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-2">{program.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{program.desc}</p>
                    <div className="flex items-center gap-1 text-gold text-sm font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn More <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ WHY CHOOSE US ════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={convocation} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/92" />
        <div className="container relative mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Why Academisthan</span>
            <h2 className="font-serif font-bold text-warm mt-4">
              The <span className="text-gradient-gold">Difference</span>
            </h2>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, title: 'Expert Faculty', desc: 'Programs led by Vice Chancellors, Professors, and industry leaders with 20+ years experience' },
              { icon: Award, title: 'Government Certified', desc: 'Partnerships with MSBSVET, UGC, and state boards for officially recognized certifications' },
              { icon: Users, title: '7,000+ Network', desc: 'Join a community of educators across 15+ states for collaboration and career growth' },
              { icon: Sparkles, title: 'Practical Focus', desc: 'Hands-on workshops with real tools, templates, and actionable takeaways — not just theory' },
            ].map((item, i) => (
              <ScrollSection key={item.title} animation="fade-up" delay={i * 100}>
                <div className="glass rounded-2xl p-6 text-center space-y-4 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gold/15 mx-auto flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-warm">{item.title}</h3>
                  <p className="text-warm/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="relative py-32 overflow-hidden">
        <img src={aiEducatorsStage} alt="AI for Educators Summit by Academisthan" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection animation="scale-in">
            <h2 className="font-serif font-bold text-warm leading-tight">
              Ready to <span className="text-gradient-gold">Transform</span><br />Your Teaching?
            </h2>
            <p className="text-warm/60 mt-6 text-lg max-w-2xl mx-auto">
              Join thousands of educators who have elevated their careers through Academisthan's certified programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-lg px-10 py-6 rounded-xl font-semibold shadow-[0_0_30px_hsl(38_55%_58%/0.3)] gap-2">
                  Become a Fellow <GraduationCap className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" className="bg-warm/10 border border-warm/30 text-warm hover:bg-warm/20 hover:border-gold hover:text-gold text-lg px-10 py-6 rounded-xl backdrop-blur-sm font-semibold">
                  Contact Us
                </Button>
              </Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
