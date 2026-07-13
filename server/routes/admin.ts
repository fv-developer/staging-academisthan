import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { 
  sendInstitutionStatusEmail, 
  sendInstitutionSuspendedEmail, 
  sendChangeRequestStatusEmail,
  sendFellowApprovedEmail,
  sendFellowRejectedEmail,
  sendFellowSuspendedEmail,
  sendInstitutionDeletedEmail
} from '../services/email';
import { sendPushNotification } from '../services/push';
import { logUserActivity } from '../utils/logger';

const router = express.Router();

// Middleware to check if user is admin
async function isAdmin(req: AuthRequest, res: Response, next: any) {
  try {
    const [roles]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [req.user!.id]
    );

    if (roles.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = { ...req.user!, role: roles[0].role };
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin status' });
  }
}

// Get user's admin role
router.get('/role', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [roles]: any = await pool.execute(
      'SELECT role, permissions FROM admin_roles WHERE user_id = ?',
      [req.user!.id]
    );

    if (roles.length === 0) {
      return res.json({ role: null, isAdmin: false });
    }

    res.json({
      role: roles[0].role,
      permissions: roles[0].permissions,
      isAdmin: true,
      isSuperAdmin: roles[0].role === 'super_admin',
      isModerator: roles[0].role === 'moderator',
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

// Get all institutions (with filters)
router.get('/institutions', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { 
      status, 
      search, 
      sortBy, 
      sortOrder,
      country,
      state,
      city,
      dateFrom,
      dateTo,
      fellowName,
      fellowEmail
    } = req.query;

    let whereClause = ' WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    if (country && country !== 'all') {
      whereClause += ' AND i.country = ?';
      params.push(country);
    }

    if (state && state !== 'all') {
      whereClause += ' AND i.state = ?';
      params.push(state);
    }

    if (city && city !== 'all') {
      whereClause += ' AND i.city = ?';
      params.push(city);
    }

    if (dateFrom) {
      whereClause += ' AND i.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      const toDate = dateTo.toString().includes('T') ? dateTo.toString() : `${dateTo} 23:59:59`;
      whereClause += ' AND i.created_at <= ?';
      params.push(toDate);
    }

    if (search) {
      whereClause += ' AND i.name LIKE ?';
      params.push(`%${search}%`);
    }

    if (fellowName) {
      whereClause += ' AND p.full_name LIKE ?';
      params.push(`%${fellowName}%`);
    }

    if (fellowEmail) {
      whereClause += ' AND p.email LIKE ?';
      params.push(`%${fellowEmail}%`);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM institutions i 
      LEFT JOIN profiles p ON i.registered_by = p.id
      ${whereClause}
    `;
    const [countRows]: any = await pool.execute(countQuery, params);
    const totalCount = countRows[0]?.total || 0;

    // Sorting
    let orderBy = 'ORDER BY i.created_at DESC';
    const sortCol = sortBy === 'name' ? 'name' : sortBy === 'oldest' ? 'created_at' : 'created_at';
    const orderDir = sortOrder === 'ASC' || sortOrder === 'asc' || sortBy === 'oldest' ? 'ASC' : 'DESC';
    orderBy = `ORDER BY i.${sortCol} ${orderDir}`;

    const mainQuery = `
      SELECT i.*, p.full_name AS fellow_name, ap.full_name AS admin_name 
      FROM institutions i 
      LEFT JOIN profiles p ON i.registered_by = p.id 
      LEFT JOIN profiles ap ON i.approved_by = ap.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    // prepared statements in mysql2 connection.execute expect strings for limit/offset
    const [institutions] = await pool.execute(mainQuery, [...params, limit, offset]);

    res.json({
      institutions,
      totalCount
    });
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({ error: 'Failed to get institutions' });
  }
});

// Get institution by ID (with pending change requests if any)
router.get('/institutions/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [institutions]: any = await pool.execute(
      `SELECT i.*, p.full_name AS fellow_name, p.phone AS fellow_phone, p.email AS fellow_email, ap.full_name AS admin_name 
       FROM institutions i 
       LEFT JOIN profiles p ON i.registered_by = p.id 
       LEFT JOIN profiles ap ON i.approved_by = ap.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (institutions.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const inst = institutions[0];

    // If pending change request, fetch it
    let changeRequest = null;
    if (inst.status === 'pending_change_approval') {
      const [requests]: any = await pool.execute(
        'SELECT * FROM institution_change_requests WHERE institution_id = ? AND status = "pending" LIMIT 1',
        [req.params.id]
      );
      if (requests.length > 0) {
        changeRequest = requests[0];
      }
    }

    res.json({ institution: inst, changeRequest });
  } catch (error) {
    console.error('Get institution details error:', error);
    res.status(500).json({ error: 'Failed to get institution' });
  }
});

// Approve institution
router.put('/institutions/:id/approve', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body || {};
    const adminId = req.user!.id;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get institution details to find contact person's user_id
      const [institutions]: any = await connection.execute(
        'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
        [id]
      );

      if (institutions.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Institution not found' });
      }

      // Update institution
      await connection.execute(
        `UPDATE institutions SET
          admin_approved = TRUE,
          status = 'approved',
          approved_by = ?,
          approved_at = NOW(),
          rejection_reason = NULL,
          suspension_reason = NULL,
          membership_status = 'active'
        WHERE id = ?`,
        [adminId, id]
      );

      // Log the action
      await connection.execute(
        `INSERT INTO approval_logs (id, institution_id, admin_id, action, notes)
         VALUES (?, ?, ?, 'approved', ?)`,
        [uuidv4(), id, adminId, notes || null]
      );

      // Find user by email and create notification
      const [users]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [institutions[0].contact_email]
      );

      if (users.length > 0) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'institution_status', 'Institution Approved! 🎉', 'Your institution registration has been approved and is now active.', '/dashboard/institutions')`,
          [uuidv4(), users[0].id]
        );
        sendPushNotification(users[0].id, 'Institution Approved! 🎉', 'Your institution registration has been approved and is now active.', '/dashboard/institutions').catch(err => {
          console.error('Push notification trigger error:', err);
        });
      }

      // Send email notification
      try {
        await sendInstitutionStatusEmail(
          institutions[0].contact_email,
          institutions[0].contact_person || 'Representative',
          institutions[0].name,
          'approved'
        );
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }

      await connection.commit();
      res.json({ message: 'Institution approved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Approve institution error:', error);
    res.status(500).json({ error: 'Failed to approve institution' });
  }
});

