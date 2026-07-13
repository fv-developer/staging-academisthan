import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Shield, FileText } from 'lucide-react';

export default function Privacy() {
  const { ref: heroRef } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-12 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/3 w-72 h-72 bg-gold/15 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <Shield className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">Legal</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-warm mb-4">
            Privacy <span className="text-gradient-gold">Policy</span>
          </h1>
          <p className="text-warm/50 text-sm">Last updated: March 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 space-y-8">
            {[
              {
                title: '1. Information We Collect',
                content: `When you register as an Academisthan Fellow, we collect personal information including your full name, email address, phone number, designation, department, institution, city, state, specialization, and years of experience. We also collect optional information such as your LinkedIn URL, Google Scholar URL, bio, and profile photo. Usage data such as page visits and feature usage may be collected automatically.`
              },
              {
                title: '2. How We Use Your Information',
                content: `Your information is used to: create and manage your Fellow membership account; display your profile in the Fellow Directory (public profiles show limited information); generate your membership ID and digital certificate; provide access to teacher tools and academic calculators; send you relevant notifications about events, programs, and academic opportunities; and improve our platform and services.`
              },
              {
                title: '3. Data Sharing',
                content: `We do not sell, trade, or rent your personal information to third parties. Your profile information visible in the Fellow Directory is limited to your name, designation, institution, department, city, state, and specialization. Sensitive information like email, phone, and full bio is only visible to you in your dashboard. We may share aggregated, anonymized data for research or reporting purposes.`
              },
              {
                title: '4. News & Content Aggregation',
                content: `Academisthan aggregates publicly available news, circulars, and notifications from government bodies (UGC, AICTE, NAAC, eGazette) and education news sources. This content is collected from public domains for educational and informational purposes. We attribute all content to its original source and provide links to the official websites.`
              },
              {
                title: '5. Data Security',
                content: `We implement industry-standard security measures to protect your personal data. All data is transmitted over encrypted connections (HTTPS). Access to the database is restricted through row-level security policies. We regularly review our security practices to ensure your data remains safe.`
              },
              {
                title: '6. Your Rights',
                content: `You have the right to: access, update, or delete your personal information through your dashboard; request a copy of your data; withdraw consent for optional data processing; and contact us with any privacy concerns. To exercise these rights, please contact us at contact@academisthan.com.`
              },
              {
                title: '7. Cookies & Analytics',
                content: `We use essential cookies to maintain your authentication session. We may use analytics tools to understand usage patterns and improve our services. No third-party advertising cookies are used on this platform.`
              },
              {
                title: '8. Changes to This Policy',
                content: `We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.`
              },
              {
                title: '9. Contact Us',
                content: `If you have any questions about this Privacy Policy, please contact us at contact@academisthan.com or through our Contact page.`
              },
            ].map(section => (
              <div key={section.title}>
                <h2 className="font-serif text-lg font-bold text-foreground mb-3">{section.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
