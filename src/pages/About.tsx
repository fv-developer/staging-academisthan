import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCountUp } from '@/hooks/useCountUp';
import {
  Quote, Target, Eye, Heart, Users, BookOpen, Award,
  Lightbulb, ArrowRight, MapPin, Calendar, Star,
  GraduationCap, Building2, Landmark, Globe, Briefcase, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import founderPhoto from '@/assets/founder-deepak-mukadam.jpg';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import conference from '@/assets/conference.jpg';

/* ─── Stat Counter ─── */
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const count = useCountUp(value, 2200, isVisible);
  return (
    <div ref={ref} className="text-center">
      <div className="font-serif text-4xl md:text-5xl font-bold text-gold">{count}{suffix}</div>
      <div className="text-warm/60 text-sm mt-2 font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

/* ─── Leadership Role Card ─── */
function RoleCard({ icon: Icon, sector, role, competency }: { icon: any; sector: string; role: string; competency: string }) {
  return (
    <div className="bg-navy/50 border border-gold/10 rounded-xl p-5 hover:border-gold/25 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-1">
          <Icon className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h4 className="font-serif text-sm font-bold text-warm">{sector}</h4>
          <p className="text-warm/60 text-xs mt-1">{role}</p>
          <p className="text-gold/70 text-xs mt-1 italic">{competency}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Timeline ─── */
const milestones = [
  { year: '2000–2010', title: 'University of Mumbai Senate', desc: 'Decade-long leadership in the university\'s supreme governing body — overseeing Finance, Administration, and Examinations. Prepared the University\'s Annual Budget for 2004–2005.' },
  { year: '2002–2014', title: 'Janakalyan Sahakari Bank Director', desc: 'Twelve years overseeing Rs. 4500 Crore business mix. Served as Vice-Chairman, Chairman of Loan Committee, and Chairman of Recovery Committee.' },
  { year: '2017–2022', title: 'Chancellor\'s Nominee, Management Council', desc: 'Direct appointment by the Chancellor to the University of Mumbai\'s Management Council — the principal executive body responsible for translating policy into action.' },
  { year: '2019', title: 'Academisthan Founded', desc: 'Launched by Maharashtra\'s Minister for Higher & Technical Education as a not-for-profit, non-political platform. Now a network of 7,000+ educators.' },
  { year: '2020', title: 'NEP 2020 Roundtable & Webinars', desc: 'Hosted major national events including a webinar on online teaching tools that attracted over 6,000 teachers, inaugurated by the Governor of Maharashtra.' },
  { year: '2025', title: 'AI for Educators with MSBSVET', desc: 'Launched a 30-hour program with Maharashtra State Board of Skill, Vocational Education & Training to empower teachers with AI tools.' },
];

const leadershipRoles = [
  { icon: GraduationCap, sector: 'Skill Development & Vocational Training', role: 'Governing Council Member, Skill Board of Maharashtra', competency: 'Industry-Academia Linkage' },
  { icon: Building2, sector: 'Skill Development & Vocational Training', role: 'Chairman, ITI Govandi', competency: 'Industry-Academia Linkage & PPP Management' },
  { icon: BookOpen, sector: 'K-12 Education', role: 'Vice President & Trustee, Ramji Assar Vidyalaya', competency: 'Foundational Educational Philosophy' },
  { icon: Landmark, sector: 'Higher Education Governance', role: 'Ex-Senate Member & Chancellor\'s Nominee, University of Mumbai', competency: 'Strategic Governance & Policy' },
  { icon: Shield, sector: 'Finance & Banking', role: 'Ex-Vice-Chairman, Janakalyan Sahakari Bank', competency: 'Large-Scale Financial Stewardship' },
  { icon: Briefcase, sector: 'Corporate Governance', role: 'Independent Director, Maharashtra Natural Gas Ltd.', competency: 'Corporate Oversight & Public Trust' },
  { icon: Globe, sector: 'International Perspective', role: 'Life Member, Indo-Australian Society', competency: 'Cross-Cultural Exchange & Global Outlook' },
  { icon: Lightbulb, sector: 'Digital Innovation in Education', role: 'Founder, Academisthan', competency: 'Visionary Leadership & National-Scale Execution' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Navbar />

      {/* ═══ Hero Banner ═══ */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={cinematicCampus} alt="About Academisthan" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsla(228,45%,12%,0.85), hsla(228,45%,15%,0.7), hsla(228,45%,12%,0.95))' }} />
        <div className="relative z-10 text-center px-4">
          <span className="text-gold text-sm tracking-[0.3em] uppercase font-medium mb-4 block">Our Story</span>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-warm mb-4">
            About <span className="text-gradient-gold">Academisthan</span>
          </h1>
          <p className="text-warm/60 text-lg max-w-xl mx-auto">
            A Profile of Leadership Across Education, Industry, and Finance
          </p>
        </div>
      </section>

      {/* ═══ Founder Section ═══ */}
      <section className="py-24 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <ScrollSection>
            <div className="grid md:grid-cols-5 gap-12 lg:gap-16 items-start">
              {/* Portrait — 2 cols */}
              <div className="md:col-span-2 relative">
                <div className="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-gold/20 shadow-[0_20px_60px_hsl(38_55%_58%/0.15)]">
                  <img src={founderPhoto} alt="Shri Deepak Kumar Mukadam" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gold/10 rounded-full border border-gold/20" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gold/5 rounded-full border border-gold/10" />
                
                {/* Name card below photo */}
                <div className="text-center mt-8">
                  <h2 className="font-serif text-2xl font-bold text-gold">Shri Deepak Kumar Mukadam</h2>
                  <p className="text-warm/60 text-sm mt-1">Founder — Academisthan</p>
                  <p className="text-warm/40 text-xs mt-1">B.Com (University of Mumbai) · PG Diploma in Advertising Management</p>
                </div>
              </div>

              {/* Bio — 3 cols */}
              <div className="md:col-span-3">
                <Quote className="w-10 h-10 text-gold/30 mb-4" />
                <p className="font-serif text-xl md:text-2xl text-warm italic leading-relaxed mb-6">
                  "The portal will bring all the top academicians and professors across the country under one roof. Their work is now just a click away."
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-6" />

                <h4 className="font-serif text-lg font-bold text-gold mb-3">A Leader Focused on Connection and Impact</h4>
                <p className="text-warm/70 text-sm leading-relaxed mb-4">
                  For four decades, Mr. Deepak Kumar Mukadam has built a career focused on connecting the vital sectors of education, industry, and governance. He holds a Commerce degree from the University of Mumbai and a postgraduate Diploma in Advertising Management — qualifications that set the stage for a career spent bridging different worlds.
                </p>
                <p className="text-warm/70 text-sm leading-relaxed mb-4">
                  His experience is both broad and practical, ranging from leadership roles at the highest levels of university governance to hands-on work in vocational training. He has launched a national digital platform for educators while also guiding major financial institutions. This diverse experience is driven by a core belief: that effective leadership in today's world requires a deep, real-world understanding of finance, policy, technology, and industry — not just expertise in a single area.
                </p>

                <h4 className="font-serif text-lg font-bold text-gold mb-3 mt-6">Leadership in University Governance</h4>
                <p className="text-warm/70 text-sm leading-relaxed mb-4">
                  Mr. Mukadam's decade on the University of Mumbai Senate (2000–2010) placed him within the university's "supreme governing body," holding ultimate authority over its affairs, property, and strategic direction. A key achievement was preparing the University's Annual Budget for the 2004–2005 academic year. His reputation for integrity led to his appointment by the Vice-Chancellor to multiple committees investigating financial and administrative irregularities.
                </p>
                <p className="text-warm/70 text-sm leading-relaxed mb-4">
                  From 2017 to 2022, he served on the University of Mumbai's Management Council as the Chancellor's Nominee — a direct appointment from the highest authority for state universities, signifying immense trust. The Management Council is the university's principal executive body, responsible for translating policy into action.
                </p>

                <h4 className="font-serif text-lg font-bold text-gold mb-3 mt-6">Academisthan: A National Platform</h4>
                <p className="text-warm/70 text-sm leading-relaxed">
                  Seeing that India's educators lacked a unified platform to connect and collaborate, Mr. Mukadam founded Academisthan in 2019. Launched by Maharashtra's Minister for Higher and Technical Education, it was created as a "not for profit" and "non-political" resource. Today, Academisthan is a thriving network of over 7,000 educators, serving as a resource for professional development and a hub for institutions and government bodies seeking expert knowledge for policy-making.
                </p>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══ Leadership Roles Grid ═══ */}
      <section className="py-24 bg-navy/80">
        <div className="container mx-auto px-6">
          <ScrollSection>
            <div className="text-center mb-16">
              <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">Leadership Portfolio</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-3">
                Four Decades of Impact
              </h2>
              <p className="text-warm/50 text-sm mt-4 max-w-2xl mx-auto">
                A rare leader equally comfortable in a university senate, a corporate boardroom, and a community-level vocational institute.
              </p>
            </div>
          </ScrollSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leadershipRoles.map((role, i) => (
              <ScrollSection key={role.sector + role.role} delay={i * 0.08}>
                <RoleCard {...role} />
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Additional Bio Sections ═══ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-12">
            <ScrollSection>
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-gold" />
                  Advancing Vocational & Skill Development
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Mr. Mukadam serves as the Chairman of the Government Industrial Training Institute (ITI) in Govandi, recently renamed in honor of his late father, Shri Jamsaheb Mukadam. As the designated "Industry Partner" under a Public-Private Partnership model, he aligns the institute's training with modern industry needs. He works closely with the Maharashtra State Ministry of Skill Development, leading the Institute Management Committee to introduce updated curricula, improve training infrastructure, and increase job placement opportunities.
                </p>
              </div>
            </ScrollSection>

            <ScrollSection delay={0.1}>
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-gold" />
                  Commitment to Foundational Education
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Mr. Mukadam is the Vice President and Trustee of Ramji Assar Vidyalaya, a respected Mumbai educational institution serving its community for over a century. His involvement at the school level provides a unique, "full-stack" perspective on the entire student journey — understanding the challenges and opportunities in K-12 education to create stronger connections between schools and higher education institutions.
                </p>
              </div>
            </ScrollSection>

            <ScrollSection delay={0.2}>
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gold" />
                  Financial & Corporate Governance
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  For twelve years (2002–2014), Mr. Mukadam was a Director of Janakalyan Sahakari Bank Ltd., overseeing a business mix of Rs. 4500 Crore. He served as Vice-Chairman (2010–2012), Chairman of the Loan Committee (2010–2014), and Chairman of the Recovery Committee (2007–2010). His expertise is further recognized through his role as an Independent Director at Maharashtra Natural Gas Ltd. and as an Ombudsman for Jalgaon Janata Sahakari Bank Ltd. since 2015.
                </p>
              </div>
            </ScrollSection>

            <ScrollSection delay={0.3}>
              <div>
                <h3 className="font-serif text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-gold" />
                  International Perspective & Community Commitment
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Mr. Mukadam brings a global perspective, having traveled extensively for business to the United States, United Kingdom, Switzerland, Germany, China, Singapore, and New Zealand. He is a Life Member of the Indo-Australian Society and serves as a Trustee of the Shankar Moti Charitable Trust, focused on community welfare. He is also active in SRIJAN, an organization that encourages and nurtures small business initiatives.
                </p>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-20 bg-navy">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCounter value={7000} suffix="+" label="Educators in Network" />
            <StatCounter value={40} suffix="+" label="Years of Leadership" />
            <StatCounter value={6000} suffix="+" label="Teachers at Largest Event" />
            <StatCounter value={4500} suffix="" label="Crore Bank Business Mix" />
          </div>
        </div>
      </section>

      {/* ═══ Journey Timeline ═══ */}
      <section className="py-24 bg-navy relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-3xl">
          <ScrollSection>
            <div className="text-center mb-16">
              <span className="text-gold text-sm tracking-[0.2em] uppercase font-medium">Timeline</span>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-3">
                The Journey
              </h2>
            </div>
          </ScrollSection>

          <div className="space-y-0">
            {milestones.map((m, i) => (
              <ScrollSection key={m.year} delay={i * 0.1}>
                <div className="flex gap-6 mb-10">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-gold shadow-[0_0_15px_hsl(38_55%_58%/0.4)] z-10 shrink-0" />
                    <div className="w-px flex-1 bg-gold/20" />
                  </div>
                  <div className="pb-4">
                    <span className="text-gold font-serif text-sm font-bold">{m.year}</span>
                    <h3 className="font-serif text-lg font-bold text-warm mt-1">{m.title}</h3>
                    <p className="text-warm/50 text-sm mt-2 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Radhakrishnan Quote Banner ═══ */}
      <section className="relative py-20 overflow-hidden">
        <img src={conference} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/90" />
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl">
          <Quote className="w-12 h-12 text-gold/30 mx-auto mb-6" />
          <p className="font-serif text-2xl md:text-3xl text-warm italic leading-relaxed mb-4">
            "The true teachers are those who help us think for ourselves."
          </p>
          <span className="text-gold/60 text-sm tracking-wide">— Dr. Sarvepalli Radhakrishnan</span>
        </div>
      </section>

      {/* ═══ A Leader of Substance ═══ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <ScrollSection>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
              A Leader of Substance
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Mr. Deepak Kumar Mukadam's career is a compelling blueprint for leadership in the 21st century. He has proven his ability to govern at the highest levels, innovate with technology, connect education with industry, and manage large-scale finances with integrity.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              His entire career has been a project of building bridges — between policy and practice, between academia and industry, and between different communities. As one colleague noted, he is "committed to the cause for which he works," a principle that defines his four decades of service and impact.
            </p>
            <Link to="/auth/signup">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 text-base px-10 py-6 rounded-full font-semibold shadow-[0_4px_30px_hsl(38_55%_58%/0.3)]">
                Join Academisthan <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
