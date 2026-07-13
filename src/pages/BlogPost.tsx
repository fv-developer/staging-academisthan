import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api-client';
import {
  ArrowLeft, Calendar, User, BookOpen, Home, Eye, Heart,
  Bookmark, BookmarkCheck, MessageSquare, Send, Reply, Trash2,
  Share2, Link2, ChevronLeft, ChevronRight, Loader2, Edit
} from 'lucide-react';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sidebar dynamic widgets states
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [archivesList, setArchivesList] = useState<{ month: string; year: string; count: number }[]>([]);

  const fetchPostDetails = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const data = await api.blogs.getBySlug(slug);
      setPost(data);

      // Check if liked & bookmarked
      if (user) {
        const savedPosts = await api.blogs.getSaved();
        setIsSaved(savedPosts.some((p: any) => p.id === data.id));
      }

      // Load comments
      const postComments = await api.blogs.getComments(data.id);
      setComments(postComments);

      // Load related posts (same category, limit 3)
      const listData = await api.blogs.list({ category: data.category, limit: 4 });
      setRelatedPosts(listData.posts.filter((p: any) => p.id !== data.id).slice(0, 3));

      // Fetch dynamic categories
      const dbCats = await api.blogs.getCategories();
      setCategoriesList(dbCats || []);

      // Load latest articles
      const latestData = await api.blogs.list({ sort: 'latest', limit: 5 });
      setLatestPosts(latestData.posts || []);

      // Build archives from last 50 posts
      const archiveData = await api.blogs.list({ limit: 50 });
      const archiveMap: Record<string, { month: string; year: string; count: number; rawDate: Date }> = {};
      (archiveData.posts || []).forEach((p: any) => {
        const date = new Date(p.published_at || p.created_at);
        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
        const yearNum = date.getFullYear().toString();
        const key = `${monthName} ${yearNum}`;
        if (!archiveMap[key]) {
          archiveMap[key] = { month: monthName, year: yearNum, count: 1, rawDate: date };
        } else {
          archiveMap[key].count++;
        }
      });
      const sortedArchives = Object.values(archiveMap).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      setArchivesList(sortedArchives.map(a => ({ month: a.month, year: a.year, count: a.count })));

    } catch (error: any) {
      console.error('Fetch blog post error:', error);
      toast({ title: 'Error loading article', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [slug, user, toast]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const res = await api.admin.getRole();
        if (res && res.role) {
          setIsAdmin(true);
        }
      } catch (err) {
        // Not admin
      }
    };
    checkAdmin();
  }, [user]);

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action is permanent.')) return;
    try {
      await api.blogs.delete(post.id);
      toast({ title: 'Blog post deleted successfully' });
      navigate('/blog');
    } catch (err: any) {
      toast({ title: 'Failed to delete post', description: err.message, variant: 'destructive' });
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'You must be signed in to like articles.' });
      return;
    }
    try {
      const res = await api.blogs.toggleLike(post.id);
      setIsLiked(res.liked);
      setPost((prev: any) => ({
        ...prev,
        like_count: res.liked ? (prev.like_count || 0) + 1 : Math.max(0, (prev.like_count || 0) - 1)
      }));
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'You must be signed in to bookmark articles.' });
      return;
    }
    try {
      const res = await api.blogs.toggleBookmark(post.id);
      setIsSaved(res.saved);
      toast({
        title: res.saved ? 'Bookmark saved! 🔖' : 'Bookmark removed',
        description: res.saved ? 'Post saved to your bookmarks library.' : 'Post removed from your bookmarks library.'
      });
    } catch (err: any) {
      toast({ title: 'Bookmark failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to add comments.' });
      return;
    }

    const contentText = parentId ? replyText : newComment;
    if (!contentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.blogs.createComment(post.id, contentText.trim(), parentId || undefined);
      setComments(prev => [...prev, res]);
      
      if (parentId) {
        setReplyText('');
        setActiveReplyId(null);
      } else {
        setNewComment('');
      }
      toast({ title: 'Comment posted! 💬' });
    } catch (err: any) {
      toast({ title: 'Comment failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.blogs.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: 'Comment deleted successfully' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied! 🔗', description: 'Article URL copied to clipboard.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background website-page flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1538]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background website-page">
        <Navbar />
        <div className="pt-32 pb-20 container mx-auto px-4 max-w-2xl text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground text-sm mb-6">This article may have been removed or unpublished.</p>
          <Button onClick={() => navigate('/blog')} className="bg-gold text-gold-foreground rounded-xl">
            Back to Blog Hub
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const canonical = `https://academisthan.org/blog/${post.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    author: { '@type': 'Person', name: post.author_name },
    datePublished: post.published_at || post.created_at,
    mainEntityOfPage: canonical,
  };

  // Group comments by parent_id
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-background website-page">
      <style>{`
        .website-page h1.blog-title {
          font-size: 25px !important;
          line-height: 1.3 !important;
        }
      `}</style>
      <Helmet>
        <title>{post.title} | Academisthan Blog</title>
        <meta name="description" content={post.summary} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>
      
      <Navbar forceSolidBg={true} />

      <article className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Back Button */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors mb-6 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insights
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column (70%) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Owner/Admin Toolbar */}
              {post && (isAdmin || (user && user.id === post.author_id)) && (
                <div className="flex items-center justify-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs">
                  <span className="text-[11px] text-slate-500 font-sans mr-auto pl-1">
                    You own this article ({post.status === 'published' ? 'Published' : 'Draft/Pending Review'})
                  </span>
                  <Button
                    onClick={() => navigate(`/dashboard/blogs/submit?slug=${post.slug}`)}
                    disabled={!isAdmin && post.status === 'published'}
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs gap-1.5 border-slate-200"
                    title={(!isAdmin && post.status === 'published') ? 'Published blogs cannot be edited by fellows' : 'Edit article'}
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Article
                  </Button>
                  <Button
                    onClick={handleDeletePost}
                    disabled={!isAdmin && post.status === 'published'}
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-xl text-xs gap-1.5 border-rose-100 text-rose-650 hover:bg-rose-50 hover:text-rose-700"
                    title={(!isAdmin && post.status === 'published') ? 'Published blogs cannot be deleted by fellows' : 'Delete article'}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              )}

              {/* Header */}
              <header className="space-y-4 mb-6">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                  {post.tags?.map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[9px] bg-muted/30">#{t}</Badge>
                  ))}
                </div>

                <h1 className="blog-title font-serif font-bold text-foreground leading-tight">
                  {post.title}
                </h1>

                {/* Author info & metrics */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-y border-border/60 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gold" />
                      <span className="font-semibold text-foreground">By {post.author_name}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.view_count || 0} views</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.like_count || 0} likes</span>
                  </div>
                </div>
              </header>

              {/* Cover image */}
              {post.cover_image_url && (
                <div className="rounded-2xl overflow-hidden mb-8 border border-border shadow-sm">
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
                </div>
              )}

              {/* Main content body */}
              <div 
                className="prose prose-slate max-w-none text-foreground/90 leading-relaxed text-[15.5px] md:text-[17px] font-serif pt-2"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Article Action Bar */}
              <div className="flex items-center justify-between border-t border-border mt-10 pt-4">
                <div className="flex items-center gap-2">
                  {/* Like Button */}
                  <Button
                    onClick={handleLike}
                    variant="outline"
                    className={`rounded-xl gap-1.5 h-9 text-xs ${isLiked ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-50' : ''}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    {post.like_count || 0} Likes
                  </Button>

                  {/* Save/Bookmark Button */}
                  <Button
                    onClick={handleBookmark}
                    variant="outline"
                    className="rounded-xl gap-1.5 h-9 text-xs"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-gold fill-gold" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" /> Save Post
                      </>
                    )}
                  </Button>
                </div>

                {/* Social Share Group */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Share:</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title)}%20${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full border border-border">
                      <Send className="w-3.5 h-3.5 text-emerald-500" />
                    </Button>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full border border-border">
                      <Share2 className="w-3.5 h-3.5 text-sky-500" />
                    </Button>
                  </a>
                  <Button onClick={copyLink} size="icon" variant="ghost" className="w-8 h-8 rounded-full border border-border">
                    <Link2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sibling Post Navigation */}
              <div className="grid grid-cols-2 gap-4 border-t border-border mt-8 pt-6">
                {post.prevPost ? (
                  <Link to={`/blog/${post.prevPost.slug}`} className="flex flex-col items-start gap-1 p-3 border border-border rounded-xl hover:border-gold/30 hover:bg-slate-50/50 transition-all text-left">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><ChevronLeft className="w-3 h-3" /> Previous</span>
                    <span className="text-xs font-bold text-foreground line-clamp-1">{post.prevPost.title}</span>
                  </Link>
                ) : <div />}
                {post.nextPost ? (
                  <Link to={`/blog/${post.nextPost.slug}`} className="flex flex-col items-end gap-1 p-3 border border-border rounded-xl hover:border-gold/30 hover:bg-slate-50/50 transition-all text-right">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">Next <ChevronRight className="w-3 h-3" /></span>
                    <span className="text-xs font-bold text-foreground line-clamp-1">{post.nextPost.title}</span>
                  </Link>
                ) : <div />}
              </div>

              {/* Author bio box */}
              {post.author_bio && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-10 flex gap-4 items-center">
                  {post.author_avatar && (
                    <img src={post.author_avatar} alt={post.author_name} className="w-12 h-12 rounded-full object-cover border border-border shrink-0" />
                  )}
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-sm text-foreground">About the Author: {post.author_name}</h4>
                    <p className="text-muted-foreground text-xs leading-relaxed">{post.author_bio}</p>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <section className="mt-12 pt-8 border-t border-border space-y-6">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gold" />
                  Comments ({comments.length})
                </h3>

                {/* Comment Form */}
                {user ? (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <form onSubmit={(e) => handleCommentSubmit(e)} className="space-y-2">
                        <textarea
                          placeholder="Add a comment to this article..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full bg-white border border-border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-gold min-h-[90px]"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={submittingComment || !newComment.trim()}
                            className="rounded-xl h-8 px-4 text-xs bg-gold text-gold-foreground font-semibold"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border rounded-2xl p-4 text-center text-xs text-muted-foreground">
                    Please <Link to="/login" className="text-gold font-bold hover:underline">sign in</Link> to contribute to the discussion.
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4 pt-4">
                  {rootComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No comments yet. Be the first to share your thoughts!</p>
                  ) : (
                    rootComments.map(comment => {
                      const replies = getReplies(comment.id);
                      return (
                        <div key={comment.id} className="border-b border-border/40 pb-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 items-center">
                              <div className="w-8 h-8 rounded-full bg-[#8B1538]/10 text-[#8B1538] font-bold text-xs flex items-center justify-center border border-[#8B1538]/5">
                                {comment.author_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-foreground">{comment.author_name}</h4>
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {user && (
                                <Button
                                  onClick={() => {
                                    setReplyText('');
                                    setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] gap-1 hover:bg-slate-50"
                                >
                                  <Reply className="w-3 h-3" /> Reply
                                </Button>
                              )}
                              {(isAdmin || (user && user.id === comment.user_id)) && (
                                <Button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[10px] gap-1 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </Button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-foreground/90 pl-11 leading-relaxed">{comment.content}</p>

                          {/* Reply Box Form */}
                          {activeReplyId === comment.id && (
                            <form onSubmit={(e) => handleCommentSubmit(e, comment.id)} className="pl-11 pt-1.5 space-y-2">
                              <textarea
                                placeholder={`Replying to ${comment.author_name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full bg-white border border-border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-gold min-h-[70px]"
                              />
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setActiveReplyId(null);
                                    setReplyText('');
                                  }}
                                  className="rounded-xl h-7 px-3 text-[10px]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={submittingComment || !replyText.trim()}
                                  className="rounded-xl h-7 px-3 text-[10px] bg-gold text-gold-foreground font-semibold"
                                >
                                  Post Reply
                                </Button>
                              </div>
                            </form>
                          )}

                          {/* Render Replies */}
                          {replies.length > 0 && (
                            <div className="pl-11 pt-2 space-y-3">
                              {replies.map(reply => {
                                return (
                                  <div key={reply.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-1.5">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex gap-2 items-center">
                                        <div className="w-6 h-6 rounded-full bg-[#8B1538]/5 text-[#8B1538] font-bold text-[10px] flex items-center justify-center">
                                          {reply.author_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <h5 className="text-[10px] font-bold text-foreground">{reply.author_name}</h5>
                                          <span className="text-[8px] text-muted-foreground">
                                            {new Date(reply.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                          </span>
                                        </div>
                                      </div>
                                      {(isAdmin || (user && user.id === reply.user_id)) && (
                                        <Button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50 rounded-full"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Related Posts Recommendations */}
              {relatedPosts.length > 0 && (
                <section className="mt-16 pt-8 border-t border-border space-y-6">
                  <h3 className="font-serif text-lg font-bold text-foreground">Related Articles</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {relatedPosts.map(rel => (
                      <Link key={rel.id} to={`/blog/${rel.slug}`} className="group space-y-2 block">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-border">
                          {rel.cover_image_url ? (
                            <img src={rel.cover_image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-gold/30">
                              <BookOpen className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-xs line-clamp-2 group-hover:text-gold transition-colors leading-snug">
                          {rel.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Right Column Sticky Sidebar (30%) */}
            <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
              
              {/* Latest Blogs Widget */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <BookOpen className="w-4 h-4 text-gold" />
                  Latest Articles
                </h3>
                <div className="space-y-4">
                  {latestPosts.slice(0, 5).map((lp) => (
                    <Link
                      key={lp.id}
                      to={`/blog/${lp.slug}`}
                      className="flex gap-3 group/item items-start hover:bg-slate-50/50 p-1.5 rounded-xl transition-all"
                    >
                      {lp.cover_image_url ? (
                        <img
                          src={lp.cover_image_url}
                          alt={lp.title}
                          className="w-16 h-12 object-cover rounded-lg border border-border/60 shrink-0 group-hover/item:scale-102 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-slate-900 text-gold/30 rounded-lg flex items-center justify-center border shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-serif text-xs font-semibold text-foreground group-hover/item:text-gold transition-colors line-clamp-2 leading-tight">
                          {lp.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(lp.published_at || lp.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories Widget */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <Bookmark className="w-4 h-4 text-gold" />
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <Link
                      key={cat}
                      to={`/blog?category=${cat}`}
                      className="px-3 py-1.5 bg-muted/40 hover:bg-gold/15 text-muted-foreground hover:text-gold border border-border/60 hover:border-gold/30 rounded-xl text-xs font-medium transition-all"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Archives Widget */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/60 pb-2.5">
                  <Calendar className="w-4 h-4 text-gold" />
                  Archives
                </h3>
                <div className="divide-y divide-border/40 text-xs">
                  {archivesList.map((archive) => (
                    <Link
                      key={`${archive.month}-${archive.year}`}
                      to={`/blog?archive=${archive.month.toLowerCase()}-${archive.year}`}
                      className="flex items-center justify-between py-2.5 text-muted-foreground hover:text-gold transition-colors group/arch"
                    >
                      <span className="font-medium">{archive.month} {archive.year}</span>
                      <Badge className="bg-slate-50 border border-border text-muted-foreground text-[10px] py-0.5 px-2 group-hover/arch:bg-gold/10 group-hover/arch:text-gold transition-colors">
                        {archive.count} {archive.count === 1 ? 'post' : 'posts'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
