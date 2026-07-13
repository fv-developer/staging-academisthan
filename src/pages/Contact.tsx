import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollSection } from '@/components/ScrollSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Mail, Phone, MapPin, Clock, Send, MessageSquare,
  Linkedin, Youtube, Instagram, Globe, ArrowRight,
  GraduationCap, Users, Building2, Sparkles, Heart,
  CheckCircle2, Shield, Zap,
} from 'lucide-react';

import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import conference from '@/assets/conference.jpg';

/* ─── Contact Info ─── */
const contactInfo = [
  { icon: Mail, label: 'Email', value: 'contact@academisthan.com', href: 'mailto:contact@academisthan.com' },
  { icon: Phone, label: 'Phone', value: '+91 83692 84305', href: 'tel:+918369284305' },
  { icon: MapPin, label: 'Location', value: 'Mumbai, Maharashtra, India', href: '#' },
  { icon: Clock, label: 'Hours', value: 'Mon-Sat: 10AM - 6PM IST', href: '#' },
];

const socialLinks = [
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/academisthan', color: 'hover:bg-[hsl(210,80%,50%)]/20 hover:text-[hsl(210,80%,50%)]' },
  { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@academisthan', color: 'hover:bg-destructive/20 hover:text-destructive' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/academisthan', color: 'hover:bg-[hsl(330,70%,55%)]/20 hover:text-[hsl(330,70%,55%)]' },
  { icon: Globe, label: 'Website', href: '/', color: 'hover:bg-gold/20 hover:text-gold' },
];

const reasons = [
  { icon: Users, title: 'Partnership Inquiry', desc: 'Institutional collaborations, MoUs, and joint programs', gradient: 'from-gold/20 to-gold/5' },
  { icon: GraduationCap, title: 'Program Enrollment', desc: 'Questions about workshops, certifications, and courses', gradient: 'from-teal/20 to-teal/5' },
  { icon: Building2, title: 'Institutional Membership', desc: 'Bulk enrollment and university-level partnerships', gradient: 'from-gold/15 to-gold/5' },
  { icon: Sparkles, title: 'Media & Speaking', desc: 'Press inquiries, conference invitations, and interviews', gradient: 'from-teal/15 to-teal/5' },
];

const faqs = [
  { q: 'Is there a fee to become an Academisthan Fellow?', a: 'No, basic fellowship is completely free. Premium programs and certified workshops may have separate fees.' },
  { q: 'How quickly do you respond to inquiries?', a: 'We typically respond within 24 hours on working days. Priority is given to institutional partnership inquiries.' },
  { q: 'Can my institution partner with Academisthan?', a: 'Absolutely! We welcome partnerships with universities, colleges, and educational organizations. Reach out via the form above.' },
  { q: 'Do you offer customized training programs?', a: 'Yes, we design tailored programs for institutions based on their specific needs — from AI workshops to NAAC preparation.' },
];

