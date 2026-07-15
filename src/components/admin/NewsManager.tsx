import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit3, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from './ImageUpload';

const newsCategories = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'ugc', label: 'UGC Updates' },
  { value: 'regulation', label: 'Policy & Rules' },
  { value: 'gazette', label: 'Gazette' },
  { value: 'recruitment', label: 'Faculty Openings' },
  { value: 'grant', label: 'Grants & Fellowships' },
  { value: 'media', label: 'In the Media' },
  { value: 'autonomous', label: 'Autonomous Colleges' },
];

export function NewsManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', summary: '', content: '', category: 'announcement',
    source_url: '', source_name: '', image_url: '', is_published: true, is_pinned: false,
  });

  const fetchItems = async () => {
    const { data } = await supabase.from('news_updates').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setForm({ title: '', summary: '', content: '', category: 'announcement', source_url: '', source_name: '', image_url: '', is_published: true, is_pinned: false });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: any) => {
    setForm({
      title: item.title, summary: item.summary, content: item.content || '',
      category: item.category, source_url: item.source_url || '', source_name: item.source_name || '',
      image_url: item.image_url || '', is_published: item.is_published, is_pinned: item.is_pinned,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      toast({ title: 'Title and summary required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim().slice(0, 300),
      summary: form.summary.trim().slice(0, 500),
      content: form.content.trim() || null,
      category: form.category,
      source_url: form.source_url.trim() || null,
      source_name: form.source_name.trim() || null,
      image_url: form.image_url.trim() || null,
      is_published: form.is_published,
      is_pinned: form.is_pinned,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('news_updates').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('news_updates').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Updated! ✨' : 'Created! ✨' });
      resetForm();
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    await supabase.from('news_updates').delete().eq('id', id);
    fetchItems();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="rounded-xl gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="w-4 h-4" /> New Item
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-foreground">{editingId ? 'Edit News' : 'New News Item'}</h4>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" maxLength={300} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {newsCategories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Source Name</Label>
              <Input value={form.source_name} onChange={(e) => setForm({ ...form, source_name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Summary</Label>
              <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="rounded-xl resize-none" rows={2} maxLength={500} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Full Content (optional)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl resize-none" rows={4} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Source URL</Label>
              <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className="rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="News Image" folder="news" />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label className="text-xs">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_pinned} onCheckedChange={(v) => setForm({ ...form, is_pinned: v })} />
                <Label className="text-xs">Pinned</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-4 py-3 hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                <Badge variant={item.is_published ? 'default' : 'outline'} className="text-[10px] shrink-0">
                  {item.is_published ? 'Live' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.category} · {new Date(item.created_at).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-1 ml-3">
              <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-8 w-8 p-0">
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