// Reject institution
router.put('/institutions/:id/reject', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body || {};
    const adminId = req.user!.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get institution details
      const [institutions]: any = await connection.execute(
        'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
        [id]
      );

      if (institutions.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Institution not found' });
      }

      // Update institution
      await connection.execute(
        `UPDATE institutions SET
          admin_approved = FALSE,
          status = 'rejected',
          approved_by = ?,
          approved_at = NOW(),
          rejection_reason = ?,
          membership_status = 'inactive'
        WHERE id = ?`,
        [adminId, reason, id]
      );

      // Log the action
      await connection.execute(
        `INSERT INTO approval_logs (id, institution_id, admin_id, action, reason, notes)
         VALUES (?, ?, ?, 'rejected', ?, ?)`,
        [uuidv4(), id, adminId, reason, notes || null]
      );

      // Find user by email and create notification
      const [users]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [institutions[0].contact_email]
      );

      if (users.length > 0) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'institution_status', 'Institution Registration Rejected ❌', ?, '/dashboard/institutions')`,
          [uuidv4(), users[0].id, `Your institution registration was rejected: ${reason}`]
        );
        sendPushNotification(users[0].id, 'Institution Registration Rejected ❌', `Your institution registration was rejected: ${reason}`, '/dashboard/institutions').catch(err => {
          console.error('Push notification trigger error:', err);
        });
      }

      // Send email notification
      try {
        await sendInstitutionStatusEmail(
          institutions[0].contact_email,
          institutions[0].contact_person || 'Representative',
          institutions[0].name,
          'rejected',
          reason
        );
      } catch (err) {
        console.error('Failed to send rejection email:', err);
      }

      await connection.commit();
      res.json({ message: 'Institution rejected successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reject institution error:', error);
    res.status(500).json({ error: 'Failed to reject institution' });
  }
});

// Suspend institution
router.put('/institutions/:id/suspend', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!reason) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [institutions]: any = await connection.execute(
        'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
        [id]
      );

      if (institutions.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Institution not found' });
      }

      await connection.execute(
        `UPDATE institutions SET
          status = 'suspended',
          suspension_reason = ?,
          membership_status = 'inactive'
         WHERE id = ?`,
        [reason, id]
      );

      await connection.execute(
        `INSERT INTO approval_logs (id, institution_id, admin_id, action, reason)
         VALUES (?, ?, ?, 'suspended', ?)`,
        [uuidv4(), id, adminId, reason]
      );

      const [users]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [institutions[0].contact_email]
      );

      if (users.length > 0) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'institution_status', 'Institution Suspended ⚠️', ?, '/dashboard/institutions')`,
          [uuidv4(), users[0].id, `Your institution "${institutions[0].name}" has been suspended: ${reason}`]
        );
      }

      // Send email
      try {
        await sendInstitutionSuspendedEmail(
          institutions[0].contact_email,
          institutions[0].contact_person || 'Representative',
          institutions[0].name,
          reason
        );
      } catch (err) {
        console.error('Failed to send suspension email:', err);
      }

      await connection.commit();
      res.json({ message: 'Institution suspended successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Suspend institution error:', error);
    res.status(500).json({ error: 'Failed to suspend institution' });
  }
});

