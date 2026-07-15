import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit3, Trash2, Eye, EyeOff, Star, X, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from './ImageUpload';
import { EventAttendanceManager } from './EventAttendanceManager';

const eventTypes = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'awards', label: 'Awards Ceremony' },
  { value: 'roundtable', label: 'Roundtable' },
  { value: 'fdp', label: 'FDP' },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100);
}

export function EventManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', slug: '', description: '', content: '',
    event_date: '', end_date: '', location: '', venue: '',
    event_type: 'conference', cover_image_url: '', flyer_image_url: '',
    is_published: false, is_featured: false,
    registration_url: '', tags: '',
  });

  const fetchItems = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setForm({
      title: '', slug: '', description: '', content: '',
      event_date: '', end_date: '', location: '', venue: '',
      event_type: 'conference', cover_image_url: '', flyer_image_url: '',
      is_published: false, is_featured: false,
      registration_url: '', tags: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: any) => {
    setForm({
      title: item.title, slug: item.slug, description: item.description || '',
      content: item.content || '',
      event_date: item.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : '',
      end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '',
      location: item.location || '', venue: item.venue || '',
      event_type: item.event_type, cover_image_url: item.cover_image_url || '',
      flyer_image_url: item.flyer_image_url || '',
      is_published: item.is_published, is_featured: item.is_featured,
      registration_url: item.registration_url || '',
      tags: item.tags?.join(', ') || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date) {
      toast({ title: 'Title and event date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    const payload: any = {
      title: form.title.trim(), slug,
      description: form.description.trim(),
      content: form.content.trim() || null,
      event_date: new Date(form.event_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      location: form.location.trim(), venue: form.venue.trim(),
      event_type: form.event_type,
      cover_image_url: form.cover_image_url.trim() || null,
      flyer_image_url: (form as any).flyer_image_url?.trim() || null,
      is_published: form.is_published, is_featured: form.is_featured,
      registration_url: form.registration_url.trim() || null,
      tags,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('events').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('events').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Event updated! ✨' : 'Event created! ✨' });
      resetForm();
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchItems();
  };

  const togglePublish = async (item: any) => {
    await supabase.from('events').update({ is_published: !item.is_published }).eq('id', item.id);
    fetchItems();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} event(s)</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="rounded-xl gap-2 bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="w-4 h-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-foreground text-sm md:text-base">{editingId ? 'Edit Event' : 'New Event'}</h4>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded-xl font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Start Date & Time</Label>
              <Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date & Time (optional)</Label>
              <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, India" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Venue</Label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Hotel Grand Hyatt" className="rounded-xl" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Short Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl resize-none" rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs">Full Content</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl resize-none font-mono text-xs" rows={6} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="AI, NEP, Workshop" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Registration URL</Label>
              <Input value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} placeholder="https://..." className="rounded-xl" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">Cover Image</Label>
              <ImageUpload value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} folder="events" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs mb-1 block">Event Flyer (for sharing)</Label>
              <ImageUpload value={form.flyer_image_url} onChange={(url) => setForm({ ...form, flyer_image_url: url })} folder="event-flyers" />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label className="text-xs">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label className="text-xs">Featured</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-gold text-gold-foreground hover:bg-gold/90">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create Event'}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="rounded-xl">Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-3 md:px-4 py-3 hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                {item.is_featured && <Star className="w-3.5 h-3.5 text-gold shrink-0" />}
                <Badge variant={item.is_published ? 'default' : 'outline'} className="text-[10px] shrink-0">
                  {item.is_published ? 'Live' : 'Draft'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 inline mr-1" />
                {new Date(item.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {item.location ? ` · ${item.location}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="sm" onClick={() => togglePublish(item)} className="h-8 w-8 p-0">
                {item.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startEdit(item)} className="h-8 w-8 p-0">
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-6">No events yet. Create your first event!</p>
        )}
      </div>

      {/* Attendance Management */}
      <EventAttendanceManager />
    </div>
  );
}
