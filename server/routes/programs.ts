import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { authenticate, AuthRequest, isAdmin } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '../utils/logger';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all programs
router.get('/', async (req, res: Response) => {
  try {
    const [programs]: any = await pool.execute('SELECT * FROM programs ORDER BY created_at DESC');
    for (const prog of programs) {
      const [modules]: any = await pool.execute(
        'SELECT * FROM program_modules WHERE program_id = ? ORDER BY sort_order ASC',
        [prog.id]
      );
      prog.modules = modules || [];
    }
    res.json(programs);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

// Get enrollments for the logged-in user
router.get('/enrollments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [enrollments] = await pool.execute(
      `SELECT e.*, p.title as program_title, p.description as program_description, p.duration, p.level, p.category, p.image_url, p.slug
       FROM enrollments e
       JOIN programs p ON e.program_id = p.id
       WHERE e.user_id = ?
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );
    res.json(enrollments);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
});

// Get certificates for the logged-in user
router.get('/enrollments/certificates', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [certs] = await pool.execute(
      `SELECT c.*, p.title as program_title, p.category, p.slug
       FROM certificates c
       JOIN programs p ON c.program_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );
    res.json(certs);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to get certificates' });
  }
});

// Get program by slug
router.get('/:slug', async (req, res: Response) => {
  try {
    const [programs]: any = await pool.execute('SELECT * FROM programs WHERE slug = ?', [req.params.slug]);
    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    const program = programs[0];
    const [modules]: any = await pool.execute(
      'SELECT * FROM program_modules WHERE program_id = ? ORDER BY sort_order ASC',
      [program.id]
    );
    
    for (const mod of modules) {
      const [steps] = await pool.execute(
        'SELECT * FROM lms_syllabus_steps WHERE module_id = ? ORDER BY sort_order ASC',
        [mod.id]
      );
      mod.steps = steps;
    }
    
    program.modules = modules;
    res.json(program);
  } catch (error) {
    console.error('Get program by slug error:', error);
    res.status(500).json({ error: 'Failed to get program' });
  }
});

// Upload program cover image (Base64) (Admin only)
router.post('/upload-cover', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URI.' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `prog-${uuidv4()}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, dataBuffer);

    const coverImageUrl = `/api/uploads/${filename}`;
 
    res.json({ coverImageUrl });
  } catch (error) {
    console.error('Upload program cover error:', error);
    res.status(500).json({ error: 'Failed to upload cover image' });
  }
});

// Create new program (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, description, duration, level, category, image_url, prerequisites, learning_outcomes } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Program title is required' });
    }

    const baseSlug = (slug || title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
    let programSlug = baseSlug;
    let counter = 1;

    while (true) {
      const [existing]: any = await pool.execute('SELECT id FROM programs WHERE slug = ?', [programSlug]);
      if (existing.length === 0) {
        break;
      }
      programSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const programId = uuidv4();
    await pool.execute(
      `INSERT INTO programs (
        id, title, slug, description, duration, level, category, image_url, is_published, prerequisites, learning_outcomes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        programId,
        title,
        programSlug,
        description || null,
        duration || null,
        level || null,
        category || null,
        image_url || null,
        prerequisites || null,
        learning_outcomes || null,
      ]
    );

    const [programs]: any = await pool.execute('SELECT * FROM programs WHERE id = ?', [programId]);
    res.status(201).json(programs[0]);
  } catch (error) {
    console.error('Create program error:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});



// Enroll a user in a program (Admin can enroll any user; user can enroll themselves if they pass user_id)
router.post('/enroll', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const loggedInUser = req.user!;
    const { program_id, user_id } = req.body;

    if (!program_id) {
      return res.status(400).json({ error: 'Program ID is required' });
    }

    // Determine target user
    let targetUserId = user_id || loggedInUser.id;

    // Check permissions: if enrolling another user, must be admin
    if (targetUserId !== loggedInUser.id) {
      const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [loggedInUser.id]);
      const hasAdmin = adminRoles.length > 0;
      if (!hasAdmin) {
        return res.status(403).json({ error: 'Only administrators can enroll other users' });
      }
    }

    // Check if program exists
    const [programs]: any = await pool.execute('SELECT id FROM programs WHERE id = ?', [program_id]);
    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Check if already enrolled
    const [existing]: any = await pool.execute(
      'SELECT id FROM enrollments WHERE program_id = ? AND user_id = ?',
      [program_id, targetUserId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User is already enrolled in this program' });
    }

    const enrollmentId = uuidv4();
    await pool.execute(
      `INSERT INTO enrollments (id, program_id, user_id, status, progress_percentage, enrolled_at)
       VALUES (?, ?, ?, 'enrolled', 0, NOW())`,
      [enrollmentId, program_id, targetUserId]
    );

    const [enrollments]: any = await pool.execute(
      `SELECT e.*, p.title as program_title
       FROM enrollments e
       JOIN programs p ON e.program_id = p.id
       WHERE e.id = ?`,
      [enrollmentId]
    );

    // Add a notification for the enrolled user
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'program_enrollment', 'Enrolled in Program 🎓', ?, '/dashboard/courses')`,
      [uuidv4(), targetUserId, `You have been enrolled in: ${enrollments[0].program_title}.`]
    );

    // Notify admins about the new course enrollment
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );
      // Fetch user name
      const [userRow]: any = await pool.execute('SELECT full_name FROM users WHERE id = ?', [targetUserId]);
      const userName = userRow[0]?.full_name || 'A fellow';
      for (const adminUser of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'course', 'New Course Enrollment 🎓', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, `${userName} enrolled in: ${enrollments[0].program_title}.`]
        );
      }
    } catch (err) {
      console.error('Failed to notify admins on enrollment:', err);
    }

    // Log assign_program activity
    await logUserActivity(
      targetUserId,
      'assign_program',
      `Assigned to program: ${enrollments[0].program_title}`,
      { programId: program_id, enrollmentId }
    );

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment: enrollments[0],
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll user' });
  }
});