// Bulk approve institutions
router.post('/institutions/bulk-approve', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, notes } = req.body;
    const adminId = req.user!.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of institution IDs is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const id of ids) {
        const [institutions]: any = await connection.execute(
          'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
          [id]
        );

        if (institutions.length === 0) continue;

        await connection.execute(
          `UPDATE institutions SET
            admin_approved = TRUE,
            status = 'approved',
            approved_by = ?,
            approved_at = NOW(),
            rejection_reason = NULL,
            suspension_reason = NULL,
            membership_status = 'active'
          WHERE id = ?`,
          [adminId, id]
        );

        await connection.execute(
          `INSERT INTO approval_logs (id, institution_id, admin_id, action, notes)
           VALUES (?, ?, ?, 'approved', ?)`,
          [uuidv4(), id, adminId, notes || 'Bulk approved']
        );

        const [users]: any = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [institutions[0].contact_email]
        );

        if (users.length > 0) {
          await connection.execute(
            `INSERT INTO notifications (id, user_id, type, title, message, link)
             VALUES (?, ?, 'institution_status', 'Institution Approved! 🎉', 'Your institution registration has been approved and is now active.', '/dashboard/institutions')`,
            [uuidv4(), users[0].id]
          );
        }

        try {
          await sendInstitutionStatusEmail(
            institutions[0].contact_email,
            institutions[0].contact_person || 'Representative',
            institutions[0].name,
            'approved'
          );
        } catch (err) {
          console.error('Failed to send approval email:', err);
        }
      }

      await connection.commit();
      res.json({ message: `Successfully approved ${ids.length} institutions.` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: 'Failed to bulk approve institutions' });
  }
});

// Bulk reject institutions
router.post('/institutions/bulk-reject', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids, reason, notes } = req.body;
    const adminId = req.user!.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of institution IDs is required' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const id of ids) {
        const [institutions]: any = await connection.execute(
          'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
          [id]
        );

        if (institutions.length === 0) continue;

        await connection.execute(
          `UPDATE institutions SET
            admin_approved = FALSE,
            status = 'rejected',
            approved_by = ?,
            approved_at = NOW(),
            rejection_reason = ?,
            membership_status = 'inactive'
          WHERE id = ?`,
          [adminId, reason, id]
        );

        await connection.execute(
          `INSERT INTO approval_logs (id, institution_id, admin_id, action, reason, notes)
           VALUES (?, ?, ?, 'rejected', ?, ?)`,
          [uuidv4(), id, adminId, reason, notes || 'Bulk rejected']
        );

        const [users]: any = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [institutions[0].contact_email]
        );

        if (users.length > 0) {
          await connection.execute(
            `INSERT INTO notifications (id, user_id, type, title, message, link)
             VALUES (?, ?, 'institution_status', 'Institution Registration Rejected ❌', ?, '/dashboard/institutions')`,
            [uuidv4(), users[0].id, `Your institution registration was rejected: ${reason}`]
          );
        }

        try {
          await sendInstitutionStatusEmail(
            institutions[0].contact_email,
            institutions[0].contact_person || 'Representative',
            institutions[0].name,
            'rejected',
            reason
          );
        } catch (err) {
          console.error('Failed to send rejection email:', err);
        }
      }

      await connection.commit();
      res.json({ message: `Successfully rejected ${ids.length} institutions.` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ error: 'Failed to bulk reject institutions' });
  }
});

