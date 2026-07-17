import { useState, useEffect } from 'react';
import { blogs } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CKEditor from '@/components/ui/CKEditor';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Plus, Search, Calendar, Tag, AlertCircle,
  Eye, Edit3, Trash2, ArrowLeft, Check, Loader2, Upload
} from 'lucide-react';

export default function BlogModule() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'General',
    cover_image_url: '',
    status: 'draft',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverBase64, setCoverBase64] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await blogs.getMyPosts();
      setMyPosts(res || []);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error fetching blogs', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const handleOpenCreate = () => {
    setForm({
      title: '',
      summary: '',
      content: '',
      category: 'General',
      cover_image_url: '',
      status: 'draft',
      tags: [],
    });
    setTagInput('');
    setCoverFile(null);
    setCoverBase64('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setActiveView('create');
  };

  const handleOpenEdit = (post: any) => {
    const predefined = ["General", "Research & Analytics", "Teaching Methodologies", "AI in Education", "Academic Policies"];
    const isCustom = post.category && !predefined.includes(post.category);
    
    setForm({
      title: post.title || '',
      summary: post.summary || '',
      content: post.content || '',
      category: post.category || 'General',
      cover_image_url: post.cover_image_url || '',
      status: post.status || 'draft',
      tags: post.tags || [],
    });
    setSelectedPost(post);
    setTagInput('');
    setCoverFile(null);
    setCoverBase64('');
    setIsCustomCategory(isCustom);
    setCustomCategory(isCustom ? post.category : '');
    setActiveView('edit');
  };

  const handleOpenView = (post: any) => {
    setSelectedPost(post);
    setActiveView('view');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File size limit exceeded', description: 'Cover image must be under 2MB', variant: 'destructive' });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setCoverFile(file);
      setCoverBase64(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const addTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !form.tags.includes(clean)) {
      setForm(p => ({ ...p, tags: [...p.tags, clean] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await blogs.delete(postId);
      toast({ title: 'Post deleted successfully' });
      fetchMyPosts();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async (submitStatus: 'draft' | 'published') => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and Content are required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCoverUrl = form.cover_image_url;

      if (coverFile && coverBase64) {
        const uploadRes = await blogs.uploadCover(coverBase64);
        finalCoverUrl = uploadRes.coverImageUrl || uploadRes.imageUrl;
      }

      const payload = {
        ...form,
        cover_image_url: finalCoverUrl,
        status: submitStatus, // 'draft' or 'published' (which goes to 'pending_review' in backend for fellows)
      };

      if (activeView === 'edit' && selectedPost) {
        await blogs.update(selectedPost.id, payload);
        toast({ title: 'Blog post updated successfully' });
      } else {
        await blogs.create(payload);
        toast({ 
          title: submitStatus === 'published' ? 'Blog submitted for review' : 'Draft saved successfully',
          description: submitStatus === 'published' ? 'Awaiting administrator moderation.' : 'You can find it under your draft blogs.'
        });
      }

      setActiveView('list');
      fetchMyPosts();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && myPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-sm">Loading your blogs...</p>
      </div>
    );
  }

  // ─── 1. VIEW BLOG POST DETAIL ───
  if (activeView === 'view' && selectedPost) {
    return (
      <div className="p-5 md:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Button onClick={() => setActiveView('list')} variant="ghost" size="sm" className="rounded-xl h-8 gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to List
          </Button>
          {selectedPost.status !== 'published' && (
            <Button onClick={() => handleOpenEdit(selectedPost)} size="sm" variant="outline" className="rounded-xl h-8 gap-1.5 text-xs">
              <Edit3 className="w-3.5 h-3.5" /> Edit Post
            </Button>
          )}
        </div>

        {selectedPost.cover_image_url && (
          <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden border border-border">
            <img src={selectedPost.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-gold/15 text-gold px-2.5 py-0.5 rounded-full">
              {selectedPost.category || 'General'}
            </span>
            <span className="text-muted-foreground text-xs">
              · {new Date(selectedPost.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h1 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-tight">{selectedPost.title}</h1>
          <p className="text-xs text-muted-foreground italic border-l-2 border-gold/40 pl-3">{selectedPost.summary}</p>
        </div>

        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap border-t border-border pt-5"
          dangerouslySetInnerHTML={{ __html: selectedPost.content }}
        />

        {selectedPost.tags && selectedPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
            {selectedPost.tags.map((t: string) => (
              <span key={t} className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {t}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── 2. CREATE & EDIT FORM ───
  if (activeView === 'create' || activeView === 'edit') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); }} className="p-5 md:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-foreground">
              {activeView === 'edit' ? 'Edit Blog Post' : 'Create New Blog'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share your insights, research breakthroughs, or classroom tools.
            </p>
          </div>
          <Button type="button" onClick={() => setActiveView('list')} variant="ghost" size="sm" className="rounded-xl h-8 gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Blog Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="E.g. Enhancing Student Engagement with AI Calculators"
              className="rounded-xl h-9 text-xs"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Category</Label>
                <button
                  type="button"
                  onClick={() => {
                    const toggleState = !isCustomCategory;
                    setIsCustomCategory(toggleState);
                    if (toggleState) {
                      setForm(p => ({ ...p, category: customCategory || '' }));
                    } else {
                      setForm(p => ({ ...p, category: 'General' }));
                    }
                  }}
                  className="text-gold text-[10px] font-bold hover:underline"
                >
                  {isCustomCategory ? 'Select Predefined' : '+ Custom Category'}
                </button>
              </div>
              {isCustomCategory ? (
                <Input
                  value={customCategory}
                  onChange={e => {
                    setCustomCategory(e.target.value);
                    setForm(p => ({ ...p, category: e.target.value }));
                  }}
                  placeholder="Enter custom category name..."
                  className="rounded-xl h-9 text-xs"
                  required
                />
              ) : (
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="General">General</option>
                  <option value="Research & Analytics">Research & Analytics</option>
                  <option value="Teaching Methodologies">Teaching Methodologies</option>
                  <option value="AI in Education">AI in Education</option>
                  <option value="Academic Policies">Academic Policies</option>
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Cover Image URL (or upload below)</Label>
              <Input
                value={form.cover_image_url}
                onChange={e => setForm(p => ({ ...p, cover_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cover Image File (Optional)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('cover-file-input')?.click()}
                className="rounded-xl h-9 text-xs gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </Button>
              <input
                type="file"
                id="cover-file-input"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {coverFile ? coverFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Summary / Short Snippet *</Label>
            <Textarea
              value={form.summary}
              onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
              placeholder="A brief 1-2 sentence overview of your post..."
              className="rounded-xl min-h-16 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Blog Content *</Label>
            <CKEditor
              value={form.content}
              onChange={val => setForm(p => ({ ...p, content: val }))}
              placeholder="Start writing your article here..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
                className="rounded-xl h-9 text-xs"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm" className="rounded-xl h-9 text-xs">
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {form.tags.map(t => (
                  <span key={t} className="text-[9px] font-semibold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-lg flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-rose-500 hover:text-rose-700 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="rounded-xl h-10 px-4 text-xs gap-1.5"
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('published')}
            className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-10 px-5 text-xs gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Submit for Review
              </>
            )}
          </Button>
        </div>
      </form>
    );
  }

  // ─── 3. BLOG POSTS LIST VIEW ───
  const statusBadges: Record<string, JSX.Element> = {
    published: <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</span>,
    pending_review: <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</span>,
    draft: <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-muted text-muted-foreground border-border">Draft</span>,
    rejected: <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-rose-500/10 text-rose-500 border-rose-500/20">Rejected</span>,
  };

  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-foreground">My Blog Articles</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Write new articles and track their moderation status.</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 h-9 gap-1.5 text-xs">
          <Plus className="w-4 h-4" /> Write Article
        </Button>
      </div>

      {myPosts.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/25">
            <FileText className="w-5 h-5 text-gold" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-foreground">No blog posts found</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              You haven't written any articles yet. Share your experience or insights with the Academisthan community today!
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[9px]">
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {myPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium text-foreground max-w-[200px] truncate">{post.title}</td>
                    <td className="p-4 text-muted-foreground">{post.category || 'General'}</td>
                    <td className="p-4">{statusBadges[post.status] || post.status}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button
                          onClick={() => handleOpenView(post)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {post.status !== 'published' && (
                          <Button
                            onClick={() => handleOpenEdit(post)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(post.status === 'draft' || post.status === 'rejected') && (
                          <Button
                            onClick={() => handleDelete(post.id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
