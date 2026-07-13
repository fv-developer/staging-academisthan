import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit3, Trash2, Eye, EyeOff, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from './ImageUpload';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
};

const categories = [
  { value: 'general', label: 'General' },
  { value: 'nep', label: 'NEP 2020' },
  { value: 'research', label: 'Research' },
  { value: 'career', label: 'Career Growth' },
  { value: 'technology', label: 'EdTech' },
  { value: 'policy', label: 'Policy & Rules' },
  { value: 'teaching', label: 'Teaching' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 100);
}

export function BlogManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    summary: '',
    category: 'general',
    tags: '',
    cover_image_url: '',
    is_published: false,
    is_featured: false,
  });

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const resetForm = () => {
    setForm({ title: '', slug: '', content: '', summary: '', category: 'general', tags: '', cover_image_url: '', is_published: false, is_featured: false });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary,
      category: post.category,
      tags: post.tags?.join(', ') || '',
      cover_image_url: post.cover_image_url || '',
      is_published: post.is_published,
      is_featured: post.is_featured,
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    const payload = {
      title: form.title.trim().slice(0, 200),
      slug,
      content: form.content.trim(),
      summary: form.summary.trim().slice(0, 500),
      category: form.category,
      tags,
      cover_image_url: form.cover_image_url.trim() || null,
      is_published: form.is_published,
      is_featured: form.is_featured,
      author_id: user?.id,
      author_name: profile?.full_name || 'Academisthan',
      published_at: form.is_published ? new Date().toISOString() : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Error saving post', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Post updated! ✨' : 'Post created! ✨' });
      resetForm();
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : null,
      })
      .eq('id', post.id);
    if (!error) fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{posts.length} post(s)</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="rounded-xl gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-foreground">{editingId ? 'Edit Post' : 'New Blog Post'}</h4>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} className="rounded-xl" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Slug (URL)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Summary (shown in card preview)</Label>
              <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="rounded-xl resize-none" rows={2} maxLength={500} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl resize-none font-mono text-xs" rows={12} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="NEP, Research, UGC" className="rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} folder="blog-covers" />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label className="text-xs">Publish</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label className="text-xs">Featured</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90">
              {saving ? 'Saving...' : editingId ? 'Update Post' : 'Create Post'}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-2">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-4 py-3 hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">{post.title}</span>
                {post.is_featured && <Star className="w-3.5 h-3.5 text-gold shrink-0" />}
                <Badge variant={post.is_published ? 'default' : 'outline'} className="text-[10px] shrink-0">
                  {post.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{post.category} · {new Date(post.created_at).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <Button variant="ghost" size="sm" onClick={() => togglePublish(post)} className="h-8 w-8 p-0">
                {post.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startEdit(post)} className="h-8 w-8 p-0">
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