// Bulk delete institutions
router.post('/institutions/bulk-delete', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const adminId = req.user!.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of institution IDs is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const id of ids) {
        // Query institution details first
        const [insts]: any = await connection.execute(
          'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
          [id]
        );
        if (insts.length > 0) {
          const inst = insts[0];
          if (inst.contact_email) {
            sendInstitutionDeletedEmail(
              inst.contact_email,
              inst.contact_person || 'Representative',
              inst.name
            ).catch(err => {
              console.error('Failed to send institution deletion email:', err);
            });
          }
        }

        // Disassociate profiles
        await connection.execute(
          'UPDATE profiles SET institution_id = NULL WHERE institution_id = ?',
          [id]
        );

        // Delete change requests
        await connection.execute(
          'DELETE FROM institution_change_requests WHERE institution_id = ?',
          [id]
        );

        // Delete logs
        await connection.execute(
          'DELETE FROM approval_logs WHERE institution_id = ?',
          [id]
        );

        // Delete institution
        await connection.execute(
          'DELETE FROM institutions WHERE id = ?',
          [id]
        );
      }

      await connection.commit();
      res.json({ message: `Successfully deleted ${ids.length} institutions.` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete institutions' });
  }
});

// Get institution approval logs
router.get('/institutions/:id/logs', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [logs]: any = await pool.execute(
      `SELECT l.*, p.full_name AS admin_name 
       FROM approval_logs l 
       LEFT JOIN profiles p ON l.admin_id = p.id 
       WHERE l.institution_id = ? 
       ORDER BY l.created_at DESC`,
      [id]
    );

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get approval logs' });
  }
});

