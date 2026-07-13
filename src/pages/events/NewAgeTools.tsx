import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowLeft, Lightbulb, Play, CheckCircle, Globe, Award, BookOpen } from 'lucide-react';

import webinarBanner from '@/assets/events/webinar-banner.jpg';

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

export default function NewAgeTools() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <img src={webinarBanner} alt="New-Age Tools for Teaching Online" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy" />
        </div>
        <div className="container relative mx-auto px-4">
          <ScrollSection>
            <Link to="/events" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 text-sm font-medium mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to All Events
            </Link>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> National Webinar Series
              </span>
              <span className="px-4 py-1.5 rounded-full bg-teal/20 text-teal text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> 6,920 Registrations
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-warm leading-tight max-w-4xl">
              New-Age Tools for Teaching Online
            </h1>
            <p className="font-serif text-xl text-gold italic mt-4">Get Ready for Education 4.0</p>
            <div className="flex flex-wrap gap-6 mt-8 text-warm/70">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gold" /> 28th – 30th June 2020</div>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-gold" /> Virtual (YouTube & Facebook Live)</div>
              <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-gold" /> 8 Countries</div>
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
                In the midst of the COVID-19 pandemic, when India's education system faced an unprecedented crisis 
                and teachers across the country were suddenly thrust into the unfamiliar world of online teaching, 
                <strong className="text-foreground"> Academisthan</strong> stepped up with a timely and transformative intervention.
              </p>
              <p className="leading-relaxed">
                From <strong className="text-foreground">28th to 30th June 2020</strong>, Academisthan organized a massive 3-day 
                National Level Webinar Series titled <em>"New-Age Tools for Teaching Online — Get Ready for Education 4.0"</em>, 
                designed to equip teachers with practical digital skills, modern tools, and effective strategies for delivering 
                quality education in a virtual environment.
              </p>
              <p className="leading-relaxed">
                The event was <strong className="text-foreground">inaugurated by none other than Shri Bhagat Singh Koshyari, 
                Hon'ble Governor of Maharashtra and Chancellor of all State Universities</strong>, lending the program extraordinary 
                credibility and significance. The Governor's participation underscored the urgency and importance of digitally 
                empowering India's teaching community at a time when the entire education ecosystem had shifted online overnight.
              </p>
              <p className="leading-relaxed">
                Organized under the visionary leadership of <strong className="text-foreground">Mr. Deepak Kumar Mukadam</strong>, 
                this webinar became one of the largest and most impactful online education events of 2020, with registrations 
                pouring in from <strong className="text-foreground">6,920 participants across 1,608 institutions, 477+ cities, 
                and 8 countries</strong>.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-navy/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Registrations', value: '6,920' },
              { label: 'Institutions', value: '1,608' },
              { label: 'Cities', value: '477+' },
              { label: 'Countries', value: '8' },
            ].map((stat, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-5 rounded-xl bg-background border border-border text-center">
                  <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
                  <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
                </div>
              </ScrollSection>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'YouTube Views/Day', value: '~10,000', icon: Play },
              { label: 'Facebook Views/Day', value: '~5,000', icon: Play },
            ].map((stat, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-5 rounded-xl bg-background border border-border text-center flex flex-col items-center">
                  <stat.icon className="h-5 w-5 text-gold mb-2" />
                  <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
                  <div className="text-muted-foreground text-sm mt-1">{stat.label}</div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Image */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollSection>
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <img src={webinarBanner} alt="New-Age Tools Webinar with Governor Koshyari" className="w-full object-cover max-h-[500px]" />
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4">
          <ScrollSection className="max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 text-center space-y-4">
              <div className="text-gold text-4xl font-serif">"</div>
              <p className="text-foreground font-medium text-lg italic leading-relaxed">
                Higher education institutions should adopt new online tools of teaching and learning. 
                A holistic view should be used to see if the new technology is foolproof, harmonious and practical. 
                I congratulate Academisthan for organizing this timely and important webinar for the benefit 
                of thousands of teachers across the country.
              </p>
              <p className="text-gold font-semibold">— Shri Bhagat Singh Koshyari</p>
              <p className="text-muted-foreground text-sm">Hon'ble Governor of Maharashtra & Chancellor of State Universities</p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Distinguished Speakers */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8 text-center">Distinguished Speakers & Guests</h2>
          </ScrollSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScrollSection delay={0}><SpeakerCard name="Shri Bhagat Singh Koshyari" role="Hon'ble Governor of Maharashtra & Chancellor of State Universities (Chief Guest)" /></ScrollSection>
            <ScrollSection delay={100}><SpeakerCard name="Dr. Suhas Pednekar" role="Vice Chancellor, University of Mumbai" /></ScrollSection>
            <ScrollSection delay={200}><SpeakerCard name="Mr. Deepak Kumar Mukadam" role="Founder, Academisthan; Chancellor's Nominee, University of Mumbai Management Council" /></ScrollSection>
          </div>
        </div>
      </section>

      {/* 3-Day Program */}
      <section className="py-16 bg-navy/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">3-Day Program Schedule</h2>
          </ScrollSection>
          <div className="space-y-6">
            {[
              {
                day: 'Day 1 — Sunday, 28th June 2020',
                title: 'Inauguration & Online Teaching Tools & Applications',
                details: [
                  'Grand inauguration by Hon\'ble Governor Shri Bhagat Singh Koshyari',
                  'Introduction to the landscape of online teaching tools available to educators',
                  'Live demonstrations of platforms like Google Classroom, Zoom, Microsoft Teams, and more',
                  'Understanding synchronous vs. asynchronous teaching methods',
                  'Best practices for setting up a virtual classroom environment',
                  'Q&A session with expert practitioners',
                ],
              },
              {
                day: 'Day 2 — Monday, 29th June 2020',
                title: 'How to Create Great Content Online',
                details: [
                  'Principles of effective digital content creation for education',
                  'Tools for creating engaging presentations, videos, and interactive materials',
                  'Screen recording, video editing, and multimedia content production techniques',
                  'Creating assessments, quizzes, and interactive exercises online',
                  'Open Educational Resources (OER) and Creative Commons licensing',
                  'Hands-on workshop: Building your first complete online lesson',
                ],
              },
              {
                day: 'Day 3 — Tuesday, 30th June 2020',
                title: 'Student Interaction & Engagement',
                details: [
                  'Strategies for maintaining student attention and participation in virtual classrooms',
                  'Gamification, polls, breakout rooms, and collaborative tools',
                  'Managing large virtual classrooms effectively',
                  'Assessment strategies for online education — proctoring, integrity, and fairness',
                  'Building a sense of community and belonging in the digital classroom',
                  'Panel discussion: The future of hybrid and blended learning in India',
                ],
              },
            ].map((session, i) => (
              <ScrollSection key={i} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-background border border-border">
                  <div className="text-gold text-sm font-semibold mb-2">{session.day}</div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-4">{session.title}</h3>
                  <div className="space-y-2">
                    {session.details.map((detail, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                        <span className="text-muted-foreground text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-foreground mb-8">Key Highlights</h2>
            <div className="flex flex-wrap gap-3">
              {[
                'Inaugurated by Hon\'ble Governor of Maharashtra',
                'Free Registration for All Teachers',
                'E-Certificates Issued to All Participants',
                'Live on YouTube & Facebook Simultaneously',
                '~10,000 YouTube Views per Day',
                '~5,000 Facebook Views per Day',
                'Participants from 8 Countries',
                '1,608 Institutions Represented',
                'Hands-on Practical Sessions',
                'Available as Recorded Sessions',
              ].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium border border-gold/20">
                  {tag}
                </span>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 bg-navy">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <ScrollSection>
            <h2 className="font-serif text-3xl font-bold text-warm mb-4">Impact & Legacy</h2>
            <p className="text-warm/70 text-lg leading-relaxed max-w-3xl mx-auto">
              At a time when India's teachers were struggling to adapt to the sudden shift to online education, 
              this Academisthan webinar served as a lifeline. It didn't just teach tools — it gave teachers 
              <strong className="text-warm"> confidence</strong>. The confidence to face a digital classroom, 
              the confidence to create engaging content, and the confidence to keep teaching — even when everything 
              around them had changed.
            </p>
            <p className="text-warm/60 mt-6 leading-relaxed max-w-3xl mx-auto">
              <strong className="text-warm">Mr. Deepak Kumar Mukadam's</strong> vision for this event was simple yet profound: 
              no teacher in India should feel left behind in the digital revolution. The overwhelming response — nearly 7,000 
              registrations from across 8 countries — proved that this vision resonated deeply with the teaching community.
            </p>
            <p className="text-warm/50 mt-6 leading-relaxed max-w-3xl mx-auto">
              The webinar series established Academisthan as a <strong className="text-warm">national platform for teacher 
              empowerment</strong> and laid the groundwork for the organization's subsequent initiatives in AI education, 
              policy advocacy, and teacher recognition.
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
