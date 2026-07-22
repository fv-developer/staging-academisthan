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
  Plus, FileText, AlertCircle, Trash2, Video
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

const LEADERSHIP_CONFIGS: Record<string, Array<{ role: string; mandatoryHead?: boolean }>> = {
  college: [
    { role: 'Chairman / President' },
    { role: 'Principal', mandatoryHead: true },
    { role: 'Vice-Principal' }
  ],
  autonomous_college: [
    { role: 'Chairman, Governing Body / Board of Management' },
    { role: 'Principal', mandatoryHead: true },
    { role: 'Controller of Examinations (CoE)' },
    { role: 'Dean / Vice-Principal' }
  ],
  university: [
    { role: 'Visitor / Chancellor' },
    { role: 'Vice-Chancellor (VC)', mandatoryHead: true },
    { role: 'Dean of Faculties / Schools' }
  ],
  deemed_university: [
    { role: 'Chancellor' },
    { role: 'Vice-Chancellor (VC)', mandatoryHead: true },
    { role: 'Dean of Schools / Faculties' }
  ],
  private_institution: [
    { role: 'President / Chairman' },
    { role: 'Chancellor' },
    { role: 'Vice-Chancellor / Director General', mandatoryHead: true },
    { role: 'Dean & HoD' }
  ],
  k12_school: [
    { role: 'Chairman / President' },
    { role: 'Principal / Headmaster', mandatoryHead: true },
    { role: 'Vice-Principal' }
  ]
};

const NAAC_GRADES = ['A++', 'A+', 'A', 'B++', 'B+'];

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

