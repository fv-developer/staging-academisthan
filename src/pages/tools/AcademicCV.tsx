import { useState, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Plus, Trash2, Download, User, BookOpen, Award,
  FlaskConical, GraduationCap, Briefcase, Globe, Sparkles, X, FileType2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
} from 'docx';

type CVSection = {
  id: string;
  title: string;
  icon: any;
  entries: { id: string; text: string }[];
};

const DEFAULT_SECTIONS: CVSection[] = [
  { id: 'education', title: 'Educational Qualifications', icon: GraduationCap, entries: [] },
  { id: 'experience', title: 'Teaching & Professional Experience', icon: Briefcase, entries: [] },
  { id: 'publications', title: 'Publications (Journals, Books, Chapters)', icon: BookOpen, entries: [] },
  { id: 'conferences', title: 'Conferences & Seminars', icon: Globe, entries: [] },
  { id: 'projects', title: 'Research Projects & Grants', icon: FlaskConical, entries: [] },
  { id: 'supervision', title: 'Research Supervision (Ph.D. / M.Phil.)', icon: GraduationCap, entries: [] },
  { id: 'awards', title: 'Awards & Honours', icon: Award, entries: [] },
  { id: 'memberships', title: 'Professional Memberships', icon: Users2Icon, entries: [] },
  { id: 'extra', title: 'Extension & Co-Curricular Activities', icon: Sparkles, entries: [] },
];

// Simple icon placeholder
function Users2Icon(props: any) {
  return <User {...props} />;
}