// Approve Change Request
router.put('/institutions/:id/change-requests/approve', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Fetch pending request
      const [requests]: any = await connection.execute(
        'SELECT * FROM institution_change_requests WHERE institution_id = ? AND status = "pending" LIMIT 1',
        [id]
      );

      if (requests.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'No pending change request found' });
      }

      const reqData = requests[0];

      // Fetch institution details
      const [inst]: any = await connection.execute(
        'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
        [id]
      );

      // Apply changes to institutions table and reset status to approved
      await connection.execute(
        `UPDATE institutions SET
          name = ?, country = ?, state = ?, city = ?, established_year = ?, status = 'approved'
         WHERE id = ?`,
        [
          reqData.name,
          reqData.country,
          reqData.state,
          reqData.city,
          reqData.established_year,
          id
        ]
      );

      // Update request status
      await connection.execute(
        'UPDATE institution_change_requests SET status = "approved" WHERE id = ?',
        [reqData.id]
      );

      // Log action
      await connection.execute(
        `INSERT INTO approval_logs (id, institution_id, admin_id, action, notes)
         VALUES (?, ?, ?, 'approved_changes', 'Approved profile field edits')`,
        [uuidv4(), id, adminId]
      );

      // Find user and notify
      const [users]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [inst[0].contact_email]
      );

      if (users.length > 0) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'institution_status', 'Change Request Approved! ✅', ?, '/dashboard/institutions')`,
          [uuidv4(), users[0].id, `Your change request for "${inst[0].name}" has been approved.`]
        );
      }

      // Send email
      try {
        await sendChangeRequestStatusEmail(
          inst[0].contact_email,
          inst[0].contact_person || 'Representative',
          inst[0].name,
          'approved'
        );
      } catch (err) {
        console.error('Failed to send change approval email:', err);
      }

      await connection.commit();
      res.json({ message: 'Change request approved successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Approve change request error:', error);
    res.status(500).json({ error: 'Failed to approve change request' });
  }
});

// Reject Change Request
router.put('/institutions/:id/change-requests/reject', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [requests]: any = await connection.execute(
        'SELECT id FROM institution_change_requests WHERE institution_id = ? AND status = "pending" LIMIT 1',
        [id]
      );

      if (requests.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'No pending change request found' });
      }

      const requestId = requests[0].id;

      // Restore status to approved
      await connection.execute(
        'UPDATE institutions SET status = "approved" WHERE id = ?',
        [id]
      );

      // Update change request
      await connection.execute(
        'UPDATE institution_change_requests SET status = "rejected", admin_notes = ? WHERE id = ?',
        [reason || null, requestId]
      );

      // Log action
      await connection.execute(
        `INSERT INTO approval_logs (id, institution_id, admin_id, action, reason)
         VALUES (?, ?, ?, 'rejected_changes', ?)`,
        [uuidv4(), id, adminId, reason || null]
      );

      const [inst]: any = await connection.execute(
        'SELECT name, contact_email, contact_person FROM institutions WHERE id = ?',
        [id]
      );

      const [users]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [inst[0].contact_email]
      );

      if (users.length > 0) {
        await connection.execute(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'institution_status', 'Change Request Rejected ❌', ?, '/dashboard/institutions')`,
          [uuidv4(), users[0].id, `Your change request for "${inst[0].name}" was rejected: ${reason || 'Invalid details'}`]
        );
      }

      // Send email
      try {
        await sendChangeRequestStatusEmail(
          inst[0].contact_email,
          inst[0].contact_person || 'Representative',
          inst[0].name,
          'rejected',
          reason
        );
      } catch (err) {
        console.error('Failed to send change rejection email:', err);
      }

      await connection.commit();
      res.json({ message: 'Change request rejected successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reject change request error:', error);
    res.status(500).json({ error: 'Failed to reject change request' });
  }
});
// Get analytics stats
router.get('/stats', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      [profiles],
      [users],
      [fellows],
      [institutions],
      [pending],
      [approved],
      [rejected],
      [suspended],
      [pendingChange],
      [programs],
      [enrollments],
      [blogs],
      [pendingBlogs],
      [notifications]
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) as count FROM profiles'),
      pool.execute('SELECT COUNT(*) as count FROM users'),
      pool.execute('SELECT COUNT(*) as count FROM users u LEFT JOIN admin_roles ar ON u.id = ar.user_id WHERE ar.user_id IS NULL'),
      pool.execute('SELECT COUNT(*) as count FROM institutions'),
      pool.execute("SELECT COUNT(*) as count FROM institutions WHERE status = 'pending'"),
      pool.execute("SELECT COUNT(*) as count FROM institutions WHERE status = 'approved'"),
      pool.execute("SELECT COUNT(*) as count FROM institutions WHERE status = 'rejected'"),
      pool.execute("SELECT COUNT(*) as count FROM institutions WHERE status = 'suspended'"),
      pool.execute("SELECT COUNT(*) as count FROM institutions WHERE status = 'pending_change_approval'"),
      pool.execute('SELECT COUNT(*) as count FROM programs'),
      pool.execute('SELECT COUNT(*) as count FROM enrollments'),
      pool.execute('SELECT COUNT(*) as count FROM blog_posts'),
      pool.execute("SELECT COUNT(*) as count FROM blog_posts WHERE status = 'pending_review'"),
      pool.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [req.user!.id]),
    ]);

    res.json({
      totalUsers: (users as any)[0].count,
      totalProfiles: (profiles as any)[0].count,
      totalFellows: (fellows as any)[0].count,
      totalInstitutions: (institutions as any)[0].count,
      pendingInstitutions: (pending as any)[0].count,
      approvedInstitutions: (approved as any)[0].count,
      rejectedInstitutions: (rejected as any)[0].count,
      suspendedInstitutions: (suspended as any)[0].count,
      pendingChangeApprovalInstitutions: (pendingChange as any)[0].count,
      totalPrograms: (programs as any)[0].count,
      totalEnrollments: (enrollments as any)[0].count,
      totalBlogs: (blogs as any)[0].count,
      pendingBlogApprovals: (pendingBlogs as any)[0].count,
      activeNotifications: (notifications as any)[0].count,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all users (admin & super admin can view)
router.get('/users', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Check if role is admin/super_admin/moderator
    const [roles]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [req.user!.id]
    );

    if (roles.length === 0) {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    const [users] = await pool.execute(`
      SELECT
        u.id,
        u.email,
        p.work_email,
        u.full_name,
        u.created_at,
        u.last_sign_in_at,
        u.updated_at as last_activity,
        p.phone,
        p.membership_id,
        p.membership_status,
        p.avatar_url,
        p.city,
        p.state,
        p.address,
        p.pincode,
        p.designation,
        p.department,
        p.institution,
        p.specialization,
        p.bio,
        ar.role as admin_role,
        GROUP_CONCAT(prog.title ORDER BY prog.id SEPARATOR ', ') as enrolled_programs,
        GROUP_CONCAT(e.status ORDER BY prog.id SEPARATOR ', ') as enrollment_statuses,
        GROUP_CONCAT(e.progress_percentage ORDER BY prog.id SEPARATOR ', ') as enrollment_progress,
        (SELECT COUNT(*) FROM tool_results WHERE user_id = u.id) as test_count,
        (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificate_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      LEFT JOIN admin_roles ar ON u.id = ar.user_id
      LEFT JOIN enrollments e ON u.id = e.user_id
      LEFT JOIN programs prog ON e.program_id = prog.id
      GROUP BY u.id, u.email, p.work_email, u.full_name, u.created_at, u.last_sign_in_at, u.updated_at, 
               p.phone, p.membership_id, p.membership_status, p.avatar_url, p.city, p.state,
               p.address, p.pincode, p.designation, p.department, p.institution, p.specialization, p.bio, ar.role
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user fellowship status (Admin only)
router.put('/users/:id/status', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { membership_status, reason } = req.body;

    if (!membership_status) {
      return res.status(400).json({ error: 'Membership status is required' });
    }

    if ((membership_status === 'rejected' || membership_status === 'suspended') && !reason) {
      return res.status(400).json({ error: `Reason is required for ${membership_status} status` });
    }

    // Fetch user details first
    const [users]: any = await pool.execute(
      `SELECT u.email, u.full_name FROM users u 
       JOIN profiles p ON u.id = p.id 
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User/Fellow not found' });
    }
    const user = users[0];

    let query = 'UPDATE profiles SET membership_status = ?, status = ?';
    const params: any[] = [membership_status, membership_status];

    if (membership_status === 'active') {
      query += ', rejection_reason = NULL, suspension_reason = NULL';
    } else if (membership_status === 'rejected') {
      query += ', rejection_reason = ?, suspension_reason = NULL';
      params.push(reason);
    } else if (membership_status === 'suspended') {
      query += ', suspension_reason = ?, rejection_reason = NULL';
      params.push(reason);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    // Send notifications
    let notificationTitle = 'Fellowship Status Updated 🏆';
    let notificationMessage = `Your Fellowship status has been updated to: ${membership_status}.`;

    if (membership_status === 'active') {
      notificationTitle = 'Fellowship Approved! 🎉';
      notificationMessage = 'Your fellowship application has been approved and your account is now active.';
      
      try {
        await sendFellowApprovedEmail(user.email, user.full_name || 'Fellow');
      } catch (err) {
        console.error('Failed to send approval email:', err);
      }
    } else if (membership_status === 'rejected') {
      notificationTitle = 'Fellowship Revision Required ❌';
      notificationMessage = `Your fellowship application requires revisions. Reason: ${reason}`;
      
      try {
        await sendFellowRejectedEmail(user.email, user.full_name || 'Fellow', reason);
      } catch (err) {
        console.error('Failed to send rejection email:', err);
      }
    } else if (membership_status === 'suspended') {
      notificationTitle = 'Fellowship Suspended ⚠️';
      notificationMessage = `Your fellowship account has been suspended. Reason: ${reason}`;
      
      try {
        await sendFellowSuspendedEmail(user.email, user.full_name || 'Fellow', reason);
      } catch (err) {
        console.error('Failed to send suspension email:', err);
      }
    }

    // Add a notification for the user
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'fellowship_status', ?, ?, '/dashboard')`,
      [uuidv4(), id, notificationTitle, notificationMessage]
    );

    // Log activity
    await logUserActivity(
      id,
      'fellowship_approval',
      `Fellowship status updated to: ${membership_status}. Reason: ${reason || 'None'}`,
      { membership_status, reason }
    );

    res.json({ message: `User fellowship status updated to ${membership_status} successfully` });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get specific user's activity logs
router.get('/users/:id/activity', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [logs] = await pool.execute(
      `SELECT * FROM user_activity_logs
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(logs);
  } catch (error) {
    console.error('Get user activity logs error:', error);
    res.status(500).json({ error: 'Failed to get user activity logs' });
  }
});

