import { useState, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ChevronDown, ChevronRight, User, Shield, LogOut, UserMinus, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import api from '@/lib/api-client';
import logo from '@/assets/academisthan-logo-official.png';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  {
    label: 'Teacher Tools',
    href: '/tools',
    children: [
      { label: 'UGC API Score Calculator', href: '/tools/api-score', icon: '📊' },
      { label: 'CAS Promotion Checker', href: '/tools/promotion-check', icon: '🏅' },
      { label: 'Research Score Calculator', href: '/tools/research-score', icon: '🔬' },
      { label: 'Notable Contributions', href: '/tools/notable-contributions', icon: '⭐' },
      { label: 'Academic CV Generator', href: '/tools/academic-cv', icon: '📄' },
      { label: 'Scholar Impact Analyzer', href: '/tools/scholar-impact', icon: '🚀', badge: 'AI' },
    ],
  },
  {
    label: 'Programs',
    href: '/programs',
    children: [
      { label: 'AI for Educators', href: '/programs/ai-for-educators', icon: '💡' },
      { label: 'Research Methodology Workshop', href: '/events', icon: '📚' },
      { label: 'NEP 2020 Implementation', href: '/programs/nep-2020-roundtable', icon: '🎯' },
    ],
  },
  { label: 'Jobs', href: '/jobs' },
  { label: 'News', href: '/news' },
  { label: 'Gazette', href: '/gazette' },
  { label: 'Events', href: '/events' },
  { label: 'Blog', href: '/blog' },
  { label: 'Directory', href: '/directory' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
];

interface NavbarProps {
  forceSolidBg?: boolean;
}

export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar({ forceSolidBg }, ref) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const { user, profile, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? Your profile will be hidden from the directory, but you can reactivate it at any time.')) return;
    try {
      await api.apiRequest('/profiles/deactivate', { method: 'POST' });
      alert('Account deactivated successfully.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate account');
    }
  };

  const handleDelete = async () => {
    if (!confirm('WARNING: Are you sure you want to delete your account permanently? This action CANNOT be undone.')) return;
    if (!profile) return;
    try {
      await api.apiRequest(`/profiles/${profile.id}`, { method: 'DELETE' });
      alert('Your account has been deleted permanently.');
      signOut();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const filteredLinks = navLinks;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      ref={ref}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        (isScrolled || forceSolidBg)
          ? 'bg-navy/95 backdrop-blur-xl shadow-2xl py-2 border-b border-gold/10'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0 mr-2 md:mr-6">
          <img src={logo} alt="Academisthan" className="h-[3.25rem] md:h-10 w-auto object-contain transition-transform group-hover:scale-110" />
          <span className="font-serif text-lg md:text-xl font-bold text-gold-foreground tracking-wide" style={{ color: 'hsl(38 55% 58%)' }}>
            Academisthan
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {filteredLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.children && link.children.length > 0 && setOpenDropdown(link.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to={link.href}
                className="px-3 py-2 text-sm font-medium text-warm/80 hover:text-gold transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {link.label}
                {link.children && link.children.length > 0 && <ChevronDown className="h-3 w-3" />}
              </Link>
              {link.children && link.children.length > 0 && openDropdown === link.label && (
                <div className="absolute top-full left-0 mt-0 w-72 bg-navy/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gold/20 overflow-hidden py-1 max-h-[500px] overflow-y-auto z-50">
                  {link.children.map((child: any) => (
                    <Link
                      key={child.href + child.label}
                      to={child.href}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors"
                    >
                      <span className="text-base w-6 text-center">{child.icon}</span>
                      <span className="flex-1">{child.label}</span>
                      {child.badge && (
                        <span className="text-[9px] font-bold tracking-wider uppercase bg-gold/15 text-gold border border-gold/25 rounded-full px-1.5 py-0.5">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA / Auth state */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('User Profile')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Button className="bg-gold/10 text-gold hover:bg-gold/20 font-medium gap-2 rounded-xl border border-gold/20">
                {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                {isAdmin ? 'Admin Panel' : (profile?.full_name?.split(' ')[0] || 'Dashboard')}
                <ChevronDown className="h-3 w-3" />
              </Button>
              {openDropdown === 'User Profile' && (
                <div className="absolute top-full right-0 mt-0 w-64 bg-navy/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gold/20 overflow-hidden py-1 z-50 dashboard-menu header-dashboard-menu space-y-1">
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors text-left"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={() => setOpenDropdown(null)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors text-left"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                      {profile?.institution_id ? (
                        <Link
                          to="/dashboard?tool=institute"
                          onClick={() => setOpenDropdown(null)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors text-left"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>My Institute</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard?tool=institute"
                          onClick={() => setOpenDropdown(null)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors text-left"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>Institute Registration</span>
                        </Link>
                      )}
                      
                      <div
                        role="button"
                        onClick={() => {
                          handleDeactivate();
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-amber-500 hover:text-amber-400 hover:bg-gold/10 transition-colors text-left cursor-pointer"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span>Deactivate My Account</span>
                      </div>

                      <div
                        role="button"
                        onClick={() => {
                          handleDelete();
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-red-500 hover:text-red-400 hover:bg-gold/10 transition-colors text-left cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete My Account</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gold/10 my-1"></div>
                  <div
                    role="button"
                    onClick={() => {
                      signOut();
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('Join Us')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold shadow-lg gap-1">
                Join Us
                <ChevronDown className="h-3 w-3" />
              </Button>
              {openDropdown === 'Join Us' && (
                <div className="absolute top-full right-0 mt-0 w-64 bg-navy/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gold/20 overflow-hidden py-1 z-50">
                  <Link
                    to="/auth/signup"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Become a Fellow</div>
                      <div className="text-xs text-warm/50">Join as an educator</div>
                    </div>
                  </Link>
                  <Link
                    to="/institution-register"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="font-medium">Institution Registration</div>
                      <div className="text-xs text-warm/50">Register your institution</div>
                    </div>
                  </Link>
                  <div className="border-t border-gold/10 my-1"></div>
                  <Link
                    to="/auth/signin"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-warm/70 hover:text-gold hover:bg-gold/10 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <div className="font-medium">Sign In</div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu toggle - RIGHT side */}
        <div className="lg:hidden">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-warm/80 hover:text-gold [&_svg]:size-8">
                <Menu className="h-8 w-8" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-white dark:bg-navy/98 backdrop-blur-xl border-l border-gold/20 overflow-y-auto">
              <div className="flex flex-col h-full">
                {/* Logo in drawer */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gold/20">
                  <img src={logo} alt="Academisthan" className="h-8 w-auto" />
                  <span className="font-serif text-base font-bold text-gold-foreground" style={{ color: 'hsl(38 55% 58%)' }}>
                    Academisthan
                  </span>
                </div>

                {/* Navigation links */}
                <nav className="flex-1 space-y-0.5">
                  {filteredLinks.map((link) => (
                    <div key={link.label}>
                      {/* Parent menu item */}
                      <div className="flex items-center">
                        <Link
                          to={link.href}
                          className="flex-1 px-3 py-2 text-sm text-foreground hover:text-gold hover:bg-gold/10 transition-colors font-normal rounded-lg"
                          onClick={() => {
                            if (!link.children || link.children.length === 0) {
                              setIsMobileOpen(false);
                            }
                          }}
                        >
                          {link.label}
                        </Link>
                        {/* Submenu toggle button */}
                        {link.children && link.children.length > 0 && (
                          <button
                            onClick={() => setOpenMobileSubmenu(openMobileSubmenu === link.label ? null : link.label)}
                            className="px-2 py-2 text-muted-foreground hover:text-gold transition-colors"
                            aria-label={`Toggle ${link.label} submenu`}
                          >
                            <ChevronRight 
                              className={cn(
                                "h-3.5 w-3.5 transition-transform duration-200",
                                openMobileSubmenu === link.label && "rotate-90"
                              )} 
                            />
                          </button>
                        )}
                      </div>

                      {/* Submenu - collapsible with smooth animation */}
                      {link.children && link.children.length > 0 && (
                        <div 
                          className={cn(
                            "ml-2 border-l-2 border-gold/20 pl-2 overflow-hidden transition-all duration-300 ease-in-out",
                            openMobileSubmenu === link.label 
                              ? "max-h-[500px] opacity-100 mt-0.5" 
                              : "max-h-0 opacity-0"
                          )}
                        >
                          <div className="space-y-0.5 py-0.5">
                            {link.children.map((child: any) => (
                              <Link
                                key={child.href + child.label}
                                to={child.href}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors rounded-lg"
                                onClick={() => setIsMobileOpen(false)}
                              >
                                <span className="text-sm w-5 text-center flex-shrink-0">{child.icon}</span>
                                <span className="flex-1">{child.label}</span>
                                {child.badge && (
                                  <span className="text-[8px] font-bold tracking-wider uppercase bg-gold/15 text-gold border border-gold/25 rounded-full px-1.5 py-0.5">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                {/* Auth buttons at bottom */}
                <div className="pt-4 space-y-2 border-t border-gold/20 mt-auto">
                  {user ? (
                    <div className="space-y-1.5 w-full">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                        My Account ({profile?.full_name || 'Fellow'})
                      </div>
                      
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMobileOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:text-gold hover:bg-gold/10 transition-colors text-left rounded-lg"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>My Profile</span>
                      </Link>

                      {profile?.institution_id ? (
                        <Link
                          to="/dashboard?tool=institute"
                          onClick={() => setIsMobileOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:text-gold hover:bg-gold/10 transition-colors text-left rounded-lg"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>My Institute</span>
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard?tool=institute"
                          onClick={() => setIsMobileOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:text-gold hover:bg-gold/10 transition-colors text-left rounded-lg"
                        >
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>Institute Registration</span>
                        </Link>
                      )}

                      <div
                        role="button"
                        onClick={() => {
                          handleDeactivate();
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-amber-500 hover:text-amber-400 hover:bg-gold/10 transition-colors text-left cursor-pointer rounded-lg"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span>Deactivate My Account</span>
                      </div>

                      <div
                        role="button"
                        onClick={() => {
                          handleDelete();
                          setIsMobileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-gold/10 transition-colors text-left cursor-pointer rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete My Account</span>
                      </div>

                      <div className="border-t border-gold/10 my-2"></div>

                      <Button 
                        onClick={() => {
                          signOut();
                          setIsMobileOpen(false);
                        }}
                        className="w-full bg-gold text-gold-foreground hover:bg-gold/90 gap-2 text-sm font-semibold rounded-lg h-10"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-muted-foreground px-3 py-1">Join Us</div>
                      <Link to="/auth/signup" onClick={() => setIsMobileOpen(false)} className="block w-full">
                        <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm justify-start gap-2">
                          <User className="h-4 w-4" />
                          Become a Fellow
                        </Button>
                      </Link>
                      <Link to="/institution-register" onClick={() => setIsMobileOpen(false)} className="block w-full">
                        <Button variant="outline" className="w-full text-foreground hover:text-gold border-gold/20 hover:bg-gold/10 text-sm justify-start gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Institution Registration
                        </Button>
                      </Link>
                      <div className="border-t border-gold/10 my-2"></div>
                      <Link to="/auth/signin" onClick={() => setIsMobileOpen(false)} className="block w-full">
                        <Button variant="outline" className="w-full text-foreground hover:text-gold border-gold/20 hover:bg-gold/10 text-sm justify-start gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
});
