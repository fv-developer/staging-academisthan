import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';
import { logUserActivity } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { sendFellowDeletedEmail, sendAdminFellowResubmittedEmail } from '../services/email';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get profile by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [profiles]: any = await pool.execute(
      'SELECT * FROM profiles WHERE id = ?',
      [req.params.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Upload profile photo (Base64)
router.post('/upload-avatar', authenticate, async (req: AuthRequest, res: Response) => {
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

    const filename = `avatar-${req.user!.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, dataBuffer);

    const avatarUrl = `/uploads/${filename}`;
 
    res.json({ avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Update profile
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Only allow users to update their own profile (or admins)
    const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [req.user!.id]);
    const isAdmin = adminRoles.length > 0;
    if (req.user!.id !== id && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Fetch existing profile
    const [currentProfiles]: any = await pool.execute('SELECT * FROM profiles WHERE id = ?', [id]);
    if (currentProfiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    const current = currentProfiles[0];

    const {
      full_name,
      phone,
      designation,
      department,
      institution,
      city,
      state,
      address,
      pincode,
      specialization,
      experience_years,
      bio,
      linkedin_url,
      google_scholar_url,
      teacher_type,
      avatar_url,
      country,
      work_email,
    } = req.body;

    // Sync full_name to users table if provided
    if (full_name !== undefined) {
      await pool.execute(
        'UPDATE users SET full_name = ? WHERE id = ?',
        [full_name ?? null, id]
      );
    }

    const merged = {
      full_name: full_name !== undefined ? full_name : current.full_name,
      designation: designation !== undefined ? designation : current.designation,
      department: department !== undefined ? department : current.department,
      institution: institution !== undefined ? institution : current.institution,
      city: city !== undefined ? city : current.city,
      state: state !== undefined ? state : current.state,
      specialization: specialization !== undefined ? specialization : current.specialization,
      bio: bio !== undefined ? bio : current.bio
    };

    const isComplete = Object.values(merged).every(val => val && String(val).trim());
    let shouldNotifyResubmission = false;

    const updates: string[] = [];
    const params: any[] = [];

    const allowedFields = [
      'full_name', 'phone', 'designation', 'department', 'institution',
      'city', 'state', 'address', 'pincode', 'specialization',
      'experience_years', 'bio', 'linkedin_url', 'google_scholar_url',
      'teacher_type', 'avatar_url', 'country', 'work_email'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field] === "" ? null : req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let query = `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW()`;

    if (isComplete && (current.membership_status === 'rejected' || current.membership_status === 'pending' || current.membership_status === 'inactive')) {
      query += `, membership_status = ?, status = ?, rejection_reason = NULL`;
      params.push('pending_review', 'pending_review');
      shouldNotifyResubmission = true;
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);

    // Get updated profile
    const [profiles]: any = await pool.execute(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );

    // Log profile update activity
    await logUserActivity(
      id,
      'profile_update',
      'Updated profile information',
      { full_name }
    );

    if (shouldNotifyResubmission) {
      try {
        const [admins]: any = await pool.execute(
          `SELECT p.id, p.email, p.full_name FROM profiles p 
           JOIN admin_roles ar ON p.id = ar.user_id`
        );
        const nameToUse = merged.full_name || current.full_name || 'A fellow';

        for (const adminUser of admins) {
          await pool.execute(
            `INSERT INTO notifications (id, user_id, type, title, message, link)
             VALUES (?, ?, 'general', 'Fellow Profile Resubmitted 👤', ?, '/admin/fellows')`,
            [uuidv4(), adminUser.id, `${nameToUse} has resubmitted their profile for review.`]
          );

          if (adminUser.email) {
            sendAdminFellowResubmittedEmail(adminUser.email, adminUser.full_name || 'Admin', nameToUse).catch(err => {
              console.error('Failed to send admin resubmit notification email:', err);
            });
          }
        }
      } catch (err) {
        console.error('Failed to notify admins on profile resubmission:', err);
      }
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete profile (deletes user account as well, cascading to profile)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Only allow users to delete their own account (or admins)
    if (req.user!.id !== id) {
      const [adminRoles]: any = await pool.execute('SELECT role FROM admin_roles WHERE user_id = ?', [req.user!.id]);
      if (adminRoles.length === 0) {
        return res.status(403).json({ error: 'Not authorized to delete this account' });
      }
    }

    // Fetch user details first to send email before deletion
    const [users]: any = await pool.execute('SELECT email, full_name FROM users WHERE id = ?', [id]);
    if (users.length > 0) {
      const user = users[0];
      try {
        await sendFellowDeletedEmail(user.email, user.full_name || 'Fellow');
      } catch (err) {
        console.error('Failed to send fellow deletion email:', err);
      }
    }

    // Delete user from users table (cascades to profile)
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Request email change
router.post('/request-email-change', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { newEmail } = req.body;

    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({ error: 'New email address is required' });
    }

    const trimmedEmail = newEmail.trim().toLowerCase();

    // Check if new email is already in use
    const [existingUsers]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    // Check if there is an existing pending request
    const [pendingRequests]: any = await pool.execute(
      'SELECT id FROM email_change_requests WHERE user_id = ? AND status = \'pending\'',
      [userId]
    );

    if (pendingRequests.length > 0) {
      return res.status(400).json({ error: 'A pending email change request already exists. Please wait for admin approval.' });
    }

    // Get current email from users
    const [userRows]: any = await pool.execute(
      'SELECT email, full_name FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldEmail = userRows[0].email;
    const fullName = userRows[0].full_name;

    // Create the email change request
    const requestId = uuidv4();
    await pool.execute(
      `INSERT INTO email_change_requests (id, user_id, old_email, new_email, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [requestId, userId, oldEmail, trimmedEmail]
    );

    // Create notifications for all admins
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );
      for (const adminUser of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'general', 'Email Change Request 📧', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, `${fullName} has requested to change their email from ${oldEmail} to ${trimmedEmail}.`]
        );
      }
    } catch (err) {
      console.error('Failed to notify admins on email change request:', err);
    }

    // Log activity
    await logUserActivity(userId, 'email_change_request', 'Submitted an email change request', { oldEmail, newEmail: trimmedEmail });

    res.json({ message: 'Email change request submitted successfully. Waiting for admin approval.' });
  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({ error: 'Failed to submit email change request' });
  }
});

