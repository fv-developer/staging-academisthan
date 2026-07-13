import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowLeft, Award, Cpu, CheckCircle, BookOpen, GraduationCap, Shield, Clock, Globe } from 'lucide-react';

import aiStage from '@/assets/events/ai-educators-stage.jpg';
import aiSpeaker from '@/assets/events/ai-educators-speaker.jpg';
import aiPanel from '@/assets/events/ai-educators-panel.jpg';
import aiMinister from '@/assets/events/ai-educators-minister.jpg';

function SpeakerCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-navy/5 dark:bg-white/5 border border-border hover:border-gold/30 transition-colors">
      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
        <span className="text-gold font-serif font-bold">{name[0]}</span>
      </div>
      <div>
        <div className="font-serif font-bold text-foreground">{name}</div>
        <div className="text-muted-foreground text-sm">{role}</div>
      </div>
    </div>
  );
}

export default function AIForEducators() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={aiStage} alt="AI for Educators Launch" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        </div>
        <div className="container relative mx-auto px-4">
          <ScrollSection>
            <Link to="/programs" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Programs
            </Link>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4" /> AI & Technology
              </span>
              <span className="px-4 py-1.5 rounded-full bg-teal/20 text-teal text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" /> Govt. of Maharashtra
              </span>
              <span className="px-4 py-1.5 rounded-full bg-warm/20 text-warm text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" /> MSBSVET Recognised Institute
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight max-w-4xl">
              AI for Educators — 30-Hour Government-Certified Online Course Launch
            </h1>
            <div className="flex flex-wrap gap-6 mt-8 text-warm/70">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> November 2025</div>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Mumbai, Maharashtra</div>
              <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-gold" /> Skill, Employment, Entrepreneurship & Innovation Dept.</div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Government Recognition Banner */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--gold)/0.15)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        
        <div className="container relative mx-auto px-4">
          <ScrollSection>
            <div className="max-w-5xl mx-auto text-center space-y-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-gold/50" />
                <Shield className="h-8 w-8 text-gold" />
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-gold/50" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-widest border border-gold/30">
                  Government Recognised Institution
                </span>
                <span className="px-4 py-1.5 rounded-full bg-teal/20 text-teal text-xs font-bold uppercase tracking-widest border border-teal/30">
                  Institute Code: MSB010900
                </span>
                <span className="px-4 py-1.5 rounded-full bg-warm/15 text-warm text-xs font-bold uppercase tracking-widest border border-warm/20">
                  Estd. 2019
                </span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm leading-tight">
                Academisthan Foundation
              </h2>
              <p className="text-gold font-serif text-lg font-semibold tracking-wide">
                A Recognised Education Institution under the Government of Maharashtra
              </p>
              
              <p className="text-warm/60 leading-relaxed max-w-3xl mx-auto">
                Academisthan Foundation <span className="text-warm/80 font-medium">(MSB010900)</span> is an officially 
                <strong className="text-warm"> recognised education institution</strong> under the 
                <strong className="text-gold"> Maharashtra State Board of Skill, Vocational Education and Training (MSBSVET)</strong>, 
                operating under the <strong className="text-warm">Skill, Employment, Entrepreneurship and Innovation Department, 
                Government of Maharashtra</strong>. All certificates issued through Academisthan's programs are awarded 
                <strong className="text-gold"> on behalf of the Government of Maharashtra</strong> and signed by the Director, MSBSVET.
              </p>
            </div>
          </ScrollSection>

          {/* Recognition Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
            {[
              {
                icon: Shield,
                title: 'Official Govt. Certificates',
                desc: 'Issued on behalf of the Government of Maharashtra by the Director, MSBSVET',
              },
              {
                icon: BookOpen,
                title: 'Board-Approved Curriculum',
                desc: 'Course Code MSBQ211024 — approved under IT-ITES / Future Skills sector',
              },
              {
                icon: Globe,
                title: 'Verifiable on msbsvet.edu.in',
                desc: 'Every certificate independently verifiable on the official Board website',
              },
              {
                icon: GraduationCap,
                title: 'Statutory Backing',
                desc: 'MSBSVET est. 1986, strengthened by Maharashtra Act No. IX of 2022',
              },
            ].map((item, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="h-full p-5 rounded-xl bg-warm/5 border border-gold/15 hover:border-gold/40 transition-all hover:bg-warm/10 group">
                  <div className="w-11 h-11 rounded-lg bg-gold/15 flex items-center justify-center mb-3 group-hover:bg-gold/25 transition-colors">
                    <item.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div className="font-serif font-bold text-warm text-sm mb-1">{item.title}</div>
                  <p className="text-warm/50 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollSection>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Event Overview</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-5">
                <p className="text-lg leading-relaxed">
                  In a landmark initiative that marks a new chapter in Indian higher education, <strong className="text-foreground">Academisthan Foundation</strong> — 
                  a <strong className="text-foreground">recognised education institution (MSB010900)</strong> under the 
                  <strong className="text-foreground"> Skill, Employment, Entrepreneurship and Innovation Department, Government of Maharashtra</strong> — 
                  launched a comprehensive 30-hour government-certified online program titled <em>"AI for Educators"</em> (Course Code: MSBQ211024) 
                  through the <strong className="text-foreground">Maharashtra State Board of Skill, Vocational Education and Training (MSBSVET)</strong>. 
                  This program was designed with a singular vision: to empower teachers across India with the knowledge, tools, 
                  and ethical framework necessary to integrate Artificial Intelligence into their teaching practices — transforming 
                  traditional pedagogy into a more engaging, personalized, and technology-enabled experience.
                </p>
                <p className="leading-relaxed">
                  The official launch ceremony was graced by <strong className="text-foreground">Shri Mangal Prabhat Lodha</strong>, 
                  Hon'ble Minister for Skill, Employment, Entrepreneurship and Innovation, Government of Maharashtra, who inaugurated the program 
                  and spoke passionately about the need for AI literacy among educators. The event brought together leading voices 
                  in education, technology, and policy-making — all united by the belief that the future of education lies at the 
                  intersection of human wisdom and artificial intelligence.
                </p>
                <p className="leading-relaxed">
                  Founded by <strong className="text-foreground">Mr. Deepak Kumar Mukadam</strong>, Academisthan Foundation has consistently 
                  championed the cause of educator empowerment since its inception in 2019. As a government-recognised institution 
                  under MSBSVET, Academisthan holds the unique distinction of being able to conduct Board-approved courses 
                  with certificates issued directly on behalf of the Government of Maharashtra — giving teachers across India 
                  access to credible, verifiable, and officially recognized professional development.
                </p>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Event Gallery</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              { src: aiStage, alt: 'AI for Educators launch ceremony with Shri Mangal Prabhat Lodha', caption: 'Official inauguration of the AI for Educators program' },
              { src: aiSpeaker, alt: 'Dr. Rajan Welukar speaking at the podium', caption: 'Dr. Rajan Welukar addressing the audience on AI in higher education' },
              { src: aiPanel, alt: 'Dignitaries at the AI for Educators inauguration', caption: 'Distinguished panel of dignitaries at the launch event' },
              { src: aiMinister, alt: "Hon'ble Minister addressing the gathering", caption: 'Shri Mangal Prabhat Lodha delivering the keynote address' },
            ].map((img, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="group overflow-hidden rounded-2xl shadow-lg">
                  <div className="h-[300px] overflow-hidden">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-4 bg-background border-t border-border">
                    <p className="text-sm text-muted-foreground">{img.caption}</p>
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Key Quote */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ScrollSection className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 text-center space-y-4">
              <div className="text-gold text-4xl font-serif">"</div>
              <p className="text-foreground font-medium text-lg italic leading-relaxed">
                AI is not just the technology of tomorrow — it's the language of today. Empowering our teachers 
                with AI literacy ensures that our students are ready for the opportunities of the digital age. 
                Teachers who embrace AI will not be replaced; they will be irreplaceable.
              </p>
              <p className="text-gold font-semibold">— Shri Mangal Prabhat Lodha</p>
              <p className="text-muted-foreground text-sm">Hon'ble Minister, Skill, Employment, Entrepreneurship & Innovation, Govt. of Maharashtra</p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Distinguished Guests */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Distinguished Guests & Speakers</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <ScrollSection delay={0}><SpeakerCard name="Shri Mangal Prabhat Lodha" role="Hon'ble Minister, Skill, Employment, Entrepreneurship & Innovation, Govt. of Maharashtra" /></ScrollSection>
            <ScrollSection delay={100}><SpeakerCard name="Dr. Rajan Welukar" role="Vice Chancellor, ATLAS SkillTech University; Former VC, University of Mumbai" /></ScrollSection>
            <ScrollSection delay={200}><SpeakerCard name="Dr. Apoorva Palkar" role="Vice Chancellor, Ratan Tata Maharashtra State Skill University" /></ScrollSection>
            <ScrollSection delay={300}><SpeakerCard name="Mr. Deepak Kumar Mukadam" role="Founder, Academisthan; Chancellor's Nominee, University of Mumbai Management Council" /></ScrollSection>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Program Details & Curriculum</h2>
          </ScrollSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Clock, label: 'Duration', value: '30 Hours' },
              { icon: Globe, label: 'Mode', value: 'Online' },
              { icon: Shield, label: 'Certification', value: 'DigiLocker' },
              { icon: GraduationCap, label: 'For', value: 'All Educators' },
            ].map((stat, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-5 rounded-xl bg-gold/5 border border-gold/15 text-center">
                  <stat.icon className="h-6 w-6 text-gold mx-auto mb-2" />
                  <div className="font-serif text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
                </div>
              </ScrollSection>
            ))}
          </div>

          <ScrollSection>
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-bold text-foreground">What Educators Will Learn</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Introduction to AI & Machine Learning fundamentals for non-technical educators',
                  'Hands-on training with AI-powered teaching tools (ChatGPT, Gemini, Copilot, etc.)',
                  'AI-driven assessment creation, grading automation, and personalized learning paths',
                  'Ethics of AI in Education — bias, privacy, academic integrity, and responsible use',
                  'Creating AI-enhanced lesson plans, presentations, and interactive content',
                  'Leveraging AI for research — literature review, data analysis, and writing assistance',
                  'Understanding AI policy frameworks — NEP 2020, UGC guidelines, and global standards',
                  'Building an AI-ready classroom — infrastructure, mindset, and institutional adoption',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border">
                    <CheckCircle className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                    <span className="text-muted-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollSection>

          <ScrollSection className="mt-12">
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-foreground">Key Highlights</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  '30 Hours Comprehensive Training',
                  'DigiLocker Government Certificate',
                  'Hands-on AI Tools Practice',
                  'Ethics & Responsible AI Module',
                  'MSBSVET Recognised Institution (MSB010900)',
                  'Suitable for All Disciplines',
                  'Self-paced Online Learning',
                  'Expert Faculty & Mentors',
                ].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium border border-gold/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 bg-navy">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-warm mb-4">Why This Matters</h2>
            <p className="text-warm/70 text-lg leading-relaxed max-w-3xl mx-auto">
              India has over <strong className="text-warm">15 lakh teachers</strong> in higher education institutions. 
              Yet the majority of them have had little to no formal exposure to AI tools and their application in pedagogy. 
              The "AI for Educators" program — conducted by <strong className="text-warm">Academisthan Foundation</strong>, 
              a <strong className="text-warm">government-recognised institution (MSB010900)</strong> under the 
              <strong className="text-warm">Skill, Employment, Entrepreneurship and Innovation Department, Government of Maharashtra</strong> — 
              aims to bridge this critical gap. Unlike private certificate mills, every certificate from this program is 
              <strong className="text-warm">issued on behalf of the Government of Maharashtra</strong> by the Director, MSBSVET, 
              and is verifiable on the official Board website.
            </p>
            <p className="text-warm/60 mt-6 leading-relaxed max-w-3xl mx-auto">
              This is not just a course — it's a movement. A movement led by <strong className="text-warm">Mr. Deepak Kumar Mukadam</strong> 
              and the Academisthan team to ensure that the teaching community of India stands at the forefront 
              of the global AI-in-education revolution — backed by the full weight of government recognition.
            </p>
          </ScrollSection>
          <ScrollSection className="mt-10">
            <Link to="/events">
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 py-3">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to All Events
              </Button>
            </Link>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
