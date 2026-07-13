import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowLeft, BookOpen, Youtube, CheckCircle, Globe, MessageSquare } from 'lucide-react';

import nepCover from '@/assets/events/nep-cover.jpg';
import nepPanelists from '@/assets/events/nep-panelists.jpg';

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

export default function NEPRoundtable() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={nepPanelists} alt="NEP 2020 Round Table panelists" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        </div>
        <div className="container relative mx-auto px-4">
          <ScrollSection>
            <Link to="/programs" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Programs
            </Link>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Policy Discussion
              </span>
              <span className="px-4 py-1.5 rounded-full bg-teal/20 text-teal text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> 6,500+ Registrations
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight max-w-4xl">
              NEP 2020: Demystifying the Transformation of Indian Education
            </h1>
            <div className="flex flex-wrap gap-6 mt-8 text-warm/70">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> Saturday, 8th August 2020</div>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Virtual Round Table</div>
              <div className="flex items-center gap-2"><Youtube className="h-5 w-5 text-gold" /> 8,100+ YouTube Views</div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Event Overview</h2>
            <div className="space-y-5 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                On <strong className="text-foreground">Saturday, 8th August 2020</strong>, just days after the Government of India 
                approved the historic <strong className="text-foreground">National Education Policy 2020</strong> — the first comprehensive 
                education policy overhaul in 34 years — Academisthan organized a landmark Virtual Round Table Discussion titled 
                <em> "NEP 2020: Demystifying Transformation of Indian Education."</em>
              </p>
              <p className="leading-relaxed">
                The timing was deliberate and impactful. With the academic community buzzing with questions, uncertainties, and 
                apprehensions about the sweeping changes proposed by NEP 2020, <strong className="text-foreground">Mr. Deepak Kumar Mukadam</strong> 
                and the Academisthan team recognized the urgent need for a credible, nuanced, and accessible forum where the policy 
                could be discussed, dissected, and demystified by those who were directly involved in its formulation and those 
                responsible for its implementation.
              </p>
              <p className="leading-relaxed">
                What followed was one of the most impactful virtual events in India's education sector that year. The round table 
                brought together an extraordinary assembly of <strong className="text-foreground">Members of Parliament, Vice Chancellors, 
                UGC leadership, NEP draft committee members, and state-level education policymakers</strong> — all on a single platform, 
                engaging in a frank, illuminating, and forward-looking conversation about the future of Indian education.
              </p>
              <p className="leading-relaxed">
                The event received close to <strong className="text-foreground">6,500 registrations</strong> from educators, administrators, 
                and students across the country and garnered over <strong className="text-foreground">8,100 views on YouTube</strong>, 
                making it one of the most widely watched education policy discussions of 2020.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-navy/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Registrations', value: '6,500+' },
              { label: 'YouTube Views', value: '8,100+' },
              { label: 'Panelists', value: '6 Eminent' },
              { label: 'Reach', value: 'Pan-India' },
            ].map((stat, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-5 rounded-xl bg-background border border-border text-center">
                  <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
                  <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Event Gallery</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { src: nepPanelists, alt: 'NEP 2020 Virtual Round Table panelists', caption: 'Distinguished panelists from Parliament, UGC, and leading universities' },
              { src: nepCover, alt: 'NEP 2020 Report', caption: 'The NEP 2020 report that transformed Indian higher education' },
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

      {/* Quote */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4">
          <ScrollSection className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 text-center space-y-4">
              <div className="text-gold text-4xl font-serif">"</div>
              <p className="text-foreground font-medium text-lg italic leading-relaxed">
                This event helped demystify critical aspects of NEP 2020 and drove positive sensitization 
                towards the policy. It dispelled apprehensions, clarified misconceptions, and motivated 
                educators across the country towards the in-spirit implementation of the new policy. 
                Academisthan once again proved that it is the voice of the Indian educator.
              </p>
              <p className="text-gold font-semibold">— Event Report Summary</p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Distinguished Panelists */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Distinguished Panelists</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScrollSection delay={0}><SpeakerCard name="Dr. Vinay Sahasrabuddhe" role="Member of Parliament, Rajya Sabha; Chairman, Parliamentary Standing Committee on HRD" /></ScrollSection>
            <ScrollSection delay={100}><SpeakerCard name="Dr. Bhushan Patwardhan" role="Vice-Chairman, University Grants Commission (UGC)" /></ScrollSection>
            <ScrollSection delay={200}><SpeakerCard name="Dr. Vasudha Kamat" role="Member, NEP Draft Committee; Former VC, SNDT Women's University" /></ScrollSection>
            <ScrollSection delay={300}><SpeakerCard name="Shri Ashish Shelar" role="Former Education Minister, Government of Maharashtra" /></ScrollSection>
            <ScrollSection delay={400}><SpeakerCard name="Dr. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" /></ScrollSection>
            <ScrollSection delay={500}><SpeakerCard name="Dr. Anuradha Majumdar" role="Dean, Faculty of Science & Technology, University of Mumbai" /></ScrollSection>
          </div>
        </div>
      </section>

      {/* Key Topics */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Key Topics Discussed</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'The vision behind NEP 2020 and its departure from the 1986 policy framework',
              'Multidisciplinary education and the shift from rigid departmental silos',
              'Academic Bank of Credits (ABC) and multiple entry/exit systems',
              'Research culture, National Research Foundation, and innovation ecosystems',
              'Autonomy for institutions — graded autonomy and the path to self-governance',
              'Teacher education reform — 4-year integrated B.Ed. and continuous professional development',
              'Digital education infrastructure, online learning, and the role of technology',
              'Implementation challenges, state-level readiness, and the road ahead',
            ].map((item, i) => (
              <ScrollSection key={i} delay={i * 50}>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border">
                  <CheckCircle className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 bg-navy">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-warm mb-4">Impact & Significance</h2>
            <p className="text-warm/70 text-lg leading-relaxed max-w-3xl mx-auto">
              At a time when India's education community was grappling with questions about the new policy's intent 
              and implications, this Academisthan round table served as a beacon of clarity. By bringing together the 
              very architects and implementors of NEP 2020, <strong className="text-warm">Mr. Deepak Kumar Mukadam</strong> ensured 
              that educators across the country heard directly from the source — dispelling myths, addressing fears, 
              and igniting enthusiasm for the transformative potential of the policy.
            </p>
            <p className="text-warm/60 mt-6 leading-relaxed max-w-3xl mx-auto">
              The event underscored Academisthan's unique position as a bridge between policymakers and practitioners — 
              a platform where India's education policy meets its educators, fostering dialogue, understanding, and collective action.
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
