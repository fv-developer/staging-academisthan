import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ExternalLink, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

type Pending = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[] | null;
  source_urls: string[] | null;
  ai_model: string | null;
  created_at: string;
};

export function PendingBlogsQueue() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, category, tags, source_urls, ai_model, created_at')
      .eq('review_status', 'pending_review')
      .order('created_at', { ascending: false });
    setPosts((data as Pending[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({
        review_status: 'approved',
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Published', description: 'Blog is now live.' });
    load();
  };

  const reject = async (id: string) => {
    if (!confirm('Delete this AI draft permanently?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Removed' });
    load();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading drafts...</p>;
  if (posts.length === 0)
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        No AI-generated drafts awaiting review. The next one drops daily at 08:00 IST.
      </Card>
    );

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <Card key={p.id} className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h4 className="font-serif font-semibold text-foreground">{p.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.summary}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                {(p.tags || []).slice(0, 4).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
              {p.ai_model && (
                <p className="text-[10px] text-muted-foreground mt-1.5">Model: {p.ai_model}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link to={`/blog/${p.slug}`} target="_blank">
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </Button>
              </Link>
              <Button size="sm" onClick={() => approve(p.id)} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-3.5 h-3.5" /> Approve & Publish
              </Button>
              <Button size="sm" variant="destructive" onClick={() => reject(p.id)} className="gap-1.5">
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
          {p.source_urls && p.source_urls.length > 0 && (
            <div className="border-t border-border pt-2">
              <p className="text-[10px] text-muted-foreground mb-1">
                Verified sources ({p.source_urls.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {p.source_urls.slice(0, 6).map((u, i) => (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gold hover:underline truncate max-w-[200px]"
                  >
                    [{i + 1}] {u.replace(/^https?:\/\//, '').split('/')[0]}
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
