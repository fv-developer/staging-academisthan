import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest, verifyToken } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { logUserActivity } from '../utils/logger';

const router = express.Router();

// 1. Get public directory of fellows with connection states relative to logged-in user (optional auth)
router.get('/directory', async (req: AuthRequest, res: Response) => {
  try {
    let userId: string | null = null;
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.id;
      }
    }

    let query: string;
    let params: any[];

    if (userId) {
      // Authenticated user: show connection status
      query = `
        SELECT 
          p.id,
          p.full_name,
          p.designation,
          p.department,
          p.institution,
          p.city,
          p.state,
          p.avatar_url,
          p.specialization,
          p.membership_status,
          fc.id as connection_id,
          fc.sender_id,
          fc.receiver_id,
          fc.status as connection_status,
          IF(fc.status = 'accepted', COALESCE(p.work_email, p.email), NULL) as email,
          IF(fc.status = 'accepted', p.phone, NULL) as phone
        FROM profiles p
        LEFT JOIN fellow_connections fc ON 
          (fc.sender_id = ? AND fc.receiver_id = p.id) OR 
          (fc.sender_id = p.id AND fc.receiver_id = ?)
        WHERE p.membership_status = 'active'
          AND p.id != ?
          AND p.email != 'admin@academisthan.org'
        ORDER BY p.full_name ASC
      `;
      params = [userId, userId, userId];
    } else {
      // Guest user: hide contact info and connection status
      query = `
        SELECT 
          p.id,
          p.full_name,
          p.designation,
          p.department,
          p.institution,
          p.city,
          p.state,
          p.avatar_url,
          p.specialization,
          p.membership_status,
          NULL as connection_id,
          NULL as sender_id,
          NULL as receiver_id,
          NULL as connection_status,
          NULL as email,
          NULL as phone
        FROM profiles p
        WHERE p.membership_status = 'active'
          AND p.email != 'admin@academisthan.org'
        ORDER BY p.full_name ASC
      `;
      params = [];
    }

    const [fellows]: any = await pool.execute(query, params);
    res.json(fellows);
  } catch (error) {
    console.error('Get directory error:', error);
    res.status(500).json({ error: 'Failed to retrieve fellow directory' });
  }
});