// Update enrollment progress
router.put('/enrollments/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { progress_percentage, status } = req.body;
    const userId = req.user!.id;

    // Check if enrollment belongs to user (or if admin)
    const [enrollments]: any = await pool.execute('SELECT user_id, program_id FROM enrollments WHERE id = ?', [id]);
    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const isOwn = enrollments[0].user_id === userId;
    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const hasAdmin = adminRoles.length > 0;

    if (!isOwn && !hasAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this enrollment' });
    }

    let query = 'UPDATE enrollments SET ';
    const params: any[] = [];
    const fields: string[] = [];

    if (progress_percentage !== undefined) {
      fields.push('progress_percentage = ?');
      params.push(progress_percentage);
    }

    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
      if (status === 'completed') {
        fields.push('completed_at = NOW()');
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += fields.join(', ') + ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    // Fetch details for logging
    const [enrollmentDetails]: any = await pool.execute(
      `SELECT e.*, p.title as program_title
       FROM enrollments e
       JOIN programs p ON e.program_id = p.id
       WHERE e.id = ?`,
      [id]
    );

    if (enrollmentDetails.length > 0) {
      const details = enrollmentDetails[0];
      if (status === 'completed') {
        await logUserActivity(
          details.user_id,
          'complete_program',
          `Completed program: ${details.program_title}`,
          { programId: details.program_id, enrollmentId: id }
        );
      } else if (progress_percentage !== undefined) {
        await logUserActivity(
          details.user_id,
          'update_progress',
          `Updated progress for "${details.program_title}" to ${progress_percentage}%`,
          { programId: details.program_id, enrollmentId: id, progress_percentage }
        );
      }
    }

    // If completed, check/generate certificate
    if (status === 'completed') {
      const [existingCert]: any = await pool.execute(
        'SELECT id FROM certificates WHERE user_id = ? AND program_id = ?',
        [enrollments[0].user_id, enrollments[0].program_id]
      );
      if (existingCert.length === 0) {
        const certId = uuidv4();
        const certNum = `ACAD-CERT-${Math.floor(100000 + Math.random() * 900000)}`;

        const [activeTemplates]: any = await pool.execute('SELECT * FROM certificate_templates WHERE is_active = 1 LIMIT 1').catch(() => [[]]);
        const activeTemplate = activeTemplates && activeTemplates.length > 0 ? activeTemplates[0] : null;
        const templateSnapshot = activeTemplate ? JSON.stringify({
          backgroundImageUrl: activeTemplate.background_image_url,
          fieldPositions: typeof activeTemplate.field_positions === 'string' ? JSON.parse(activeTemplate.field_positions) : activeTemplate.field_positions
        }) : null;

        await pool.execute(
          `INSERT INTO certificates (id, user_id, program_id, certificate_number, certificate_type, issued_at, template_snapshot)
           VALUES (?, ?, ?, ?, 'program', NOW(), ?)`,
          [certId, enrollments[0].user_id, enrollments[0].program_id, certNum, templateSnapshot]
        );

        if (enrollmentDetails.length > 0) {
          await logUserActivity(
            enrollments[0].user_id,
            'earn_certificate',
            `Earned completion certificate for: ${enrollmentDetails[0].program_title} (Cert: ${certNum})`,
            { programId: enrollments[0].program_id, certificateId: certId, certificateNumber: certNum }
          );

          // Notify admins about the course completion
          try {
            const [admins]: any = await pool.execute(
              `SELECT p.id FROM profiles p 
               JOIN admin_roles ar ON p.id = ar.user_id`
            );
            // Fetch user name
            const [userRow]: any = await pool.execute('SELECT full_name FROM users WHERE id = ?', [enrollments[0].user_id]);
            const userName = userRow[0]?.full_name || 'A fellow';
            for (const adminUser of admins) {
              await pool.execute(
                `INSERT INTO notifications (id, user_id, type, title, message, link)
                 VALUES (?, ?, 'certificate', 'Course Completed 🏆', ?, '/admin/fellows')`,
                [uuidv4(), adminUser.id, `${userName} has completed: ${enrollmentDetails[0].program_title}.`]
              );
            }
          } catch (err) {
            console.error('Failed to notify admins on completion:', err);
          }
        }
      }
    }

    res.json({ message: 'Enrollment updated successfully' });
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ error: 'Failed to update enrollment' });
  }
});

