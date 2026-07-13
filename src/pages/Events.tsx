import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowRight, Play, Award, Lightbulb, BookOpen, Cpu, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Event images
import aiStage from '@/assets/events/ai-educators-stage.jpg';
import aiSpeaker from '@/assets/events/ai-educators-speaker.jpg';
import aiPanel from '@/assets/events/ai-educators-panel.jpg';
import aiMinister from '@/assets/events/ai-educators-minister.jpg';
import webinarBanner from '@/assets/events/webinar-banner.jpg';
import awardsCover from '@/assets/events/awards-cover.jpg';
import nepCover from '@/assets/events/nep-cover.jpg';
import nepPanelists from '@/assets/events/nep-panelists.jpg';

/* ─── Event Gallery ─── */
function EventGallery({ images }: { images: { src: string; alt: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {images.map((img, i) => (
        <div key={i} className={`overflow-hidden rounded-xl ${i === 0 ? 'col-span-2 h-[300px] md:h-[400px]' : 'h-[200px]'}`}>
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Highlight Badge ─── */
function HighlightBadge({ icon: Icon, text, isDark = false }: { icon: any; text: string; isDark?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
      <Icon className="h-4 w-4 text-gold" />
      <span className={cn(
        "text-sm font-medium",
        isDark ? "text-warm" : "text-foreground"
      )}>{text}</span>
    </div>
  );
}

/* ─── Speaker Card ─── */
function SpeakerCard({ name, role, isDark = false }: { name: string; role: string; isDark?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border",
      isDark 
        ? "bg-white/5 border-white/10" 
        : "bg-navy/5 border-border"
    )}>
      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
        <span className="text-gold font-serif font-bold text-sm">{name[0]}</span>
      </div>
      <div className="min-w-0">
        <div className={cn(
          "font-serif font-bold text-sm truncate",
          isDark ? "text-warm" : "text-foreground"
        )}>{name}</div>
        <div className={cn(
          "text-xs truncate",
          isDark ? "text-warm/60" : "text-muted-foreground"
        )}>{role}</div>
      </div>
    </div>
  );
}

/* ─────────────────── EVENTS PAGE ─────────────────── */
export default function Events() {
  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* ════ HERO ════ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-primary to-navy" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection>
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Our Journey</span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-warm mt-4">
              Past <span className="text-gradient-gold">Events</span>
            </h1>
            <p className="text-warm/60 mt-6 text-lg max-w-3xl mx-auto">
              From national-level webinars inaugurated by Governors to Teacher of the Year Awards — 
              Academisthan has been at the forefront of educator empowerment since 2019.
            </p>
          </ScrollSection>
        </div>
      </section>

      {/* ════ EVENT 1: AI FOR EDUCATORS (2025) ════ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gold/20" />
              <span className="text-gold font-serif font-bold text-lg">2025</span>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
          </ScrollSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ScrollSection animation="slide-right">
              <EventGallery images={[
                { src: aiStage, alt: 'AI for Educators launch ceremony with Shri Mangal Prabhat Lodha' },
                { src: aiSpeaker, alt: 'Dr. Rajan Welukar speaking at the podium' },
                { src: aiPanel, alt: 'Dignitaries at the AI for Educators inauguration' },
                { src: aiMinister, alt: 'Hon\'ble Minister addressing the gathering' },
              ]} />
            </ScrollSection>

            <ScrollSection animation="slide-left" delay={200}>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <HighlightBadge icon={Cpu} text="AI & Technology" />
                  <HighlightBadge icon={Award} text="Govt. Certified" />
                </div>

                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  AI for Educators — 30-Hour Online Course Launch
                </h2>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gold" /> November 2025</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gold" /> Mumbai, Maharashtra</div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  In a landmark initiative, <strong>Academisthan</strong> in collaboration with the <strong>Maharashtra State Board of Skill, 
                  Vocational Education and Training (MSBVET)</strong>, launched a 30-hour government-certified online program 
                  titled <em>"AI for Educators"</em> — aimed at helping teachers harness AI tools effectively and ethically, 
                  transforming traditional teaching into a more engaging and tech-enabled experience.
                </p>

                <div className="p-5 rounded-xl bg-gold/5 border border-gold/15 space-y-2">
                  <p className="text-foreground font-medium italic text-sm">
                    "AI is not just the technology of tomorrow — it's the language of today. Empowering our teachers 
                    with AI literacy ensures that our students are ready for the opportunities of the digital age."
                  </p>
                  <p className="text-gold text-sm font-semibold">— Shri Mangal Prabhat Lodha, Hon'ble Minister</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-foreground text-sm">Distinguished Guests</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <SpeakerCard name="Shri Mangal Prabhat Lodha" role="Hon'ble Minister, Skill Dev. & Entrepreneurship" />
                    <SpeakerCard name="Dr. Rajan Welukar" role="Vice Chancellor, ATLAS SkillTech University" />
                    <SpeakerCard name="Dr. Apoorva Palkar" role="VC, Ratan Tata Maharashtra State Skill University" />
                    <SpeakerCard name="Deepakkumar Mukadam" role="Founder, Academisthan" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-semibold">30 Hours Training</div>
                  <div className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-semibold">DigiLocker Certified</div>
                  <div className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-semibold">Hands-on AI Tools</div>
                  <div className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-semibold">Ethics & Responsible AI</div>
                </div>

                <div className="pt-0">
                  <Link to="/events/ai-for-educators">
                    <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 group">
                      Read Full Event Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ EVENT 2: TEACHER OF THE YEAR AWARDS (2021) ════ */}
      <section className="py-20 bg-navy">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gold/20" />
              <span className="text-gold font-serif font-bold text-lg">2021</span>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
          </ScrollSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ScrollSection animation="slide-right" delay={200}>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <HighlightBadge icon={Award} text="National Awards" isDark />
                </div>

                <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm leading-tight">
                  Academisthan's Teacher of the Year Awards 2021
                </h2>

                <div className="flex flex-wrap gap-4 text-sm text-warm/60">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gold" /> September 5, 2021</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gold" /> Pan-India (National Level)</div>
                </div>

                <p className="text-warm/70 leading-relaxed">
                  Academisthan instituted the National Level <strong className="text-warm">"Best Teacher of the Year Awards"</strong> to 
                  recognize and celebrate excellence in teaching at Higher Education Institutions across India. 
                  The awards honoured teachers who, through their commitment and industry, improved the quality 
                  of education and enriched the lives of their students.
                </p>

                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-warm text-sm">Award Categories</h4>
                  <div className="space-y-2">
                    {[
                      'Category I — Extraordinary Contribution to Teaching & Research',
                      'Category II — Young Teacher Award (40 years or below)',
                      'Category III — Innovation in e-Teaching & Learning',
                    ].map((cat) => (
                      <div key={cat} className="flex items-start gap-2 text-warm/60 text-sm">
                        <Award className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-warm text-sm">Disciplines Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Science', 'Technology', 'Arts & Humanities', 'Social Sciences', 'Law', 'Commerce', 'Management', 'North East Special'].map((d) => (
                      <span key={d} className="px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-medium">{d}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-warm text-sm">Distinguished Patrons</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <SpeakerCard name="Hon'ble Justice Sujata Manohar" role="Former Judge, Supreme Court of India" isDark />
                    <SpeakerCard name="Dr. Anil Sahasrabuddhe" role="Chairman, AICTE" isDark />
                    <SpeakerCard name="Prof. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" isDark />
                  </div>
                </div>

                <div className="pt-0">
                  <Link to="/events/teacher-awards-2021">
                    <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 group">
                      Read Full Event Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollSection>

            <ScrollSection animation="slide-left">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl h-[500px]">
                  <img src={awardsCover} alt="Teacher of the Year Awards 2021" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5 rounded-xl glass space-y-2">
                  <p className="text-warm/70 text-sm italic">
                    "The purpose of the National Level 'Best Teacher Award' is to celebrate the unique contribution 
                    of some of the finest teachers in the country and to honour those who have enriched the lives of their students."
                  </p>
                  <p className="text-gold text-sm font-semibold">— Academisthan Awards Committee</p>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ EVENT 3: NEP 2020 ROUNDTABLE (2020) ════ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gold/20" />
              <span className="text-gold font-serif font-bold text-lg">August 2020</span>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
          </ScrollSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ScrollSection animation="slide-right">
              <EventGallery images={[
                { src: nepPanelists, alt: 'NEP 2020 Virtual Round Table panelists and event poster' },
                { src: nepCover, alt: 'NEP 2020 Report cover' },
              ]} />
            </ScrollSection>

            <ScrollSection animation="slide-left" delay={200}>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <HighlightBadge icon={BookOpen} text="Policy Discussion" />
                  <HighlightBadge icon={Users} text="6,500+ Registrations" />
                </div>

                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  NEP 2020: Demystifying Transformation of Indian Education
                </h2>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gold" /> Saturday, 8th August 2020</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gold" /> Virtual Round Table</div>
                  <div className="flex items-center gap-1"><Users className="h-4 w-4 text-gold" /> 8,100+ YouTube Views</div>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  A landmark virtual round table discussion that brought together <strong>Members of Parliament, 
                  Vice Chancellors, and leading educationists</strong> to unravel the intent, execution, and 
                  implications of the National Education Policy 2020. The event received close to 
                  <strong> 6,500 registrations</strong> and over <strong>8,100 views on YouTube</strong>.
                </p>

                <div className="p-5 rounded-xl bg-gold/5 border border-gold/15 space-y-2">
                  <p className="text-foreground font-medium italic text-sm">
                    "This event helped demystify aspects of NEP 2020 and drove positive sensitization 
                    towards the policy, dispelling apprehensions and motivating in-spirit implementation."
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-foreground text-sm">Distinguished Panelists</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <SpeakerCard name="Dr. Vinay Sahasrabuddhe" role="MP Rajya Sabha, Chairman HRD Committee" />
                    <SpeakerCard name="Dr. Bhushan Patwardhan" role="Vice-Chairman, UGC" />
                    <SpeakerCard name="Dr. Vasudha Kamat" role="Member, NEP Draft Committee" />
                    <SpeakerCard name="Shri Ashish Shelar" role="Former Education Minister, Maharashtra" />
                    <SpeakerCard name="Dr. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" />
                    <SpeakerCard name="Dr. Anuradha Majumdar" role="Dean, Faculty of Science & Tech, Mumbai Univ." />
                  </div>
                </div>

                <div className="pt-0">
                  <Link to="/events/nep-2020-roundtable">
                    <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 group">
                      Read Full Event Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ EVENT 4: NEW-AGE TOOLS WEBINAR (2020) ════ */}
      <section className="py-20 bg-navy">
        <div className="container mx-auto px-4">
          <ScrollSection>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gold/20" />
              <span className="text-gold font-serif font-bold text-lg">June 2020</span>
              <div className="h-px flex-1 bg-gold/20" />
            </div>
          </ScrollSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ScrollSection animation="slide-right" delay={200}>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <HighlightBadge icon={Lightbulb} text="Webinar Series" isDark />
                  <HighlightBadge icon={Users} text="6,920 Registrations" isDark />
                </div>

                <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm leading-tight">
                  New-Age Tools for Teaching Online
                </h2>
                <p className="font-serif text-lg text-gold italic">Get Ready for Education 4.0</p>

                <div className="flex flex-wrap gap-4 text-sm text-warm/60">
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gold" /> 28th – 30th June 2020</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gold" /> Virtual (YouTube & Facebook Live)</div>
                  <div className="flex items-center gap-1"><Users className="h-4 w-4 text-gold" /> 1,608 Institutions</div>
                </div>

                <p className="text-warm/70 leading-relaxed">
                  <strong className="text-warm">Inaugurated by Hon'ble Governor of Maharashtra, Shri Bhagat Singh Koshyari</strong>, 
                  this 3-day national webinar equipped teachers with digital tools for online education during 
                  the COVID-19 pandemic. It covered online teaching tools, quality e-content creation, and 
                  student engagement strategies.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Registrations', value: '6,920' },
                    { label: 'Institutions', value: '1,608' },
                    { label: 'Cities', value: '477+' },
                    { label: 'Countries', value: '8' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl glass text-center">
                      <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
                      <div className="text-warm/50 text-xs mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-warm text-sm">3-Day Sessions</h4>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/10">
                      <div className="text-gold text-xs font-semibold mb-1">Day 1 — June 28</div>
                      <div className="text-warm/70 text-sm">Inauguration + Online Teaching Tools & Applications</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/10">
                      <div className="text-gold text-xs font-semibold mb-1">Day 2 — June 29</div>
                      <div className="text-warm/70 text-sm">How to Create Great Content Online</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/10">
                      <div className="text-gold text-xs font-semibold mb-1">Day 3 — June 30</div>
                      <div className="text-warm/70 text-sm">Student Interaction & Engagement</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-warm text-sm">Eminent Attendees</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <SpeakerCard name="Shri Bhagat Singh Koshyari" role="Hon'ble Governor of Maharashtra (Chief Guest)" isDark />
                    <SpeakerCard name="Dr. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" isDark />
                    <SpeakerCard name="Deepakkumar Mukadam" role="Founder, Academisthan" isDark />
                  </div>
                </div>

                <div className="pt-0">
                  <Link to="/events/new-age-tools-2020">
                    <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 group">
                      Read Full Event Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollSection>

            <ScrollSection animation="slide-left">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl h-[400px]">
                  <img src={webinarBanner} alt="New-Age Tools Webinar banner with Governor Koshyari" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5 rounded-xl glass space-y-2">
                  <p className="text-warm/70 text-sm italic">
                    "Higher education institutions should adopt new online tools of teaching and learning. 
                    A holistic view should be used to see if the new technology is foolproof, harmonious and practical."
                  </p>
                  <p className="text-gold text-sm font-semibold">— Shri Bhagat Singh Koshyari, Hon'ble Governor</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-semibold flex items-center gap-1">
                    <Play className="h-3 w-3" /> ~10,000 YouTube views/day
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-semibold flex items-center gap-1">
                    <Play className="h-3 w-3" /> ~5,000 Facebook views/day
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-semibold">Free Registration</div>
                  <div className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-semibold">E-Certificates Issued</div>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* ════ ABOUT ACADEMISTHAN (From the docs) ════ */}
      <section className="py-20 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5">
        <div className="container mx-auto px-4">
          <ScrollSection className="max-w-4xl mx-auto text-center space-y-6">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Estd. 2019</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              About <span className="text-gradient-gold">Academisthan</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Academisthan is a <strong>"not for profit"</strong> initiative started by and for the teaching faculty serving 
              Higher Education Institutions. Founded by <strong>Shri Deepakkumar Mukadam</strong>, Hon'ble Chancellor's Nominee 
              on the Management Council of the University of Mumbai, it is the first and one of its kind e-portal 
              in India — connecting teachers across State Universities, Central Universities, Private Universities, 
              Deemed and Affiliated colleges to exchange views, network, and grow professionally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/about">
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8">
                  Read Our Full Story <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 rounded-xl px-8">
                  Become a Fellow
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