export default function Contact() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSending(true);

    const { error } = await supabase.from('contact_submissions').insert({
      name: form.name.trim().slice(0, 100),
      email: form.email.trim().slice(0, 254),
      subject: form.subject.trim().slice(0, 200) || null,
      message: form.message.trim().slice(0, 2000),
      user_id: user?.id || null,
    } as any);

    setSending(false);

    if (error) {
      toast({ title: 'Failed to send message', description: 'Please try again later.', variant: 'destructive' });
    } else {
      setSent(true);
      toast({ title: 'Message sent! ✨', description: "We'll get back to you within 24 hours." });
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden website-page">
      <Helmet>
        <title>Contact Academisthan — Partnerships, Programs & Membership</title>
        <meta name="description" content="Get in touch with Academisthan for institutional partnerships, fellowship enrollment, and educator support. We respond within 24 hours." />
        <link rel="canonical" href="https://academisthan.org/contact" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        })}</script>
      </Helmet>
      <Navbar />


      {/* ════ HERO ════ */}
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={conference} alt="Contact Academisthan" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsla(228,45%,12%,0.9), hsla(228,45%,15%,0.78), hsla(228,45%,12%,0.93))' }} />



        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" style={{ animation: 'fadeUp 1s ease-out forwards', opacity: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6">
            <MessageSquare className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-semibold">We'd Love to Hear from You</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-warm mt-2 leading-tight">
            Let's <span className="text-gradient-gold">Connect</span>
          </h1>
          <p className="text-warm/50 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Have a question, partnership idea, or just want to say hello?
            We're always excited to connect with fellow educators.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-10" style={{ animation: 'fadeUp 0.8s 0.4s ease-out forwards', opacity: 0 }}>
            {[
              { icon: Zap, text: '24hr Response' },
              { icon: Shield, text: '7,000+ Fellows' },
              { icon: Heart, text: 'Always Free' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-warm/50 text-sm">
                <item.icon className="w-4 h-4 text-gold" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CONTACT FORM + INFO ════ */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Left — Form */}
            <div className="lg:col-span-3">
              <ScrollSection animation="slide-right">
                <div className="relative overflow-hidden bg-gradient-to-br from-navy/60 to-navy/80 border border-gold/15 rounded-3xl p-8 md:p-10 backdrop-blur-sm">
                  {/* Subtle corner accent */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gold/3 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-warm">Send a Message</h2>
                        <p className="text-warm/40 text-sm">We typically respond within 24 hours</p>
                      </div>
                    </div>

                    {sent ? (
                      <div className="text-center py-12" style={{ animation: 'scaleIn 0.6s ease-out forwards' }}>
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-10 h-10 text-accent" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-warm mb-2">Message Sent!</h3>
                        <p className="text-warm/50 text-sm max-w-sm mx-auto mb-6">
                          Thank you for reaching out. Our team will get back to you within 24 hours.
                        </p>
                        <Button
                          onClick={() => setSent(false)}
                          variant="outline"
                          className="rounded-xl border-gold/20 text-gold hover:bg-gold/10"
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label className="text-warm/70 text-xs">Full Name *</Label>
                            <Input
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="Dr. Priya Sharma"
                              className="rounded-xl bg-navy/80 border-gold/15 text-warm placeholder:text-warm/30 focus:border-gold/40 h-12"
                              maxLength={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-warm/70 text-xs">Email *</Label>
                            <Input
                              type="email"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              placeholder="priya@university.edu"
                              className="rounded-xl bg-navy/80 border-gold/15 text-warm placeholder:text-warm/30 focus:border-gold/40 h-12"
                              maxLength={254}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-warm/70 text-xs">Subject</Label>
                          <Input
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Partnership inquiry / Program question / General"
                            className="rounded-xl bg-navy/80 border-gold/15 text-warm placeholder:text-warm/30 focus:border-gold/40 h-12"
                            maxLength={200}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-warm/70 text-xs">Message *</Label>
                          <Textarea
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="Tell us how we can help..."
                            className="rounded-xl bg-navy/80 border-gold/15 text-warm placeholder:text-warm/30 focus:border-gold/40 resize-none min-h-[140px]"
                            rows={5}
                            maxLength={2000}
                          />
                          <span className="text-warm/20 text-[10px] float-right">{form.message.length}/2000</span>
                        </div>
                        <Button
                          type="submit"
                          disabled={sending}
                          className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl px-8 py-5 font-semibold gap-2 shadow-[0_4px_20px_hsl(38_55%_58%/0.3)] w-full sm:w-auto"
                        >
                          {sending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-gold-foreground border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </div>
                          ) : (
                            <>Send Message <Send className="w-4 h-4" /></>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </ScrollSection>
            </div>

            {/* Right — Info */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollSection animation="slide-left" delay={100}>
                <div className="space-y-4">
                  {contactInfo.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a key={item.label} href={item.href} className="group flex items-start gap-4 p-4 rounded-xl border border-gold/10 hover:border-gold/25 transition-all bg-navy/40 hover:bg-navy/60">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                          <Icon className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <span className="text-warm/40 text-xs uppercase tracking-wider">{item.label}</span>
                          <p className="text-warm font-medium text-sm mt-0.5 group-hover:text-gold transition-colors">{item.value}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </ScrollSection>

              <ScrollSection animation="slide-left" delay={200}>
                <div className="p-5 rounded-xl border border-gold/10 bg-navy/40">
                  <h3 className="font-serif text-lg font-bold text-warm mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <a
                          key={social.label}
                          href={social.href}
                          className={`w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center text-warm/60 transition-all ${social.color}`}
                          title={social.label}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </ScrollSection>

              <ScrollSection animation="slide-left" delay={300}>
                <div className="relative overflow-hidden p-5 rounded-xl border border-gold/15 bg-gradient-to-br from-gold/10 to-gold/5">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-gold" />
                      <h4 className="font-serif font-bold text-warm text-sm">Join 7,000+ Educators</h4>
                    </div>
                    <p className="text-warm/50 text-xs leading-relaxed mb-3">
                      Become an Academisthan Fellow for free tools, career support, and a community that cares.
                    </p>
                    <a href="/auth/signup" className="inline-flex items-center gap-1 text-gold text-xs font-semibold hover:underline">
                      Become a Fellow <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </ScrollSection>
            </div>
          </div>
        </div>
      </section>

      {/* ════ REASONS TO REACH OUT ════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <ScrollSection className="text-center mb-16">
            <span className="text-teal text-sm font-semibold tracking-widest uppercase">How Can We Help?</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4">
              We're Here <span className="text-gradient-gold">For You</span>
            </h2>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((reason, i) => {
              const Icon = reason.icon;
              return (
                <ScrollSection key={reason.title} animation="fade-up" delay={i * 100}>
                  <div className={`group bg-gradient-to-br ${reason.gradient} border border-border rounded-2xl p-6 text-center space-y-4 hover:border-gold/30 hover:shadow-xl transition-all hover:-translate-y-2 h-full`}>
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 mx-auto flex items-center justify-center group-hover:bg-gold/20 group-hover:scale-110 transition-all">
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-foreground">{reason.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{reason.desc}</p>
                  </div>
                </ScrollSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════ FAQ ════ */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollSection className="text-center mb-16">
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">Common Questions</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm mt-4">
              Frequently <span className="text-gradient-gold">Asked</span>
            </h2>
          </ScrollSection>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <ScrollSection key={i} animation="fade-up" delay={i * 80}>
                <div className="bg-navy/60 border border-gold/10 rounded-2xl p-6 hover:border-gold/20 transition-all">
                  <h4 className="font-serif text-base font-bold text-warm mb-2">{faq.q}</h4>
                  <p className="text-warm/50 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section className="relative py-28 overflow-hidden">
        <img src={cinematicCampus} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollSection animation="scale-in">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-warm leading-tight">
              Together, We <span className="text-gradient-gold">Transform</span><br />Education
            </h2>
            <p className="text-warm/60 mt-6 text-lg max-w-xl mx-auto">
              Every great collaboration starts with a conversation.
            </p>
          </ScrollSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