// Delete enrollment
router.delete('/enrollments/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if enrollment belongs to user (or if admin)
    const [enrollments]: any = await pool.execute('SELECT user_id FROM enrollments WHERE id = ?', [id]);
    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const isOwn = enrollments[0].user_id === userId;
    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const hasAdmin = adminRoles.length > 0;

    if (!isOwn && !hasAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this enrollment' });
    }

    await pool.execute('DELETE FROM enrollments WHERE id = ?', [id]);
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
});

// Update program details (Admin only)
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, description, duration, level, category, image_url, prerequisites, learning_outcomes } = req.body;
    await pool.execute(
      `UPDATE programs SET 
        title = ?, slug = ?, description = ?, duration = ?, level = ?, category = ?, 
        image_url = ?, prerequisites = ?, learning_outcomes = ?
       WHERE id = ?`,
      [title, slug, description || null, duration || null, level || null, category || null, image_url || null, prerequisites || null, learning_outcomes || null, req.params.id]
    );
    res.json({ message: 'Program updated successfully' });
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete program (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute('DELETE FROM programs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

// Get modules for a program
router.get('/:id/modules', async (req, res: Response) => {
  try {
    const [modules] = await pool.execute(
      'SELECT * FROM program_modules WHERE program_id = ? ORDER BY sort_order ASC',
      [req.params.id]
    );
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to get modules' });
  }
});

// Add module (Admin only)
router.post('/:id/modules', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, video_url, content, sort_order, duration_minutes, chapter } = req.body;
    const moduleId = uuidv4();
    await pool.execute(
      `INSERT INTO program_modules (id, program_id, chapter, title, description, video_url, content, sort_order, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [moduleId, req.params.id, chapter || null, title, description || null, video_url || null, content || null, sort_order || 0, duration_minutes || null]
    );
    res.status(201).json({ id: moduleId, message: 'Module added successfully' });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({ error: 'Failed to add module' });
  }
});

// Update module (Admin only)
router.put('/modules/:moduleId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, video_url, content, sort_order, duration_minutes, chapter } = req.body;
    await pool.execute(
      `UPDATE program_modules SET 
        title = ?, description = ?, video_url = ?, content = ?, sort_order = ?, duration_minutes = ?, chapter = ?
       WHERE id = ?`,
      [title, description || null, video_url || null, content || null, sort_order || 0, duration_minutes || null, chapter || null, req.params.moduleId]
    );
    res.json({ message: 'Module updated successfully' });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

// Delete module (Admin only)
router.delete('/modules/:moduleId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute('DELETE FROM program_modules WHERE id = ?', [req.params.moduleId]);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

// Get enrollments for a specific user (Admin only)
router.get('/users/:userId/enrollments', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [enrollments] = await pool.execute(
      `SELECT e.*, p.title as program_title, p.category, p.duration, p.level
       FROM enrollments e
       JOIN programs p ON e.program_id = p.id
       WHERE e.user_id = ?
       ORDER BY e.enrolled_at DESC`,
      [req.params.userId]
    );
    res.json(enrollments);
  } catch (error) {
    console.error('Get user enrollments error:', error);
    res.status(500).json({ error: 'Failed to get user enrollments' });
  }
});

// === LMS SYLLABUS STEPS AND PROGRESS ENDPOINTS ===

// Get syllabus steps for a module
router.get('/modules/:moduleId/steps', async (req, res: Response) => {
  try {
    const [steps] = await pool.execute(
      'SELECT * FROM lms_syllabus_steps WHERE module_id = ? ORDER BY sort_order ASC',
      [req.params.moduleId]
    );
    res.json(steps);
  } catch (error) {
    console.error('Get syllabus steps error:', error);
    res.status(500).json({ error: 'Failed to get syllabus steps' });
  }
});

// Add syllabus step (Admin only)
router.post('/modules/:moduleId/steps', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content_type, video_url, text_content, file_url, quiz_questions, passing_score, sort_order, duration_minutes } = req.body;
    
    if (!title || !content_type) {
      return res.status(400).json({ error: 'Title and content type are required' });
    }

    const stepId = uuidv4();
    await pool.execute(
      `INSERT INTO lms_syllabus_steps (
        id, module_id, title, content_type, video_url, text_content, file_url, quiz_questions, passing_score, sort_order, duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stepId,
        req.params.moduleId,
        title,
        content_type,
        video_url || null,
        text_content || null,
        file_url || null,
        quiz_questions ? (typeof quiz_questions === 'string' ? quiz_questions : JSON.stringify(quiz_questions)) : null,
        passing_score !== undefined ? passing_score : 80,
        sort_order || 0,
        duration_minutes || 0
      ]
    );

    res.status(201).json({ id: stepId, message: 'Syllabus step added successfully' });
  } catch (error) {
    console.error('Add syllabus step error:', error);
    res.status(500).json({ error: 'Failed to add syllabus step' });
  }
});

