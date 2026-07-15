import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { supabase } from '@/lib/api-client';
import {
  ScrollText, Search, ExternalLink, Clock, FileText,
  Landmark, Shield, BookOpen, Scale, ChevronRight,
  Download, Filter, AlertCircle, CheckCircle2, Info,
  GraduationCap, Building2, Globe, Star, Briefcase,
  Stethoscope, Gavel, Award, Users, Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Regulatory Bodies ── */
const REGULATORY_BODIES = [
  {
    id: 'ugc',
    name: 'UGC',
    fullName: 'University Grants Commission',
    icon: Landmark,
    color: 'from-primary/20 to-primary/5 border-primary/15',
    categories: ['ugc_aicte', 'ugc_update'],
    url: 'https://www.ugc.gov.in',
    desc: 'Circulars, notifications, and regulations governing universities and colleges',
  },
  {
    id: 'aicte',
    name: 'AICTE',
    fullName: 'All India Council for Technical Education',
    icon: Building2,
    color: 'from-accent/20 to-accent/5 border-accent/15',
    categories: ['ugc_aicte'],
    url: 'https://www.aicte-india.org',
    desc: 'Approval handbooks, model curricula, pay scales for technical education',
  },
  {
    id: 'moe',
    name: 'MoE',
    fullName: 'Ministry of Education, Govt. of India',
    icon: GraduationCap,
    color: 'from-gold/20 to-gold/5 border-gold/15',
    categories: ['education_news'],
    url: 'https://www.education.gov.in',
    desc: 'NEP 2020, NIRF, RUSA, and national education policy directions',
  },
  {
    id: 'gazette',
    name: 'eGazette',
    fullName: 'Government of India Gazette',
    icon: ScrollText,
    color: 'from-gold/20 to-gold/5 border-gold/15',
    categories: ['gazette'],
    url: 'https://egazette.gov.in',
    desc: 'Official gazette notifications, acts, amendments, and statutory orders',
  },
  {
    id: 'naac',
    name: 'NAAC',
    fullName: 'National Assessment & Accreditation Council',
    icon: Shield,
    color: 'from-teal/20 to-teal/5 border-teal/15',
    categories: ['ugc_aicte'],
    url: 'https://naac.gov.in',
    desc: 'Accreditation frameworks, AQAR, SSR templates, and quality benchmarks',
  },
  {
    id: 'nba',
    name: 'NBA',
    fullName: 'National Board of Accreditation',
    icon: Award,
    color: 'from-accent/15 to-accent/5 border-accent/10',
    categories: ['ugc_aicte'],
    url: 'https://www.nbaind.org',
    desc: 'Outcome-based accreditation for engineering, pharmacy, and management programmes',
  },
  {
    id: 'ncte',
    name: 'NCTE',
    fullName: 'National Council for Teacher Education',
    icon: Users,
    color: 'from-primary/15 to-primary/5 border-primary/10',
    categories: ['education_news'],
    url: 'https://ncte.gov.in',
    desc: 'Recognition norms for B.Ed., M.Ed., D.El.Ed., and integrated teacher programmes',
  },
  {
    id: 'bci',
    name: 'BCI',
    fullName: 'Bar Council of India',
    icon: Gavel,
    color: 'from-gold/15 to-gold/5 border-gold/10',
    categories: ['education_news'],
    url: 'https://www.barcouncilofindia.org',
    desc: 'Legal education standards, LL.B. curriculum, and law college approvals',
  },
  {
    id: 'pci',
    name: 'PCI',
    fullName: 'Pharmacy Council of India',
    icon: Stethoscope,
    color: 'from-teal/15 to-teal/5 border-teal/10',
    categories: ['education_news'],
    url: 'https://www.pci.nic.in',
    desc: 'Pharmacy education regulations, D.Pharm & B.Pharm approval norms',
  },
  {
    id: 'heci',
    name: 'HECI',
    fullName: 'Higher Education Commission of India (Proposed)',
    icon: Library,
    color: 'from-accent/20 to-accent/5 border-accent/15',
    categories: ['education_news'],
    url: 'https://www.education.gov.in',
    desc: 'Proposed single overarching regulator as envisaged in NEP 2020 — replacing UGC',
  },
];

/* ── Key Regulations Reference ── */
type Regulation = {
  title: string;
  body: string;
  authority: string;
  dateIssued: string;
  year: string;
  status: 'Active' | 'Superseded' | 'Under Review' | 'Draft';
  desc: string;
  tags: string[];
  documentUrl: string;
  gazetteRef?: string;
};

const KEY_REGULATIONS: Regulation[] = [
  // ═══ UGC Regulations ═══
  {
    title: 'UGC Regulations 2018 — Minimum Qualifications for Appointment of Teachers (4th Amendment)',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '18 Jul 2018',
    year: '2018',
    status: 'Active',
    desc: 'Defines minimum qualifications, API scores (Table-2), CAS promotion criteria, and eligibility for appointment of teachers and academic staff in universities and colleges across India.',
    tags: ['CAS', 'API Score', 'Faculty Promotion', 'NET/SET'],
    documentUrl: 'https://www.ugc.gov.in/pdfnews/4033931_UGC-Regulation_min_Qualification_Jul2018.pdf',
    gazetteRef: 'Gazette of India, Extraordinary, Part III, Section 4',
  },
  {
    title: 'UGC (Open and Distance Learning & Online Programmes) Regulations, 2020',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '04 Sep 2020',
    year: '2020',
    status: 'Active',
    desc: 'Framework for offering open, distance learning, and online degree programmes by HEIs. Covers approval process, programme standards, and technology requirements.',
    tags: ['ODL', 'Online Education', 'Approval'],
    documentUrl: 'https://www.ugc.gov.in/ugc_notices.aspx?id=MTcxMg==',
  },
  {
    title: 'UGC (Minimum Standards & Procedures for Award of Ph.D. Degree) Regulations, 2022',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '07 Nov 2022',
    year: '2022',
    status: 'Active',
    desc: 'Revised regulations for Ph.D. admission, coursework, supervision, publication requirements, and viva voce standards. Supersedes 2016 regulations.',
    tags: ['Ph.D.', 'Research', 'Thesis', 'Viva Voce'],
    documentUrl: 'https://www.ugc.gov.in/pdfnews/1367692_Revised-PhD-regulations-2022.pdf',
    gazetteRef: 'Gazette of India, Part III, Section 4',
  },
  {
    title: 'UGC-CARE List — Consortium for Academic and Research Ethics',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '14 Jan 2019',
    year: '2019',
    status: 'Active',
    desc: 'Approved list of quality journals for research publications. Only CARE-listed journal publications count for API score and CAS promotion assessments.',
    tags: ['CARE List', 'Journals', 'Research', 'API Score'],
    documentUrl: 'https://ugccare.unipune.ac.in/',
  },
  {
    title: 'UGC (Academic Bank of Credits) Regulations, 2021',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '28 Jul 2021',
    year: '2021',
    status: 'Active',
    desc: 'Establishes the Academic Bank of Credits (ABC) framework enabling students to accumulate credits across institutions, enabling multiple entry/exit in higher education.',
    tags: ['ABC', 'Credit Transfer', 'NEP 2020'],
    documentUrl: 'https://www.abc.gov.in/',
  },
  {
    title: 'UGC (Conferment of Autonomous Status upon Colleges) Regulations, 2023',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Revised guidelines for conferment of autonomous status to colleges. Covers eligibility criteria, governance structure, curriculum design freedom, examination reforms, and periodic review.',
    tags: ['Autonomous Colleges', 'Governance', 'Curriculum Freedom'],
    documentUrl: 'https://www.ugc.gov.in/subpage/autonomousColleges.aspx',
  },
  {
    title: 'UGC Guidelines — Curriculum and Credit Framework for UG Programmes (CCFUP)',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Framework for 4-year undergraduate programmes with multiple entry/exit. Certificate after 1 year, diploma after 2, degree after 3, honours/research after 4 years under NEP 2020.',
    tags: ['NEP 2020', 'FYUP', 'Multiple Entry Exit', 'UG Reform'],
    documentUrl: 'https://www.ugc.gov.in/pdfnews/5765530_CCFUP.pdf',
  },
  {
    title: 'UGC Regulations on Curbing Menace of Ragging in HEIs, 2009',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '2009 (Amended 2016)',
    year: '2016',
    status: 'Active',
    desc: 'Mandatory anti-ragging measures, committee constitution, helpline, affidavits, and penal provisions for all higher education institutions.',
    tags: ['Anti-Ragging', 'Student Safety', 'Compliance'],
    documentUrl: 'https://www.antiragging.in/',
  },
  {
    title: 'UGC (Establishment & Maintenance of Standards in Private Universities) Regulations, 2003',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '2003',
    year: '2003',
    status: 'Active',
    desc: 'Norms for establishment of private universities including infrastructure, faculty, and governance requirements.',
    tags: ['Private University', 'Establishment', 'Standards'],
    documentUrl: 'https://www.ugc.gov.in/subpage/privateuniversities.aspx',
  },
  {
    title: 'UGC Regulations on Mandatory Assessment & Accreditation of HEIs, 2012',
    body: 'UGC',
    authority: 'University Grants Commission',
    dateIssued: '2012 (Amended 2018)',
    year: '2018',
    status: 'Active',
    desc: 'Makes NAAC/NBA accreditation mandatory for all HEIs. Institutions must apply within 6 months of becoming eligible. Non-compliance attracts funding and approval consequences.',
    tags: ['Mandatory Accreditation', 'NAAC', 'NBA', 'Compliance'],
    documentUrl: 'https://www.ugc.gov.in/ugc_notices.aspx',
  },

  // ═══ Ministry of Education / MHRD ═══
  {
    title: 'National Education Policy 2020 (NEP 2020)',
    body: 'MoE',
    authority: 'Ministry of Education, Govt. of India',
    dateIssued: '29 Jul 2020',
    year: '2020',
    status: 'Active',
    desc: 'India\'s transformative education policy covering multidisciplinary institutions, 4-year UG degree, Academic Bank of Credits, HECI restructuring, and teacher education reforms.',
    tags: ['NEP', 'Multidisciplinary', 'Credit Bank', 'HECI'],
    documentUrl: 'https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf',
  },
  {
    title: 'National Institutional Ranking Framework (NIRF)',
    body: 'MoE',
    authority: 'Ministry of Education, Govt. of India',
    dateIssued: '2015 (Updated Annually)',
    year: '2015',
    status: 'Active',
    desc: 'Ranking methodology based on Teaching & Resources, Research, Graduation Outcomes, Outreach & Inclusivity, and Perception. Annual data submission required.',
    tags: ['NIRF', 'Ranking', 'Data Submission'],
    documentUrl: 'https://www.nirfindia.org/',
  },
  {
    title: 'RUSA 2.0 — Rashtriya Uchchatar Shiksha Abhiyan Guidelines',
    body: 'MoE',
    authority: 'Ministry of Education, Govt. of India',
    dateIssued: '2018',
    year: '2018',
    status: 'Active',
    desc: 'Central funding scheme for state universities focused on infrastructure, faculty positions, research, and equity. Provides strategic funding linked to reforms.',
    tags: ['RUSA', 'Funding', 'State Universities'],
    documentUrl: 'https://ryvfrusa.education.gov.in/',
  },
  {
    title: 'Anusandhan National Research Foundation Act, 2023',
    body: 'MoE',
    authority: 'Ministry of Education & DST, Govt. of India',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Establishes the Anusandhan NRF to fund, coordinate, and promote research across natural sciences, engineering, humanities, and social sciences in India.',
    tags: ['NRF', 'Research Funding', 'NEP 2020'],
    documentUrl: 'https://anrf.res.in/',
  },

  // ═══ AICTE ═══
  {
    title: 'AICTE Approval Process Handbook 2025–26',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2025',
    year: '2025',
    status: 'Active',
    desc: 'Comprehensive guidelines for approval of new technical institutions, extension of approval, addition of courses, intake changes, and closure. Annual publication with updated norms.',
    tags: ['Approval Handbook', 'Technical Education', 'Intake', 'Faculty Norms'],
    documentUrl: 'https://www.aicte-india.org/bureaus/approval-process-handbook',
  },
  {
    title: 'AICTE Approval Process Handbook 2024–25',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2024',
    year: '2024',
    status: 'Superseded',
    desc: 'Previous year\'s approval process handbook. Superseded by 2025-26 edition but useful for historical reference and understanding year-over-year policy changes.',
    tags: ['Approval Handbook', 'Technical Education', 'Reference'],
    documentUrl: 'https://www.aicte-india.org/bureaus/approval-process-handbook',
  },
  {
    title: 'AICTE Model Curriculum for UG Engineering Programmes',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2018',
    year: '2018',
    status: 'Active',
    desc: 'Model curriculum for B.Tech/B.E. programmes with focus on outcome-based education, project-based learning, and industry-relevant skill development.',
    tags: ['Model Curriculum', 'OBE', 'Engineering'],
    documentUrl: 'https://www.aicte-india.org/education/model-curriculum',
  },
  {
    title: 'AICTE Regulations on Pay Scales & Career Advancement (7th CPC)',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2019',
    year: '2019',
    status: 'Active',
    desc: 'Pay scales, cadre structure, and career advancement scheme for faculty in AICTE-approved technical institutions following 7th CPC recommendations.',
    tags: ['Pay Scale', '7th CPC', 'Faculty', 'CAS'],
    documentUrl: 'https://www.aicte-india.org/bureaus/administration/pay-scales',
  },
  {
    title: 'AICTE Guidelines for Grant of Autonomy to Technical Institutions',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2022',
    year: '2022',
    status: 'Active',
    desc: 'Norms for grant of autonomy to AICTE-approved institutions covering eligibility, curriculum flexibility, examination reforms, and periodic assessment mechanisms.',
    tags: ['Autonomous', 'Technical Institutions', 'Flexibility'],
    documentUrl: 'https://www.aicte-india.org/bureaus/approval',
  },
  {
    title: 'AICTE Regulations on Faculty Cadre, Qualification & Workload',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2020',
    year: '2020',
    status: 'Active',
    desc: 'Norms for faculty-student ratio, workload hours, qualification requirements for all professor levels, and recognition of industry experience for faculty positions.',
    tags: ['Faculty Workload', 'Qualification', 'Faculty Ratio'],
    documentUrl: 'https://www.aicte-india.org/bureaus/administration',
  },
  {
    title: 'AICTE Guidelines on Internship/Apprenticeship Embedded Programmes',
    body: 'AICTE',
    authority: 'All India Council for Technical Education',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Framework for integrating industry internships and apprenticeships within degree programmes, including credit mapping, duration, mentoring, and assessment guidelines.',
    tags: ['Internship', 'Apprenticeship', 'Industry Connect'],
    documentUrl: 'https://www.aicte-india.org/opportunities/students',
  },

  // ═══ NAAC ═══
  {
    title: 'NAAC Revised Assessment & Accreditation Framework (RAF)',
    body: 'NAAC',
    authority: 'National Assessment & Accreditation Council',
    dateIssued: '2024',
    year: '2024',
    status: 'Active',
    desc: 'Binary accreditation model with revised criteria — Curricular Aspects, Teaching-Learning, Research, Infrastructure, Student Support, Governance, and Innovation.',
    tags: ['Accreditation', 'AQAR', 'SSR', 'Binary Model'],
    documentUrl: 'https://naac.gov.in/assessment-accreditation#checks',
  },
  {
    title: 'NAAC — Self Study Report (SSR) Template & Manuals',
    body: 'NAAC',
    authority: 'National Assessment & Accreditation Council',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Templates for preparing the Self-Study Report with criterion-wise documentation, data requirements, and best practices for NAAC peer team visits.',
    tags: ['SSR', 'Documentation', 'Peer Visit'],
    documentUrl: 'https://naac.gov.in/resources#manuals',
  },
  {
    title: 'NAAC AQAR (Annual Quality Assurance Report) Submission',
    body: 'NAAC',
    authority: 'National Assessment & Accreditation Council',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Annual reporting format for accredited institutions covering curriculum delivery, research output, faculty development, student progression, and quality initiatives.',
    tags: ['AQAR', 'Annual Report', 'Quality Assurance'],
    documentUrl: 'https://naac.gov.in/resources#aqar',
  },

  // ═══ NBA ═══
  {
    title: 'NBA Self Assessment Report (SAR) — Engineering Programs (Tier-I & II)',
    body: 'NBA',
    authority: 'National Board of Accreditation',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'SAR format for Tier-I and Tier-II engineering programmes based on outcome-based education (OBE) with Program Outcomes, Program Educational Objectives, and Course Outcomes.',
    tags: ['SAR', 'OBE', 'Program Outcomes', 'Engineering'],
    documentUrl: 'https://www.nbaind.org/accreditation',
  },
  {
    title: 'NBA Accreditation Criteria for Pharmacy Programs',
    body: 'NBA',
    authority: 'National Board of Accreditation',
    dateIssued: '2022',
    year: '2022',
    status: 'Active',
    desc: 'Accreditation criteria and SAR format for B.Pharm and D.Pharm programmes covering OBE outcomes, curriculum design, lab infrastructure, and clinical exposure.',
    tags: ['Pharmacy', 'B.Pharm', 'OBE', 'Accreditation'],
    documentUrl: 'https://www.nbaind.org/accreditation',
  },
  {
    title: 'NBA Accreditation Criteria for Management Programs (MBA/PGDM)',
    body: 'NBA',
    authority: 'National Board of Accreditation',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'SAR format and criteria for MBA/PGDM programmes covering programme outcomes, industry interface, placement records, and case study pedagogy.',
    tags: ['MBA', 'Management', 'OBE', 'Placement'],
    documentUrl: 'https://www.nbaind.org/accreditation',
  },

  // ═══ NCTE ═══
  {
    title: 'NCTE Recognition Norms & Procedures Regulations, 2014 (Amended 2021)',
    body: 'NCTE',
    authority: 'National Council for Teacher Education',
    dateIssued: '2014 (Amended 2021)',
    year: '2021',
    status: 'Active',
    desc: 'Norms for recognition of teacher education institutions offering B.Ed., M.Ed., D.El.Ed., and integrated programmes. Covers intake, infrastructure, and faculty requirements.',
    tags: ['B.Ed.', 'Teacher Education', 'Recognition'],
    documentUrl: 'https://ncte.gov.in/website/regulation.aspx',
  },
  {
    title: 'NCTE 4-Year Integrated Teacher Education Programme (ITEP) Curriculum Framework',
    body: 'NCTE',
    authority: 'National Council for Teacher Education',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Curriculum framework for the 4-year ITEP as envisaged under NEP 2020 — combines subject knowledge with pedagogy, school internship, and foundational literacy/numeracy.',
    tags: ['ITEP', 'NEP 2020', '4-Year B.Ed.', 'Pedagogy'],
    documentUrl: 'https://ncte.gov.in/website/ITEP.aspx',
  },
  {
    title: 'NCTE Norms & Standards for Teacher Education Programmes',
    body: 'NCTE',
    authority: 'National Council for Teacher Education',
    dateIssued: '2021',
    year: '2021',
    status: 'Active',
    desc: 'Norms covering land, building, library, ICT lab, faculty qualifications, student-teacher ratio, and practice teaching requirements for all teacher education programmes.',
    tags: ['Infrastructure', 'Faculty Norms', 'Practice Teaching'],
    documentUrl: 'https://ncte.gov.in/website/regulation.aspx',
  },

  // ═══ BCI (Bar Council of India) ═══
  {
    title: 'BCI Rules of Legal Education, 2008 (Amended)',
    body: 'BCI',
    authority: 'Bar Council of India',
    dateIssued: '2008 (Amended 2020)',
    year: '2020',
    status: 'Active',
    desc: 'Rules governing legal education including 5-year and 3-year LL.B. programmes, faculty eligibility, curriculum standards, and inspection norms for law colleges.',
    tags: ['LL.B.', 'Legal Education', 'Law College', 'Curriculum'],
    documentUrl: 'https://www.barcouncilofindia.org/about/about-the-legal-education',
    gazetteRef: 'Advocates Act, 1961 — Section 7 & 49',
  },
  {
    title: 'BCI Standards for Affiliation & Establishment of Law Colleges',
    body: 'BCI',
    authority: 'Bar Council of India',
    dateIssued: '2019',
    year: '2019',
    status: 'Active',
    desc: 'Norms for affiliation of new law colleges including land, infrastructure, library, moot court, faculty-student ratio, and inspection procedures under the Advocates Act.',
    tags: ['New College', 'Affiliation', 'Infrastructure', 'Moot Court'],
    documentUrl: 'https://www.barcouncilofindia.org/about/about-the-legal-education',
  },

  // ═══ PCI (Pharmacy Council of India) ═══
  {
    title: 'PCI Education Regulations, 2020 (D.Pharm & B.Pharm)',
    body: 'PCI',
    authority: 'Pharmacy Council of India',
    dateIssued: '2020',
    year: '2020',
    status: 'Active',
    desc: 'Revised curriculum and infrastructure norms for D.Pharm and B.Pharm programmes including lab requirements, clinical pharmacy exposure, and hospital training hours.',
    tags: ['D.Pharm', 'B.Pharm', 'Curriculum', 'Hospital Training'],
    documentUrl: 'https://www.pci.nic.in/',
    gazetteRef: 'Pharmacy Act, 1948',
  },
  {
    title: 'PCI Minimum Standards for Pharmacy Institutions',
    body: 'PCI',
    authority: 'Pharmacy Council of India',
    dateIssued: '2021',
    year: '2021',
    status: 'Active',
    desc: 'Norms for land, building, equipment, faculty qualifications, and student-staff ratio for institutions offering D.Pharm, B.Pharm, M.Pharm, and Pharm.D. programmes.',
    tags: ['Infrastructure', 'Faculty', 'M.Pharm', 'Pharm.D.'],
    documentUrl: 'https://www.pci.nic.in/',
  },

  // ═══ HECI (Proposed) ═══
  {
    title: 'Higher Education Commission of India (HECI) — Draft Bill',
    body: 'HECI',
    authority: 'Ministry of Education, Govt. of India',
    dateIssued: '2018 (Revised Draft 2023)',
    year: '2023',
    status: 'Draft',
    desc: 'Draft bill to replace the UGC Act and create a single overarching regulator for higher education as envisaged in NEP 2020. Proposes four verticals: NHERC, NAC, HEGC, and GEC.',
    tags: ['HECI', 'NEP 2020', 'Regulatory Reform', 'UGC Replacement'],
    documentUrl: 'https://www.education.gov.in/higher_education',
  },
  {
    title: 'NEP 2020 — HECI Proposed Four-Vertical Structure',
    body: 'HECI',
    authority: 'Ministry of Education, Govt. of India',
    dateIssued: 'As proposed in NEP 2020',
    year: '2020',
    status: 'Under Review',
    desc: 'NEP 2020 proposes NHERC (regulation), NAC (accreditation), HEGC (funding), and GEC (academic standards) as the four independent verticals under a single umbrella — HECI.',
    tags: ['NHERC', 'NAC', 'HEGC', 'GEC', 'NEP 2020'],
    documentUrl: 'https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf',
  },

  // ═══ eGazette / Government Acts ═══
  {
    title: 'Central Universities Act, 2009',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '20 Mar 2009',
    year: '2009',
    status: 'Active',
    desc: 'Establishes and incorporates central universities. Defines governance structure, powers of Chancellor, Vice Chancellor, and statutory bodies.',
    tags: ['Central University', 'Governance', 'Act'],
    documentUrl: 'https://www.indiacode.nic.in/handle/123456789/2053',
    gazetteRef: 'Act No. 25 of 2009',
  },
  {
    title: 'National Medical Commission Act, 2019',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '08 Aug 2019',
    year: '2019',
    status: 'Active',
    desc: 'Replaces MCI with the National Medical Commission. Governs medical education, NEXT exam, fee regulation, and standards for medical colleges.',
    tags: ['NMC', 'Medical Education', 'NEXT Exam'],
    documentUrl: 'https://www.indiacode.nic.in/handle/123456789/15070',
    gazetteRef: 'Act No. 30 of 2019',
  },
  {
    title: 'National Commission for Allied & Healthcare Professions Act, 2021',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '28 Mar 2021',
    year: '2021',
    status: 'Active',
    desc: 'Establishes the National Commission for Allied and Healthcare Professions for regulation and standards of education and services in allied health.',
    tags: ['Allied Health', 'Healthcare Professions', 'Commission'],
    documentUrl: 'https://www.indiacode.nic.in/handle/123456789/16702',
    gazetteRef: 'Act No. 14 of 2021',
  },
  {
    title: 'Anusandhan National Research Foundation Act, 2023',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '2023',
    year: '2023',
    status: 'Active',
    desc: 'Establishes the NRF to seed, grow, and facilitate research across natural sciences, engineering, technology, social sciences, and humanities.',
    tags: ['NRF Act', 'Research', 'Funding'],
    documentUrl: 'https://www.indiacode.nic.in/',
    gazetteRef: 'Act No. 23 of 2023',
  },
  {
    title: 'UGC Act, 1956 (as amended)',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '1956 (Last Amended 2013)',
    year: '2013',
    status: 'Active',
    desc: 'The foundational act establishing UGC for coordination, determination, and maintenance of standards of university education in India.',
    tags: ['UGC Act', 'Foundation', 'University Standards'],
    documentUrl: 'https://www.indiacode.nic.in/handle/123456789/1478',
    gazetteRef: 'Act No. 3 of 1956',
  },
  {
    title: 'AICTE Act, 1987 (as amended)',
    body: 'eGazette',
    authority: 'Government of India, Ministry of Law & Justice',
    dateIssued: '1987 (Last Amended 2020)',
    year: '2020',
    status: 'Active',
    desc: 'The act establishing AICTE for proper planning and coordinated development of technical education and management education system in India.',
    tags: ['AICTE Act', 'Technical Education', 'Foundation'],
    documentUrl: 'https://www.indiacode.nic.in/handle/123456789/1496',
    gazetteRef: 'Act No. 52 of 1987',
  },
];

const REGULATION_AUTHORITIES = ['All', 'UGC', 'MoE', 'AICTE', 'NAAC', 'NBA', 'NCTE', 'BCI', 'PCI', 'HECI', 'eGazette'] as const;

const AUTHORITY_COLORS: Record<string, string> = {
  UGC: 'bg-primary/10 text-primary border-primary/20',
  MoE: 'bg-gold/15 text-gold border-gold/30',
  AICTE: 'bg-accent/10 text-accent border-accent/20',
  NAAC: 'bg-teal/10 text-teal border-teal/20',
  NBA: 'bg-secondary/40 text-secondary-foreground border-secondary/50',
  NCTE: 'bg-gold/10 text-gold border-gold/20',
  BCI: 'bg-primary/15 text-primary border-primary/25',
  PCI: 'bg-teal/15 text-teal border-teal/25',
  HECI: 'bg-accent/15 text-accent border-accent/25',
  eGazette: 'bg-primary/10 text-primary border-primary/20',
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Gazette() {
  const [activeBody, setActiveBody] = useState<string>('all');
  const [activeRegAuthority, setActiveRegAuthority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const { ref: heroRef } = useScrollAnimation();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['gazette-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .in('category', ['ugc_aicte', 'ugc_update', 'gazette', 'announcement'])
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filtered = (notifications || []).filter(item => {
    const body = REGULATORY_BODIES.find(b => b.id === activeBody);
    const matchesBody = activeBody === 'all' || (body && body.categories.some(c => c === item.category));
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBody && matchesSearch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 bg-gradient-to-b from-[hsl(228,45%,8%)] via-[hsl(228,45%,12%)] to-background overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-[20%] w-96 h-96 bg-gold/6 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 right-[10%] w-72 h-72 bg-accent/5 rounded-full blur-[100px]" />
          {/* Decorative scroll pattern */}
          <div className="absolute top-20 right-[5%] opacity-[0.03]">
            <ScrollText className="w-64 h-64 text-warm" />
          </div>
        </div>

        <div ref={heroRef} className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2 mb-6">
              <Scale className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold tracking-wide">Regulatory Intelligence</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-warm mb-5 leading-tight">
              Gazette, Circulars &<br />
              <span className="text-gradient-gold">Regulations</span>
            </h1>
            <p className="text-warm/55 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Your one-stop regulatory knowledge base — auto-aggregated circulars, 
              gazette notifications, and frameworks from UGC, AICTE, NAAC, NCTE, BCI, PCI, NBA &amp; the upcoming HECI. 
              Stay compliant, stay informed.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search circulars, regulations, notifications..."
                className="h-14 pl-12 pr-6 rounded-2xl bg-card border-2 border-border text-foreground placeholder:text-muted-foreground text-base focus:border-gold focus:bg-card shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Regulatory Bodies Grid ── */}
      <section className="py-10 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-gold" />
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Regulatory Bodies</h2>
                <p className="text-muted-foreground text-xs">{REGULATORY_BODIES.length} bodies · Click to filter notifications</p>
              </div>
            </div>
            {activeBody !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setActiveBody('all')} className="rounded-xl text-muted-foreground text-xs">
                Show All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {REGULATORY_BODIES.map(body => {
              const Icon = body.icon;
              const isActive = activeBody === body.id;
              return (
                <button
                  key={body.id}
                  onClick={() => setActiveBody(isActive ? 'all' : body.id)}
                  className={cn(
                    'rounded-2xl bg-gradient-to-br p-5 border text-left transition-all hover:-translate-y-1',
                    isActive ? 'border-gold/40 shadow-lg shadow-gold/10 ring-1 ring-gold/20' : 'hover:border-gold/20',
                    body.color
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    {isActive && <CheckCircle2 className="h-4 w-4 text-gold" />}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-foreground">{body.name}</h3>
                  <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">{body.desc}</p>
                  <a
                    href={body.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[10px] text-gold mt-3 hover:underline"
                  >
                    Official Website <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Key Regulations Reference ── */}
      <section className="py-12 border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Key Regulations Reference</h2>
                <p className="text-muted-foreground text-xs">{KEY_REGULATIONS.length} official documents · Click to view full document</p>
              </div>
            </div>
          </div>

          {/* Authority filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {REGULATION_AUTHORITIES.map((auth) => {
              const count = auth === 'All' ? KEY_REGULATIONS.length : KEY_REGULATIONS.filter(r => r.body === auth).length;
              if (auth !== 'All' && count === 0) return null;
              return (
                <button
                  key={auth}
                  onClick={() => setActiveRegAuthority(auth)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                    activeRegAuthority === auth
                      ? 'bg-gold text-gold-foreground shadow-md shadow-gold/20'
                      : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border'
                  )}
                >
                  {auth}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-md text-[9px] font-bold',
                    activeRegAuthority === auth ? 'bg-gold-foreground/20 text-gold-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Regulations grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {KEY_REGULATIONS
              .filter(reg => activeRegAuthority === 'All' || reg.body === activeRegAuthority)
              .map((reg, i) => {
                const statusColor = reg.status === 'Active' 
                  ? 'bg-accent/15 text-accent border-accent/30' 
                  : reg.status === 'Under Review'
                  ? 'bg-gold/15 text-gold border-gold/30'
                  : 'bg-muted text-muted-foreground border-border';
                
                return (
                  <a
                    key={i}
                    href={reg.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card border border-border rounded-2xl p-5 hover:border-gold/25 hover:shadow-lg transition-all hover:-translate-y-0.5 block"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 font-bold', AUTHORITY_COLORS[reg.body] || '')}>
                          {reg.body}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{reg.dateIssued}</span>
                      </div>
                      <Badge className={cn('text-[9px] px-2 py-0 border', statusColor)}>
                        {reg.status}
                      </Badge>
                    </div>

                    {/* Authority line */}
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                      <Landmark className="w-3 h-3" />
                      {reg.authority}
                    </p>

                    {/* Title */}
                    <h3 className="font-serif text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {reg.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-3">
                      {reg.desc}
                    </p>

                    {/* Gazette reference */}
                    {reg.gazetteRef && (
                      <p className="text-[10px] text-gold/60 italic mb-3 flex items-center gap-1">
                        <ScrollText className="w-3 h-3" />
                        {reg.gazetteRef}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {reg.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Document link */}
                    <div className="flex items-center gap-2 text-gold text-[11px] font-semibold pt-2 border-t border-border group-hover:gap-3 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on Official Website
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </div>
                  </a>
                );
              })}
          </div>

          {/* Fair-use disclaimer */}
          <div className="mt-8 bg-muted/30 border border-border rounded-xl p-4 max-w-4xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-gold/70" />
              <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
                <p><strong className="text-foreground/70">Source Attribution:</strong> All links redirect to official government and regulatory body websites. Academisthan does not host, modify, or redistribute any official documents.</p>
                <p><strong className="text-foreground/70">Accuracy:</strong> Regulation titles and descriptions are compiled for educational reference only. For legally binding content, always verify from the original source. Information may change as authorities update their portals.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Notifications Feed ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Latest Notifications</h2>
                <p className="text-muted-foreground text-xs">Auto-updated from official sources</p>
              </div>
            </div>
            {activeBody !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setActiveBody('all')} className="rounded-xl text-muted-foreground">
                Clear Filter
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-sm mb-4">
            <span className="text-foreground font-bold">{filtered.length}</span> notifications
            {activeBody !== 'all' && <> from <span className="text-gold font-semibold">{REGULATORY_BODIES.find(b => b.id === activeBody)?.name}</span></>}
          </p>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5">
                  <Skeleton className="h-4 w-1/4 mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ScrollText className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">No notifications found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'Try different keywords.' : 'Regulatory updates are added every 6 hours.'}
              </p>
            </div>
          )}

          {/* Notification list */}
          {!isLoading && visible.length > 0 && (
            <div className="space-y-3">
              {visible.map((item, i) => (
                <a
                  key={item.id}
                  href={item.source_url || '#'}
                  target={item.source_url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="group block bg-card border border-border rounded-2xl p-5 hover:border-gold/20 hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="w-3 h-3 rounded-full bg-gold/40 ring-4 ring-gold/10" />
                      {i < visible.length - 1 && <div className="w-0.5 h-full bg-border mt-1" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 border-gold/30 text-gold font-semibold">
                          {item.source_name || 'Official'}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(item.published_at)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-sm font-bold text-foreground leading-snug mb-1.5 group-hover:text-gold transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-2">
                        {item.summary}
                      </p>

                      {/* Action */}
                      {item.source_url && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gold font-medium group-hover:gap-2 transition-all">
                          Read Full Notification <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setVisibleCount(c => c + 10)}
                className="rounded-xl gap-2"
              >
                Load More Notifications
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="py-8 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-gold/60 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  <strong className="text-foreground/70">Disclaimer:</strong> This page aggregates publicly available regulatory information for educational reference purposes only. 
                  All document links redirect to official government and regulatory body websites. Academisthan does not host, reproduce, or redistribute any official documents or gazette notifications.
                </p>
                <p>
                  <strong className="text-foreground/70">No Affiliation:</strong> Academisthan is an independent academic platform and is not affiliated with, endorsed by, or officially connected to UGC, AICTE, NAAC, NBA, NCTE, BCI, PCI, NMC, or any government ministry or regulatory body mentioned on this page.
                </p>
                <p>
                  <strong className="text-foreground/70">Accuracy & Currency:</strong> While we strive to keep information current, regulations are frequently amended. Users must verify all information from official sources before relying on it for any academic, legal, or administrative purpose. Academisthan assumes no liability for outdated or inaccurate information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