type Step = 1 | 2 | 3 | 4;

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

  const [leadership, setLeadership] = useState<Array<{
    role: string;
    checked: boolean;
    salutation: string;
    fullName: string;
    designation: string;
    email: string;
    phone: string;
    phoneDialCode: string;
    linkedinUrl?: string;
    googleScholarUrl?: string;
  }>>([]);
  const [leadershipErrors, setLeadershipErrors] = useState<Record<string, Record<string, string>>>({});

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

  // Campus Tour Media states
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [campusVideoFile, setCampusVideoFile] = useState<File | null>(null);

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
    institute_code: '',
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
    naac_grade: 'A++',
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

  // Initialize/reset leadership state when institution_type changes
  useEffect(() => {
    const roles = LEADERSHIP_CONFIGS[form.institution_type] || LEADERSHIP_CONFIGS.college;
    setLeadership(roles.map(r => ({
      role: r.role,
      checked: false,
      salutation: 'Dr.',
      fullName: '',
      designation: r.role,
      email: '',
      phone: '',
      phoneDialCode: '+91',
      linkedinUrl: '',
      googleScholarUrl: ''
    })));
    setLeadershipErrors({});
  }, [form.institution_type]);

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
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setDocError('Only PDF, PNG, JPG, and WEBP formats are accepted.');
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoError('Only PNG, JPG, and WEBP formats are accepted for the logo.');
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
    if (key === 'address' && !value.trim()) {
      return 'Address details are required';
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
    const step2Fields = ['institution_name', 'institution_phone', 'established_year', 'pincode', 'address'];
    
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

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, Record<string, string>> = {};
    let hasError = false;

    // Check that at least one leadership profile is checked
    const checkedLeads = leadership.filter(l => l.checked);
    if (checkedLeads.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Kindly select at least one office holder from the leadership list and fill in their respective details.',
        variant: 'destructive'
      });
      return false;
    }

    // Validate details for all checked leadership members
    leadership.forEach((lead) => {
      if (!lead.checked) return;
      
      const leadErr: Record<string, string> = {};
      
      if (!lead.fullName || !lead.fullName.trim()) {
        leadErr.fullName = 'Full Name is required';
        hasError = true;
      }
      
      if (!lead.designation || !lead.designation.trim()) {
        leadErr.designation = 'Designation is required';
        hasError = true;
      }
      
      if (!lead.email || !lead.email.trim()) {
        leadErr.email = 'Email is required';
        hasError = true;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lead.email.trim())) {
          leadErr.email = 'Please enter a valid email address';
          hasError = true;
        } else if (isPublicEmailDomain(lead.email.trim())) {
          leadErr.email = 'Please use your official institutional email address (e.g. your-name@institutename.com).';
          hasError = true;
        }
      }
      
      if (!lead.phone || !lead.phone.trim()) {
        leadErr.phone = 'Phone number is required';
        hasError = true;
      } else {
        const countryObj = countries.find(c => c.dialCode === lead.phoneDialCode) || countries[0];
        const maxLength = getMaxPhoneLength(countryObj);
        const regex = new RegExp(countryObj.phoneRegex);
        if (lead.phone.length < 7 || lead.phone.length > maxLength || !regex.test(lead.phone)) {
          leadErr.phone = `Please enter a valid phone number for ${countryObj.name} (${countryObj.phonePlaceholder})`;
          hasError = true;
        }
      }

      if (lead.linkedinUrl && lead.linkedinUrl.trim()) {
        const linkedinPattern = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/.*$/i;
        if (!linkedinPattern.test(lead.linkedinUrl.trim())) {
          leadErr.linkedinUrl = 'Invalid LinkedIn URL';
          hasError = true;
        }
      }

      if (lead.googleScholarUrl && lead.googleScholarUrl.trim()) {
        const scholarPattern = /^(https?:\/\/)?(www\.)?scholar\.google\.(com|co\.[a-z]{2}|[a-z]{2,3})\/.*$/i;
        if (!scholarPattern.test(lead.googleScholarUrl.trim())) {
          leadErr.googleScholarUrl = 'Invalid Google Scholar URL';
          hasError = true;
        }
      }

      if (Object.keys(leadErr).length > 0) {
        newErrors[lead.role] = leadErr;
      }
    });

    setLeadershipErrors(newErrors);
    return !hasError;
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

    if (!logoFile) {
      setLogoError('Institute Logo is required.');
      toast({ title: 'Logo missing', description: 'Please upload an institute logo to submit.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      // 0. Duplicate prevention check (fellow-specific only)
      const res = await institutions.getMyRegistered();
      const myRegistered = Array.isArray(res) ? res : (res && (res as any).institutions ? (res as any).institutions : []);
      const isDuplicate = myRegistered.some((inst: any) => 
        inst.name.toLowerCase() === form.institution_name.trim().toLowerCase() &&
        inst.city.toLowerCase() === form.city.trim().toLowerCase() &&
        inst.state.toLowerCase() === form.state.trim().toLowerCase()
      );

      if (isDuplicate) {
        setIsSubmitting(false);
        toast({
          title: 'Duplicate Institution Detected ⚠️',
          description: 'You have already registered this institute.',
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

      // 1c. Upload Campus Gallery Images if available
      const galleryUrls: string[] = [];
      if (galleryFiles && galleryFiles.length > 0) {
        for (const file of galleryFiles) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = err => reject(err);
          });
          const galRes = await institutions.uploadDocument(base64, file.name);
          if (galRes.documentUrl) {
            galleryUrls.push(galRes.documentUrl);
          }
        }
      }

      // 1d. Upload Campus MP4 Video if available
      let campusVideoUrl: string | undefined = undefined;
      if (campusVideoFile) {
        const videoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(campusVideoFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = err => reject(err);
        });
        const vidRes = await institutions.uploadDocument(videoBase64, campusVideoFile.name);
        campusVideoUrl = vidRes.documentUrl;
      }

      // 1e. Prepare leadership profiles payload
      const checkedLeadership = leadership
        .filter(l => l.checked)
        .map(l => ({
          role: l.role,
          fullName: `${l.salutation} ${l.fullName.trim()}`,
          designation: l.role,
          email: l.email.trim(),
          phone: `${l.phoneDialCode}${l.phone.trim()}`,
          linkedinUrl: l.linkedinUrl ? l.linkedinUrl.trim() : undefined,
          googleScholarUrl: l.googleScholarUrl ? l.googleScholarUrl.trim() : undefined
        }));

      const institutionData = {
        name: form.institution_name.trim(),
        institute_code: form.institute_code.trim() || undefined,
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
        campus_gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
        campus_video_url: campusVideoUrl,
        youtube_url: form.youtube_url ? form.youtube_url.trim() : undefined,
        description: form.description.trim() || undefined,
        student_count: form.student_count ? parseInt(form.student_count) : undefined,
        faculty_count: form.faculty_count ? parseInt(form.faculty_count) : undefined,
        representative_designation: form.representative_designation.trim(),
        leadership: checkedLeadership
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

  const stepLabels = ['Representative Info', 'Institution Info', 'Leadership Details', 'Supporting Documentation'];

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
            <div className="w-full mb-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between max-w-xl mx-auto relative">
                {/* Background line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 -z-0" />
                <div 
                  className="absolute top-4 left-0 h-0.5 bg-[#8B1538] transition-all duration-300 -z-0" 
                  style={{ width: `${((step - 1) / 3) * 100}%` }} 
                />

                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex flex-col items-center relative z-10 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      s < step ? 'bg-[#8B1538] text-white' :
                      s === step ? 'bg-amber-500 text-white shadow-lg ring-4 ring-amber-500/10' :
                      'bg-white border-2 border-slate-200 text-slate-400'
                    }`}>
                      {s < step ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className={cn(
                      "text-xs mt-2 font-semibold text-center whitespace-nowrap",
                      s === step ? "text-slate-800 font-bold" : "text-slate-400"
                    )}>
                      {s === 1 ? 'Step 1: Rep Info' : s === 2 ? 'Step 2: Institute Info' : s === 3 ? 'Step 3: Leadership' : 'Step 4: Documents'}
                    </span>
                  </div>
                ))}
              </div>
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

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Official Email *</Label>
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
                        <Label className="text-sm font-medium text-slate-700">Representative Mobile Number *</Label>
                        <div className="flex gap-1.5">
                          <Select
                            value={countries.find(c => c.dialCode === form.representative_dial_code)?.code || 'IN'}
                            onValueChange={(val) => {
                              const country = countries.find(c => c.code === val);
                              if (country) {
                                updateForm('representative_dial_code', country.dialCode);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[95px] rounded-lg text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-48 text-sm">
                              {countries.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.code} ({c.dialCode})</SelectItem>
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
                      <Label className="text-sm font-medium text-slate-700">Institute Code</Label>
                      <Input 
                        value={form.institute_code} 
                        onChange={e => updateForm('institute_code', e.target.value)} 
                        placeholder="e.g. AISHE or Registration Code" 
                        className="rounded-lg text-sm"
                        maxLength={50} 
                      />
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
                          value={countries.find(c => c.dialCode === form.institution_dial_code)?.code || 'IN'}
                          onValueChange={(val) => {
                            const country = countries.find(c => c.code === val);
                            if (country) {
                              updateForm('institution_dial_code', country.dialCode);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[95px] rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 text-sm">
                            {countries.map(c => (
                              <SelectItem key={c.code} value={c.code}>{c.code} ({c.dialCode})</SelectItem>
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
                      <Label className="text-sm font-medium text-slate-700">Institute Address Details *</Label>
                      <Input 
                        value={form.address} 
                        onChange={e => updateForm('address', e.target.value)} 
                        onBlur={e => handleFieldBlur('address', e.target.value)}
                        placeholder="Full postal address" 
                        className={cn("rounded-lg text-sm", errors.address && "border-red-500")}
                        maxLength={500} 
                      />
                      {errors.address && (
                        <p className="text-[11px] text-red-500">{errors.address}</p>
                      )}
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
                      <Label className="text-sm font-medium text-slate-700">Accreditation Grade</Label>
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
                      Next: Leadership Details <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: Institution Leadership Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-[#8B1538]/10 flex items-center justify-center text-[#8B1538]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg font-bold text-slate-800">Institution Leadership Details</h2>
                      <p className="text-xs text-slate-500">Provide official contact details of key leadership figures</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200/50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-normal font-medium">
                      Kindly select at least one office holder from the leadership list and fill in their respective details.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {leadership.map((lead, idx) => {
                      const leadErrs = leadershipErrors[lead.role] || {};

                      return (
                        <div key={lead.role} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className={cn(
                            "flex items-center justify-between p-4 cursor-pointer transition-colors select-none",
                            lead.checked ? "bg-slate-50 border-b border-slate-100" : "hover:bg-slate-50/50"
                          )}
                            onClick={() => {
                              setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, checked: !l.checked } : l));
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={lead.checked}
                                readOnly
                                className="w-4 h-4 rounded border-slate-300 text-[#8B1538] focus:ring-[#8B1538]"
                              />
                              <div>
                                <span className="text-sm font-semibold text-slate-800">
                                  {lead.role}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400">
                              {lead.checked ? 'Click to collapse' : 'Click to expand'}
                            </span>
                          </div>

                          {lead.checked && (
                            <div className="p-5 bg-white space-y-4">
                              <div className="grid sm:grid-cols-2 gap-4">
                                {/* Full Name with Salutation */}
                                <div className="space-y-1.5 sm:col-span-2">
                                  <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                                  <div className="flex gap-2">
                                    <Select
                                      value={lead.salutation || 'Dr.'}
                                      onValueChange={(val) => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, salutation: val } : l))}
                                    >
                                      <SelectTrigger className="w-[85px] rounded-lg text-xs h-9 pl-2 pr-1 bg-white border-slate-200">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'].map(sal => (
                                          <SelectItem key={sal} value={sal} className="text-xs">{sal}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={lead.fullName}
                                      onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, fullName: e.target.value } : l))}
                                      placeholder="Enter full name"
                                      className={cn("flex-1 rounded-lg text-xs h-9", leadErrs.fullName && "border-red-500")}
                                      maxLength={150}
                                    />
                                  </div>
                                  {leadErrs.fullName && <p className="text-[10px] text-red-500">{leadErrs.fullName}</p>}
                                </div>

                                {/* Official Email */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Official Email ID *</Label>
                                  <Input
                                    type="email"
                                    value={lead.email}
                                    onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, email: e.target.value } : l))}
                                    placeholder="e.g. principal@college.edu.in"
                                    className={cn("rounded-lg text-xs h-9", leadErrs.email && "border-red-500")}
                                    maxLength={150}
                                  />
                                  {leadErrs.email && <p className="text-[10px] text-red-500">{leadErrs.email}</p>}
                                </div>

                                {/* Contact Number */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Official Contact Number *</Label>
                                  <div className="flex gap-1.5">
                                    <Select
                                      value={countries.find(c => c.dialCode === lead.phoneDialCode)?.code || 'IN'}
                                      onValueChange={(val) => {
                                        const country = countries.find(c => c.code === val);
                                        if (country) {
                                          setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, phoneDialCode: country.dialCode } : l));
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-[80px] rounded-lg text-xs h-9 pl-2 pr-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {countries.map(c => (
                                          <SelectItem key={c.code} value={c.code} className="text-xs">
                                            {c.dialCode} ({c.code})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={lead.phone}
                                      onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, phone: e.target.value.replace(/\D/g, '') } : l))}
                                      placeholder="Contact number"
                                      className={cn("flex-1 rounded-lg text-xs h-9", leadErrs.phone && "border-red-500")}
                                      maxLength={15}
                                    />
                                  </div>
                                  {leadErrs.phone && <p className="text-[10px] text-red-500">{leadErrs.phone}</p>}
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                {/* LinkedIn URL */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">LinkedIn Profile URL</Label>
                                  <Input
                                    value={lead.linkedinUrl || ''}
                                    onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, linkedinUrl: e.target.value } : l))}
                                    placeholder="https://linkedin.com/in/username"
                                    className={cn("rounded-lg text-xs h-9", leadErrs.linkedinUrl && "border-red-500")}
                                  />
                                  {leadErrs.linkedinUrl && <p className="text-[10px] text-red-500">{leadErrs.linkedinUrl}</p>}
                                </div>

                                {/* Google Scholar URL */}
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold text-slate-700">Google Scholar Profile URL</Label>
                                  <Input
                                    value={lead.googleScholarUrl || ''}
                                    onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, googleScholarUrl: e.target.value } : l))}
                                    placeholder="https://scholar.google.com/citations?user=..."
                                    className={cn("rounded-lg text-xs h-9", leadErrs.googleScholarUrl && "border-red-500")}
                                  />
                                  {leadErrs.googleScholarUrl && <p className="text-[10px] text-red-500">{leadErrs.googleScholarUrl}</p>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="rounded-lg text-sm h-10 gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => {
                        if (validateStep3()) setStep(4);
                      }} 
                      className="rounded-lg bg-[#8B1538] hover:bg-[#720E2C] text-white gap-2 font-medium text-sm h-10"
                    >
                      Next: Documentation <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Documentation & Showcase */}
              {step === 4 && (
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
                    {/* Verification Document Upload */}
                    <div className="sm:col-span-1 space-y-2">
                      <Label className="text-xs font-semibold text-slate-700">Verification Document (PDF/JPG/PNG) *</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('reg-doc-input')?.click()}
                          className="rounded-lg h-9 text-xs gap-1.5 bg-white border-slate-200 hover:bg-slate-50"
                        >
                          <Upload className="w-3.5 h-3.5" /> Select File
                        </Button>
                        <input
                          type="file"
                          id="reg-doc-input"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={handleDocumentChange}
                          className="hidden"
                        />
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {docFile ? docFile.name : 'No file selected'}
                        </span>
                        {docFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDocFile(null); setDocBase64(''); }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0 rounded-md"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {docError && <p className="text-[10px] text-red-500 mt-1">{docError}</p>}
                    </div>

                    {/* Logo Upload */}
                    <div className="sm:col-span-1 space-y-2">
                      <Label className="text-xs font-semibold text-slate-700">Institute Logo *</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('reg-logo-input')?.click()}
                          className="rounded-lg h-9 text-xs gap-1.5 bg-white border-slate-200 hover:bg-slate-50"
                        >
                          <Upload className="w-3.5 h-3.5" /> Select Logo
                        </Button>
                        <input
                          type="file"
                          id="reg-logo-input"
                          accept=".png,.jpg,.jpeg,.webp"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {logoFile ? logoFile.name : 'No logo selected'}
                        </span>
                        {logoFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setLogoFile(null); setLogoBase64(''); }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0 rounded-md"
                            title="Remove logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {logoError && <p className="text-[10px] text-red-500 mt-1">{logoError}</p>}
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

                    {/* Campus Tour / Institute Overview */}
                    <div className="sm:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#8B1538]" />
                        <h3 className="font-serif text-sm font-bold text-slate-800">Campus Tour / Institute Overview</h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        Upload media files to showcase your campus infrastructure and facilities.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Campus Gallery Images (JPG, PNG, WEBP — max 5MB)</Label>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('reg-gallery-input')?.click()}
                              className="rounded-lg h-9 text-xs gap-1.5 bg-white border-slate-200 hover:bg-slate-50"
                            >
                              <Upload className="w-3.5 h-3.5" /> Select Images
                            </Button>
                            <input
                              type="file"
                              id="reg-gallery-input"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  const newFiles: File[] = [];
                                  Array.from(e.target.files).forEach(file => {
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast({ title: 'Image too large', description: `${file.name} exceeds 5MB limit.`, variant: 'destructive' });
                                    } else {
                                      newFiles.push(file);
                                    }
                                  });
                                  setGalleryFiles(prev => [...prev, ...newFiles]);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-[11px] text-slate-500 truncate">
                              {galleryFiles.length > 0 ? `${galleryFiles.length} file(s) selected` : 'No images selected'}
                            </span>
                          </div>
                          {galleryFiles.length > 0 && (
                            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {galleryFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate max-w-[180px] text-[11px] font-medium text-slate-700">{file.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 shrink-0"
                                    title="Remove image"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">Campus MP4 Video (Max 25MB)</Label>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('reg-video-input')?.click()}
                              className="rounded-lg h-9 text-xs gap-1.5 bg-white border-slate-200 hover:bg-slate-50"
                            >
                              <Upload className="w-3.5 h-3.5" /> Select Video
                            </Button>
                            <input
                              type="file"
                              id="reg-video-input"
                              accept="video/mp4"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  if (!file.name.toLowerCase().endsWith('.mp4')) {
                                    toast({ title: 'Invalid video format', description: 'Only MP4 videos are supported.', variant: 'destructive' });
                                  } else if (file.size > 25 * 1024 * 1024) {
                                    toast({ title: 'Video too large', description: 'Video exceeds 25MB limit.', variant: 'destructive' });
                                  } else {
                                    setCampusVideoFile(file);
                                  }
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {campusVideoFile ? campusVideoFile.name : 'No video selected'}
                            </span>
                            {campusVideoFile && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCampusVideoFile(null)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 shrink-0 rounded-md"
                                title="Remove video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                          <Label className="text-xs font-medium text-slate-700">YouTube Video Link</Label>
                          <Input
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={form.youtube_url || ''}
                            onChange={e => updateForm('youtube_url', e.target.value)}
                            className="rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="rounded-lg text-sm h-10 gap-2">
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