// Update syllabus step (Admin only)
router.put('/steps/:stepId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content_type, video_url, text_content, file_url, quiz_questions, passing_score, sort_order, duration_minutes } = req.body;
    
    await pool.execute(
      `UPDATE lms_syllabus_steps SET 
        title = COALESCE(?, title),
        content_type = COALESCE(?, content_type),
        video_url = ?,
        text_content = ?,
        file_url = ?,
        quiz_questions = ?,
        passing_score = ?,
        sort_order = COALESCE(?, sort_order),
        duration_minutes = COALESCE(?, duration_minutes),
        updated_at = NOW()
      WHERE id = ?`,
      [
        title || null,
        content_type || null,
        video_url || null,
        text_content || null,
        file_url || null,
        quiz_questions ? (typeof quiz_questions === 'string' ? quiz_questions : JSON.stringify(quiz_questions)) : null,
        passing_score !== undefined ? passing_score : null,
        sort_order !== undefined ? sort_order : null,
        duration_minutes !== undefined ? duration_minutes : null,
        req.params.stepId
      ]
    );

    res.json({ message: 'Syllabus step updated successfully' });
  } catch (error) {
    console.error('Update syllabus step error:', error);
    res.status(500).json({ error: 'Failed to update syllabus step' });
  }
});

// Delete syllabus step (Admin only)
router.delete('/steps/:stepId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute('DELETE FROM lms_syllabus_steps WHERE id = ?', [req.params.stepId]);
    res.json({ message: 'Syllabus step deleted successfully' });
  } catch (error) {
    console.error('Delete syllabus step error:', error);
    res.status(500).json({ error: 'Failed to delete syllabus step' });
  }
});

// Get user progress for an enrollment
router.get('/enrollments/:enrollmentId/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [progress] = await pool.execute(
      `SELECT sp.* 
       FROM lms_user_step_progress sp
       JOIN enrollments e ON sp.enrollment_id = e.id
       WHERE sp.enrollment_id = ? AND (e.user_id = ? OR EXISTS(SELECT role FROM admin_roles WHERE user_id = ?))`,
      [req.params.enrollmentId, userId, userId]
    );
    res.json(progress);
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({ error: 'Failed to get student progress' });
  }
});

