import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest, isAdmin } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAdminBlogSubmittedEmail, sendBlogApprovedEmail, sendBlogRejectedEmail } from '../services/email';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to convert title to slug
function convertToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Get all published blog posts (Public Listing)
router.get('/', async (req, res: Response) => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const sort = req.query.sort as string; // 'latest' | 'popular' | 'views'
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    let query = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM blog_likes l WHERE l.post_id = p.id) as real_like_count,
             (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id AND c.status = 'approved') as real_comment_count
      FROM blog_posts p
      WHERE p.status = 'published' AND p.is_published = 1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild);
    }

    if (tag) {
      query += ` AND p.id IN (
        SELECT pt.post_id FROM blog_post_tags pt
        JOIN blog_tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      )`;
      params.push(tag);
    }

    // Sorting
    if (sort === 'popular') {
      // Sort by likes first
      query += ` ORDER BY p.is_pinned DESC, p.like_count DESC, p.published_at DESC`;
    } else if (sort === 'views') {
      query += ` ORDER BY p.is_pinned DESC, p.view_count DESC, p.published_at DESC`;
    } else {
      // Default: Latest
      query += ` ORDER BY p.is_pinned DESC, p.published_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [posts]: any = await pool.query(query, params);

    // Load tags for each post
    for (const post of posts) {
      const [tags]: any = await pool.execute(
        `SELECT t.name FROM blog_tags t
         JOIN blog_post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags.map((t: any) => t.name);
    }

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM blog_posts p WHERE p.status = 'published' AND p.is_published = 1`;
    const countParams: any[] = [];

    if (category && category !== 'all') {
      countQuery += ` AND p.category = ?`;
      countParams.push(category);
    }
    if (search) {
      countQuery += ` AND (p.title LIKE ? OR p.summary LIKE ? OR p.content LIKE ?)`;
      const searchWild = `%${search}%`;
      countParams.push(searchWild, searchWild, searchWild);
    }
    if (tag) {
      countQuery += ` AND p.id IN (
        SELECT pt.post_id FROM blog_post_tags pt
        JOIN blog_tags t ON pt.tag_id = t.id
        WHERE t.name = ?
      )`;
      countParams.push(tag);
    }

    const [countResult]: any = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    res.json({ posts, total, limit, offset });
  } catch (error) {
    console.error('Get published blogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve blog posts' });
  }
});

// 2. Get saved/bookmarked posts for logged-in user
router.get('/saved', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [saved]: any = await pool.execute(
      `SELECT p.*, s.created_at as saved_at, pr.full_name as author_name, pr.avatar_url as author_avatar
       FROM blog_posts p
       JOIN blog_saved_posts s ON s.post_id = p.id
       LEFT JOIN profiles pr ON p.author_id = pr.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId]
    );

    // Fetch tags
    for (const post of saved) {
      const [tags]: any = await pool.execute(
        `SELECT t.name FROM blog_tags t
         JOIN blog_post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags.map((t: any) => t.name);
    }

    res.json(saved);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Failed to retrieve bookmarked posts' });
  }
});

// 3. Get posts written by the logged-in user (Fellow dashboard blogs)
router.get('/my-posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [posts]: any = await pool.execute(
      'SELECT * FROM blog_posts WHERE author_id = ? ORDER BY created_at DESC',
      [userId]
    );

    for (const post of posts) {
      const [tags]: any = await pool.execute(
        `SELECT t.name FROM blog_tags t
         JOIN blog_post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags.map((t: any) => t.name);
    }

    res.json(posts);
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve your blog posts' });
  }
});