// Send custom notification to a specific user
router.post('/users/:id/notifications', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, message, link } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title and message are required' });
    }

    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, type, title, message, link || null]
    );

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Send user notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get all tool results with user info (Admin logs)
router.get('/tool-results', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [results] = await pool.execute(`
      SELECT tr.*, p.full_name, p.email, p.membership_id
      FROM tool_results tr
      LEFT JOIN profiles p ON tr.user_id = p.id
      ORDER BY tr.created_at DESC
    `);
    res.json(results);
  } catch (error) {
    console.error('Get admin tool results error:', error);
    res.status(500).json({ error: 'Failed to get tool results' });
  }
});

// Delete single tool result (Admin)
router.delete('/tool-results/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM tool_results WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Tool result not found' });
    }

    res.json({ message: 'Tool result deleted successfully' });
  } catch (error) {
    console.error('Delete admin tool result error:', error);
    res.status(500).json({ error: 'Failed to delete tool result' });
  }
});

// Bulk delete tool results (Admin)
router.post('/tool-results/bulk-delete', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'List of IDs is required' });
    }

    const placeholders = ids.map(() => '?').join(', ');
    await pool.execute(
      `DELETE FROM tool_results WHERE id IN (${placeholders})`,
      ids
    );

    res.json({ message: 'Tool results deleted successfully' });
  } catch (error) {
    console.error('Bulk delete admin tool results error:', error);
    res.status(500).json({ error: 'Failed to delete tool results' });
  }
});

