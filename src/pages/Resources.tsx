import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import {
  BookOpen, ExternalLink, FileText, Download, Landmark, Globe,
  ArrowRight, Search, Shield, Award, GraduationCap, Building2,
  Scale, Briefcase, Lightbulb, Users, Star, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import library from '@/assets/library.jpg';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import research from '@/assets/research.jpg';

/* ─── Data ─── */
const regulatoryBodies = [
  { name: 'UGC', full: 'University Grants Commission', url: 'https://ugc.gov.in', desc: 'Regulations, circulars, approved universities, NET updates', icon: Landmark, color: 'bg-gold/15 border-gold/25 hover:border-gold/40' },
  { name: 'AICTE', full: 'All India Council for Technical Education', url: 'https://aicte-india.org', desc: 'Approval process, faculty norms, model curricula', icon: Building2, color: 'bg-teal/15 border-teal/25 hover:border-teal/40' },
  { name: 'NAAC', full: 'National Assessment & Accreditation Council', url: 'https://naac.gov.in', desc: 'Accreditation framework, SSR templates, best practices', icon: Award, color: 'bg-gold/15 border-gold/25 hover:border-gold/40' },
  { name: 'NIRF', full: 'National Institutional Ranking Framework', url: 'https://nirfindia.org', desc: 'Ranking methodology, data submission, parameter analysis', icon: Star, color: 'bg-teal/15 border-teal/25 hover:border-teal/40' },
  { name: 'NBA', full: 'National Board of Accreditation', url: 'https://nbaind.org', desc: 'Outcome-based accreditation, SAR preparation, OBE guidelines', icon: Shield, color: 'bg-gold/15 border-gold/25 hover:border-gold/40' },
  { name: 'NCTE', full: 'National Council for Teacher Education', url: 'https://ncte.gov.in', desc: 'Teacher education norms, recognition status, regulations', icon: GraduationCap, color: 'bg-teal/15 border-teal/25 hover:border-teal/40' },
  { name: 'MoE', full: 'Ministry of Education', url: 'https://education.gov.in', desc: 'NEP 2020, policy updates, RUSA, scholarships', icon: Globe, color: 'bg-gold/15 border-gold/25 hover:border-gold/40' },
  { name: 'eGazette', full: 'The Gazette of India', url: 'https://egazette.gov.in', desc: 'Official notifications, ordinances, government orders', icon: Scale, color: 'bg-teal/15 border-teal/25 hover:border-teal/40' },
];

const quickGuides = [
  { title: 'UGC API Score Calculation Guide', desc: 'Step-by-step walkthrough of Academic Performance Indicator scoring under UGC 2018 regulations', icon: FileText, category: 'Guide' },
  { title: 'CAS Promotion Eligibility Checklist', desc: 'Complete checklist for Career Advancement Scheme promotion from Assistant Professor to Professor', icon: Shield, category: 'Checklist' },
  { title: 'NAAC SSR Preparation Template', desc: 'Comprehensive template for preparing the Self-Study Report with criterion-wise documentation tips', icon: Award, category: 'Template' },
  { title: 'Research Paper Writing Framework', desc: 'IMRaD structure guide with UGC-CARE journal submission best practices and common pitfalls', icon: BookOpen, category: 'Guide' },
  { title: 'NEP 2020 Implementation Handbook', desc: 'Practical guide for implementing outcome-based education, credit framework, and multidisciplinary approach', icon: GraduationCap, category: 'Handbook' },
  { title: 'Grant Writing Proposal Template', desc: 'Ready-to-use templates for UGC Minor/Major projects, SERB, DST, and ICMR funding proposals', icon: Briefcase, category: 'Template' },
];

const usefulLinks = [
  { name: 'UGC-CARE List', url: 'https://ugccare.unipune.ac.in', desc: 'Approved journal list for research publications' },
  { name: 'SWAYAM', url: 'https://swayam.gov.in', desc: 'Free online courses from India\'s best teachers' },
  { name: 'NPTEL', url: 'https://nptel.ac.in', desc: 'IIT/IISc online courses and certifications' },
  { name: 'Shodhganga', url: 'https://shodhganga.inflibnet.ac.in', desc: 'Indian theses and dissertations repository' },
  { name: 'INFLIBNET', url: 'https://inflibnet.ac.in', desc: 'E-journals, e-books, and academic databases' },
  { name: 'Vidwan', url: 'https://vidwan.inflibnet.ac.in', desc: 'Expert database of Indian researchers' },
  { name: 'NTA', url: 'https://nta.ac.in', desc: 'UGC-NET, CSIR-NET, GATE examinations' },
  { name: 'AISHE', url: 'https://aishe.gov.in', desc: 'All India Survey on Higher Education data' },
];

/* ─── Main Page ─── */
export default function Resources() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Navbar />

      {/* ════ HERO ════ */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={research} alt="Research Resources" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsla(228,45%,12%,0.9), hsla(228,45%,15%,0.78), hsla(228,45%,12%,0.93))' }} />



        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" style={{ animation: 'fadeUp 1s ease-out forwards', opacity: 0 }}>
          <span className="text-gold text-sm tracking-[0.3em] uppercase font-semibold">Resources Hub</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-warm mt-4 leading-tight">
            Everything an <span className="text-gradient-gold">Educator</span> Needs
          </h1>
          <p className="text-warm/50 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Regulatory links, quick-reference guides, templates, and tools — 
            your one-stop destination for academic resources.
          </p>
        </div>
      </section>

      {/* ════ REGULATORY BODIES ════ */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Official Sources</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              Regulatory <span className="text-gradient-gold">Bodies</span>
            </h2>
            <p className="text-warm/50 mt-4 max-w-2xl mx-auto">
              Direct links to India's key higher education regulatory authorities
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {regulatoryBodies.map((body, i) => {
              const Icon = body.icon;
              return (
                <ScrollSection key={body.name} animation="fade-up" delay={i * 80}>
                  <a href={body.url} target="_blank" rel="noopener noreferrer" className="group block h-full">
                    <div className={`rounded-2xl border p-6 transition-all h-full hover:-translate-y-1 hover:shadow-lg ${body.color}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                          <Icon className="w-6 h-6 text-gold" />
                        </div>
                        <ExternalLink className="w-4 h-4 text-warm/30 group-hover:text-gold transition-colors" />
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-warm mb-1">{body.name}</h3>
                      <p className="text-warm/40 text-xs font-medium mb-3">{body.full}</p>
                      <p className="text-warm/55 text-sm leading-relaxed">{body.desc}</p>
                    </div>
                  </a>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ QUICK GUIDES & TEMPLATES ════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">Guides & Templates</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4">
              Quick Reference <span className="text-gradient-gold">Library</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Curated guides, checklists, and templates to navigate academic regulations and requirements
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickGuides.map((guide, i) => {
              const Icon = guide.icon;
              return (
                <ScrollSection key={guide.title} animation="fade-up" delay={i * 100}>
                  <div className="group bg-card border border-border rounded-2xl p-6 hover:border-gold/30 hover:shadow-lg transition-all hover:-translate-y-1 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full uppercase tracking-wider">{guide.category}</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground mb-2">{guide.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{guide.desc}</p>
                    <div className="flex items-center gap-1 text-gold text-sm font-semibold mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      Coming Soon <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ USEFUL LINKS ════ */}
      <section className="relative py-24 overflow-hidden">
        <img src={library} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/93" />
        <div className="container relative mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Useful Links</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              Academic <span className="text-gradient-gold">Portals</span>
            </h2>
            <p className="text-warm/50 mt-4 max-w-2xl mx-auto">
              Essential online platforms every Indian educator should know
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {usefulLinks.map((link, i) => (
              <ScrollSection key={link.name} animation="scale-in" delay={i * 60}>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="glass rounded-xl p-5 hover:border-gold/30 transition-all h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-serif text-lg font-bold text-warm group-hover:text-gold transition-colors">{link.name}</h4>
                      <ExternalLink className="w-3.5 h-3.5 text-warm/30 group-hover:text-gold transition-colors" />
                    </div>
                    <p className="text-warm/50 text-xs leading-relaxed">{link.desc}</p>
                  </div>
                </a>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TEACHER TOOLS CTA ════ */}
      <section className="py-24 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-12">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Free Tools</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4">
              Calculate, Check, <span className="text-gradient-gold">Create</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Use our free teacher productivity tools — no login required
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'API Score Calculator', desc: 'UGC Table-2 scoring', href: '/tools/api-score', icon: Lightbulb },
              { title: 'CAS Promotion Checker', desc: 'Eligibility validator', href: '/tools/promotion-check', icon: Shield },
              { title: 'Research Score', desc: 'Publication metrics', href: '/tools/research-score', icon: Star },
              { title: 'Scholar Impact', desc: 'AI-powered analysis', href: '/tools/scholar-impact', icon: Award, featured: true },
              { title: 'Academic CV', desc: 'Generate your CV', href: '/tools/academic-cv', icon: FileText },
            ].map((tool) => (
              <Link key={tool.title} to={tool.href} className="group block h-full">
                <div className={cn(
                  'bg-card border rounded-xl p-5 hover:border-gold/30 hover:shadow-md transition-all text-center h-full',
                  (tool as any).featured ? 'border-gold/30 ring-1 ring-gold/10' : 'border-border'
                )}>
                  {(tool as any).featured && (
                    <span className="text-[9px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">AI Powered</span>
                  )}
                  <tool.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h4 className="font-serif font-bold text-foreground text-sm">{tool.title}</h4>
                  <p className="text-muted-foreground text-xs mt-1">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="relative py-32 overflow-hidden">
        <img src={cinematicCampus} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection animation="scale-in">
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight">
              Join the <span className="text-gradient-gold">Knowledge</span><br />Revolution
            </h2>
            <p className="text-warm/60 mt-6 text-lg max-w-2xl mx-auto">
              Access exclusive resources, daily regulatory updates, and personalized career tools as an Academisthan Fellow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-lg px-10 py-6 rounded-xl font-semibold shadow-[0_0_30px_hsl(38_55%_58%/0.3)] gap-2">
                  Become a Fellow <GraduationCap className="w-5 h-5" />
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
