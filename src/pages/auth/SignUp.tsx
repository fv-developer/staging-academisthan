import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, ArrowRight, Eye, EyeOff, Sparkles, Search, ChevronDown } from 'lucide-react';
import logo from '@/assets/academisthan-logo-official.png';
import cinematicCampus from '@/assets/hero/cinematic-campus.jpg';
import { countries, Country, getMaxPhoneLength, getExpectedPhoneLabel } from '@/utils/countryData';
import { cn } from '@/lib/utils';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Country search and select state
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((c) => c.code === 'IN') || countries[0]
  );
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryContainerRef = useRef<HTMLDivElement>(null);

  const { signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close country dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryContainerRef.current && !countryContainerRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Check if user is already a Fellow
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.95)), url(${cinematicCampus})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-3">
              You're Already a Fellow!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account <span className="font-semibold text-foreground">{profile.full_name}</span> is already registered as an Academisthan Fellow.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/dashboard" className="block w-full">
                <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/institution-register" className="block w-full">
                <Button variant="outline" className="w-full">
                  Register Your Institution
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    // Phone format validation based on selected country
    const phoneRegex = new RegExp(selectedCountry.phoneRegex);
    const maxLen = getMaxPhoneLength(selectedCountry);
    const expectedDigits = getExpectedPhoneLabel(selectedCountry);

    if (phone.length > maxLen) {
      toast({
        title: 'Validation Error',
        description: `Mobile number cannot exceed ${maxLen} digits.`,
        variant: 'destructive',
      });
      return;
    }

    if (phone.length < maxLen && !phoneRegex.test(phone)) {
      toast({
        title: 'Validation Error',
        description: `Please enter a valid ${expectedDigits}-digit mobile number.`,
        variant: 'destructive',
      });
      return;
    }

    if (!phoneRegex.test(phone)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid mobile number format.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const fullPhone = `${selectedCountry.dialCode} ${phone.trim()}`;
    const { error } = await signUp(email.trim(), password, fullName.trim(), selectedCountry.name, fullPhone);
    setIsLoading(false);

    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Account created! 📧',
        description: 'Please check your email to verify your account before signing in.',
      });
      // Redirect to sign in page with a message
      navigate('/auth/signin?verified=false');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Cinematic visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ animation: 'kenBurns 20s ease-in-out infinite alternate' }}>
          <img src={cinematicCampus} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsla(228,45%,12%,0.92), hsla(228,45%,15%,0.8))' }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Academisthan" className="h-10 w-10" />
            <span className="font-serif text-xl font-bold text-gold">Academisthan</span>
          </Link>

          <div className="max-w-md">
            <h2 className="font-serif text-4xl font-bold text-warm leading-tight mb-4">
              Join India's Premier<br />
              <span className="text-gradient-gold">Academic Community</span>
            </h2>
            <p className="text-warm/60 leading-relaxed mb-8">
              Get your unique Academisthan Fellow membership, access teacher productivity tools, 
              connect with 7,000+ educators, and grow your academic career.
            </p>

            <div className="space-y-4">
              {[
                { icon: '🎓', text: 'Unique ACAD membership ID & digital card' },
                { icon: '📊', text: 'UGC API Score Calculator & CAS Checker' },
                { icon: '🤝', text: 'Network with 7,000+ educators across India' },
                { icon: '🏆', text: 'Teacher awards & recognition programs' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-warm/70 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-warm/30 text-xs">
            "Teachers should be the best minds in the country." — Dr. Sarvepalli Radhakrishnan
          </p>
        </div>
      </div>

      {/* Right — Sign up form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Academisthan" className="h-8 w-8" />
              <span className="font-serif text-lg font-bold" style={{ color: 'hsl(38,55%,58%)' }}>Academisthan</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              Become a Fellow
            </h1>
            <p className="text-muted-foreground text-sm">
              Create your account and join the Academisthan community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Dr. Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl border-border bg-card"
                required
                maxLength={100}
              />
            </div>

            {/* Country Dropdown */}
            <div className="space-y-2 relative" ref={countryContainerRef}>
              <Label className="text-sm font-medium">Country</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span>{selectedCountry ? selectedCountry.name : 'Select Country'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>

                {countryDropdownOpen && (
                  <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-lg">
                    <div className="flex items-center border-b border-border px-3 pb-2 mb-2">
                      <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setCountryDropdownOpen(false);
                            setCountrySearch('');
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                            selectedCountry?.code === c.code && "bg-muted font-medium text-gold"
                          )}
                        >
                          <span>{c.name}</span>
                          <span className="text-muted-foreground text-xs">{c.dialCode}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="py-2 text-center text-sm text-muted-foreground">No country found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Number Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex h-12 items-center justify-center rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground font-medium min-w-[70px]">
                  {selectedCountry?.dialCode || '+91'}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={selectedCountry?.phonePlaceholder || 'Mobile number'}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const maxLen = getMaxPhoneLength(selectedCountry);
                    if (val.length > maxLen) {
                      setPhoneError(`Mobile number cannot exceed ${maxLen} digits.`);
                    } else {
                      setPhoneError('');
                    }
                    setPhone(val.slice(0, maxLen));
                  }}
                  className={cn(
                    "h-12 rounded-xl border-border bg-card flex-1",
                    phoneError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  required
                />
              </div>
              {phoneError && <p className="text-red-500 text-xs font-semibold mt-1">{phoneError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="priya@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-card"
                required
                maxLength={254}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Please use your personal email address.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pr-12"
                  required
                  minLength={6}
                  maxLength={72}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl font-semibold text-base shadow-[0_4px_20px_hsl(38_55%_58%/0.3)]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gold-foreground border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Create Fellow Account <Sparkles className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already a Fellow?{' '}
            <Link to="/auth/signin" className="text-gold hover:text-gold/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border text-center">
            <p className="text-xs text-muted-foreground mb-2">Want to register your institution instead?</p>
            <Link to="/institution-register" className="text-gold text-sm font-semibold hover:underline">
              Institution Membership →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