// Get all email change requests
router.get('/email-change-requests', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [requests] = await pool.execute(`
      SELECT 
        ecr.*,
        p.full_name,
        p.membership_id
      FROM email_change_requests ecr
      JOIN profiles p ON ecr.user_id = p.id
      ORDER BY ecr.created_at DESC
    `);
    res.json(requests);
  } catch (error) {
    console.error('Get email change requests error:', error);
    res.status(500).json({ error: 'Failed to get email change requests' });
  }
});

// Approve email change request
router.put('/email-change-requests/:id/approve', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    await connection.beginTransaction();

    // 1. Get the request details
    const [requestRows]: any = await connection.execute(
      'SELECT * FROM email_change_requests WHERE id = ? FOR UPDATE',
      [id]
    );

    if (requestRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Email change request not found' });
    }

    const request = requestRows[0];

    if (request.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: `Request has already been ${request.status}` });
    }

    const { user_id, new_email, old_email } = request;

    // 2. Verify that the new email is not already registered (double check)
    const [existingUsers]: any = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [new_email, user_id]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'New email address is already registered to another account' });
    }

    // 3. Update email in users table
    await connection.execute(
      'UPDATE users SET email = ? WHERE id = ?',
      [new_email, user_id]
    );

    // 4. Update email in profiles table
    await connection.execute(
      'UPDATE profiles SET email = ? WHERE id = ?',
      [new_email, user_id]
    );

    // 5. Update request status to approved
    await connection.execute(
      `UPDATE email_change_requests 
       SET status = 'approved', admin_notes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [adminNotes || null, id]
    );

    await connection.commit();

    // 6. Notify user of approval
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'general', 'Email Change Approved 🎉', ?, '/dashboard')`,
      [
        uuidv4(),
        user_id,
        `Your request to change your email from ${old_email} to ${new_email} has been approved.`
      ]
    );

    res.json({ message: 'Email change request approved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Approve email change error:', error);
    res.status(500).json({ error: 'Failed to approve email change request' });
  } finally {
    connection.release();
  }
});

