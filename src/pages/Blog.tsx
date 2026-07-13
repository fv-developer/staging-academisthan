import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api-client';
import {
  Calendar, Clock, ArrowRight, BookOpen, Search,
  Eye, Heart, MessageSquare, Share2, Bookmark,
  BookmarkCheck, Loader2, Sparkles, SlidersHorizontal,
  Share, Send, Mail, Link2, Edit, Trash2
} from 'lucide-react';

const categoryLabels: Record<string, string> = {
  general: 'General',
  nep: 'NEP 2020',
  research: 'Research',
  career: 'Career Growth',
  technology: 'EdTech',
  policy: 'Policy & Rules',
  teaching: 'Teaching',
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  is_ai_generated: boolean;
  author_name: string;
  author_id: string;
  status: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
};

export default function Blog() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'popular' | 'views'
  
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [activeShareMenu, setActiveShareMenu] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>(categoryLabels);

  const loadCategories = async () => {
    try {
      const dbCats = await api.blogs.getCategories();
      const updatedCats = { ...categoryLabels };
      dbCats.forEach((cat: string) => {
        const key = cat.toLowerCase().trim();
        if (!updatedCats[key]) {
          updatedCats[key] = cat;
        }
      });
      setCategories(updatedCats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.blogs.list({
        category: selectedCategory,
        search: search.trim() || undefined,
        sort: sortBy,
        limit: 50
      });
      
      let finalPosts = data.posts || [];

      // Apply archive filter if set in search params
      const params = new URLSearchParams(window.location.search);
      const archive = params.get('archive');
      if (archive) {
        const parts = archive.split('-');
        if (parts.length === 2) {
          const [monthName, yearStr] = parts;
          finalPosts = finalPosts.filter((p: any) => {
            const date = new Date(p.published_at || p.created_at);
            const m = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
            const y = date.getFullYear().toString();
            return m === monthName.toLowerCase() && y === yearStr;
          });
        }
      }

      setPosts(finalPosts);

      if (user) {
        // Load saved bookmarks
        const bookmarks = await api.blogs.getSaved();
        setSavedPostIds(bookmarks.map((b: any) => b.id));
      }
    } catch (error: any) {
      console.error('Fetch blogs error:', error);
      toast({ title: 'Failed to load posts', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) {
      const matchedKey = Object.keys(categories).find(k => k.toLowerCase() === cat.toLowerCase());
      setSelectedCategory(matchedKey || cat);
    } else {
      setSelectedCategory('all');
    }
  }, [window.location.search, categories]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const res = await api.admin.getRole();
        if (res && res.role) {
          setIsAdmin(true);
        }
      } catch (err) {}
    };
    checkAdmin();
  }, [user]);

  const handleDeletePost = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this blog post? This action is permanent.')) return;
    try {
      await api.blogs.delete(id);
      toast({ title: 'Blog post deleted successfully' });
      fetchPosts();
    } catch (err: any) {
      toast({ title: 'Failed to delete post', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPosts();
    }, search ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search, sortBy, user, window.location.search]);

  const handleBookmarkToggle = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to bookmark articles.' });
      return;
    }

    try {
      const res = await api.blogs.toggleBookmark(postId);
      if (res.saved) {
        setSavedPostIds(prev => [...prev, postId]);
        toast({ title: 'Post saved! 📌', description: 'This article was added to your bookmarked posts.' });
      } else {
        setSavedPostIds(prev => prev.filter(id => id !== postId));
        toast({ title: 'Post removed', description: 'This article was removed from your bookmarks.' });
      }
    } catch (err: any) {
      toast({ title: 'Error bookmarking post', description: err.message, variant: 'destructive' });
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to like articles.' });
      return;
    }

    try {
      const res = await api.blogs.toggleLike(postId);
      if (res.liked) {
        setLikedPostIds(prev => [...prev, postId]);
      } else {
        setLikedPostIds(prev => prev.filter(id => id !== postId));
      }
      
      // Update like count in local state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, like_count: res.likeCount };
        }
        return p;
      }));
    } catch (err: any) {
      toast({ title: 'Error liking post', description: err.message, variant: 'destructive' });
    }
  };

  const copyShareLink = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const link = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied! 📋', description: 'Article link copied to clipboard.' });
    setActiveShareMenu(null);
  };

  const handleShareClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveShareMenu(activeShareMenu === postId ? null : postId);
  };

  const featured = posts.find((p) => p.is_featured);
  const regular = posts.filter((p) => p !== featured);

  return (
    <div className="min-h-screen bg-background website-page">
      <Navbar forceSolidBg={true} />

      {/* Hero Banner */}
      <div className="relative pt-24 pb-16 bg-slate-900 text-white overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(38,55%,58%) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container mx-auto px-4 max-w-7xl relative z-10 pt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            <span className="text-gold text-xs tracking-[0.2em] uppercase font-semibold">Academisthan Hub</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-warm">
            Insights & <span className="text-gold">Educator Stories</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Latest trends in EdTech, research publications, policy briefs, and career progression guides created by India's leading fellows.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-10 space-y-6">
        {/* Filters and Searches */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-sm">
          {/* Categories Tab list */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gold text-gold-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Topics
            </button>
            {Object.keys(categories).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gold text-gold-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {categories[cat]}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-9 text-xs"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-xl h-9 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Liked</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1538]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">No articles found</h3>
            <p className="text-muted-foreground text-xs">Try clearing search filters or check back later.</p>
          </div>
        ) : (
          <>
            {/* Featured Post (Big Card) */}
            {featured && (
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border hover:border-gold/30 transition-all shadow-sm group/featured mb-12">
                <div className="grid md:grid-cols-2 gap-0 relative z-10">
                  <Link to={`/blog/${featured.slug}`} className="h-64 md:h-[400px] overflow-hidden bg-slate-100 block cursor-pointer">
                    {featured.cover_image_url ? (
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover/featured:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-gold/35">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                  </Link>
                  <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
                    <Link to={`/blog/${featured.slug}`} className="space-y-3 block group/featuredtext cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-gold/15 text-gold border-gold/20 text-[10px]">Featured</Badge>
                        <Badge variant="secondary" className="text-[10px]">{categories[featured.category.toLowerCase().trim()] || featured.category}</Badge>
                      </div>
                      <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground group-hover/featuredtext:text-gold transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground text-xs md:text-sm line-clamp-3 leading-relaxed">
                        {featured.summary}
                      </p>
                    </Link>

                    <div className="space-y-3">
                      {/* Metric Counts */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground border-b border-border/60 pb-3">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {featured.view_count || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {featured.like_count || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {featured.comment_count || 0}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 5 min read</span>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">By {featured.author_name}</span>
                          <span>•</span>
                          <span>{new Date(featured.published_at || featured.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2 relative z-20">
                          {/* Share Button */}
                          <Button
                            onClick={(e) => handleShareClick(e, featured.id)}
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-full border border-border"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                          {/* Bookmark Button */}
                          <Button
                            onClick={(e) => handleBookmarkToggle(e, featured.id)}
                            size="icon"
                            variant="ghost"
                            className="relative w-8 h-8 rounded-full border border-border z-25"
                          >
                            {savedPostIds.includes(featured.id) ? (
                              <BookmarkCheck className="w-3.5 h-3.5 text-gold fill-gold" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          {/* Owner/Admin Toolbar */}
                          {(isAdmin || (user && user.id === featured.author_id)) && (
                            <>
                              <Link to={`/dashboard/blogs/submit?slug=${featured.slug}`} onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-8 h-8 rounded-full border border-border"
                                  title="Edit Post"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                              <Button
                                onClick={(e) => handleDeletePost(e, featured.id)}
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 rounded-full border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                                title="Delete Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          {/* Share Menu Dropdown */}
                          {activeShareMenu === featured.id && (
                            <div className="absolute right-0 bottom-10 bg-card border border-border rounded-xl p-1.5 shadow-md flex gap-1 z-30">
                              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={(e) => copyShareLink(e, featured.slug)}>
                                <Link2 className="w-3.5 h-3.5" />
                              </Button>
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(featured.title)}%20${encodeURIComponent(window.location.origin + '/blog/' + featured.slug)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button size="icon" variant="ghost" className="w-7 h-7"><Send className="w-3.5 h-3.5 text-emerald-500" /></Button>
                              </a>
                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(featured.title)}&url=${encodeURIComponent(window.location.origin + '/blog/' + featured.slug)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button size="icon" variant="ghost" className="w-7 h-7"><Share className="w-3.5 h-3.5 text-sky-500" /></Button>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid for Regular posts */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((post) => (
                <div key={post.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-gold/30 hover:shadow-sm transition-all flex flex-col justify-between group relative">
                  
                  <Link to={`/blog/${post.slug}`} className="block flex-1 group/content cursor-pointer">
                    {/* Cover image */}
                    <div className="h-44 overflow-hidden bg-slate-100 relative">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover/content:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-gold/30">
                          <BookOpen className="w-10 h-10" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-card/90 text-foreground border border-border text-[9px]">
                        {categories[post.category.toLowerCase().trim()] || post.category}
                      </Badge>
                    </div>

                    {/* Content Excerpt */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-serif text-sm md:text-base font-bold text-foreground group-hover/content:text-gold transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground text-xs line-clamp-3 leading-relaxed">
                        {post.summary}
                      </p>
                    </div>
                  </Link>

                  {/* Card Details Footer */}
                  <div className="p-5 pt-0 mt-2 space-y-3 relative z-10">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-b border-border/50 pb-2.5">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count || 0}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.like_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comment_count || 0}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 4 min read</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        <span className="font-semibold text-foreground truncate max-w-[120px]">{post.author_name}</span>
                        <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 relative">
                        {/* Bookmark */}
                        <Button
                          onClick={(e) => handleBookmarkToggle(e, post.id)}
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 rounded-full border border-border"
                        >
                          {savedPostIds.includes(post.id) ? (
                            <BookmarkCheck className="w-3 h-3 text-gold fill-gold" />
                          ) : (
                            <Bookmark className="w-3 h-3" />
                          )}
                        </Button>
                        {/* Like */}
                        <Button
                          onClick={(e) => handleLikeToggle(e, post.id)}
                          size="icon"
                          variant="ghost"
                          className={`w-7 h-7 rounded-full border border-border ${likedPostIds.includes(post.id) ? 'bg-red-50 text-red-500' : ''}`}
                        >
                          <Heart className={`w-3 h-3 ${likedPostIds.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        {/* Share */}
                        <Button
                          onClick={(e) => handleShareClick(e, post.id)}
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 rounded-full border border-border"
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>

                        {/* Owner/Admin Toolbar */}
                        {(isAdmin || (user && user.id === post.author_id)) && (
                          <>
                            <Link to={`/dashboard/blogs/submit?slug=${post.slug}`} onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7 rounded-full border border-border"
                                title="Edit Post"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Button
                              onClick={(e) => handleDeletePost(e, post.id)}
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 rounded-full border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-600"
                              title="Delete Post"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}

                        {/* Share Dropdown */}
                        {activeShareMenu === post.id && (
                          <div className="absolute right-0 bottom-9 bg-card border border-border rounded-xl p-1 shadow-md flex gap-1 z-30">
                            <Button size="icon" variant="ghost" className="w-6.5 h-6.5" onClick={(e) => copyShareLink(e, post.slug)}>
                              <Link2 className="w-3 h-3" />
                            </Button>
                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.origin + '/blog/' + post.slug)}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="icon" variant="ghost" className="w-6.5 h-6.5"><Send className="w-3 h-3 text-emerald-500" /></Button>
                            </a>
                            <a
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin + '/blog/' + post.slug)}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="icon" variant="ghost" className="w-6.5 h-6.5"><Share className="w-3 h-3 text-sky-500" /></Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