// 4. Get all pending blog posts (Admin Moderation List)
router.get('/admin/pending', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [posts]: any = await pool.execute(
      `SELECT p.*, pr.avatar_url as author_avatar
       FROM blog_posts p
       JOIN profiles pr ON p.author_id = pr.id
       WHERE p.status = 'pending_review' 
       ORDER BY p.created_at ASC`
    );

    for (const post of posts) {
      const [tags]: any = await pool.execute(
        `SELECT t.name FROM blog_tags t
         JOIN blog_post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags.map((t: any) => t.name);
    }

    res.json(posts);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ error: 'Failed to load pending blog submissions' });
  }
});

// 4.5 Get all distinct categories
router.get('/categories', async (req, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT DISTINCT category FROM blog_posts 
       WHERE category IS NOT NULL AND category != ''`
    );
    const categories = rows.map((r: any) => r.category);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// 5. Get blog details by slug (Public)
const getBlogBySlug = async (req: any, res: Response) => {
  try {
    const { slug } = req.params;

    const [posts]: any = await pool.execute(
      `SELECT p.*, pr.avatar_url as author_avatar, pr.bio as author_bio
       FROM blog_posts p
       LEFT JOIN profiles pr ON p.author_id = pr.id
       WHERE p.slug = ?`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const post = posts[0];

    // Increment View Count
    await pool.execute('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);
    post.view_count += 1;

    // Load tags
    const [tags]: any = await pool.execute(
      `SELECT t.name FROM blog_tags t
       JOIN blog_post_tags pt ON pt.tag_id = t.id
       WHERE pt.post_id = ?`,
      [post.id]
    );
    post.tags = tags.map((t: any) => t.name);

    // Get sibling posts for navigation (Previous / Next)
    const [prevPosts]: any = await pool.execute(
      'SELECT title, slug FROM blog_posts WHERE status = "published" AND published_at < ? ORDER BY published_at DESC LIMIT 1',
      [post.published_at || new Date()]
    );
    const [nextPosts]: any = await pool.execute(
      'SELECT title, slug FROM blog_posts WHERE status = "published" AND published_at > ? ORDER BY published_at ASC LIMIT 1',
      [post.published_at || new Date()]
    );

    post.prevPost = prevPosts[0] || null;
    post.nextPost = nextPosts[0] || null;

    res.json(post);
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({ error: 'Failed to retrieve blog details' });
  }
};

router.get('/slug/:slug', getBlogBySlug);
router.get('/:slug', getBlogBySlug);

// 6. Create Blog Post (Authenticated)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, summary, content, cover_image_url, category, tags, status: clientStatus } = req.body;
    const authorId = req.user!.id;
    const authorName = req.user!.full_name;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Determine target status
    // Admin role check
    const [roles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [authorId]);
    const isAdminUser = roles.length > 0;

    let status = 'draft';
    if (clientStatus === 'published' && isAdminUser) {
      status = 'published';
    } else if (clientStatus === 'published' && !isAdminUser) {
      status = 'pending_review';
    } else if (clientStatus === 'draft') {
      status = 'draft';
    } else if (!isAdminUser) {
      status = 'pending_review'; // Default for fellows is submit for review
    } else {
      status = 'published'; // Default for admin is published
    }

    const postId = uuidv4();
    const baseSlug = convertToSlug(title);
    let slug = baseSlug;

    // Check slug uniqueness
    const [exists]: any = await pool.execute('SELECT id FROM blog_posts WHERE slug = ?', [slug]);
    if (exists.length > 0) {
      slug = `${baseSlug}-${postId.slice(0, 5)}`;
    }

    const isPublished = status === 'published';
    const publishedAt = isPublished ? new Date() : null;

    // Estimate reading time (roughly 200 words per minute)
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    await pool.execute(
      `INSERT INTO blog_posts (
        id, title, slug, summary, content, cover_image_url, category, 
        author_id, author_name, status, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        postId,
        title,
        slug,
        summary || title.slice(0, 150),
        content,
        cover_image_url || null,
        category || 'General',
        authorId,
        authorName,
        status,
        isPublished ? 1 : 0,
        publishedAt
      ]
    );

    // Save Tags
    if (tags && Array.isArray(tags)) {
      for (const tName of tags) {
        const cleanTagName = tName.trim().toLowerCase();
        if (!cleanTagName) continue;

        // Find or create tag
        let [existingTags]: any = await pool.execute('SELECT id FROM blog_tags WHERE name = ?', [cleanTagName]);
        let tagId = '';

        if (existingTags.length === 0) {
          tagId = uuidv4();
          await pool.execute('INSERT INTO blog_tags (id, name) VALUES (?, ?)', [tagId, cleanTagName]);
        } else {
          tagId = existingTags[0].id;
        }

        // Link tag to post
        await pool.execute('INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
      }
    }

    // Log Activity
    await logUserActivity(
      authorId,
      'create_blog',
      `Submitted blog post: "${title}" as status: ${status}`,
      { postId, slug, status }
    );

    if (status === 'pending_review') {
      try {
        const [admins]: any = await pool.execute(
          `SELECT ar.user_id, p.email, p.full_name FROM admin_roles ar
           JOIN profiles p ON ar.user_id = p.id`
        );
        for (const adminRow of admins) {
          await pool.execute(
            `INSERT INTO notifications (id, user_id, trigger_user_id, type, title, message, link)
             VALUES (?, ?, ?, 'blog', 'Blog Pending Review 📝', ?, '/admin/blogs')`,
            [uuidv4(), adminRow.user_id, authorId, `A new blog post "${title}" has been submitted for review by ${authorName}.`]
          );
          if (adminRow.email) {
            sendAdminBlogSubmittedEmail(adminRow.email, adminRow.full_name || 'Admin', title, authorName).catch(err => {
              console.error('Failed to send admin blog submission email:', err);
            });
          }
        }
      } catch (err) {
        console.error('Failed to notify admins on blog submission:', err);
      }
    }

    res.status(201).json({ id: postId, slug, status, message: 'Blog post created successfully' });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// 7. Update Blog Post (Author or Admin)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, summary, content, cover_image_url, category, tags, status: clientStatus } = req.body;
    const userId = req.user!.id;

    // Check if post exists and author identity
    const [posts]: any = await pool.execute('SELECT author_id, title, status FROM blog_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const post = posts[0];
    const isAuthor = post.author_id === userId;

    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const isAdminUser = adminRoles.length > 0;

    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: 'You are not authorized to update this blog post' });
    }

    // Fellow edit restriction: Cannot edit published/approved blog
    if (!isAdminUser && post.status === 'published') {
      return res.status(403).json({ error: 'You cannot edit this post as it has already been approved and published.' });
    }

    // Determine status
    let status = 'draft';
    if (clientStatus) {
      if (clientStatus === 'published' && isAdminUser) {
        status = 'published';
      } else if (clientStatus === 'published' && !isAdminUser) {
        status = 'pending_review'; // Fellow submits edits for review
      } else {
        status = clientStatus;
      }
    } else {
      // Keep old status unless author is editing draft to publish it
      status = post.status;
    }

    const isSubmittedForReview = (status === 'pending_review' && post.status !== 'pending_review');
    const isPublished = status === 'published';
    const publishedAt = isPublished ? new Date() : null;

    let query = `
      UPDATE blog_posts 
      SET title = ?, summary = ?, content = ?, cover_image_url = ?, category = ?, status = ?
    `;
    const params: any[] = [
      title !== undefined ? title : post.title,
      summary !== undefined ? summary : post.summary,
      content !== undefined ? content : post.content,
      cover_image_url !== undefined ? cover_image_url : post.cover_image_url,
      category !== undefined ? category : post.category,
      status
    ];

    if (isSubmittedForReview) {
      query += `, rejection_reason = NULL`;
    }

    if (isPublished) {
      query += `, is_published = 1, published_at = NOW()`;
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);

    // Sync Tags
    if (tags && Array.isArray(tags)) {
      // Delete old tags link
      await pool.execute('DELETE FROM blog_post_tags WHERE post_id = ?', [id]);

      for (const tName of tags) {
        const cleanTagName = tName.trim().toLowerCase();
        if (!cleanTagName) continue;

        let [existingTags]: any = await pool.execute('SELECT id FROM blog_tags WHERE name = ?', [cleanTagName]);
        let tagId = '';

        if (existingTags.length === 0) {
          tagId = uuidv4();
          await pool.execute('INSERT INTO blog_tags (id, name) VALUES (?, ?)', [tagId, cleanTagName]);
        } else {
          tagId = existingTags[0].id;
        }

        await pool.execute('INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)', [id, tagId]);
      }
    }

    // Log Activity
    await logUserActivity(
      userId,
      'edit_blog',
      `Updated blog post: "${title || post.title}"`,
      { postId: id }
    );

    if (isSubmittedForReview) {
      try {
        const [admins]: any = await pool.execute(
          `SELECT ar.user_id, p.email, p.full_name FROM admin_roles ar
           JOIN profiles p ON ar.user_id = p.id`
        );
        const [authorInfo]: any = await pool.execute(
          `SELECT full_name FROM profiles WHERE id = ?`,
          [post.author_id]
        );
        const authorName = authorInfo.length > 0 ? (authorInfo[0].full_name || 'A fellow') : 'A fellow';
        const finalTitle = title || post.title;

        for (const adminRow of admins) {
          await pool.execute(
            `INSERT INTO notifications (id, user_id, trigger_user_id, type, title, message, link)
             VALUES (?, ?, ?, 'blog', 'Blog Pending Review 📝', ?, '/admin/blogs')`,
            [uuidv4(), adminRow.user_id, post.author_id, `The blog post "${finalTitle}" has been resubmitted for review by ${authorName}.`]
          );
          if (adminRow.email) {
            sendAdminBlogSubmittedEmail(adminRow.email, adminRow.full_name || 'Admin', finalTitle, authorName).catch(err => {
              console.error('Failed to send admin blog resubmission email:', err);
            });
          }
        }
      } catch (err) {
        console.error('Failed to notify admins on blog edit resubmission:', err);
      }
    }

    res.json({ message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// 8. Delete Blog Post (Author or Admin)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [posts]: any = await pool.execute('SELECT author_id, title, status FROM blog_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const post = posts[0];
    const isAuthor = post.author_id === userId;

    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const isAdminUser = adminRoles.length > 0;

    if (!isAuthor && !isAdminUser) {
      return res.status(403).json({ error: 'You are not authorized to delete this blog post' });
    }

    // Fellow delete restriction: Can only delete draft or rejected blogs
    if (!isAdminUser && post.status !== 'draft' && post.status !== 'rejected') {
      return res.status(403).json({ error: 'You are only allowed to delete draft or rejected posts.' });
    }

    await pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    // Log Activity
    await logUserActivity(
      userId,
      'delete_blog',
      `Deleted blog post: "${post.title}"`,
      { postId: id }
    );

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// 9. Like/Unlike Blog Post
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    // Check if liked
    const [liked]: any = await pool.execute(
      'SELECT * FROM blog_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    let hasLiked = false;

    if (liked.length === 0) {
      await pool.execute('INSERT INTO blog_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      await pool.execute('UPDATE blog_posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      hasLiked = true;
    } else {
      await pool.execute('DELETE FROM blog_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      await pool.execute('UPDATE blog_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ?', [postId]);
      hasLiked = false;
    }

    // Get current like count
    const [likesResult]: any = await pool.execute('SELECT like_count FROM blog_posts WHERE id = ?', [postId]);
    const likeCount = likesResult[0]?.like_count || 0;

    res.json({ liked: hasLiked, likeCount });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ error: 'Failed to register like action' });
  }
});

// 10. Bookmark/Unbookmark Blog Post
router.post('/:id/bookmark', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;

    // Check if saved
    const [saved]: any = await pool.execute(
      'SELECT * FROM blog_saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    let isSaved = false;

    if (saved.length === 0) {
      await pool.execute('INSERT INTO blog_saved_posts (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      isSaved = true;
    } else {
      await pool.execute('DELETE FROM blog_saved_posts WHERE user_id = ? AND post_id = ?', [userId, postId]);
      isSaved = false;
    }

    res.json({ saved: isSaved });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    res.status(500).json({ error: 'Failed to bookmark post' });
  }
});

// 11. Comments - Fetch approved comments tree for post
router.get('/:id/comments', async (req, res: Response) => {
  try {
    const postId = req.params.id;
    const [comments]: any = await pool.execute(
      `SELECT c.*, pr.full_name as author_name, pr.avatar_url as author_avatar
       FROM blog_comments c
       JOIN profiles pr ON c.user_id = pr.id
       WHERE c.post_id = ? AND c.status = 'approved'
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// 12. Comments - Post a comment/reply
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const commentId = uuidv4();
    await pool.execute(
      `INSERT INTO blog_comments (id, post_id, user_id, parent_id, content, status)
       VALUES (?, ?, ?, ?, ?, 'approved')`,
      [commentId, postId, userId, parent_id || null, content.trim()]
    );

    // Update comment count
    await pool.execute('UPDATE blog_posts SET comment_count = comment_count + 1 WHERE id = ?', [postId]);

    // Fetch the inserted comment details for return
    const [details]: any = await pool.execute(
      `SELECT c.*, pr.full_name as author_name, pr.avatar_url as author_avatar
       FROM blog_comments c
       JOIN profiles pr ON c.user_id = pr.id
       WHERE c.id = ?`,
      [commentId]
    );

    res.status(201).json(details[0]);
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// 13. Comments - Delete comment (Owner or Admin)
router.delete('/comments/:commentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    const [comments]: any = await pool.execute('SELECT user_id, post_id FROM blog_comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = comments[0];
    const isOwner = comment.user_id === userId;

    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const isAdminUser = adminRoles.length > 0;

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await pool.execute('DELETE FROM blog_comments WHERE id = ?', [commentId]);
    await pool.execute('UPDATE blog_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?', [comment.post_id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// 14. Admin approval - Approve Post
router.put('/admin/approve/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch post details first
    const [posts]: any = await pool.execute('SELECT author_id, title FROM blog_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    const post = posts[0];

    // Fetch author details
    const [users]: any = await pool.execute(
      `SELECT email, full_name FROM users WHERE id = ?`,
      [post.author_id]
    );

    await pool.execute(
      `UPDATE blog_posts 
       SET status = 'published', is_published = 1, published_at = NOW(), rejection_reason = NULL 
       WHERE id = ?`,
      [id]
    );

    // Send notification to the author
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'blog', 'Blog Approved! 🎉', ?, '/blog')`,
      [uuidv4(), post.author_id, `Your blog submission "${post.title}" has been approved and published.`]
    );

    if (users.length > 0) {
      try {
        await sendBlogApprovedEmail(users[0].email, users[0].full_name || 'Fellow', post.title);
      } catch (err) {
        console.error('Failed to send blog approval email:', err);
      }
    }

    res.json({ message: 'Blog submission approved and published successfully' });
  } catch (error) {
    console.error('Approve blog error:', error);
    res.status(500).json({ error: 'Failed to approve blog post' });
  }
});

// 15. Admin approval - Reject Post
router.put('/admin/reject/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // Fetch post details first
    const [posts]: any = await pool.execute('SELECT author_id, title FROM blog_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    const post = posts[0];

    // Fetch author details
    const [users]: any = await pool.execute(
      `SELECT email, full_name FROM users WHERE id = ?`,
      [post.author_id]
    );

    await pool.execute(
      `UPDATE blog_posts 
       SET status = 'rejected', is_published = 0, rejection_reason = ? 
       WHERE id = ?`,
      [reason, id]
    );

    // Send notification to the author
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'blog', 'Blog Revision Requested 📝', ?, '/dashboard/profile')`,
      [uuidv4(), post.author_id, `Your blog submission "${post.title}" requires revisions. Reason: ${reason}`]
    );

    if (users.length > 0) {
      try {
        await sendBlogRejectedEmail(users[0].email, users[0].full_name || 'Fellow', post.title, reason);
      } catch (err) {
        console.error('Failed to send blog rejection email:', err);
      }
    }

    res.json({ message: 'Blog submission rejected successfully' });
  } catch (error) {
    console.error('Reject blog error:', error);
    res.status(500).json({ error: 'Failed to reject blog post' });
  }
});

// 16. Get all blog posts for Admin management
router.get('/admin/all', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [posts]: any = await pool.execute(
      `SELECT p.*, pr.avatar_url as author_avatar
       FROM blog_posts p
       LEFT JOIN profiles pr ON p.author_id = pr.id
       ORDER BY p.created_at DESC`
    );

    for (const post of posts) {
      const [tags]: any = await pool.execute(
        `SELECT t.name FROM blog_tags t
         JOIN blog_post_tags pt ON pt.tag_id = t.id
         WHERE pt.post_id = ?`,
        [post.id]
      );
      post.tags = tags.map((t: any) => t.name);
    }

    res.json(posts);
  } catch (error) {
    console.error('Get admin all blogs error:', error);
    res.status(500).json({ error: 'Failed to retrieve all blog posts' });
  }
});

// 17. Upload cover image (Base64)
router.post('/upload-cover', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Extract format and base64 data
    const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URI.' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `cover-${uuidv4()}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, dataBuffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const coverImageUrl = `${protocol}://${req.get('host')}/uploads/${filename}`;

    res.json({ coverImageUrl });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ error: 'Failed to upload cover image' });
  }
});

export default router;