// Reject email change request
router.put('/email-change-requests/:id/reject', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes || !adminNotes.trim()) {
      return res.status(400).json({ error: 'Rejection reason (admin notes) is required' });
    }

    // 1. Get request details
    const [requestRows]: any = await pool.execute(
      'SELECT * FROM email_change_requests WHERE id = ?',
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ error: 'Email change request not found' });
    }

    const request = requestRows[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Request has already been ${request.status}` });
    }

    // 2. Update status to rejected
    await pool.execute(
      `UPDATE email_change_requests 
       SET status = 'rejected', admin_notes = ?, updated_at = NOW() 
       WHERE id = ?`,
      [adminNotes.trim(), id]
    );

    // 3. Notify user of rejection
    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link)
       VALUES (?, ?, 'general', 'Email Change Request Rejected ❌', ?, '/dashboard')`,
      [
        uuidv4(),
        request.user_id,
        `Your request to change your email to ${request.new_email} has been rejected. Reason: ${adminNotes.trim()}`
      ]
    );

    res.json({ message: 'Email change request rejected successfully' });
  } catch (error) {
    console.error('Reject email change error:', error);
    res.status(500).json({ error: 'Failed to reject email change request' });
  }
});

// Get all program enrollments
router.get('/enrollments', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT 
        e.id,
        e.enrolled_at,
        e.status,
        e.progress_percentage,
        e.completed_at,
        u.full_name AS fellow_name,
        p.title AS program_name,
        c.certificate_number
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN programs p ON e.program_id = p.id
      LEFT JOIN certificates c ON (e.user_id = c.user_id AND e.program_id = c.program_id)
      ORDER BY e.enrolled_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Failed to get enrollments' });
  }
});

// Broadcast notification to all Fellows
router.post('/notifications/broadcast', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, message, link } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Type, title and message are required' });
    }

    const [users]: any = await pool.execute('SELECT id FROM users');
    
    for (const user of users) {
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), user.id, type, title, message, link || null]
      );
    }

    res.json({ message: `Notification broadcasted to ${users.length} fellows successfully` });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// Send notification to selected Fellows
router.post('/notifications/send-selected', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, type, title, message, link } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !type || !title || !message) {
      return res.status(400).json({ error: 'Selected user IDs, type, title and message are required' });
    }

    for (const userId of userIds) {
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, link)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, type, title, message, link || null]
      );
    }

    res.json({ message: `Notification sent to ${userIds.length} fellows successfully` });
  } catch (error) {
    console.error('Send selected notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get notification history (admin logs)
router.get('/notifications/history', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const [rows]: any = await pool.execute(`
      SELECT n.*, 
             COALESCE(trigger_p.full_name, recipient_p.full_name, 'System') AS fellow_name,
             COALESCE(trigger_p.email, recipient_p.email) AS fellow_email
      FROM notifications n
      LEFT JOIN profiles recipient_p ON n.user_id = recipient_p.id
      LEFT JOIN profiles trigger_p ON n.trigger_user_id = trigger_p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 100
    `, [adminId]);
    res.json(rows);
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to get notifications history' });
  }
});

// Get unread notification count for admin
router.get('/notifications/unread-count', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [adminId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread notifications count' });
  }
});

// Mark all unread notifications as read for admin
router.put('/notifications/mark-read', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [adminId]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Bulk delete notifications for admin (permanent deletion)
router.post('/notifications/bulk-delete', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body || {};
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids list' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `DELETE FROM notifications WHERE id IN (${placeholders})`,
      ids
    );
    res.json({ success: true, message: `Successfully deleted ${ids.length} notifications` });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({ error: 'Failed to bulk delete notifications' });
  }
});

// Delete single notification (permanent deletion)
router.delete('/notifications/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