// Complete a syllabus step (student/admin)
router.post('/enrollments/:enrollmentId/steps/:stepId/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { enrollmentId, stepId } = req.params;
    const { score, bypass } = req.body; // Score for quizzes

    // Validate enrollment and ownership
    const [enrollments]: any = await pool.execute(
      'SELECT user_id, program_id FROM enrollments WHERE id = ?',
      [enrollmentId]
    );
    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    const enrollment = enrollments[0];
    const isOwn = enrollment.user_id === userId;
    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [userId]);
    const hasAdmin = adminRoles.length > 0;

    if (!isOwn && !hasAdmin) {
      return res.status(403).json({ error: 'Not authorized to complete steps for this enrollment' });
    }

    // Fetch step details to verify type
    const [steps]: any = await pool.execute('SELECT * FROM lms_syllabus_steps WHERE id = ?', [stepId]);
    if (steps.length === 0) {
      return res.status(404).json({ error: 'Syllabus step not found' });
    }
    const step = steps[0];

    let passed: boolean | null = null;
    let finalScore: number | null = null;

    if (step.content_type === 'quiz') {
      if (score === undefined) {
        return res.status(400).json({ error: 'Quiz score is required' });
      }
      finalScore = score;
      passed = bypass ? true : (score >= (step.passing_score || 80));
    }

    // Upsert progress
    const progressId = uuidv4();
    await pool.execute(
      `INSERT INTO lms_user_step_progress (id, enrollment_id, step_id, user_id, completed, score, passed, attempts, completed_at)
       VALUES (?, ?, ?, ?, TRUE, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE 
         attempts = attempts + 1,
         score = ?,
         passed = ?,
         completed_at = NOW()`,
      [progressId, enrollmentId, stepId, enrollment.user_id, finalScore, passed, finalScore, passed]
    );

    // Calculate overall enrollment progress percentage
    // Get all steps for this program
    const [allSteps]: any = await pool.execute(
      `SELECT s.id 
       FROM lms_syllabus_steps s
       JOIN program_modules m ON s.module_id = m.id
       WHERE m.program_id = ?`,
      [enrollment.program_id]
    );

    const totalSteps = allSteps.length;
    let progressPercent = 0;

    if (totalSteps > 0) {
      // Get completed steps (if quiz, must be passed)
      const [completedSteps]: any = await pool.execute(
        `SELECT COUNT(DISTINCT step_id) as count 
         FROM lms_user_step_progress 
         WHERE enrollment_id = ? AND (score IS NULL OR passed = TRUE)`,
        [enrollmentId]
      );
      const completedCount = completedSteps[0]?.count || 0;
      progressPercent = Math.round((completedCount / totalSteps) * 100);
    }

    const isComplete = progressPercent >= 100;
    const status = isComplete ? 'completed' : 'in_progress';

    // Update enrollment progress
    await pool.execute(
      `UPDATE enrollments 
       SET progress_percentage = ?, 
           status = ?, 
           completed_at = IF(?, NOW(), completed_at),
           updated_at = NOW() 
       WHERE id = ?`,
      [progressPercent, status, isComplete, enrollmentId]
    );

    // If completed and not already certified, issue certificate
    if (isComplete) {
      const [existingCert]: any = await pool.execute(
        'SELECT id FROM certificates WHERE user_id = ? AND program_id = ?',
        [enrollment.user_id, enrollment.program_id]
      );
      if (existingCert.length === 0) {
        const certId = uuidv4();
        const certNum = `ACAD-CERT-${Math.floor(100000 + Math.random() * 900000)}`;

        const [activeTemplates]: any = await pool.execute('SELECT * FROM certificate_templates WHERE is_active = 1 LIMIT 1').catch(() => [[]]);
        const activeTemplate = activeTemplates && activeTemplates.length > 0 ? activeTemplates[0] : null;
        const templateSnapshot = activeTemplate ? JSON.stringify({
          backgroundImageUrl: activeTemplate.background_image_url,
          fieldPositions: typeof activeTemplate.field_positions === 'string' ? JSON.parse(activeTemplate.field_positions) : activeTemplate.field_positions
        }) : null;

        await pool.execute(
          `INSERT INTO certificates (id, user_id, program_id, certificate_number, certificate_type, issued_at, template_snapshot)
           VALUES (?, ?, ?, ?, 'program', NOW(), ?)`,
          [certId, enrollment.user_id, enrollment.program_id, certNum, templateSnapshot]
        );
      }
    }

    res.json({
      message: 'Step completed successfully',
      progress_percentage: progressPercent,
      completed: true,
      passed,
      score: finalScore
    });
  } catch (error) {
    console.error('Complete step error:', error);
    res.status(500).json({ error: 'Failed to complete syllabus step' });
  }
});

