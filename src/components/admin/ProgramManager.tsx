import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CKEditor from '@/components/ui/CKEditor';
import {
  Plus, Edit3, Trash2, X, Move, BookOpen, FileText, Video as VideoIcon,
  Link as LinkIcon, HelpCircle, Check, ArrowLeft, Loader2, Save, Download, File, AlertCircle, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from './FileUpload';

export function ProgramManager() {
  const { toast } = useToast();
  
  // Views: 'list' | 'create_program' | 'edit_program' | 'program_builder' | 'add_syllabus_step' | 'quiz_builder'
  const [view, setView] = useState<'list' | 'create_program' | 'edit_program' | 'program_builder' | 'add_syllabus_step' | 'quiz_builder'>('list');
  
  // Programs & stats state
  const [programs, setPrograms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active selection states
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  
  // Modules and steps states
  const [modules, setModules] = useState<any[]>([]);
  const [stepsByModule, setStepsByModule] = useState<Record<string, any[]>>({});
  
  // Forms states
  const [programForm, setProgramForm] = useState({
    title: '', description: '', image_url: ''
  });

  const [moduleForm, setModuleForm] = useState({
    title: '', chapter: 'M1', duration_minutes: 30
  });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleFormOpen, setModuleFormOpen] = useState(false);

  const [stepForm, setStepForm] = useState({
    title: '',
    content_type: 'video', // 'video', 'text', 'pdf', 'document', 'link', 'quiz'
    video_url: '',
    text_content: '',
    file_url: '',
    duration_minutes: 15,
    is_preview: false
  });

  // Quiz Editor state
  const [quizName, setQuizName] = useState('');
  const [passingMarks, setPassingMarks] = useState(60);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState(0); // 0 for A, 1 for B, 2 for C, 3 for D

  // Drag and Drop States
  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);
  const [draggedStepIdx, setDraggedStepIdx] = useState<number | null>(null);
  const [draggedStepModuleId, setDraggedStepModuleId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const progs = await api.programs.getAll();
      setPrograms(progs || []);
      const reps = await api.programs.getProgressReports();
      setEnrollments(reps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate stats
  const programStats = useMemo(() => {
    const stats: Record<string, { moduleCount: number; fellowCount: number }> = {};
    programs.forEach(p => {
      stats[p.id] = { moduleCount: p.modules?.length || 0, fellowCount: 0 };
    });
    
    enrollments.forEach(e => {
      if (stats[e.program_id]) {
        stats[e.program_id].fellowCount++;
      }
    });

    return stats;
  }, [programs, enrollments]);

  // Load modules for active program
  const loadModules = async (programId: string) => {
    try {
      const data = await api.programs.getModules(programId);
      setModules(data || []);
      if (data) {
        for (const mod of data) {
          fetchSteps(mod.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSteps = async (moduleId: string) => {
    try {
      const steps = await api.programs.getSyllabusSteps(moduleId);
      setStepsByModule(prev => ({
        ...prev,
        [moduleId]: steps || []
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Program Actions
  const handleSaveProgram = async () => {
    if (!programForm.title.trim()) {
      toast({ title: 'Program name is required', variant: 'destructive' });
      return;
    }

    const payload = {
      title: programForm.title.trim(),
      description: programForm.description.trim(),
      image_url: programForm.image_url.trim(),
      slug: programForm.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim(),
      is_published: true
    };

    try {
      if (selectedProgram) {
        await api.programs.update(selectedProgram.id, payload);
        toast({ title: 'Program updated successfully!' });
      } else {
        await api.programs.create(payload);
        toast({ title: 'Program created successfully!' });
      }
      setView('list');
      loadData();
    } catch (err: any) {
      toast({ title: 'Failed to save program', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This deletes all modules and syllabus steps.`)) return;
    try {
      await api.programs.delete(id);
      toast({ title: 'Program deleted successfully' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Failed to delete program', variant: 'destructive' });
    }
  };

  // 2. Module Actions
  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast({ title: 'Module title is required', variant: 'destructive' });
      return;
    }

    const payload = {
      title: moduleForm.title.trim(),
      chapter: moduleForm.chapter.trim() || `M${modules.length + 1}`,
      duration_minutes: moduleForm.duration_minutes || 0,
      sort_order: modules.length
    };

    try {
      if (editingModuleId) {
        await api.programs.updateModule(editingModuleId, payload);
        toast({ title: 'Module updated successfully!' });
      } else {
        await api.programs.addModule(selectedProgram.id, payload);
        toast({ title: 'Module added successfully!' });
      }
      setModuleFormOpen(false);
      setModuleForm({ title: '', chapter: `M${modules.length + 1}`, duration_minutes: 30 });
      setEditingModuleId(null);
      loadModules(selectedProgram.id);
    } catch (err: any) {
      toast({ title: 'Failed to save module', variant: 'destructive' });
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its syllabus steps?')) return;
    try {
      await api.programs.deleteModule(moduleId);
      toast({ title: 'Module deleted' });
      loadModules(selectedProgram.id);
    } catch (err) {
      toast({ title: 'Failed to delete module', variant: 'destructive' });
    }
  };

  // Module Drag and Drop reordering
  const handleModuleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedModuleIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleModuleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedModuleIdx === null || draggedModuleIdx === targetIdx) return;

    const list = [...modules];
    const [draggedItem] = list.splice(draggedModuleIdx, 1);
    list.splice(targetIdx, 0, draggedItem);
    setModules(list);

    try {
      await api.programs.reorderModules(selectedProgram.id, list.map(m => m.id));
    } catch (err) {
      toast({ title: 'Failed to save module order', variant: 'destructive' });
      loadModules(selectedProgram.id);
    }
    setDraggedModuleIdx(null);
  };

  // 3. Syllabus Steps Actions
  const handleSaveStep = async () => {
    if (!stepForm.title.trim()) {
      toast({ title: 'Syllabus title is required', variant: 'destructive' });
      return;
    }

    const payload = {
      title: stepForm.title.trim(),
      content_type: stepForm.content_type,
      video_url: stepForm.content_type === 'video' ? stepForm.video_url : null,
      text_content: stepForm.content_type === 'text' ? stepForm.text_content : null,
      file_url: (stepForm.content_type === 'pdf' || stepForm.content_type === 'document' || stepForm.content_type === 'link') ? stepForm.file_url : null,
      duration_minutes: stepForm.duration_minutes || 10,
      quiz_questions: null,
      passing_score: 80
    };

    try {
      if (selectedStep) {
        await api.programs.updateSyllabusStep(selectedStep.id, payload);
        toast({ title: 'Syllabus item updated!' });
      } else {
        await api.programs.addSyllabusStep(selectedModule.id, payload);
        toast({ title: 'Syllabus item added!' });
      }
      setView('program_builder');
      loadModules(selectedProgram.id);
    } catch (err: any) {
      toast({ title: 'Failed to save syllabus item', variant: 'destructive' });
    }
  };

  const handleDeleteStep = async (stepId: string, moduleId: string) => {
    if (!confirm('Are you sure you want to delete this syllabus step?')) return;
    try {
      await api.programs.deleteSyllabusStep(stepId);
      toast({ title: 'Syllabus item deleted' });
      loadModules(selectedProgram.id);
    } catch (err) {
      toast({ title: 'Failed to delete syllabus item', variant: 'destructive' });
    }
  };

  // Step Drag and Drop reordering
  const handleStepDragStart = (e: React.DragEvent, idx: number, moduleId: string) => {
    setDraggedStepIdx(idx);
    setDraggedStepModuleId(moduleId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDrop = async (e: React.DragEvent, targetIdx: number, moduleId: string) => {
    e.preventDefault();
    if (draggedStepIdx === null || draggedStepModuleId !== moduleId || draggedStepIdx === targetIdx) return;

    const list = [...(stepsByModule[moduleId] || [])];
    const [draggedItem] = list.splice(draggedStepIdx, 1);
    list.splice(targetIdx, 0, draggedItem);

    setStepsByModule(prev => ({
      ...prev,
      [moduleId]: list
    }));

    try {
      await api.programs.reorderSyllabusSteps(moduleId, list.map(s => s.id));
    } catch (err) {
      toast({ title: 'Failed to save syllabus order', variant: 'destructive' });
      fetchSteps(moduleId);
    }
    setDraggedStepIdx(null);
    setDraggedStepModuleId(null);
  };

  // 4. Quiz Builder Actions
  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      toast({ title: 'Question description is required', variant: 'destructive' });
      return;
    }
    if (options.some(o => !o.trim())) {
      toast({ title: 'Please fill all options A, B, C, D', variant: 'destructive' });
      return;
    }

    const correctVal = options[correctAnswerIdx] || options[0];
    const newQ = {
      question: questionText.trim(),
      options: options.map(o => o.trim()),
      correct_answer: correctVal
    };

    setQuizQuestions(prev => [...prev, newQ]);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswerIdx(0);
    toast({ title: 'Question added to list!' });
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuiz = async () => {
    if (!quizName.trim()) {
      toast({ title: 'Quiz title is required', variant: 'destructive' });
      return;
    }
    if (quizQuestions.length === 0) {
      toast({ title: 'Please add at least one question to the quiz', variant: 'destructive' });
      return;
    }

    const payload = {
      title: quizName.trim(),
      content_type: 'quiz',
      quiz_questions: JSON.stringify(quizQuestions),
      passing_score: passingMarks,
      duration_minutes: quizQuestions.length * 2
    };

    try {
      if (selectedStep) {
        await api.programs.updateSyllabusStep(selectedStep.id, payload);
        toast({ title: 'Quiz updated successfully! 📝' });
      } else {
        await api.programs.addSyllabusStep(selectedModule.id, payload);
        toast({ title: 'Quiz created successfully! 📝' });
      }
      setView('program_builder');
      loadModules(selectedProgram.id);
    } catch (err: any) {
      toast({ title: 'Failed to save quiz', variant: 'destructive' });
    }
  };

  const handleGoBackToBuilder = () => {
    setView('program_builder');
  };

  if (loading && programs.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      
      {/* ═══ VIEW 1: ADMIN - PROGRAM LIST VIEW (Slide 3 Screen 1) ═══ */}
      {view === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 w-full">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-serif text-base font-bold text-navy">Programs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage all programs</p>
            </div>
            <Button
              onClick={() => {
                setSelectedProgram(null);
                setProgramForm({ title: '', description: '', image_url: '' });
                setView('create_program');
              }}
              className="btn-primary"
            >
              <Plus className="w-3.5 h-3.5" /> Create Program
            </Button>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Program Name</th>
                  <th className="p-4 text-center">Modules</th>
                  <th className="p-4 text-center">Fellows</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programs.map((prog) => {
                  const stats = programStats[prog.id] || { moduleCount: 0, fellowCount: 0 };
                  const isPublished = prog.is_published || prog.status === 'published';
                  return (
                    <tr key={prog.id} className="hover:bg-slate-50/40 transition-colors">
                      <td 
                        onClick={() => {
                          setSelectedProgram(prog);
                          loadModules(prog.id);
                          setView('program_builder');
                        }}
                        className="p-4 font-semibold text-slate-800 hover:text-blue-600 cursor-pointer text-xs"
                      >
                        {prog.title}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {prog.modules?.length || 0}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {stats.fellowCount}
                      </td>
                      <td className="p-4 text-center">
                        <Badge className={isPublished ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}>
                          {isPublished ? 'Active' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            onClick={() => {
                              setSelectedProgram(prog);
                              setProgramForm({
                                title: prog.title,
                                description: prog.description || '',
                                image_url: prog.image_url || ''
                              });
                              setView('edit_program');
                            }}
                            className="btn-warning btn-xs"
                          >
                            Edit Info
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedProgram(prog);
                              loadModules(prog.id);
                              setView('program_builder');
                            }}
                            className="btn-outline btn-xs"
                          >
                            Builder
                          </Button>
                          <Button
                            onClick={() => handleDeleteProgram(prog.id, prog.title)}
                            className="btn-danger btn-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {programs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic text-[11px]">
                      No programs created yet. Click "+ Create Program" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW 2: CREATE / EDIT PROGRAM (Slide 3 Screen 2) ═══ */}
      {(view === 'create_program' || view === 'edit_program') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Programs</span>
              <h3 className="font-serif text-base font-bold text-navy mt-0.5">
                {view === 'create_program' ? 'Create Program' : 'Edit Program'}
              </h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full w-8 h-8"><X className="w-4 h-4" /></Button>
          </div>

          <div className="space-y-4 w-full max-w-2xl">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Program Name *</Label>
              <Input
                value={programForm.title}
                onChange={e => setProgramForm({ ...programForm, title: e.target.value })}
                placeholder="Enter program name"
                className="rounded-xl text-xs h-9 bg-slate-50/20"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Description</Label>
              <Textarea
                value={programForm.description}
                onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                placeholder="Enter program description..."
                className="rounded-xl text-xs resize-none bg-slate-50/20"
                rows={4}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cover Image</Label>
              <Input
                value={programForm.image_url}
                onChange={e => setProgramForm({ ...programForm, image_url: e.target.value })}
                placeholder="https://academisthan.org/images/cover.jpg (or drop URL here)"
                className="rounded-xl text-xs h-9 bg-slate-50/20"
              />
              <p className="text-[9px] text-slate-400 mt-1">Provide an image URL or path for the course dashboard banner.</p>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-100">
              <Button
                onClick={handleSaveProgram}
                className="btn-success"
              >
                Save Program
              </Button>
              <Button
                onClick={() => setView('list')}
                className="btn-outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW 3: PROGRAM BUILDER (Slide 3 Screen 3) ═══ */}
      {view === 'program_builder' && selectedProgram && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 w-full">
          {/* Header breadcrumbs & actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                Programs <ChevronRight className="w-3 h-3 text-slate-300" /> {selectedProgram.title} <ChevronRight className="w-3 h-3 text-slate-300" /> <span className="text-slate-600">Builder</span>
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="font-serif text-lg font-bold text-navy">{selectedProgram.title}</h2>
                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold uppercase py-0.5">Active</Badge>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Drag & drop to reorder modules and syllabus</p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setView('list')}
                className="btn-outline"
              >
                Back to Programs
              </Button>
              <Button
                onClick={() => {
                  setModuleForm({ title: '', chapter: `M${modules.length + 1}`, duration_minutes: 30 });
                  setEditingModuleId(null);
                  setModuleFormOpen(true);
                }}
                className="btn-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Add Module
              </Button>
            </div>
          </div>

          {/* Module Form Inline Edit Drawer */}
          {moduleFormOpen && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 w-full max-w-xl animate-in slide-in-from-top duration-200">
              <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider border-b pb-1">
                {editingModuleId ? 'Edit Module details' : 'Create Module'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Module Title *</Label>
                  <Input
                     placeholder="e.g. Foundations of AI"
                     value={moduleForm.title}
                     onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                     className="rounded-lg text-xs h-8 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase">Chapter/Unit (M1, M2...)</Label>
                  <Input
                     placeholder="e.g. M1"
                     value={moduleForm.chapter}
                     onChange={e => setModuleForm({ ...moduleForm, chapter: e.target.value })}
                     className="rounded-lg text-xs h-8 bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1.5">
                <Button onClick={handleSaveModule} className="btn-success btn-sm">
                  Save Module
                </Button>
                <Button onClick={() => setModuleFormOpen(false)} className="btn-outline btn-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Full-width Module List */}
          <div className="space-y-4 w-full">
            {modules.map((mod, mIdx) => {
              const stepList = stepsByModule[mod.id] || [];
              return (
                <div
                  key={mod.id}
                  draggable
                  onDragStart={(e) => handleModuleDragStart(e, mIdx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleModuleDrop(e, mIdx)}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full"
                >
                  {/* Module Header Bar - Full Width spacing */}
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between gap-4 group">
                    <div className="flex items-center gap-3 cursor-grab active:cursor-grabbing min-w-0 flex-1">
                      <Move className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-700 uppercase shrink-0">{mod.chapter || `M${mIdx + 1}`} - </span>
                        <h4 className="text-xs font-bold text-navy truncate">{mod.title}</h4>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 font-semibold border-none text-[9px] px-2 py-0.5 ml-2">
                        {stepList.length} items
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        onClick={() => {
                          setSelectedModule(mod);
                          setStepForm({
                            title: '',
                            content_type: 'video',
                            video_url: '',
                            text_content: '',
                            file_url: '',
                            duration_minutes: 15,
                            is_preview: false
                          });
                          setSelectedStep(null);
                          setView('add_syllabus_step');
                        }}
                        className="btn-outline btn-xs"
                      >
                        <Plus className="w-3 h-3" /> Add Syllabus
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingModuleId(mod.id);
                          setModuleForm({
                            title: mod.title,
                            chapter: mod.chapter || `M${mIdx + 1}`,
                            duration_minutes: mod.duration_minutes || 30
                          });
                          setModuleFormOpen(true);
                        }}
                        className="btn-warning btn-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="btn-danger btn-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Syllabus steps - Full width list rows */}
                  <div className="bg-white divide-y divide-slate-100/70 w-full">
                    {stepList.map((step, sIdx) => {
                      let typeLabel = step.content_type;
                      let durationText = `${step.duration_minutes || 0} min`;
                      if (step.content_type === 'quiz') {
                        let questionsCount = 0;
                        try {
                          questionsCount = step.quiz_questions
                            ? (typeof step.quiz_questions === 'string' ? JSON.parse(step.quiz_questions) : step.quiz_questions).length
                            : 0;
                        } catch (e) {}
                        durationText = `${questionsCount} Questions`;
                      }

                      return (
                        <div
                          key={step.id}
                          draggable
                          onDragStart={(e) => handleStepDragStart(e, sIdx, mod.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleStepDrop(e, sIdx, mod.id)}
                          className="flex items-center justify-between px-6 py-3.5 text-xs hover:bg-slate-50/50 group transition-all w-full gap-4"
                        >
                          <div className="flex items-center gap-3.5 cursor-grab active:cursor-grabbing min-w-0 flex-1">
                            <Move className="w-4 h-4 text-slate-300 group-hover:text-slate-450 shrink-0" />
                            <span className="text-slate-400 font-mono text-[10px] w-4 shrink-0">{sIdx + 1}.</span>
                            <span className="text-slate-800 font-semibold truncate">{step.title}</span>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            {/* Content type label */}
                            <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-50 px-2 py-0.5 border border-slate-100 rounded-md select-none shrink-0">
                              {typeLabel}
                            </span>
                            
                            {/* Duration label */}
                            <span className="text-[10px] text-slate-450 font-medium shrink-0 w-20 text-right">
                              {durationText}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                onClick={() => {
                                  setSelectedModule(mod);
                                  setSelectedStep(step);
                                  if (step.content_type === 'quiz') {
                                    setQuizName(step.title);
                                    setPassingMarks(step.passing_score || 60);
                                    let qList = [];
                                    try {
                                      qList = typeof step.quiz_questions === 'string' ? JSON.parse(step.quiz_questions) : (step.quiz_questions || []);
                                    } catch (e) {}
                                    setQuizQuestions(qList);
                                    setView('quiz_builder');
                                  } else {
                                    setStepForm({
                                      title: step.title,
                                      content_type: step.content_type,
                                      video_url: step.video_url || '',
                                      text_content: step.text_content || '',
                                      file_url: step.file_url || '',
                                      duration_minutes: step.duration_minutes || 15,
                                      is_preview: !!step.is_preview
                                    });
                                    setView('add_syllabus_step');
                                  }
                                }}
                                className="btn-warning btn-xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteStep(step.id, mod.id)}
                                className="btn-danger btn-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {stepList.length === 0 && (
                      <div className="text-center py-6 text-slate-400 italic text-[11px] select-none bg-slate-50/15">
                        No syllabus items configured. Click "+ Add Syllabus" to add video lectures, readings, or quizzes.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {modules.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <BookOpen className="w-12 h-12 text-slate-350 mb-3 animate-pulse" />
                <h4 className="font-semibold text-slate-700 text-xs">No Modules Created</h4>
                <p className="text-[10px] max-w-xs mt-1 text-slate-400">Create your first module (M1 - Foundations) using the "+ Add Module" button above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ VIEW 4: ADD / EDIT SYLLABUS - DEDICATED FULL WIDTH PAGE (Slide 3 Screen 4) ═══ */}
      {view === 'add_syllabus_step' && selectedModule && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6 w-full max-w-4xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Module: {selectedModule.chapter} - {selectedModule.title}
              </span>
              <h3 className="font-serif text-base font-bold text-navy mt-0.5">
                {selectedStep ? 'Edit Syllabus' : 'Add Syllabus'}
              </h3>
            </div>
            <Button
              onClick={handleGoBackToBuilder}
              className="btn-outline btn-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Builder
            </Button>
          </div>

          <div className="space-y-5 w-full">
            {/* Title Input */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Title *</Label>
              <Input
                value={stepForm.title}
                onChange={e => setStepForm({ ...stepForm, title: e.target.value })}
                placeholder="Enter syllabus title"
                className="rounded-xl text-xs h-9 bg-slate-50/20 max-w-xl"
                required
              />
            </div>

            {/* Content Type Selector - Grid Card Style (Screen 4 Layout) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Content Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {[
                  { value: 'video', label: 'Video', icon: VideoIcon, color: 'text-blue-500 border-blue-100 bg-blue-50/5' },
                  { value: 'text', label: 'Text', icon: FileText, color: 'text-emerald-500 border-emerald-100 bg-emerald-50/5' },
                  { value: 'pdf', label: 'PDF', icon: Download, color: 'text-rose-500 border-rose-100 bg-rose-50/5' },
                  { value: 'document', label: 'Document', icon: File, color: 'text-amber-500 border-amber-100 bg-amber-50/5' },
                  { value: 'link', label: 'External Link', icon: LinkIcon, color: 'text-cyan-500 border-cyan-100 bg-cyan-50/5' },
                  { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-violet-500 border-violet-100 bg-violet-50/5' }
                ].map(type => {
                  const Icon = type.icon;
                  const isSelected = stepForm.content_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        if (type.value === 'quiz') {
                          setQuizName(stepForm.title || `${selectedModule.chapter} Quiz`);
                          setPassingMarks(60);
                          setQuizQuestions([]);
                          setView('quiz_builder');
                        } else {
                          setStepForm({ ...stepForm, content_type: type.value as any });
                        }
                      }}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center group",
                        isSelected
                          ? "bg-navy border-navy text-warm shadow-md"
                          : `${type.color} text-slate-650 hover:bg-slate-50 border-slate-100`
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isSelected ? "text-gold" : "")} />
                      <span className="text-[9px] font-bold tracking-wide uppercase">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">Estimated Duration (mins)</Label>
              <Input
                type="number"
                value={stepForm.duration_minutes}
                onChange={e => setStepForm({ ...stepForm, duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-28 rounded-xl text-xs h-9 bg-slate-50/20"
              />
            </div>

            {/* Conditional input panels - Full width spacing */}
            <div className="w-full">
              {/* Type: Video */}
              {stepForm.content_type === 'video' && (
                <div className="space-y-4 bg-slate-50/50 border border-slate-250/70 rounded-2xl p-5 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">Video Source</span>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">YouTube Link *</Label>
                    <Input
                      value={stepForm.video_url}
                      onChange={e => setStepForm({ ...stepForm, video_url: e.target.value })}
                      placeholder="e.g. https://www.youtube.com/watch?v=xxxx"
                      className="rounded-xl text-xs h-9 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Type: Text */}
              {stepForm.content_type === 'text' && (
                <div className="space-y-2 w-full">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">CKEditor 5 Content</Label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white w-full min-h-[350px]">
                    <CKEditor
                      value={stepForm.text_content || ''}
                      onChange={data => setStepForm({ ...stepForm, text_content: data })}
                    />
                  </div>
                </div>
              )}

              {/* Type: PDF */}
              {stepForm.content_type === 'pdf' && (
                <div className="space-y-4 bg-slate-50/50 border border-slate-250/70 rounded-2xl p-5 w-full text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">PDF File</span>
                  <FileUpload
                    value={stepForm.file_url || ''}
                    onChange={url => setStepForm({ ...stepForm, file_url: url })}
                    label="Upload PDF or Paste URL *"
                    folder="syllabus-pdfs"
                    accept=".pdf"
                  />
                </div>
              )}

              {/* Type: Document */}
              {stepForm.content_type === 'document' && (
                <div className="space-y-4 bg-slate-50/50 border border-slate-250/70 rounded-2xl p-5 w-full text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">Document details</span>
                  <FileUpload
                    value={stepForm.file_url || ''}
                    onChange={url => setStepForm({ ...stepForm, file_url: url })}
                    label="Upload Document or Paste URL *"
                    folder="syllabus-documents"
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                </div>
              )}

              {/* Type: External Link */}
              {stepForm.content_type === 'link' && (
                <div className="space-y-4 bg-slate-50/50 border border-slate-250/70 rounded-2xl p-5 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-1">Web Link</span>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">External URL *</Label>
                    <Input
                      value={stepForm.file_url}
                      onChange={e => setStepForm({ ...stepForm, file_url: e.target.value })}
                      placeholder="https://wikipedia.org/..."
                      className="rounded-xl text-xs h-9 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox preview */}
            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="is_preview_chk"
                checked={stepForm.is_preview}
                onChange={e => setStepForm({ ...stepForm, is_preview: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-350 focus:ring-blue-500 rounded"
              />
              <label htmlFor="is_preview_chk" className="text-xs text-slate-600 font-semibold cursor-pointer">
                Make this content free preview
              </label>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2.5 pt-4 border-t border-slate-100">
              <Button
                onClick={handleSaveStep}
                className="btn-success"
              >
                Save Syllabus
              </Button>
              <Button
                onClick={handleGoBackToBuilder}
                className="btn-outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW 5: DEDICATED QUIZ BUILDER PAGE (Slide 3 Screen 5) ═══ */}
      {view === 'quiz_builder' && selectedModule && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6 w-full max-w-4xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Module: {selectedModule.chapter} - {selectedModule.title}
              </span>
              <h3 className="font-serif text-base font-bold text-navy mt-0.5">Add Quiz</h3>
            </div>
            <Button
              onClick={handleGoBackToBuilder}
              className="btn-outline btn-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Builder
            </Button>
          </div>

          <div className="space-y-5 w-full">
            {/* Quiz Title & Passing Marks inline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Quiz Title *</Label>
                <Input
                  value={quizName}
                  onChange={e => setQuizName(e.target.value)}
                  placeholder="Enter quiz title"
                  className="rounded-xl text-xs h-9 bg-slate-50/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Passing Marks (%) *</Label>
                <Input
                  type="number"
                  value={passingMarks}
                  onChange={e => setPassingMarks(parseInt(e.target.value) || 60)}
                  placeholder="60"
                  className="rounded-xl text-xs h-9 bg-slate-50/20"
                  min={1}
                  max={100}
                />
              </div>
            </div>

            {/* MCQ list area */}
            <div className="space-y-3.5 max-w-3xl">
              {quizQuestions.map((q, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-4 flex justify-between items-start gap-3 bg-slate-50/20 group">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Question {idx + 1}</span>
                    <p className="text-xs font-semibold text-slate-800">{q.questionText}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className="text-[11px] flex items-center gap-1.5 text-slate-500">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            q.correctAnswerIdx === oIdx ? "bg-emerald-500" : "bg-slate-300"
                          )} />
                          <span className={q.correctAnswerIdx === oIdx ? "font-semibold text-emerald-600" : ""}>
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveQuestion(idx)}
                    className="btn-danger btn-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {quizQuestions.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic text-[11px] border border-dashed border-slate-200 rounded-xl">
                  No questions designed. Append questions below.
                </div>
              )}
            </div>

            {/* MCQ Creator Card Widget - styled exactly like mockup Slide 3 Screen 5 */}
            <div className="border border-slate-200 rounded-2xl bg-white p-5 space-y-4 shadow-sm w-full">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Question Builder</span>
                <span className="text-[9px] text-slate-400 font-semibold select-none">Question {quizQuestions.length + 1}</span>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-slate-500 uppercase">Question description *</Label>
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Enter your question here"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 h-16 bg-slate-50/15"
                />
              </div>

              {/* Options inputs with radio buttons right next to them */}
              <div className="space-y-2.5">
                <Label className="text-[9px] font-bold text-slate-500 uppercase">Options (Select radio for Correct Answer)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, idx) => {
                    const isChecked = correctAnswerIdx === idx;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3 py-1.5 hover:border-slate-350 transition-colors bg-white">
                        <input
                          type="radio"
                          name="quiz_correct_radio"
                          checked={isChecked}
                          onChange={() => setCorrectAnswerIdx(idx)}
                          className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={opt}
                            onChange={e => {
                              const updated = [...options];
                              updated[idx] = e.target.value;
                              setOptions(updated);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            className="border-0 bg-transparent p-0 text-xs h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  onClick={handleAddQuestion}
                  className="btn-primary"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </Button>
              </div>
            </div>

            {/* Quiz actions footer */}
            <div className="flex gap-2.5 pt-4 border-t border-slate-100">
              <Button
                onClick={handleSaveQuiz}
                className="btn-success"
              >
                Save Quiz
              </Button>
              <Button
                onClick={handleGoBackToBuilder}
                className="btn-outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