export default function AcademicCV({ embedded }: { embedded?: boolean }) {
  const { profile } = useAuth();
  const { ref: heroRef } = useScrollAnimation();
  const printRef = useRef<HTMLDivElement>(null);

  // Pre-fill from profile
  const [personalInfo, setPersonalInfo] = useState({
    name: profile?.full_name || '',
    designation: profile?.designation || '',
    department: profile?.department || '',
    institution: profile?.institution || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    specialization: profile?.specialization || '',
    experience: profile?.experience_years?.toString() || '',
    linkedin: profile?.linkedin_url || '',
    scholar: profile?.google_scholar_url || '',
    objective: '',
  });

  const [sections, setSections] = useState<CVSection[]>(DEFAULT_SECTIONS);
  const [showPreview, setShowPreview] = useState(false);

  const updatePersonal = (key: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [key]: value }));
  };

  const addEntry = (sectionId: string) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? { ...sec, entries: [...sec.entries, { id: crypto.randomUUID(), text: '' }] }
          : sec
      )
    );
  };

  const updateEntry = (sectionId: string, entryId: string, text: string) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? {
              ...sec,
              entries: sec.entries.map(e => (e.id === entryId ? { ...e, text } : e)),
            }
          : sec
      )
    );
  };

  const removeEntry = (sectionId: string, entryId: string) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? { ...sec, entries: sec.entries.filter(e => e.id !== entryId) }
          : sec
      )
    );
  };

  const handlePrint = () => {
    const isProfileComplete = profile && ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'].every(f => {
      const val = (profile as any)[f];
      return val && typeof val === 'string' && val.trim();
    });
    if (profile?.membership_status !== 'active' && !isProfileComplete) {
      toast({
        title: 'Fellowship Required',
        description: 'Downloading or printing PDF CVs requires an active Fellow membership.',
        variant: 'destructive',
      });
      return;
    }
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const { toast } = useToast();

  const handleDocxExport = async () => {
    const isProfileComplete = profile && ['full_name', 'designation', 'institution', 'city', 'state', 'specialization', 'department', 'bio'].every(f => {
      const val = (profile as any)[f];
      return val && typeof val === 'string' && val.trim();
    });
    if (profile?.membership_status !== 'active' && !isProfileComplete) {
      toast({
        title: 'Fellowship Required',
        description: 'Exporting CV as DOCX requires an active Fellow membership.',
        variant: 'destructive',
      });
      return;
    }
    const filled = sections.filter(s => s.entries.some(e => e.text.trim()));
    const head = (text: string) =>
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B08D4C', space: 1 } },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, color: '1A2744', size: 22 })],
      });
    const para = (text: string, opts: { bold?: boolean; size?: number; color?: string; align?: any } = {}) =>
      new Paragraph({
        alignment: opts.align,
        spacing: { after: 80 },
        children: [new TextRun({ text, bold: opts.bold, size: opts.size || 20, color: opts.color || '333333' })],
      });

    const children: Paragraph[] = [
      para(personalInfo.name || 'Your Name', { bold: true, size: 36, color: '1A2744', align: AlignmentType.CENTER }),
      para(
        [personalInfo.designation, personalInfo.department].filter(Boolean).join(' · '),
        { size: 22, color: 'B08D4C', align: AlignmentType.CENTER }
      ),
      para(personalInfo.institution || '', { size: 20, color: '666666', align: AlignmentType.CENTER }),
      para(
        [
          personalInfo.email && `✉ ${personalInfo.email}`,
          personalInfo.phone && `☎ ${personalInfo.phone}`,
          personalInfo.city && `📍 ${personalInfo.city}${personalInfo.state ? ', ' + personalInfo.state : ''}`,
        ].filter(Boolean).join('   '),
        { size: 18, color: '888888', align: AlignmentType.CENTER }
      ),
    ];

    if (personalInfo.objective) {
      children.push(head('Career Summary'));
      children.push(para(personalInfo.objective));
    }

    const meta: string[] = [];
    if (personalInfo.specialization) meta.push(`Specialization: ${personalInfo.specialization}`);
    if (personalInfo.experience) meta.push(`Experience: ${personalInfo.experience} years`);
    if (personalInfo.linkedin) meta.push(`LinkedIn: ${personalInfo.linkedin}`);
    if (personalInfo.scholar) meta.push(`Google Scholar: ${personalInfo.scholar}`);
    if (meta.length) {
      children.push(head('Profile'));
      meta.forEach(m => children.push(para(m)));
    }

    filled.forEach(sec => {
      children.push(head(sec.title));
      sec.entries.filter(e => e.text.trim()).forEach((entry, i) => {
        children.push(para(`${i + 1}. ${entry.text}`));
      });
    });

    children.push(para('', {}));
    children.push(para(
      'Generated via Academisthan Academic CV Generator · academisthan.org',
      { size: 16, color: '999999', align: AlignmentType.CENTER }
    ));

    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [{
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(personalInfo.name || 'Academic-CV').replace(/\s+/g, '-')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CV exported as DOCX' });
  };

  const filledSections = sections.filter(s => s.entries.some(e => e.text.trim()));

  return (
    <div className={cn(embedded ? "" : "min-h-screen bg-background website-page")}>
      {!embedded && <Navbar />}

      {/* Hero */}
      <section className={cn("relative overflow-hidden print:hidden", embedded ? "pt-4 pb-0 bg-transparent" : "pt-28 pb-16 bg-gradient-to-b from-[hsl(228,45%,10%)] via-[hsl(228,45%,14%)] to-background")}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-gold/20 rounded-full blur-[100px]" />
        </div>
        <div ref={heroRef} className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <FileText className="h-4 w-4 text-gold" />
            <span className="text-gold text-sm font-medium">CV Generator</span>
          </div>
          <h1 className={cn("font-serif font-bold mb-2", embedded ? "text-xl md:text-2xl text-foreground" : "text-4xl md:text-5xl lg:text-6xl text-warm")}>
            Academic CV <span className="text-gradient-gold">Generator</span>
          </h1>
          <p className={cn("mx-auto", embedded ? "text-xs md:text-sm max-w-xl text-muted-foreground" : "text-lg max-w-2xl text-warm/60")}>
            Build a professional academic curriculum vitae. Your profile data is pre-filled — 
            add your achievements and generate a print-ready CV instantly.
          </p>
        </div>
      </section>

      {/* Editor */}
      <section className="py-12 md:py-16 print:hidden">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          {/* Personal Info */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="font-serif text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-gold" /> Personal Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Dr. John Doe' },
                { key: 'designation', label: 'Designation', placeholder: 'Associate Professor' },
                { key: 'department', label: 'Department', placeholder: 'Computer Science' },
                { key: 'institution', label: 'Institution', placeholder: 'University of Mumbai' },
                { key: 'email', label: 'Email', placeholder: 'john@university.edu' },
                { key: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                { key: 'city', label: 'City', placeholder: 'Mumbai' },
                { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                { key: 'specialization', label: 'Specialization', placeholder: 'Machine Learning' },
                { key: 'experience', label: 'Years of Experience', placeholder: '15' },
                { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                { key: 'scholar', label: 'Google Scholar URL', placeholder: 'https://scholar.google.com/...' },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    value={(personalInfo as any)[field.key]}
                    onChange={(e) => updatePersonal(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="rounded-xl"
                    maxLength={300}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Career Objective / Summary</Label>
                <Textarea
                  value={personalInfo.objective}
                  onChange={(e) => updatePersonal('objective', e.target.value)}
                  placeholder="A brief academic profile summary..."
                  className="rounded-xl resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Sections */}
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <div key={sec.id} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gold" /> {sec.title}
                  </h2>
                  <Button
                    onClick={() => addEntry(sec.id)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1 border-gold/30 text-gold hover:bg-gold/10"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>

                {sec.entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No entries yet. Click "Add" to add your {sec.title.toLowerCase()}.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sec.entries.map((entry, i) => (
                      <div key={entry.id} className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground mt-3 w-6 shrink-0">{i + 1}.</span>
                        <Input
                          value={entry.text}
                          onChange={(e) => updateEntry(sec.id, entry.id, e.target.value)}
                          placeholder={`Enter ${sec.title.toLowerCase()} detail...`}
                          className="rounded-xl flex-1"
                          maxLength={500}
                        />
                        <Button
                          onClick={() => removeEntry(sec.id, entry.id)}
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              className="rounded-xl gap-2 px-8 h-12"
            >
              <FileText className="h-5 w-5" /> Preview CV
            </Button>
            <Button
              onClick={handleDocxExport}
              variant="outline"
              className="rounded-xl gap-2 px-8 h-12 border-gold/40 text-gold hover:bg-gold/10"
            >
              <FileType2 className="h-5 w-5" /> Export as DOCX
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2 px-8 h-12 text-base font-semibold"
            >
              <Download className="h-5 w-5" /> Download / Print PDF
            </Button>
          </div>
        </div>
      </section>

      {/* Print Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 print:static print:bg-transparent print:backdrop-blur-none print:p-0">
          <div className="relative w-full max-w-3xl print:max-w-none">
            <Button
              onClick={() => setShowPreview(false)}
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-10 bg-background border border-border rounded-full shadow-lg print:hidden"
            >
              <X className="h-5 w-5" />
            </Button>

            <div ref={printRef} className="bg-white text-black p-8 md:p-12 rounded-2xl print:rounded-none print:shadow-none shadow-2xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {/* CV Header */}
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: '#1a2744' }}>
                  {personalInfo.name || 'Your Name'}
                </h1>
                <p className="text-lg mt-1" style={{ color: '#b08d4c' }}>
                  {personalInfo.designation}{personalInfo.department ? ` · ${personalInfo.department}` : ''}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {personalInfo.institution}
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-gray-500">
                  {personalInfo.email && <span>✉ {personalInfo.email}</span>}
                  {personalInfo.phone && <span>☎ {personalInfo.phone}</span>}
                  {personalInfo.city && <span>📍 {personalInfo.city}{personalInfo.state ? `, ${personalInfo.state}` : ''}</span>}
                </div>
              </div>

              {/* Objective */}
              {personalInfo.objective && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#1a2744', borderBottom: '1px solid #b08d4c', paddingBottom: '4px' }}>
                    Career Summary
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {personalInfo.objective}
                  </p>
                </div>
              )}

              {/* Key Details */}
              <div className="mb-6 grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                {personalInfo.specialization && (
                  <div><strong>Specialization:</strong> {personalInfo.specialization}</div>
                )}
                {personalInfo.experience && (
                  <div><strong>Experience:</strong> {personalInfo.experience} years</div>
                )}
                {personalInfo.linkedin && (
                  <div><strong>LinkedIn:</strong> {personalInfo.linkedin}</div>
                )}
                {personalInfo.scholar && (
                  <div><strong>Google Scholar:</strong> {personalInfo.scholar}</div>
                )}
              </div>

              {/* Sections */}
              {filledSections.map(sec => (
                <div key={sec.id} className="mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#1a2744', borderBottom: '1px solid #b08d4c', paddingBottom: '4px' }}>
                    {sec.title}
                  </h2>
                  <ul className="space-y-1.5 text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {sec.entries.filter(e => e.text.trim()).map((entry, i) => (
                      <li key={entry.id} className="flex items-start gap-2">
                        <span className="text-gray-600">{i + 1}.</span>
                        <span>{entry.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Footer */}
              <div className="border-t border-gray-300 pt-4 mt-8 text-center">
                <p className="text-[10px] text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Generated via Academisthan Academic CV Generator · academisthan.com
                </p>
              </div>
            </div>

            {/* Print button inside modal */}
            <div className="flex justify-center mt-4 print:hidden">
              <Button onClick={handlePrint} className="bg-gold text-gold-foreground hover:bg-gold/90 rounded-xl gap-2">
                <Download className="h-4 w-4" /> Print / Save as PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {!embedded && <Footer />}
    </div>
  );
}
