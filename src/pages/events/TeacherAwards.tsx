import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowLeft, Award, Star, CheckCircle, FileText, Trophy } from 'lucide-react';

import awardsCover from '@/assets/events/awards-cover.jpg';

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

export default function TeacherAwards() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={awardsCover} alt="Teacher of the Year Awards 2021" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        </div>
        <div className="container relative mx-auto px-4">
          <ScrollSection>
            <Link to="/events" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to All Events
            </Link>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4" /> National Awards
              </span>
              <span className="px-4 py-1.5 rounded-full bg-teal/20 text-teal text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Teacher Recognition
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight max-w-4xl">
              Academisthan's Teacher of the Year Awards 2021
            </h1>
            <div className="flex flex-wrap gap-6 mt-8 text-warm/70">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> September 5, 2021 (Teachers' Day)</div>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Pan-India (National Level)</div>
              <div className="flex items-center gap-2"><Award className="h-5 w-5 text-gold" /> Supreme Court Patronage</div>
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
                On the auspicious occasion of <strong className="text-foreground">Teachers' Day, September 5, 2021</strong>, Academisthan 
                instituted its inaugural National Level <strong className="text-foreground">"Best Teacher of the Year Awards"</strong> — a 
                prestigious recognition program designed to celebrate, honour, and elevate the extraordinary contributions of teachers 
                serving in Higher Education Institutions (HEIs) across the length and breadth of India.
              </p>
              <p className="leading-relaxed">
                Conceived and spearheaded by <strong className="text-foreground">Mr. Deepak Kumar Mukadam</strong>, Founder of Academisthan 
                and Hon'ble Chancellor's Nominee on the Management Council of the University of Mumbai, this awards program was born 
                out of a deep conviction that India's teachers — the silent architects of the nation's future — deserve far greater 
                recognition, respect, and celebration than they typically receive.
              </p>
              <p className="leading-relaxed">
                The awards carried the distinguished patronage of <strong className="text-foreground">Hon'ble Justice Smt. Sujata V. Manohar</strong>, 
                former Judge of the Supreme Court of India, and were supported by an eminent jury panel comprising Vice Chancellors, 
                AICTE leadership, and senior academicians — lending the program both prestige and academic rigour.
              </p>
              <p className="leading-relaxed">
                Unlike typical awards that focus solely on research output, the Academisthan Teacher of the Year Awards adopted a 
                <strong className="text-foreground"> holistic evaluation framework</strong> — assessing nominees on teaching quality, 
                research contributions, innovation in pedagogy, community impact, mentorship excellence, and adaptability to digital 
                and e-learning environments. This comprehensive approach ensured that teachers who truly made a difference in their 
                students' lives were recognized, not just those with the longest publication lists.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Award Image */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollSection>
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <img src={awardsCover} alt="Teacher of the Year Awards 2021 poster" className="w-full object-cover object-top max-h-[500px]" />
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <ScrollSection className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 text-center space-y-4">
              <div className="text-gold text-4xl font-serif">"</div>
              <p className="text-foreground font-medium text-lg italic leading-relaxed">
                The purpose of the National Level 'Best Teacher Award' is to celebrate the unique contribution 
                of some of the finest teachers in the country — teachers who through their commitment and industry 
                have not merely improved the quality of education at their institutions, but have enriched the very 
                lives of their students and inspired them to become better human beings.
              </p>
              <p className="text-gold font-semibold">— Academisthan Awards Committee</p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Distinguished Patrons */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Distinguished Patrons & Jury</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScrollSection delay={0}><SpeakerCard name="Hon'ble Justice Smt. Sujata V. Manohar" role="Former Judge, Supreme Court of India — Chief Patron" /></ScrollSection>
            <ScrollSection delay={100}><SpeakerCard name="Dr. Anil Sahasrabuddhe" role="Chairman, All India Council for Technical Education (AICTE)" /></ScrollSection>
            <ScrollSection delay={200}><SpeakerCard name="Prof. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" /></ScrollSection>
            <ScrollSection delay={300}><SpeakerCard name="Mr. Deepak Kumar Mukadam" role="Founder, Academisthan; Chancellor's Nominee, University of Mumbai" /></ScrollSection>
          </div>
        </div>
      </section>

      {/* Award Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Award Categories</h2>
          </ScrollSection>
          <div className="space-y-6">
            {[
              {
                title: 'Category I — Extraordinary Contribution to Teaching & Research',
                desc: 'For senior educators who have demonstrated sustained excellence in both teaching and research over a distinguished career. This category recognizes those whose body of work has significantly advanced their field and inspired generations of students.',
                icon: Star,
              },
              {
                title: 'Category II — Young Teacher Award (40 years or below)',
                desc: 'Celebrating the next generation of academic leaders — young teachers who have shown exceptional promise, innovation, and impact early in their careers. This award encourages fresh talent and acknowledges that great teaching knows no age.',
                icon: Award,
              },
              {
                title: 'Category III — Innovation in e-Teaching & Learning',
                desc: 'Recognizing educators who have embraced technology to transform their classrooms, especially during and after the COVID-19 pandemic. This category honours those who pioneered innovative online teaching methods, digital content creation, and virtual student engagement strategies.',
                icon: Trophy,
              },
            ].map((cat, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-background border border-border hover:border-gold/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <cat.icon className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-foreground mb-2">{cat.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Disciplines Covered</h2>
            <p className="text-muted-foreground mb-8">
              The awards spanned across all major disciplines in Indian higher education, ensuring representation and recognition for teachers from every academic stream:
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                'Science & Technology', 'Arts & Humanities', 'Social Sciences', 'Law & Legal Studies',
                'Commerce & Business', 'Management Studies', 'Education & Pedagogy',
                'North East India Special Category', 'Engineering & Applied Sciences', 'Medical & Health Sciences',
              ].map((d) => (
                <span key={d} className="px-5 py-2.5 rounded-full bg-gold/10 text-gold font-medium border border-gold/20">{d}</span>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Eligibility & Process */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Nomination & Evaluation Process</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Open to all full-time teachers at recognized HEIs across India',
              'Self-nomination and institutional nomination both accepted',
              'Evaluated on teaching quality, research, innovation, and community impact',
              'Multi-stage review by an eminent jury of Vice Chancellors and academicians',
              'Special consideration for teachers from underserved regions and institutions',
              'Transparent, merit-based selection with no application fee',
              'Winners received certificates, citations, and national-level recognition',
              'Results announced on Teachers\' Day — honouring Dr. Radhakrishnan\'s legacy',
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
            <h2 className="font-serif text-3xl font-bold text-warm mb-4">Legacy & Impact</h2>
            <p className="text-warm/70 text-lg leading-relaxed max-w-3xl mx-auto">
              The Academisthan Teacher of the Year Awards 2021 set a new benchmark for teacher recognition in India. 
              By celebrating not just academic output but also the human qualities of mentorship, innovation, and dedication, 
              the awards sent a powerful message: <strong className="text-warm">that teaching is not merely a profession, 
              but a sacred calling that deserves the nation's highest respect</strong>.
            </p>
            <p className="text-warm/60 mt-6 leading-relaxed max-w-3xl mx-auto">
              Under the visionary leadership of <strong className="text-warm">Mr. Deepak Kumar Mukadam</strong>, 
              the awards continue to inspire thousands of educators across India to strive for excellence, 
              knowing that their contributions — however quiet — are seen, valued, and celebrated.
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