// Request reactivation of suspended account
router.post('/request-reactivation', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Check if the profile is actually suspended
    const [profiles]: any = await pool.execute(
      'SELECT membership_status, full_name FROM profiles WHERE id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = profiles[0];
    if (profile.membership_status !== 'suspended') {
      return res.status(400).json({ error: 'Account is not suspended' });
    }

    // Update status to pending_review
    await pool.execute(
      "UPDATE profiles SET membership_status = 'pending_review', status = 'pending_review', suspension_reason = NULL WHERE id = ?",
      [userId]
    );

    // Notify administrators
    try {
      const [admins]: any = await pool.execute(
        `SELECT p.id, p.email, p.full_name FROM profiles p 
         JOIN admin_roles ar ON p.id = ar.user_id`
      );

      const fullName = profile.full_name || 'A fellow';
      for (const adminUser of admins) {
        // Add a dashboard notification for the admin
        await pool.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'fellowship_status', 'Fellow Reactivation Request 🔓', ?, '/admin/fellows')`,
          [uuidv4(), adminUser.id, `${fullName} has requested reactivation of their suspended account.`]
        );
      }
    } catch (err) {
      console.error('Failed to notify admins on reactivation request:', err);
    }

    // Log activity
    await logUserActivity(userId, 'reactivation_request', 'Submitted a reactivation request for suspended account');

    res.json({ message: 'Reactivation request submitted successfully. Waiting for admin review.' });
  } catch (error) {
    console.error('Request reactivation error:', error);
    res.status(500).json({ error: 'Failed to submit reactivation request' });
  }
});

// Deactivate account
router.post('/deactivate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await pool.execute('UPDATE profiles SET is_deactivated = TRUE WHERE id = ?', [userId]);
    await logUserActivity(userId, 'deactivate_account', 'Deactivated user account');
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

// Reactivate account (fellow-initiated)
router.post('/reactivate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await pool.execute('UPDATE profiles SET is_deactivated = FALSE WHERE id = ?', [userId]);
    await logUserActivity(userId, 'reactivate_account', 'Reactivated user account');
    res.json({ message: 'Account reactivated successfully' });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({ error: 'Failed to reactivate account' });
  }
});

export default router;
