import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, MapPin, Phone, Linkedin, Twitter, Youtube, Instagram } from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer ref={ref} className="bg-navy text-navy-foreground">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Academisthan" className="h-10 w-auto object-contain" />
              <span className="font-serif text-xl font-bold text-gold">Academisthan</span>
            </div>
            <p className="text-gold/70 text-sm font-serif font-semibold tracking-wide mb-2">
              Of the Teachers · By the Teachers · For the Teachers
            </p>
            <p className="text-warm/40 text-xs leading-relaxed italic">
              "The true teachers are those who help us think for ourselves."
              <br />
              <span className="not-italic text-warm/30 mt-1 inline-block">— Dr. Sarvepalli Radhakrishnan</span>
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { label: 'LinkedIn', href: 'https://www.linkedin.com/company/academisthan', renderIcon: () => <Linkedin className="w-5 h-5" /> },
                { 
                  label: 'X', 
                  href: 'https://twitter.com/academisthan', 
                  renderIcon: () => (
                    <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ) 
                },
                { label: 'YouTube', href: 'https://www.youtube.com/@academisthan', renderIcon: () => <Youtube className="w-5 h-5" /> },
                { label: 'Instagram', href: 'https://www.instagram.com/academisthan', renderIcon: () => <Instagram className="w-5 h-5" /> },
              ].map((social) => {
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-full bg-gold/10 hover:bg-gold/20 border border-gold/20 flex items-center justify-center text-gold transition-all hover:scale-110 hover:shadow-lg hover:shadow-gold/20"
                  >
                    {social.renderIcon()}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-gold font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Programs', href: '/programs' },
                { label: 'Blog', href: '/blog' },
                { label: 'Jobs & Opportunities', href: '/jobs' },
                { label: 'News & Updates', href: '/news' },
                { label: 'Gazette & Regulations', href: '/gazette' },
                { label: 'Events', href: '/events' },
                { label: 'Resources', href: '/resources' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-warm/50 hover:text-gold text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Teacher Tools */}
          <div>
            <h4 className="font-serif text-gold font-semibold mb-4">Teacher Tools</h4>
            <ul className="space-y-2">
              {[
                { label: 'UGC API Score Calculator', href: '/tools/api-score' },
                { label: 'Promotion Checker', href: '/tools/promotion-check' },
                { label: 'Research Score', href: '/tools/research-score' },
                { label: 'Notable Contributions', href: '/tools/notable-contributions' },
                { label: 'Academic CV Generator', href: '/tools/academic-cv' },
                { label: 'Scholar Impact Analyzer', href: '/tools/scholar-impact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-warm/50 hover:text-gold text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-gold font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-warm/50 text-sm">
                <Mail className="h-4 w-4 mt-0.5 text-gold/60" />
                <a href="mailto:contact@academisthan.com" className="hover:text-gold transition-colors">contact@academisthan.com</a>
              </li>
              <li className="flex items-start gap-2 text-warm/50 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-gold/60" />
                <a href="tel:+918369284305" className="hover:text-gold transition-colors">+91 83692 84305</a>
              </li>
              <li className="flex items-start gap-2 text-warm/50 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-gold/60" />
                Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal disclaimer bar */}
      <div className="border-t border-gold/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-warm/30 text-xs leading-relaxed text-center">
            This platform provides summaries and interpretations of publicly available government notifications for educational purposes. 
            For official versions, refer to the original sources. Academisthan is not affiliated with UGC, AICTE, or any government body.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gold/5">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-warm/25 text-xs">
            © {new Date().getFullYear()} Academisthan. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-warm/25 hover:text-gold/50 text-xs transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-warm/25 hover:text-gold/50 text-xs transition-colors">Terms of Service</Link>
            <Link to="/verify" className="text-warm/25 hover:text-gold/50 text-xs transition-colors">Verify Certificate</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});
