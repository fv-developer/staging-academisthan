import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { institutions } from '@/lib/api-client';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { countries, Country, stateCities, getMaxPhoneLength } from '@/utils/countryData';
import {
  Building2, User, Mail, Phone, MapPin, Globe, Award,
  GraduationCap, Upload, ArrowRight, ArrowLeft, Check,
  Sparkles, Shield, Users, BookOpen, Star, ChevronsUpDown,
  Plus, FileText, AlertCircle, Trash2
} from 'lucide-react';

// Institution Types mapping options
const INSTITUTION_TYPES = [
  { value: 'college', label: 'College (Affiliated)' },
  { value: 'autonomous_college', label: 'Autonomous College' },
  { value: 'university', label: 'University (State/Central)' },
  { value: 'deemed_university', label: 'Deemed University' },
  { value: 'private_institution', label: 'Private Institution' },
  { value: 'k12_school', label: 'K-12 School' },
];

const NAAC_GRADES = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited', 'Applied'];

const REPRESENTATIVE_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Dean',
  'HOD',
  'Director',
  'Other'
];

type Step = 1 | 2 | 3;

export default function InstitutionRegister() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is active fellow
  const isFellow = user && profile && profile.membership_status === 'active';

  // Error state for validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic Country / State / City state variables
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'IN') || countries[0]
  );
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const [stateSearch, setStateSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const [citySearch, setCitySearch] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Autocomplete search states
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Supporting Document states
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBase64, setDocBase64] = useState<string>('');
  const [docError, setDocError] = useState<string>('');

  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  const [isOtherDesignation, setIsOtherDesignation] = useState(false);

  const [form, setForm] = useState({
    // Representative
    representative_name: '',
    representative_email: '',
    representative_phone: '',
    representative_dial_code: '+91',
    representative_designation: '',
    // Institution basics
    institution_name: '',
    institution_type: 'college',
    affiliated_university: '',
    // Contact details
    institution_phone: '',
    institution_dial_code: '+91',
    // Location
    address: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    website: '',
    // Accreditation
    naac_grade: 'Not Accredited',
    nirf_rank: '',
    established_year: '',
    // Stats
    student_count: '',
    faculty_count: '',
    // Showcase
    description: '',
    achievements: '',
    programs_offered: '',
    notable_alumni: '',
  });

  // Autofill representative information from Fellow profile
  useEffect(() => {
    if (profile) {
      const activeCountry = countries.find(c => c.name === (profile.country || 'India')) || countries.find(c => c.code === 'IN') || countries[0];
      
      let cleanPhone = profile.phone || '';
      // Strip dial code if present
      if (cleanPhone.startsWith(activeCountry.dialCode)) {
        cleanPhone = cleanPhone.substring(activeCountry.dialCode.length);
      } else {
        const matchedCountry = countries.find(c => cleanPhone.startsWith(c.dialCode));
        if (matchedCountry) {
          cleanPhone = cleanPhone.substring(matchedCountry.dialCode.length);
        }
      }
      cleanPhone = cleanPhone.replace(/\D/g, '');

      setForm(prev => ({
        ...prev,
        representative_name: profile.full_name || '',
        representative_email: profile.work_email || profile.email || '',
        representative_phone: cleanPhone,
        representative_dial_code: activeCountry.dialCode,
        representative_designation: profile.designation || '',
      }));
    }
  }, [profile]);

  // Handle autocomplete outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateForm = (key: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'country') {
        updated.state = '';
        updated.city = '';
        setStateSearch('');
        setCitySearch('');
      } else if (key === 'state') {
        updated.city = '';
        setCitySearch('');
      }
      return updated;
    });

    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPublicEmailDomain = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    const publicDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
      'aol.com', 'zoho.com', 'yandex.com', 'mail.com', 
      'protonmail.com', 'icloud.com', 'live.com', 'gmx.com'
    ];
    return publicDomains.includes(domain);
  };

  const handleNameChange = async (val: string) => {
    updateForm('institution_name', val);
    if (val.trim().length > 2) {
      try {
        const results = await institutions.autocomplete(val);
        setAutocompleteResults(results);
        setShowAutocomplete(results.length > 0);
      } catch (err) {
        console.error('Autocomplete request failed:', err);
      }
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  };

  // Document uploader helper
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setDocError('');
    if (!file) return;

    // Type validation
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setDocError('Only PDF, PNG, and JPG formats are accepted.');
      return;
    }

    // Size validation
    if (file.size > 5 * 1024 * 1024) {
      setDocError('File size must not exceed 5 MB.');
      return;
    }

    setDocFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError('');
    if (!file) return;

    // Type validation (only images for logo)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Only PNG and JPG formats are accepted for the logo.');
      return;
    }

    // Size validation (2MB max for logo)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo file size must not exceed 2 MB.');
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateField = (key: string, value: string): string => {
    if (key === 'representative_name' && !value.trim()) {
      return 'Full name is required';
    }
    if (key === 'representative_designation' && !value.trim()) {
      return 'Designation is required';
    }
    if (key === 'representative_email') {
      if (!value.trim()) return 'Email is required';
      if (!validateEmail(value)) return 'Please enter a valid email address';
      if (isPublicEmailDomain(value)) {
        return 'Please use your official institutional email address (e.g. your-name@institutename.com).';
      }
    }
    if (key === 'representative_phone') {
      if (!value.trim()) return 'Phone number is required';
      const countryObj = countries.find(c => c.dialCode === form.representative_dial_code) || countries[0];
      const maxLength = getMaxPhoneLength(countryObj);
      const regex = new RegExp(countryObj.phoneRegex);
      if (value.length < 7 || value.length > maxLength || !regex.test(value)) {
        return `Please enter a valid phone number for ${countryObj.name} (${countryObj.phonePlaceholder})`;
      }
    }
    if (key === 'institution_phone' && !value.trim()) {
      return 'Institution contact number is required';
    }
    if (key === 'institution_phone') {
      const countryObj = countries.find(c => c.dialCode === form.institution_dial_code) || countries[0];
      const maxLength = getMaxPhoneLength(countryObj);
      const regex = new RegExp(countryObj.phoneRegex);
      if (value.length < 7 || value.length > maxLength || !regex.test(value)) {
        return `Please enter a valid contact number for ${countryObj.name} (${countryObj.phonePlaceholder})`;
      }
    }

    // Postal code validation
    if (key === 'pincode') {
      if (!value.trim()) return 'Postal / Pin code is required';
      const countryObj = selectedCountry;
      const regex = new RegExp(countryObj.pinRegex);
      if (!regex.test(value)) {
        return `Please enter a valid postal code for ${countryObj.name} (${countryObj.pinPlaceholder})`;
      }
    }

    // Established year check
    if (key === 'established_year') {
      if (!value.trim()) return 'Established year is required';
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        return `Please enter a valid year between 1800 and ${currentYear}`;
      }
    }

    return '';
  };

  const handleFieldBlur = (key: string, value: string) => {
    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const repFields = ['representative_name', 'representative_designation', 'representative_email', 'representative_phone'];
    
    repFields.forEach(f => {
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const step2Fields = ['institution_name', 'institution_phone', 'established_year', 'pincode'];
    
    step2Fields.forEach(f => {
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });

    if (!form.state) {
      newErrors.state = 'State is required';
    }
    if (!form.city) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      navigate('/auth/signin');
      return;
    }

    if (!docFile) {
      setDocError('Supporting verification document is required.');
      toast({ title: 'Supporting document missing', description: 'Please upload a verification document to submit.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 0. Duplicate prevention check
      const approvedList = await institutions.getAll();
      const isDuplicate = (approvedList || []).some((inst: any) => 
        inst.name.toLowerCase() === form.institution_name.trim().toLowerCase() &&
        inst.city.toLowerCase() === form.city.trim().toLowerCase() &&
        inst.state.toLowerCase() === form.state.trim().toLowerCase()
      );

      if (isDuplicate) {
        setIsSubmitting(false);
        toast({
          title: 'Duplicate Institution Detected ⚠️',
          description: `An approved record for "${form.institution_name.trim()}" in ${form.city.trim()}, ${form.state} already exists in Academisthan's registry. Duplicate submissions are not allowed.`,
          variant: 'destructive'
        });
        return;
      }
      // 1. Upload the supporting document
      const uploadRes = await institutions.uploadDocument(docBase64, docFile.name);
      const documentUrl = uploadRes.documentUrl;

      // 1b. Upload logo if available
      let logoUrl = undefined;
      if (logoFile && logoBase64) {
        const logoUploadRes = await institutions.uploadDocument(logoBase64, logoFile.name);
        logoUrl = logoUploadRes.documentUrl;
      }

      // 2. Prepare payload
      const institutionData = {
        name: form.institution_name.trim(),
        type: form.institution_type,
        address: form.address.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
        country: form.country,
        pincode: form.pincode.trim(),
        contact_person: form.representative_name.trim(),
        contact_email: form.representative_email.trim(),
        contact_phone: `${form.institution_dial_code}${form.institution_phone.trim()}`,
        website: form.website.trim() || undefined,
        established_year: parseInt(form.established_year),
        accreditation: form.naac_grade,
        document_url: documentUrl,
        logo_url: logoUrl,
        description: form.description.trim() || undefined,
        student_count: form.student_count ? parseInt(form.student_count) : undefined,
        faculty_count: form.faculty_count ? parseInt(form.faculty_count) : undefined,
        representative_designation: form.representative_designation.trim()
      };

      await institutions.create(institutionData);
      
      setIsSubmitting(false);
      
      toast({ 
        title: 'Submitted Successfully! 🏛️', 
        description: 'Your institution registration has been submitted successfully and is awaiting admin approval.' 
      });
      navigate('/dashboard/institutions');
    } catch (error: any) {
      setIsSubmitting(false);
      toast({ 
        title: 'Registration failed', 
        description: error.message || 'Failed to register institution. Please try again.',
        variant: 'destructive' 
      });
    }
  };

  // States and Cities dynamic logic based on selected country
  const countryStates = stateCities[selectedCountry.name] || null;
  const statesList = countryStates ? Object.keys(countryStates).sort() : [];
  const filteredStates = statesList.filter(s => {
    if (stateSearch === form.state || !stateSearch) return true;
    return s.toLowerCase().includes(stateSearch.toLowerCase());
  });
  const availableCities = (countryStates && form.state) ? (countryStates[form.state] || []).sort() : [];

  const stepLabels = ['Representative Info', 'Institution Info', 'Supporting Documentation'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 website-page">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-24 pb-12 bg-gradient-to-b from-[#0F1E36] to-[#1D3557] overflow-hidden text-white">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #E5C158 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container mx-auto px-4 max-w-3xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-4 text-amber-300">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Institution Portal</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-3 text-amber-100">
            Register Your Institution
          </h1>
          <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
            Submit your university or college registration. Once verified and approved by the admin panel, your institution will be available to all fellows.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl pb-20 -mt-6 relative z-20">
        {!isFellow ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-800 mb-3">
              Fellow Account Required
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
              To request registering an educational institution, you must possess an active, verified Academisthan Fellow account.
            </p>
            <div className="space-y-3 max-w-sm mx-auto">
              <Link to="/auth/signup" className="block">
                <Button className="w-full bg-[#8B1538] hover:bg-[#720E2C] text-white rounded-xl gap-2 font-medium">
                  <User className="w-4 h-4" />
                  Become a Fellow
                </Button>
              </Link>
              <p className="text-xs text-slate-400">
                Already a Fellow? <Link to="/auth/signin" className="text-[#8B1538] font-semibold hover:underline">Sign In</Link> to proceed.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s < step ? 'bg-[#8B1538] text-white' :
                    s === step ? 'bg-amber-500 text-white shadow-lg' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={cn(
                    "text-xs ml-2 mr-3 hidden sm:inline font-medium",
                    s === step ? "text-slate-800 font-bold" : "text-slate-400"
                  )}>
                    {stepLabels[s - 1]}
                  </span>
                  {s < 3 && <div className="w-8 h-px bg-slate-200 mr-3 hidden sm:block" />}
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-md">
              {/* STEP 1: Representative Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-800">Representative Info</h2>
                      <p className="text-xs text-slate-500">Auto-filled from your Fellow profile credentials</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Full Name *</Label>
                      <Input 
                        value={form.representative_name} 
                        onChange={e => updateForm('representative_name', e.target.value)} 
                        onBlur={e => handleFieldBlur('representative_name', e.target.value)}
                        placeholder="Dr. Ravi Pal" 
                        className={cn("rounded-lg text-sm", errors.representative_name && "border-red-500")}
                        maxLength={100} 
                        required 
                      />
                      {errors.representative_name && (
                        <p className="text-[11px] text-red-500">{errors.representative_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Designation *</Label>
                      <Select 
                        value={
                          isOtherDesignation 
                            ? 'Other' 
                            : (REPRESENTATIVE_DESIGNATIONS.includes(form.representative_designation) 
                                ? form.representative_designation 
                                : (form.representative_designation ? 'Other' : ''))
                        } 
                        onValueChange={v => {
                          if (v === 'Other') {
                            setIsOtherDesignation(true);
                            updateForm('representative_designation', '');
                          } else {
                            setIsOtherDesignation(false);
                            updateForm('representative_designation', v);
                          }
                        }}
                      >
                        <SelectTrigger className={cn("rounded-lg text-sm", errors.representative_designation && "border-red-500")}>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          {REPRESENTATIVE_DESIGNATIONS.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(isOtherDesignation || (form.representative_designation && !REPRESENTATIVE_DESIGNATIONS.includes(form.representative_designation))) && (
                        <Input
                          value={form.representative_designation}
                          onChange={e => updateForm('representative_designation', e.target.value)}
                          onBlur={e => handleFieldBlur('representative_designation', e.target.value)}
                          placeholder="Enter designation"
                          className={cn("rounded-lg text-sm mt-2", errors.representative_designation && "border-red-500")}
                          maxLength={100}
                        />
                      )}
                      {errors.representative_designation && (
                        <p className="text-[11px] text-red-500">{errors.representative_designation}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Official Office Email *</Label>
                      <Input 
                        type="email" 
                        value={form.representative_email} 
                        onChange={e => updateForm('representative_email', e.target.value)} 
                        onBlur={e => handleFieldBlur('representative_email', e.target.value)}
                        placeholder="your-name@institutename.com" 
                        className={cn("rounded-lg text-sm", errors.representative_email && "border-red-500")}
                        maxLength={254} 
                        required 
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Please use your official institutional email address (e.g. your-name@institutename.com) for faster verification.
                      </p>
                      {errors.representative_email && (
                        <p className="text-[11px] text-red-500">{errors.representative_email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Mobile Number *</Label>
                      <div className="flex gap-1.5">
                        <Select
                          value={form.representative_dial_code}
                          onValueChange={(val) => updateForm('representative_dial_code', val)}
                        >
                          <SelectTrigger className="w-[95px] rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 text-sm">
                            {countries.map(c => (
                              <SelectItem key={c.code} value={c.dialCode}>{c.code} ({c.dialCode})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          value={form.representative_phone} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                            updateForm('representative_phone', val);
                          }}
                          onBlur={e => handleFieldBlur('representative_phone', e.target.value)}
                          placeholder="Phone number" 
                          className={cn("flex-1 rounded-lg text-sm", errors.representative_phone && "border-red-500")}
                          required 
                        />
                      </div>
                      {errors.representative_phone && (
                        <p className="text-[11px] text-red-500">{errors.representative_phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button 
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                      }} 
                      className="rounded-lg bg-[#8B1538] hover:bg-[#720E2C] text-white gap-2 font-medium text-sm h-10"
                    >
                      Next: Institution Details <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: Institution Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-800">Institution Information</h2>
                      <p className="text-xs text-slate-500">Provide official details of the institution</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Autocomplete Institution Name */}
                    <div className="sm:col-span-2 space-y-2 relative" ref={autocompleteRef}>
                      <Label className="text-sm font-medium text-slate-700">Institution Name *</Label>
                      <Input 
                        value={form.institution_name} 
                        onChange={e => handleNameChange(e.target.value)} 
                        onBlur={e => handleFieldBlur('institution_name', e.target.value)}
                        placeholder="Search or enter institution name" 
                        className={cn("rounded-lg text-sm", errors.institution_name && "border-red-500")}
                        maxLength={200} 
                        required 
                      />
                      {showAutocomplete && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 text-sm">
                          {autocompleteResults.map(name => (
                            <div
                              key={name}
                              onClick={() => {
                                updateForm('institution_name', name);
                                setShowAutocomplete(false);
                              }}
                              className="p-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 font-medium"
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.institution_name && (
                        <p className="text-[11px] text-red-500">{errors.institution_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Institution Type *</Label>
                      <Select value={form.institution_type} onValueChange={v => updateForm('institution_type', v)}>
                        <SelectTrigger className="rounded-lg text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="text-xs">
                          {INSTITUTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Affiliated University</Label>
                      <Input value={form.affiliated_university} onChange={e => updateForm('affiliated_university', e.target.value)} placeholder="e.g. University of Mumbai" className="rounded-lg text-sm" maxLength={200} />
                    </div>

                    {/* Institution Phone */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Institution Contact Number *</Label>
                      <div className="flex gap-1.5">
                        <Select
                          value={form.institution_dial_code}
                          onValueChange={(val) => updateForm('institution_dial_code', val)}
                        >
                          <SelectTrigger className="w-[95px] rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 text-sm">
                            {countries.map(c => (
                              <SelectItem key={c.code} value={c.dialCode}>{c.code} ({c.dialCode})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          value={form.institution_phone} 
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                            updateForm('institution_phone', val);
                          }}
                          onBlur={e => handleFieldBlur('institution_phone', e.target.value)}
                          placeholder="Contact number" 
                          className={cn("flex-1 rounded-lg text-sm", errors.institution_phone && "border-red-500")}
                          required 
                        />
                      </div>
                      {errors.institution_phone && (
                        <p className="text-[11px] text-red-500">{errors.institution_phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Established Year *</Label>
                      <Input 
                        type="number" 
                        value={form.established_year} 
                        onChange={e => updateForm('established_year', e.target.value)} 
                        onBlur={e => handleFieldBlur('established_year', e.target.value)}
                        placeholder="e.g. 1948" 
                        className={cn("rounded-lg text-sm", errors.established_year && "border-red-500")}
                        min={1800} 
                        max={new Date().getFullYear()} 
                      />
                      {errors.established_year && (
                        <p className="text-[11px] text-red-500">{errors.established_year}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Address</Label>
                      <Input value={form.address} onChange={e => updateForm('address', e.target.value)} placeholder="Full postal address" className="rounded-lg text-sm" maxLength={500} />
                    </div>

                    {/* Cascading Country Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Country *</Label>
                      <Popover open={countryDropdownOpen} onOpenChange={setCountryDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryDropdownOpen}
                            className="w-full justify-between rounded-lg font-normal border-slate-200 text-sm h-10 bg-white text-left pl-3"
                          >
                            <span>{form.country}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search country..." 
                              value={countrySearch}
                              onValueChange={setCountrySearch}
                            />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {countries
                                  .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                                  .map((c) => (
                                    <CommandItem
                                      key={c.code}
                                      value={c.name}
                                      onSelect={() => {
                                        setSelectedCountry(c);
                                        updateForm('country', c.name);
                                        updateForm('representative_dial_code', c.dialCode);
                                        updateForm('institution_dial_code', c.dialCode);
                                        setCountryDropdownOpen(false);
                                        setCountrySearch('');
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-[#8B1538]",
                                          form.country === c.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {c.name}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Cascading State Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">State *</Label>
                      {countryStates ? (
                        <Popover open={stateDropdownOpen} onOpenChange={setStateDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={stateDropdownOpen}
                              className={cn(
                                "w-full justify-between rounded-lg font-normal border-slate-200 text-sm h-10 bg-white text-left pl-3",
                                errors.state && "border-red-500"
                              )}
                            >
                              <span>{form.state || "Select state..."}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search state..." 
                                value={stateSearch}
                                onValueChange={setStateSearch}
                              />
                              <CommandList>
                                <CommandEmpty>No state found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredStates.map((s) => (
                                    <CommandItem
                                      key={s}
                                      value={s}
                                      onSelect={() => {
                                        updateForm('state', s);
                                        setStateDropdownOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-[#8B1538]",
                                          form.state === s ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {s}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input
                          value={form.state}
                          onChange={e => updateForm('state', e.target.value)}
                          placeholder="Enter state / province"
                          className="rounded-lg text-sm"
                        />
                      )}
                      {errors.state && <p className="text-[11px] text-red-500">{errors.state}</p>}
                    </div>

                    {/* Cascading City Dropdown */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">City *</Label>
                      {countryStates ? (
                        <Popover open={cityDropdownOpen} onOpenChange={setCityDropdownOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!form.state}
                              aria-expanded={cityDropdownOpen}
                              className={cn(
                                "w-full justify-between rounded-lg font-normal border-slate-200 text-sm h-10 bg-white text-left pl-3",
                                errors.city && "border-red-500"
                              )}
                            >
                              <span>{form.city || (form.state ? "Select city..." : "Select state first")}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search city..." 
                                value={citySearch}
                                onValueChange={setCitySearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="p-2 text-center text-sm">
                                    <p className="mb-2 text-muted-foreground">No matching city found.</p>
                                    {citySearch.trim() && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full rounded-md bg-[#8B1538] text-white hover:bg-[#720E2C]"
                                        onClick={() => {
                                          updateForm('city', citySearch.trim());
                                          setCityDropdownOpen(false);
                                        }}
                                      >
                                        Use "{citySearch}"
                                      </Button>
                                    )}
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {availableCities
                                    .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                                    .map((c) => (
                                      <CommandItem
                                        key={c}
                                        value={c}
                                        onSelect={() => {
                                          updateForm('city', c);
                                          setCityDropdownOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 text-[#8B1538]",
                                            form.city === c ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {c}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input
                          value={form.city}
                          onChange={e => updateForm('city', e.target.value)}
                          placeholder="Enter city"
                          className="rounded-lg text-sm"
                        />
                      )}
                      {errors.city && <p className="text-[11px] text-red-500">{errors.city}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Postal / Pin Code *</Label>
                      <Input 
                        value={form.pincode} 
                        onChange={e => updateForm('pincode', e.target.value.slice(0, 10))}
                        onBlur={e => handleFieldBlur('pincode', e.target.value)}
                        placeholder="e.g. 411007" 
                        className={cn("rounded-lg text-sm", errors.pincode && "border-red-500")}
                        maxLength={10} 
                      />
                      {errors.pincode && (
                        <p className="text-[11px] text-red-500">{errors.pincode}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Website</Label>
                      <Input value={form.website} onChange={e => updateForm('website', e.target.value)} placeholder="https://www.college.edu.in" className="rounded-lg text-sm" maxLength={300} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">NAAC Grade</Label>
                      <Select value={form.naac_grade} onValueChange={v => updateForm('naac_grade', v)}>
                        <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Select grade" /></SelectTrigger>
                        <SelectContent className="text-xs">
                          {NAAC_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">NIRF Rank</Label>
                      <Input 
                        type="number" 
                        value={form.nirf_rank} 
                        onChange={e => updateForm('nirf_rank', e.target.value)} 
                        placeholder="e.g. 45" 
                        className="rounded-lg text-sm" 
                        min={1} 
                        max={1000} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-lg text-sm h-10 gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => {
                        if (validateStep2()) setStep(3);
                      }} 
                      className="rounded-lg bg-[#8B1538] hover:bg-[#720E2C] text-white gap-2 font-medium text-sm h-10"
                    >
                      Next: Documentation <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Documentation & Showcase */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-800">Verification & Showcase</h2>
                      <p className="text-xs text-slate-500">Upload official verification documents</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* File Upload supporting document */}
                    <div className="sm:col-span-1 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        Supporting Verification Document * <span className="text-slate-400 font-normal">(Required)</span>
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col items-center justify-center text-center h-[200px]">
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <label className="cursor-pointer">
                          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors inline-block shadow-sm">
                            Choose File
                          </span>
                          <input 
                            type="file" 
                            accept=".pdf,.png,.jpg,.jpeg" 
                            onChange={handleDocumentChange} 
                            className="hidden" 
                          />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PDF, JPG, or PNG up to 5 MB.
                        </p>

                        {docFile && (
                          <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-[10px] text-slate-700 font-medium w-full">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{docFile.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setDocFile(null);
                                setDocBase64('');
                              }} 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md p-0.5 h-6 w-6"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {docError && (
                          <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {docError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Logo upload */}
                    <div className="sm:col-span-1 space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        Institution Logo <span className="text-slate-400 font-normal">(Optional)</span>
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col items-center justify-center text-center h-[200px]">
                        {logoFile ? (
                          <img src={logoBase64} alt="Preview" className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white mb-2" />
                        ) : (
                          <Building2 className="w-6 h-6 text-slate-400 mb-2" />
                        )}
                        <label className="cursor-pointer">
                          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors inline-block shadow-sm">
                            Choose Image
                          </span>
                          <input 
                            type="file" 
                            accept=".png,.jpg,.jpeg" 
                            onChange={handleLogoChange} 
                            className="hidden" 
                          />
                        </label>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PNG or JPG up to 2 MB.
                        </p>

                        {logoFile && (
                          <div className="mt-2 p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-[10px] text-slate-700 font-medium w-full">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate max-w-[120px]">{logoFile.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setLogoFile(null);
                                setLogoBase64('');
                              }} 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md p-0.5 h-6 w-6"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        {logoError && (
                          <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {logoError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Student Enrollment Count</Label>
                      <Input type="number" value={form.student_count} onChange={e => updateForm('student_count', e.target.value)} placeholder="e.g. 5000" className="rounded-lg text-sm" min={0} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Faculty Count</Label>
                      <Input type="number" value={form.faculty_count} onChange={e => updateForm('faculty_count', e.target.value)} placeholder="e.g. 250" className="rounded-lg text-sm" min={0} />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">About the Institution</Label>
                      <Textarea value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Brief description of your institution, its vision, and mission..." className="rounded-lg text-sm resize-none" rows={3} maxLength={2000} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Key Achievements</Label>
                      <Textarea value={form.achievements} onChange={e => updateForm('achievements', e.target.value)} placeholder="Awards, accreditations, notable achievements..." className="rounded-lg text-sm resize-none" rows={2} maxLength={2000} />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-lg text-sm h-10 gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#8B1538] hover:bg-[#720E2C] text-white gap-2 font-medium text-sm h-10 shadow-md"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          Submit Registration <Sparkles className="w-4 h-4 text-amber-300" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Benefits Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { icon: Shield, title: 'Unique Institution ID', desc: 'Auto-generates verified ID on approval' },
            { icon: Users, title: 'Link Fellows', desc: 'Allows other fellows to link to your institution' },
            { icon: Award, title: 'Showcase Credentials', desc: 'Publish verified rankings and statistics' },
          ].map((b) => (
            <div key={b.title} className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 text-amber-600">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-sm font-bold text-slate-800 mb-1">{b.title}</h3>
              <p className="text-xs text-slate-500 leading-normal">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