// 2. Send a connection request
router.post('/request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user!.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'You cannot connect with yourself' });
    }

    // Check if connection already exists
    const [existing]: any = await pool.execute(`
      SELECT * FROM fellow_connections 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `, [senderId, receiverId, receiverId, senderId]);

    if (existing.length > 0) {
      const conn = existing[0];
      if (conn.status === 'accepted') {
        return res.status(400).json({ error: 'You are already connected' });
      } else if (conn.status === 'pending') {
        return res.status(400).json({ error: 'Connection request is already pending' });
      } else {
        // If rejected, we can delete the old record and create a new request
        await pool.execute('DELETE FROM fellow_connections WHERE id = ?', [conn.id]);
      }
    }

    const connectionId = uuidv4();
    await pool.execute(`
      INSERT INTO fellow_connections (id, sender_id, receiver_id, status)
      VALUES (?, ?, ?, 'pending')
    `, [connectionId, senderId, receiverId]);

    // Fetch sender details for notification message
    const [senderProfile]: any = await pool.execute('SELECT full_name FROM profiles WHERE id = ?', [senderId]);
    const senderName = senderProfile[0]?.full_name || 'A fellow';

    // Insert notification for the receiver
    await pool.execute(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'connection_request', 'New Connection Request 🤝', ?, '/dashboard/connections')
    `, [uuidv4(), receiverId, `${senderName} sent you a connection request.`]);

    // Log activity
    await logUserActivity(
      senderId,
      'send_connection_request',
      `Sent connection request to ${receiverId}`,
      { receiverId, connectionId }
    );

    res.status(201).json({ message: 'Connection request sent successfully', connectionId });
  } catch (error) {
    console.error('Send request error:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// 3. Get incoming pending requests
router.get('/received-requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [requests]: any = await pool.execute(`
      SELECT 
        fc.id as connection_id,
        fc.sender_id,
        fc.created_at,
        p.full_name,
        p.designation,
        p.department,
        p.institution,
        p.city,
        p.state,
        p.avatar_url
      FROM fellow_connections fc
      JOIN profiles p ON fc.sender_id = p.id
      WHERE fc.receiver_id = ? AND fc.status = 'pending'
      ORDER BY fc.created_at DESC
    `, [userId]);

    res.json(requests);
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

// 4. Get accepted connections
router.get('/my-connections', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [connections]: any = await pool.execute(`
      SELECT 
        fc.id as connection_id,
        fc.created_at as connected_since,
        p.id as user_id,
        p.full_name,
        COALESCE(p.work_email, p.email) as email,
        p.phone,
        p.designation,
        p.department,
        p.institution,
        p.address,
        p.city,
        p.state,
        p.pincode,
        p.avatar_url
      FROM fellow_connections fc
      JOIN profiles p ON (p.id = fc.sender_id OR p.id = fc.receiver_id) AND p.id != ?
      WHERE (fc.sender_id = ? OR fc.receiver_id = ?) 
        AND fc.status = 'accepted'
      ORDER BY p.full_name ASC
    `, [userId, userId, userId]);

    res.json(connections);
  } catch (error) {
    console.error('Get my connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// 5. Respond to connection request (accept/reject)
router.put('/respond/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connectionId = req.params.id;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid status response' });
    }

    // Verify request belongs to the user
    const [connRow]: any = await pool.execute(
      'SELECT * FROM fellow_connections WHERE id = ? AND receiver_id = ?',
      [connectionId, userId]
    );

    if (connRow.length === 0) {
      return res.status(404).json({ error: 'Connection request not found or unauthorized' });
    }

    const connection = connRow[0];

    // Update connection status
    await pool.execute(
      'UPDATE fellow_connections SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, connectionId]
    );

    // Fetch receiver details (the one who accepts/declines) for notification message
    const [receiverProfile]: any = await pool.execute('SELECT full_name FROM profiles WHERE id = ?', [userId]);
    const receiverName = receiverProfile[0]?.full_name || 'A fellow';

    if (status === 'accepted') {
      // Notify sender
      await pool.execute(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'connection_accepted', 'Connection Request Accepted 🎉', ?, '/dashboard/connections')
      `, [uuidv4(), connection.sender_id, `${receiverName} accepted your connection request.`]);

      // Log activity
      await logUserActivity(
        userId,
        'accept_connection',
        `Accepted connection request from ${connection.sender_id}`,
        { senderId: connection.sender_id, connectionId }
      );
    } else {
      // Notify sender
      await pool.execute(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'connection_rejected', 'Connection Request Declined', ?, '/dashboard/connections')
      `, [uuidv4(), connection.sender_id, `${receiverName} declined your connection request.`]);

      // Log activity
      await logUserActivity(
        userId,
        'reject_connection',
        `Declined connection request from ${connection.sender_id}`,
        { senderId: connection.sender_id, connectionId }
      );
    }

    res.json({ message: `Connection request ${status} successfully` });
  } catch (error) {
    console.error('Respond connection error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// 6. Admin: Get all connection request logs
router.get('/admin/all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    const userId = req.user!.id;
    const [adminCheck]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [userId]
    );

    if (adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const [allConnections]: any = await pool.execute(`
      SELECT 
        fc.id,
        fc.sender_id,
        fc.receiver_id,
        fc.status,
        fc.created_at,
        fc.updated_at,
        sp.full_name as sender_name,
        sp.email as sender_email,
        rp.full_name as receiver_name,
        rp.email as receiver_email
      FROM fellow_connections fc
      JOIN profiles sp ON fc.sender_id = sp.id
      JOIN profiles rp ON fc.receiver_id = rp.id
      ORDER BY fc.created_at DESC
    `);

    res.json(allConnections);
  } catch (error) {
    console.error('Admin get connections error:', error);
    res.status(500).json({ error: 'Failed to fetch connection logs' });
  }
});

// 7. Remove a connection
router.delete('/remove/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connectionId = req.params.id;

    // Check if the connection belongs to the user (either sender or receiver)
    const [connRow]: any = await pool.execute(
      'SELECT * FROM fellow_connections WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
      [connectionId, userId, userId]
    );

    if (connRow.length === 0) {
      return res.status(404).json({ error: 'Connection not found or unauthorized' });
    }

    const connection = connRow[0];

    // Delete the connection
    await pool.execute('DELETE FROM fellow_connections WHERE id = ?', [connectionId]);

    // Log activity
    await logUserActivity(
      userId,
      'remove_connection',
      `Removed connection ${connectionId} with user ${userId === connection.sender_id ? connection.receiver_id : connection.sender_id}`,
      { connectionId, partnerId: userId === connection.sender_id ? connection.receiver_id : connection.sender_id }
    );

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
});

// 8. Admin: Remove a connection
router.delete('/admin/remove/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    const userId = req.user!.id;
    const [adminCheck]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [userId]
    );

    if (adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const connectionId = req.params.id;

    const [connRow]: any = await pool.execute(
      'SELECT * FROM fellow_connections WHERE id = ?',
      [connectionId]
    );

    if (connRow.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    await pool.execute('DELETE FROM fellow_connections WHERE id = ?', [connectionId]);

    // Log activity
    await logUserActivity(
      userId,
      'admin_remove_connection',
      `Admin removed connection ${connectionId}`,
      { connectionId }
    );

    res.json({ message: 'Connection removed by admin successfully' });
  } catch (error) {
    console.error('Admin remove connection error:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
});

// 9. Admin: Get connection statistics & analytics
router.get('/admin/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    const userId = req.user!.id;
    const [adminCheck]: any = await pool.execute(
      'SELECT role FROM admin_roles WHERE user_id = ?',
      [userId]
    );

    if (adminCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    // Get total counts by status
    const [statusCounts]: any = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM fellow_connections 
      GROUP BY status
    `);

    // Get recent activity (last 10 connections)
    const [recentConnections]: any = await pool.execute(`
      SELECT 
        fc.id,
        fc.sender_id,
        fc.receiver_id,
        fc.status,
        fc.created_at,
        sp.full_name as sender_name,
        rp.full_name as receiver_name
      FROM fellow_connections fc
      JOIN profiles sp ON fc.sender_id = sp.id
      JOIN profiles rp ON fc.receiver_id = rp.id
      ORDER BY fc.created_at DESC
      LIMIT 10
    `);

    // Format stats
    let total = 0;
    let pending = 0;
    let accepted = 0;
    let rejected = 0;

    statusCounts.forEach((row: any) => {
      const count = Number(row.count);
      total += count;
      if (row.status === 'pending') pending = count;
      else if (row.status === 'accepted') accepted = count;
      else if (row.status === 'rejected') rejected = count;
    });

    res.json({
      stats: {
        total,
        pending,
        accepted,
        rejected
      },
      recentConnections
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch connection stats' });
  }
});

export default router;