// Admin: Get progress reports for all fellows (Admin only)
router.get('/admin/progress-reports', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [reports] = await pool.execute(
      `SELECT 
        e.id as enrollment_id,
        e.status as enrollment_status,
        e.progress_percentage,
        e.enrolled_at,
        e.completed_at,
        e.updated_at as last_activity,
        p.title as program_title,
        p.id as program_id,
        prof.id as user_id,
        prof.full_name,
        prof.email
       FROM enrollments e
       JOIN programs p ON e.program_id = p.id
       JOIN profiles prof ON e.user_id = prof.id
       ORDER BY e.updated_at DESC`
    );

    // Fetch quiz grades and module completion counts for each enrollment
    const reportsWithDetails = [];
    for (const rep of (reports as any[])) {
      const [grades]: any = await pool.execute(
        `SELECT sp.step_id, sp.score, sp.passed, sp.attempts, sp.completed_at, s.title as step_title, m.sort_order as mod_order, s.sort_order as step_order
         FROM lms_user_step_progress sp
         JOIN lms_syllabus_steps s ON sp.step_id = s.id
         LEFT JOIN program_modules m ON s.module_id = m.id
         WHERE sp.enrollment_id = ? AND s.content_type = 'quiz'
         ORDER BY m.sort_order ASC, s.sort_order ASC, s.title ASC`,
        [rep.enrollment_id]
      );
      
      const [modules]: any = await pool.execute(
        `SELECT 
          m.id as module_id, 
          m.title as module_title,
          COUNT(s.id) as total_steps,
          SUM(IF(sp.completed = 1 AND (s.content_type != 'quiz' OR sp.passed = 1), 1, 0)) as completed_steps
         FROM program_modules m
         JOIN lms_syllabus_steps s ON s.module_id = m.id
         LEFT JOIN lms_user_step_progress sp ON sp.step_id = s.id AND sp.enrollment_id = ?
         WHERE m.program_id = ?
         GROUP BY m.id`,
        [rep.enrollment_id, rep.program_id]
      );

      reportsWithDetails.push({
        ...rep,
        quizzes: grades,
        modules: modules.map((m: any) => ({
          id: m.module_id,
          title: m.module_title,
          completed: Number(m.total_steps) > 0 && Number(m.total_steps) === Number(m.completed_steps),
          progress: `${m.completed_steps}/${m.total_steps}`
        }))
      });
    }

    res.json(reportsWithDetails);
  } catch (error) {
    console.error('Get progress reports error:', error);
    res.status(500).json({ error: 'Failed to get progress reports' });
  }
});

// Reorder modules (Admin only)
router.put('/:id/modules/reorder', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { moduleIds } = req.body;
    if (!Array.isArray(moduleIds)) {
      return res.status(400).json({ error: 'moduleIds array is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < moduleIds.length; i++) {
        await connection.execute(
          'UPDATE program_modules SET sort_order = ? WHERE id = ? AND program_id = ?',
          [i, moduleIds[i], req.params.id]
        );
      }
      await connection.commit();
      res.json({ message: 'Modules reordered successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reorder modules error:', error);
    res.status(500).json({ error: 'Failed to reorder modules' });
  }
});

// Reorder syllabus steps (Admin only)
router.put('/modules/:moduleId/steps/reorder', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { stepIds } = req.body;
    if (!Array.isArray(stepIds)) {
      return res.status(400).json({ error: 'stepIds array is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < stepIds.length; i++) {
        await connection.execute(
          'UPDATE lms_syllabus_steps SET sort_order = ? WHERE id = ? AND module_id = ?',
          [i, stepIds[i], req.params.moduleId]
        );
      }
      await connection.commit();
      res.json({ message: 'Syllabus steps reordered successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reorder syllabus steps error:', error);
    res.status(500).json({ error: 'Failed to reorder syllabus steps' });
  }
});

export default router;
