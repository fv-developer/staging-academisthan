import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendPushNotification } from '../services/push';

const router = express.Router();

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [notifications] = await pool.execute(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [result]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Create notification (internal use - for system to create notifications)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, type, title, message, link } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const notificationId = uuidv4();

    await pool.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notificationId, user_id, type, title, message, link || null]
    );

    // Trigger push notification
    try {
      await sendPushNotification(user_id, title, message, link || undefined);
    } catch (pushError) {
      console.error('Failed to send push notification:', pushError);
    }

    res.status(201).json({ success: true, id: notificationId });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return res.status(400).json({ error: 'Missing subscription keys' });
    }

    const subscriptionId = uuidv4();

    // Check if subscription endpoint already exists
    const [existing]: any = await pool.execute(
      'SELECT id FROM push_subscriptions WHERE endpoint = ?',
      [endpoint]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE push_subscriptions SET user_id = ? WHERE endpoint = ?',
        [userId, endpoint]
      );
    } else {
      await pool.execute(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) 
         VALUES (?, ?, ?, ?, ?)`,
        [subscriptionId, userId, endpoint, p256dh, auth]
      );
    }

    res.status(201).json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
