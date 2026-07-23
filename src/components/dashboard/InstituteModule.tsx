import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { institutions } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Building2, Mail, Phone, MapPin, Globe, Award,
  Upload, Check, Shield, AlertCircle, Edit3, ArrowLeft, ArrowRight, Loader2, Eye, ExternalLink, ChevronsUpDown, Calendar, Plus, Trash2, Video, Users
} from 'lucide-react';
import { countries, Country, stateCities, getMaxPhoneLength } from '@/utils/countryData';
import { cn, getBustUrl } from '@/lib/utils';

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

const ACCREDITATION_GRADES = [
  'A++',
  'A+',
  'A',
  'B++',
  'B+',
  'Not Accredited'
];

export default function InstituteModule() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myInstitutions, setMyInstitutions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingInst, setEditingInst] = useState<any>(null);
  const [viewingInst, setViewingInst] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isOtherDesignation, setIsOtherDesignation] = useState(false);

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

  // Form states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBase64, setDocBase64] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [campusVideoFile, setCampusVideoFile] = useState<File | null>(null);

  // Autocomplete search states
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Cascading Country/State/City Search lists
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'IN') || countries[0]
  );
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  const [stateSearch, setStateSearch] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const [citySearch, setCitySearch] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    institute_code: '',
    type: 'college',
    established_year: '',
    website: '',
    description: '',
    accreditation: 'Not Accredited',
    student_count: '',
    faculty_count: '',
    contact_person: '',
    contact_email: '',
    representative_phone: '',
    representative_dial_code: '+91',
    representative_designation: '',
    institution_phone: '',
    institution_dial_code: '+91',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const fetchMyInstitutions = async () => {
    setLoading(true);
    try {
      const res = await institutions.getMyRegistered();
      const list = Array.isArray(res) ? res : (res && (res as any).institutions ? (res as any).institutions : []);
      setMyInstitutions(list);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error loading institutions', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInstitutions();
  }, []);

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

  // Initialize/reset leadership state when institution type changes
  useEffect(() => {
    const rolesConfig = LEADERSHIP_CONFIGS[form.type] || LEADERSHIP_CONFIGS.college;

    if (editingInst && editingInst.leadership && editingInst.leadership.length > 0) {
      setLeadership(rolesConfig.map(config => {
        const savedLead = editingInst.leadership.find((l: any) => l.role === config.role);
        if (savedLead) {
          // Parse dial code and phone number if merged
          let phoneDialCode = '+91';
          let phone = savedLead.phone || '';
          const matchedCountry = countries.find(c => phone.startsWith(c.dialCode));
          if (matchedCountry) {
            phoneDialCode = matchedCountry.dialCode;
            phone = phone.substring(matchedCountry.dialCode.length);
          }

          // Parse salutation if merged
          let salutation = 'Dr.';
          let fullName = savedLead.full_name || '';
          const salutations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
          const matchedSal = salutations.find(s => fullName.startsWith(s + ' '));
          if (matchedSal) {
            salutation = matchedSal;
            fullName = fullName.substring(matchedSal.length + 1);
          }

          return {
            role: config.role,
            checked: true,
            salutation,
            fullName: fullName,
            designation: savedLead.designation || config.role,
            email: savedLead.email || '',
            phone: phone,
            phoneDialCode: phoneDialCode,
            linkedinUrl: savedLead.linkedin_url || '',
            googleScholarUrl: savedLead.google_scholar_url || ''
          };
        } else {
          return {
            role: config.role,
            checked: false,
            salutation: 'Dr.',
            fullName: '',
            designation: config.role,
            email: '',
            phone: '',
            phoneDialCode: '+91',
            linkedinUrl: '',
            googleScholarUrl: ''
          };
        }
      }));
    } else {
      setLeadership(rolesConfig.map(r => ({
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
    }
    setLeadershipErrors({});
  }, [form.type, editingInst?.id, editingInst?.leadership]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File size limit exceeded', description: 'File must be under 5MB', variant: 'destructive' });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === 'doc') {
        setDocFile(file);
        setDocBase64(base64);
      } else {
        setLogoFile(file);
        setLogoBase64(base64);
      }
    } catch (err) {
      console.error('Error reading file:', err);
    }
  };

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

  const validateField = (key: string, value: string): string => {
    if (key === 'contact_person' && !value.trim()) {
      return 'Representative name is required';
    }
    if (key === 'representative_designation' && !value.trim()) {
      return 'Designation is required';
    }
    if (key === 'contact_email') {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      
      const domain = value.split('@')[1]?.toLowerCase();
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'zoho.com', 'protonmail.com', 'icloud.com'];
      if (domain && publicDomains.includes(domain)) {
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
    if (key === 'name' && !value.trim()) {
      return 'Institution name is required';
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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const step1Fields = ['contact_person', 'representative_designation', 'contact_email', 'representative_phone'];
    step1Fields.forEach(f => {
      const err = validateField(f === 'contact_email' ? 'contact_email' : f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const step2Fields = ['name', 'institution_phone', 'established_year', 'pincode'];
    step2Fields.forEach(f => {
      const err = validateField(f, form[f as keyof typeof form]);
      if (err) newErrors[f] = err;
    });

    if (!form.state) newErrors.state = 'State is required';
    if (!form.city) newErrors.city = 'City is required';

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

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    if (!editingInst && !docFile) {
      newErrors.document = 'Supporting verification document is required';
    }
    if (!editingInst && !logoFile) {
      newErrors.logo = 'Institute Logo is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = async (val: string) => {
    updateForm('name', val);
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

  const startEditing = (inst?: any) => {
    setErrors({});
    setDocFile(null);
    setDocBase64('');
    setLogoFile(null);
    setLogoBase64('');
    setStep(1);

    if (inst) {
      setEditingInst(inst);
      institutions.getById(inst.id).then(detailed => {
        setEditingInst(detailed);
      }).catch(err => {
        console.error('Failed to fetch detailed institution for edit:', err);
      });
      
      const activeCountry = countries.find(c => c.name === (inst.country || 'India')) || countries.find(c => c.code === 'IN') || countries[0];
      setSelectedCountry(activeCountry);
      
      // Parse representative phone
      let repCleanPhone = profile?.phone || '';
      let repDialCode = '+91';
      const repActiveCountry = countries.find(c => c.name === (profile?.country || 'India')) || countries[0];
      if (repCleanPhone.startsWith(repActiveCountry.dialCode)) {
        repDialCode = repActiveCountry.dialCode;
        repCleanPhone = repCleanPhone.substring(repActiveCountry.dialCode.length);
      } else {
        const matchedCountry = countries.find(c => repCleanPhone.startsWith(c.dialCode));
        if (matchedCountry) {
          repDialCode = matchedCountry.dialCode;
          repCleanPhone = repCleanPhone.substring(matchedCountry.dialCode.length);
        }
      }
      repCleanPhone = repCleanPhone.replace(/\D/g, '');

      // Parse institution contact phone
      let instCleanPhone = inst.contact_phone || '';
      let instDialCode = '+91';
      if (instCleanPhone.startsWith(activeCountry.dialCode)) {
        instDialCode = activeCountry.dialCode;
        instCleanPhone = instCleanPhone.substring(activeCountry.dialCode.length);
      } else {
        const matchedCountry = countries.find(c => instCleanPhone.startsWith(c.dialCode));
        if (matchedCountry) {
          instDialCode = matchedCountry.dialCode;
          instCleanPhone = instCleanPhone.substring(matchedCountry.dialCode.length);
        }
      }
      instCleanPhone = instCleanPhone.replace(/\D/g, '');

      setStateSearch(inst.state || '');
      setCitySearch(inst.city || '');

      setForm({
        name: inst.name || '',
        institute_code: inst.institute_code || '',
        type: inst.type || 'college',
        established_year: inst.established_year ? String(inst.established_year) : '',
        website: inst.website || '',
        description: inst.description || '',
        accreditation: inst.accreditation || 'Not Accredited',
        student_count: inst.student_count ? String(inst.student_count) : '',
        faculty_count: inst.faculty_count ? String(inst.faculty_count) : '',
        contact_person: inst.contact_person || profile?.full_name || '',
        contact_email: inst.contact_email || profile?.work_email || profile?.email || '',
        representative_phone: repCleanPhone,
        representative_dial_code: repDialCode,
        representative_designation: inst.representative_designation || profile?.designation || '',
        institution_phone: instCleanPhone,
        institution_dial_code: instDialCode,
        address: inst.address || '',
        city: inst.city || '',
        state: inst.state || '',
        pincode: inst.pincode || '',
        country: inst.country || 'India',
      });

      if (inst.representative_designation && !REPRESENTATIVE_DESIGNATIONS.includes(inst.representative_designation)) {
        setIsOtherDesignation(true);
      } else if (profile?.designation && !REPRESENTATIVE_DESIGNATIONS.includes(profile.designation)) {
        setIsOtherDesignation(true);
      } else {
        setIsOtherDesignation(false);
      }
    } else {
      setEditingInst(null);
      
      const activeCountry = countries.find(c => c.name === (profile?.country || 'India')) || countries.find(c => c.code === 'IN') || countries[0];
      setSelectedCountry(activeCountry);

      let cleanPhone = profile?.phone || '';
      if (cleanPhone.startsWith(activeCountry.dialCode)) {
        cleanPhone = cleanPhone.substring(activeCountry.dialCode.length);
      } else {
        const matchedCountry = countries.find(c => cleanPhone.startsWith(c.dialCode));
        if (matchedCountry) {
          cleanPhone = cleanPhone.substring(matchedCountry.dialCode.length);
        }
      }
      cleanPhone = cleanPhone.replace(/\D/g, '');

      setForm({
        name: '',
        institute_code: '',
        type: 'college',
        established_year: '',
        website: '',
        description: '',
        accreditation: 'Not Accredited',
        student_count: '',
        faculty_count: '',
        contact_person: profile?.full_name || '',
        contact_email: profile?.work_email || profile?.email || '',
        representative_phone: cleanPhone,
        representative_dial_code: activeCountry.dialCode,
        representative_designation: profile?.designation || '',
        institution_phone: '',
        institution_dial_code: activeCountry.dialCode,
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: activeCountry.name,
      });

      if (profile?.designation && !REPRESENTATIVE_DESIGNATIONS.includes(profile.designation)) {
        setIsOtherDesignation(true);
      } else {
        setIsOtherDesignation(false);
      }
    }
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      toast({ title: 'Validation failed', description: 'Please check the highlighted errors across all sections.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 0. Duplicate prevention check for new registrations (fellow-specific only)
      if (!editingInst) {
        const isDuplicate = (myInstitutions || []).some((inst: any) => 
          inst.name.toLowerCase() === form.name.trim().toLowerCase() &&
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
      }

      // Check if editing and protected fields were changed on an approved institution
      let protectedChanged = false;
      if (editingInst && editingInst.status === 'approved') {
        const originalName = editingInst.name || '';
        const originalCountry = editingInst.country || '';
        const originalState = editingInst.state || '';
        const originalCity = editingInst.city || '';
        const originalEst = editingInst.established_year ? String(editingInst.established_year) : '';

        if (
          form.name.trim().toLowerCase() !== originalName.toLowerCase() ||
          form.country.toLowerCase() !== originalCountry.toLowerCase() ||
          form.state.toLowerCase() !== originalState.toLowerCase() ||
          form.city.toLowerCase() !== originalCity.toLowerCase() ||
          form.established_year !== originalEst
        ) {
          protectedChanged = true;
        }
      }

      let documentUrl = editingInst?.document_url || '';
      let logoUrl = editingInst?.logo_url || '';

      if (docFile && docBase64) {
        const docRes = await institutions.uploadDocument(docBase64, docFile.name);
        documentUrl = docRes.documentUrl;
      }

      if (logoFile && logoBase64) {
        const logoRes = await institutions.uploadDocument(logoBase64, logoFile.name);
        logoUrl = logoRes.documentUrl;
      }

      // Existing gallery URLs from editingInst
      let existingGallery: string[] = [];
      if (editingInst?.campus_gallery) {
        if (Array.isArray(editingInst.campus_gallery)) {
          existingGallery = editingInst.campus_gallery;
        } else if (typeof editingInst.campus_gallery === 'string') {
          try {
            existingGallery = JSON.parse(editingInst.campus_gallery);
          } catch (e) {
            existingGallery = editingInst.campus_gallery.split(',').filter(Boolean);
          }
        }
      }

      // Upload new gallery files
      const newGalleryUrls: string[] = [];
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
            newGalleryUrls.push(galRes.documentUrl);
          }
        }
      }
      const combinedGallery = [...existingGallery, ...newGalleryUrls];

      // Upload campus video file
      let campusVideoUrl = editingInst?.campus_video_url || null;
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

      // Prepare checked leadership profiles
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

      const payload = {
        name: form.name.trim(),
        institute_code: form.institute_code.trim() || null,
        type: form.type,
        established_year: form.established_year ? parseInt(form.established_year) : null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        accreditation: form.accreditation,
        student_count: form.student_count ? parseInt(form.student_count) : null,
        faculty_count: form.faculty_count ? parseInt(form.faculty_count) : null,
        contact_person: form.contact_person.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: `${form.institution_dial_code}${form.institution_phone.trim()}`,
        address: form.address.trim() || null,
        city: form.city.trim(),
        state: form.state,
        country: form.country,
        pincode: form.pincode.trim(),
        document_url: documentUrl,
        logo_url: logoUrl,
        campus_gallery: combinedGallery.length > 0 ? combinedGallery : null,
        campus_video_url: campusVideoUrl,
        youtube_url: form.youtube_url ? form.youtube_url.trim() : null,
        representative_designation: form.representative_designation.trim(),
        leadership: checkedLeadership
      };

      if (editingInst) {
        await institutions.update(editingInst.id, payload);
        if (protectedChanged) {
          toast({
            title: 'Change Request Submitted! 📝',
            description: 'Your changes to protected fields (Name, Location, Est.) have been submitted to the Admin for approval. The original values remain active until reviewed.',
          });
        } else {
          toast({ title: 'Details updated successfully ✨', description: 'Your institutional updates are saved.' });
        }
      } else {
        await institutions.create(payload);
        toast({ title: 'Institution registered successfully! 🏛️', description: 'Your submission is now awaiting admin review.' });
      }

      setIsEditing(false);
      setEditingInst(null);
      setStep(1);
      await fetchMyInstitutions();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInst = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the registration for "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await institutions.delete(id);
      toast({ title: 'Institution deleted successfully' });
      await fetchMyInstitutions();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Failed to delete institution', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm font-medium">Fetching registered institutions...</p>
      </div>
    );
  }

  // ─── READ-ONLY DETAILS MODAL ───
  const statusColors: Record<string, string> = {
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    suspended: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending_change_approval: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  const statusLabels: Record<string, string> = {
    approved: 'Approved',
    pending: 'Pending Review',
    suspended: 'Suspended',
    pending_change_approval: 'Pending Change Approval',
    rejected: 'Rejected',
  };

  const getInstitutionTypeLabel = (val: string) => {
    return INSTITUTION_TYPES.find(t => t.value === val)?.label || val;
  };

  // ─── LIST VIEW: SHOW DATA TABLE ───
  if (!isEditing) {
    return (
      <div className="p-5 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Registered Institutions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and track your registered educational institutions.</p>
          </div>
          <Button onClick={() => startEditing()} className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-1.5 h-9 text-xs">
            <Plus className="w-4 h-4" /> Register Institution
          </Button>
        </div>

        {myInstitutions.filter(inst => inst.status === 'rejected').map(inst => (
          <div key={inst.id} className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex gap-3 text-rose-500 text-xs animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-[13px]">Registration Rejected: {inst.name}</h4>
              <p className="text-rose-500/80 leading-relaxed">
                <strong>Reason:</strong> {inst.rejection_reason || 'No reason provided.'}
              </p>
              <button 
                onClick={() => startEditing(inst)}
                className="mt-2 text-rose-600 font-bold hover:underline flex items-center gap-1.5 text-[11px]"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit & Resubmit Application →
              </button>
            </div>
          </div>
        ))}

        {myInstitutions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-2xl space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto text-gold">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">No Registered Institutions</h4>
              <p className="text-xs text-muted-foreground px-4 leading-relaxed">
                Connect your college or university to Academisthan's directory to access certified academic programs and teacher self-assessments.
              </p>
            </div>
            <Button onClick={() => startEditing()} variant="outline" className="rounded-xl h-8 border-gold/20 text-gold hover:bg-gold/10 hover:text-gold text-xs">
              Register Your Institution
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Institution Name</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Submission Date</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Office Email</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Contact Number</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Location</TableHead>
                    <TableHead className="text-xs font-bold whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-xs font-bold text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myInstitutions.map((inst) => (
                    <TableRow key={inst.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium text-xs max-w-[200px] truncate">{inst.name}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {inst.created_at ? new Date(inst.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap capitalize">{inst.type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{inst.contact_email}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{inst.contact_phone}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{inst.city}, {inst.state}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${statusColors[inst.status] || 'bg-muted text-muted-foreground'}`}>
                          {statusLabels[inst.status] || inst.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Button onClick={() => setViewingInst(inst)} size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {inst.status === 'rejected' ? (
                            <Button onClick={() => startEditing(inst)} size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-gold hover:text-gold hover:bg-gold/10" title="Edit and Resubmit">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button disabled size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground/30 cursor-not-allowed" title="Editing is disabled for active or pending reviews">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleDeleteInst(inst.id, inst.name)} 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" 
                            title="Delete institution"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* View Details Dialog */}
        {viewingInst && (
          <Dialog open={!!viewingInst} onOpenChange={(open) => !open && setViewingInst(null)}>
            <DialogContent className="max-w-2xl rounded-2xl border border-border p-6 shadow-xl">
              <DialogHeader className="border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  {viewingInst.logo_url ? (
                    <img src={getBustUrl(viewingInst.logo_url)} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                  )}
                  <div className="text-left">
                    <DialogTitle className="font-serif text-base font-bold text-foreground leading-tight">{viewingInst.name}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground capitalize mt-0.5">
                      {getInstitutionTypeLabel(viewingInst.type)} · Estd: {viewingInst.established_year || 'N/A'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {viewingInst.status === 'pending' && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 text-amber-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold uppercase tracking-wider text-[10px]">Awaiting Verification</h4>
                    <p className="text-amber-500/80 leading-normal">
                      Academisthan is currently reviewing your registration document. Once approved, your institution membership will be fully activated.
                    </p>
                  </div>
                </div>
              )}

              {viewingInst.status === 'pending_change_approval' && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 flex gap-2.5 text-indigo-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold uppercase tracking-wider text-[10px]">Pending Change Approval</h4>
                    <p className="text-indigo-500/80 leading-normal">
                      Your changes to protected fields are awaiting admin review. The current approved details remain active publicly.
                    </p>
                  </div>
                </div>
              )}

              {(viewingInst.status === 'rejected' || viewingInst.rejection_reason) && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex gap-2.5 text-rose-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold uppercase tracking-wider text-[10px]">Registration Rejected</h4>
                    <p className="text-rose-500/80 leading-normal">
                      Reason: {viewingInst.rejection_reason || 'No reason provided.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-5 text-xs mt-2 leading-relaxed">
                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block font-medium">Location Details</span>
                    <p className="text-foreground mt-0.5 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{viewingInst.address ? `${viewingInst.address}, ` : ''}{viewingInst.city}, {viewingInst.state} - {viewingInst.pincode}, {viewingInst.country}</span>
                    </p>
                  </div>
                  {viewingInst.website && (
                    <div>
                      <span className="text-muted-foreground block font-medium">Official Website</span>
                      <a href={viewingInst.website.startsWith('http') ? viewingInst.website : `https://${viewingInst.website}`} target="_blank" rel="noreferrer" className="text-gold hover:underline mt-0.5 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 shrink-0" /> {viewingInst.website}
                      </a>
                    </div>
                  )}
                  {viewingInst.accreditation && (
                    <div>
                      <span className="text-muted-foreground block font-medium">Accreditation</span>
                      <p className="text-foreground mt-0.5 font-semibold">{viewingInst.accreditation}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block font-semibold">Stats & Details</span>
                    <div className="grid grid-cols-2 gap-2 mt-1 bg-muted/20 border border-border/50 rounded-xl p-2.5">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Students</span>
                        <p className="font-bold text-foreground">{viewingInst.student_count || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Faculty</span>
                        <p className="font-bold text-foreground">{viewingInst.faculty_count || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-muted/30 border border-border/40 rounded-2xl p-4">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5 mb-2">Representative Contact</h4>
                  <div>
                    <span className="text-muted-foreground block font-medium">Contact Person</span>
                    <p className="text-foreground font-semibold mt-0.5">{viewingInst.contact_person || 'N/A'}</p>
                  </div>
                  {viewingInst.representative_designation && (
                    <div>
                      <span className="text-muted-foreground block font-medium">Designation</span>
                      <p className="text-foreground mt-0.5">{viewingInst.representative_designation}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground block font-medium">Office Email</span>
                    <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {viewingInst.contact_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Contact Number</span>
                    <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {viewingInst.contact_phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {viewingInst.description && (
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-muted-foreground block font-medium">About / Description</span>
                    <p className="text-foreground bg-muted/10 border border-border/30 rounded-xl p-3 max-h-24 overflow-y-auto whitespace-pre-wrap">{viewingInst.description}</p>
                  </div>
                )}

                {viewingInst.document_url && (
                  <div className="sm:col-span-2 pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-medium">Submitted Verification Document</span>
                    <a href={getBustUrl(viewingInst.document_url)} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="rounded-xl h-8 gap-1 text-xs text-gold border-gold/25 hover:bg-gold/15">
                        <ExternalLink className="w-3.5 h-3.5" /> View Document File
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ─── REGISTRATION & EDIT WIZARD FORM ───
  const countryStates = stateCities[selectedCountry.name] || null;
  const statesList = countryStates ? Object.keys(countryStates).sort() : [];
  const filteredStates = statesList.filter(s => {
    if (stateSearch === form.state || !stateSearch) return true;
    return s.toLowerCase().includes(stateSearch.toLowerCase());
  });
  const availableCities = (countryStates && form.state) ? (countryStates[form.state] || []).sort() : [];
  const filteredCities = availableCities.filter(c => {
    if (citySearch === form.city || !citySearch) return true;
    return c.toLowerCase().includes(citySearch.toLowerCase());
  });

  return (
    <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            {editingInst ? 'Edit Institute Details' : 'Register Your Institution'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {editingInst ? 'Update your institutional profile information.' : 'Connect your college or university to Academisthan.'}
          </p>
        </div>
        <Button type="button" onClick={() => { setIsEditing(false); setEditingInst(null); }} variant="ghost" size="sm" className="rounded-xl h-8 gap-1 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to list
        </Button>
      </div>

      {editingInst && editingInst.status === 'approved' && (
        <div className="bg-indigo-500/5 border border-indigo-500/25 rounded-2xl p-4 flex gap-3 text-indigo-500 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-[10px]">Important Editing Notice</h4>
            <p className="leading-relaxed text-indigo-500/80">
              Modifying protected fields (Institution Name, Country, State, City, or Established Year) will put this institution back to **"Pending Change Approval"** for Admin review. Original details will remain active publicly until the changes are approved.
            </p>
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between gap-1 mb-6 bg-muted/40 border border-border/60 rounded-xl p-3">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1.5 flex-1 justify-center sm:last:flex-none">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
              s < step ? 'bg-emerald-600 text-white' :
              s === step ? 'bg-gold text-gold-foreground shadow-sm' :
              'bg-muted-foreground/10 text-muted-foreground'
            }`}>
              {s < step ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline truncate ${
              s === step ? 'text-foreground font-bold' : 'text-muted-foreground'
            }`}>
              {s === 1 ? 'Representative' : s === 2 ? 'Institution' : s === 3 ? 'Leadership' : 'Showcase & Docs'}
            </span>
            {s < 4 && <div className="h-px bg-border flex-1 mx-2 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Representative Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Representative Name *</Label>
              <Input
                value={form.contact_person}
                onChange={e => updateForm('contact_person', e.target.value)}
                onBlur={e => handleFieldBlur('contact_person', e.target.value)}
                placeholder="Prof. Ravi Sharma"
                className={cn("rounded-xl h-9 text-xs", errors.contact_person && "border-red-500")}
              />
              {errors.contact_person && <span className="text-[10px] text-red-500">{errors.contact_person}</span>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Representative Designation *</Label>
              <Select
                value={
                  isOtherDesignation 
                    ? 'Other' 
                    : (REPRESENTATIVE_DESIGNATIONS.includes(form.representative_designation) 
                        ? form.representative_designation 
                        : (form.representative_designation ? 'Other' : ''))
                }
                onValueChange={val => {
                  if (val === 'Other') {
                    setIsOtherDesignation(true);
                    updateForm('representative_designation', '');
                  } else {
                    setIsOtherDesignation(false);
                    updateForm('representative_designation', val);
                  }
                }}
              >
                <SelectTrigger className={cn("rounded-xl h-9 text-xs", errors.representative_designation && "border-red-500")}>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {REPRESENTATIVE_DESIGNATIONS.map(d => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOtherDesignation && (
                <Input
                  value={form.representative_designation}
                  onChange={e => updateForm('representative_designation', e.target.value)}
                  onBlur={e => handleFieldBlur('representative_designation', e.target.value)}
                  placeholder="Enter custom designation"
                  className="rounded-xl h-9 text-xs mt-2"
                />
              )}
              {errors.representative_designation && <span className="text-[10px] text-red-500">{errors.representative_designation}</span>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Official Email *</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={e => updateForm('contact_email', e.target.value)}
                onBlur={e => handleFieldBlur('contact_email', e.target.value)}
                placeholder="your-name@institutename.com"
                className={cn("rounded-xl h-9 text-xs", errors.contact_email && "border-red-500")}
              />
              <span className="text-[10px] text-slate-400 block leading-normal">
                Please use your official institutional email address (e.g. your-name@institutename.com) for faster verification.
              </span>
              {errors.contact_email && <span className="text-[10px] text-red-500 block">{errors.contact_email}</span>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Representative Mobile Number *</Label>
              <div className="flex gap-1.5">
                <Select
                  value={countries.find(c => c.dialCode === form.representative_dial_code)?.code || 'IN'}
                  onValueChange={(val) => {
                    const found = countries.find(c => c.code === val);
                    if (found) {
                      updateForm('representative_dial_code', found.dialCode);
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px] rounded-xl h-9 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">{c.code} ({c.dialCode})</SelectItem>
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
                  className={cn("rounded-xl h-9 text-xs flex-1", errors.representative_phone && "border-red-500")}
                />
              </div>
              {errors.representative_phone && <span className="text-[10px] text-red-500">{errors.representative_phone}</span>}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-4 text-xs gap-1.5"
            >
              Next: Institution Details <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Institution Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Autocomplete Institution Name */}
            <div className="sm:col-span-2 space-y-1.5 relative" ref={autocompleteRef}>
              <Label className="text-xs">Institution Name *</Label>
              <Input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={e => handleFieldBlur('name', e.target.value)}
                placeholder="Search or enter institution name"
                className={cn("rounded-xl h-9 text-xs", errors.name && "border-red-500")}
              />
              {showAutocomplete && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 text-xs text-popover-foreground">
                  {autocompleteResults.map(name => (
                    <div
                      key={name}
                      onClick={() => {
                        updateForm('name', name);
                        setShowAutocomplete(false);
                      }}
                      className="p-2 hover:bg-muted cursor-pointer font-medium"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}
              {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Institute Code</Label>
              <Input
                value={form.institute_code}
                onChange={e => updateForm('institute_code', e.target.value)}
                placeholder="e.g. AISHE or Registration Code"
                className="rounded-xl h-9 text-xs"
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Institution Type *</Label>
              <Select
                value={form.type}
                onValueChange={val => updateForm('type', val)}
              >
                <SelectTrigger className="rounded-xl h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Established Year *</Label>
              <Input
                type="number"
                value={form.established_year}
                onChange={e => updateForm('established_year', e.target.value)}
                onBlur={e => handleFieldBlur('established_year', e.target.value)}
                placeholder="1995"
                className={cn("rounded-xl h-9 text-xs", errors.established_year && "border-red-500")}
              />
              {errors.established_year && <span className="text-[10px] text-red-500">{errors.established_year}</span>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Website URL</Label>
              <Input
                value={form.website}
                onChange={e => updateForm('website', e.target.value)}
                placeholder="www.university.edu.in"
                className="rounded-xl h-9 text-xs"
              />
            </div>

            {/* Institution Contact Phone */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Institution Contact Number *</Label>
              <div className="flex gap-1.5">
                <Select
                  value={countries.find(c => c.dialCode === form.institution_dial_code)?.code || 'IN'}
                  onValueChange={(val) => {
                    const found = countries.find(c => c.code === val);
                    if (found) {
                      updateForm('institution_dial_code', found.dialCode);
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px] rounded-xl h-9 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">{c.code} ({c.dialCode})</SelectItem>
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
                  className={cn("rounded-xl h-9 text-xs flex-1", errors.institution_phone && "border-red-500")}
                />
              </div>
              {errors.institution_phone && <span className="text-[10px] text-red-500">{errors.institution_phone}</span>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Address Details *</Label>
              <Input
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder="Main Campus, National Highway 4"
                className="rounded-xl h-9 text-xs"
              />
            </div>

            {/* Cascading Country / State / City selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Country *</Label>
              <Popover open={countryDropdownOpen} onOpenChange={setCountryDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between rounded-xl h-9 text-xs bg-transparent border-input pl-3"
                  >
                    <span>{form.country}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search country..." 
                      value={countrySearch}
                      onValueChange={setCountrySearch}
                      className="h-8 text-xs"
                    />
                    <CommandList className="max-h-48 text-xs">
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries
                          .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                          .map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.name}
                              onSelect={() => {
                                updateForm('country', country.name);
                                setSelectedCountry(country);
                                setCountryDropdownOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5",
                                  form.country === country.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {country.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">State *</Label>
              {countryStates ? (
                <Popover open={stateDropdownOpen} onOpenChange={setStateDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between rounded-xl h-9 text-xs bg-transparent border-input pl-3"
                    >
                      <span>{form.state || 'Select State'}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search state..." 
                        value={stateSearch}
                        onValueChange={setStateSearch}
                        className="h-8 text-xs"
                      />
                      <CommandList className="max-h-48 text-xs">
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          {filteredStates.map((st) => (
                            <CommandItem
                              key={st}
                              value={st}
                              onSelect={() => {
                                updateForm('state', st);
                                setStateDropdownOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5",
                                  form.state === st ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {st}
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
                  placeholder="State name"
                  className="rounded-xl h-9 text-xs"
                />
              )}
              {errors.state && <span className="text-[10px] text-red-500">{errors.state}</span>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">City *</Label>
              {countryStates && form.state ? (
                <Popover open={cityDropdownOpen} onOpenChange={setCityDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between rounded-xl h-9 text-xs bg-transparent border-input pl-3"
                    >
                      <span>{form.city || 'Select City'}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search city..." 
                        value={citySearch}
                        onValueChange={setCitySearch}
                        className="h-8 text-xs"
                      />
                      <CommandList className="max-h-48 text-xs">
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCities.map((ct) => (
                            <CommandItem
                              key={ct}
                              value={ct}
                              onSelect={() => {
                                updateForm('city', ct);
                                setCityDropdownOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5",
                                  form.city === ct ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {ct}
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
                  placeholder="City name"
                  className="rounded-xl h-9 text-xs"
                />
              )}
              {errors.city && <span className="text-[10px] text-red-500">{errors.city}</span>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">PIN / ZIP Code *</Label>
              <Input 
                value={form.pincode} 
                onChange={e => updateForm('pincode', e.target.value)} 
                onBlur={e => handleFieldBlur('pincode', e.target.value)}
                placeholder={selectedCountry.pinPlaceholder} 
                className={cn("rounded-xl h-9 text-xs", errors.pincode && "border-red-500")}
              />
              {errors.pincode && <span className="text-[10px] text-red-500">{errors.pincode}</span>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Accreditation Grade</Label>
              <Select
                value={form.accreditation || 'Not Accredited'}
                onValueChange={(val) => updateForm('accreditation', val)}
              >
                <SelectTrigger className="rounded-xl h-9 text-xs">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {ACCREDITATION_GRADES.map(g => (
                    <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" onClick={() => setStep(1)} variant="outline" className="rounded-xl h-9 px-4 text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-4 text-xs gap-1.5"
            >
              Next: Leadership Details <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Institution Leadership Details */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-normal font-medium">
              Kindly select at least one office holder from the leadership list and fill in their respective details.
            </p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {leadership.map((lead, idx) => {
              const leadErrs = leadershipErrors[lead.role] || {};

              return (
                <div key={lead.role} className="border border-border/80 rounded-xl overflow-hidden shadow-sm bg-card text-xs">
                  <div className={cn(
                    "flex items-center justify-between p-3 cursor-pointer transition-colors select-none",
                    lead.checked ? "bg-muted/30 border-b border-border/40" : "hover:bg-muted/20"
                  )}
                    onClick={() => {
                      setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, checked: !l.checked } : l));
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={lead.checked}
                        readOnly
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#8B1538] focus:ring-[#8B1538]"
                      />
                      <div>
                        <span className="font-semibold text-foreground">
                          {lead.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {lead.checked ? 'Collapse' : 'Expand'}
                    </span>
                  </div>

                  {lead.checked && (
                    <div className="p-4 space-y-3.5 bg-card">
                      <div className="grid sm:grid-cols-2 gap-3.5">
                        {/* Full Name with Salutation */}
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-[10px] font-semibold text-muted-foreground">Full Name *</Label>
                          <div className="flex gap-2">
                            <Select
                              value={lead.salutation || 'Dr.'}
                              onValueChange={(val) => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, salutation: val } : l))}
                            >
                              <SelectTrigger className="w-[80px] rounded-xl text-xs h-9 pl-2 pr-1 bg-transparent border-slate-200">
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
                              className={cn("flex-1 rounded-xl h-9 text-xs", leadErrs.fullName && "border-red-500")}
                              maxLength={150}
                            />
                          </div>
                          {leadErrs.fullName && <p className="text-[10px] text-red-500 mt-0.5">{leadErrs.fullName}</p>}
                        </div>

                        {/* Official Email */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-muted-foreground">Official Email ID *</Label>
                          <Input
                            type="email"
                            value={lead.email}
                            onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, email: e.target.value } : l))}
                            placeholder="e.g. principal@college.edu.in"
                            className={cn("rounded-xl h-9 text-xs", leadErrs.email && "border-red-500")}
                            maxLength={150}
                          />
                          {leadErrs.email && <p className="text-[10px] text-red-500 mt-0.5">{leadErrs.email}</p>}
                        </div>

                        {/* Contact Number */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-muted-foreground">Official Contact Number *</Label>
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
                              <SelectTrigger className="w-[75px] rounded-xl text-xs h-9 pl-2 pr-1 bg-transparent">
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
                              className={cn("flex-1 rounded-xl h-9 text-xs", leadErrs.phone && "border-red-500")}
                              maxLength={15}
                            />
                          </div>
                          {leadErrs.phone && <p className="text-[10px] text-red-500 mt-0.5">{leadErrs.phone}</p>}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3.5 border-t border-border/40 pt-3">
                        {/* LinkedIn URL */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-muted-foreground">LinkedIn Profile URL</Label>
                          <Input
                            value={lead.linkedinUrl || ''}
                            onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, linkedinUrl: e.target.value } : l))}
                            placeholder="https://linkedin.com/in/username"
                            className={cn("rounded-xl h-8 text-[11px]", leadErrs.linkedinUrl && "border-red-500")}
                          />
                          {leadErrs.linkedinUrl && <p className="text-[10px] text-red-500 mt-0.5">{leadErrs.linkedinUrl}</p>}
                        </div>

                        {/* Google Scholar URL */}
                        <div className="space-y-1">
                          <Label className="text-[10px] font-semibold text-muted-foreground">Google Scholar Profile URL</Label>
                          <Input
                            value={lead.googleScholarUrl || ''}
                            onChange={e => setLeadership(prev => prev.map((l, i) => i === idx ? { ...l, googleScholarUrl: e.target.value } : l))}
                            placeholder="https://scholar.google.com/citations?user=..."
                            className={cn("rounded-xl h-8 text-[11px]", leadErrs.googleScholarUrl && "border-red-500")}
                          />
                          {leadErrs.googleScholarUrl && <p className="text-[10px] text-red-500 mt-0.5">{leadErrs.googleScholarUrl}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-border">
            <Button type="button" onClick={() => setStep(2)} variant="outline" className="rounded-xl h-9 px-4 text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button 
              type="button"
              onClick={() => {
                if (validateStep3()) setStep(4);
              }} 
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-4 text-xs gap-1.5"
            >
              Next: Showcase & Docs <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Showcase & Achievements */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Student Enrollment Count</Label>
              <Input type="number" value={form.student_count} onChange={e => updateForm('student_count', e.target.value)} placeholder="e.g. 5000" className="rounded-xl h-9 text-xs" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Faculty Count</Label>
              <Input type="number" value={form.faculty_count} onChange={e => updateForm('faculty_count', e.target.value)} placeholder="e.g. 250" className="rounded-xl h-9 text-xs" min={0} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs">About / Description</Label>
              <Textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                placeholder="Brief description of the institute, its mission, and achievements..."
                className="rounded-xl min-h-20 text-xs"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 border-t border-border pt-4">
            {/* Upload Document File */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Verification Document (PDF/JPG/PNG) *</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('doc-input')?.click()}
                  className="rounded-xl h-9 text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Select File
                </Button>
                <input
                  type="file"
                  id="doc-input"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => handleFileChange(e, 'doc')}
                  className="hidden"
                />
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {docFile ? docFile.name : editingInst?.document_url ? 'Keep current file' : 'No file selected'}
                </span>
                {(docFile || editingInst?.document_url) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDocFile(null); setDocBase64(''); }}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 shrink-0 rounded-lg"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              {errors.document && <span className="text-[10px] text-rose-500 block">{errors.document}</span>}
            </div>

            {/* Upload Logo File */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Institute Logo *</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-input')?.click()}
                  className="rounded-xl h-9 text-xs gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Select Logo
                </Button>
                <input
                  type="file"
                  id="logo-input"
                  accept=".png,.jpg,.jpeg"
                  onChange={e => handleFileChange(e, 'logo')}
                  className="hidden"
                />
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {logoFile ? logoFile.name : editingInst?.logo_url ? 'Keep current logo' : 'No logo selected'}
                </span>
                {(logoFile || editingInst?.logo_url) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setLogoFile(null); setLogoBase64(''); }}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 shrink-0 rounded-lg"
                    title="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              {errors.logo && <span className="text-[10px] text-rose-500 block">{errors.logo}</span>}
            </div>

            {/* Campus Tour / Institute Overview */}
            <div className="sm:col-span-2 border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gold" />
                <Label className="text-xs font-bold text-foreground">Campus Tour / Institute Overview</Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Upload media files to showcase your campus infrastructure and facilities.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Campus Gallery Images (JPG, PNG, WEBP — max 5MB)</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('dash-gallery-input')?.click()}
                      className="rounded-xl h-9 text-xs gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Select Images
                    </Button>
                    <input
                      type="file"
                      id="dash-gallery-input"
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
                    <span className="text-[10px] text-muted-foreground truncate">
                      {galleryFiles.length > 0 ? `${galleryFiles.length} file(s) selected` : 'No images selected'}
                    </span>
                  </div>
                  {galleryFiles.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {galleryFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 bg-muted/40 border border-border rounded-lg text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <Upload className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span className="truncate max-w-[180px] text-[11px] font-medium text-foreground">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-6 w-6 p-0 shrink-0"
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
                  <Label className="text-xs font-semibold">Campus MP4 Video (Max 25MB)</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('dash-video-input')?.click()}
                      className="rounded-xl h-9 text-xs gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Select Video
                    </Button>
                    <input
                      type="file"
                      id="dash-video-input"
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
                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                      {campusVideoFile ? campusVideoFile.name : 'No video selected'}
                    </span>
                    {campusVideoFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCampusVideoFile(null)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 w-7 p-0 shrink-0 rounded-lg"
                        title="Remove video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium">YouTube Video Link</Label>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.youtube_url || ''}
                    onChange={e => updateForm('youtube_url', e.target.value)}
                    className="rounded-xl text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex justify-between gap-2">
            <Button type="button" onClick={() => setStep(3)} variant="outline" className="rounded-xl h-9 px-4 text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 px-6 text-xs gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> {editingInst ? 'Save Updates' : 'Register Institution'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
