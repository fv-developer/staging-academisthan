import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { FileText } from 'lucide-react';

export default function Terms() {
  const { ref: heroRef } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-12 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-1/3 w-72 h-72 bg-accent/15 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <FileText className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">Legal</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-warm mb-4">
            Terms of <span className="text-gradient-gold">Service</span>
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
                title: '1. Acceptance of Terms',
                content: `By accessing or using the Academisthan platform (academisthan.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Academisthan reserves the right to modify these terms at any time.`
              },
              {
                title: '2. Membership & Registration',
                content: `To access certain features, you must register as an Academisthan Fellow. You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. Each membership ID is unique and non-transferable. Membership is currently available at no cost and may be subject to change.`
              },
              {
                title: '3. Acceptable Use',
                content: `You agree to use Academisthan only for lawful purposes and in accordance with these terms. You shall not: impersonate any person or entity; provide false or misleading information in your profile; use the platform to spam, harass, or harm others; attempt to access other users' accounts; reverse engineer or tamper with the platform's functionality; or use automated tools to scrape or collect data from the platform.`
              },
              {
                title: '4. Teacher Tools & Calculators',
                content: `The UGC API Score Calculator, CAS Promotion Checker, Research Score Calculator, and other tools provided are for informational and educational purposes only. Scores and results are indicative and based on general UGC/AICTE guidelines. They do not constitute official assessments. Always verify with your institution's IQAC and the latest official regulations.`
              },
              {
                title: '5. News & Content Aggregation',
                content: `Academisthan aggregates news, circulars, and notifications from publicly available government and educational sources. We strive for accuracy but do not guarantee the completeness or timeliness of aggregated content. For official and legally binding information, always refer to the original government or institutional source. Academisthan is not affiliated with UGC, AICTE, NAAC, or any government body.`
              },
              {
                title: '6. Intellectual Property',
                content: `The Academisthan platform, including its design, logos, original content, and software, is the intellectual property of Academisthan. Aggregated content remains the property of its respective original sources and is used under fair use for educational purposes. You may not reproduce, distribute, or create derivative works from our original content without permission.`
              },
              {
                title: '7. Fellow Directory',
                content: `By registering as a Fellow, you consent to having limited profile information (name, designation, institution, department, location, specialization) displayed in the public Fellow Directory. You can manage your profile information through your dashboard at any time.`
              },
              {
                title: '8. Certificate Verification',
                content: `The Certificate Verification feature allows third parties to verify the authenticity of Academisthan membership IDs. Verified information is limited to the fellow's name, designation, institution, and membership status. This verification confirms membership only and does not constitute an endorsement of qualifications.`
              },
              {
                title: '9. Limitation of Liability',
                content: `Academisthan is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform. This includes but is not limited to: decisions made based on calculator results; reliance on aggregated news content; or any loss of data or service interruptions.`
              },
              {
                title: '10. Termination',
                content: `We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time by contacting us. Upon termination, your profile will be removed from the Fellow Directory and your membership ID will be deactivated.`
              },
              {
                title: '11. Governing Law',
                content: `These Terms of Service are governed by the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.`
              },
              {
                title: '12. Contact',
                content: `For any questions regarding these Terms of Service, please contact us at contact@academisthan.com.`
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
