import webpush from 'web-push';
import pool from '../config/database';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidContactEmail = process.env.VAPID_CONTACT_EMAIL || 'mailto:noreplyacademisthan@gmail.com';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      vapidContactEmail,
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('✅ Web Push VAPID details configured successfully');
  } catch (error) {
    console.error('❌ Error configuring VAPID details:', error);
  }
} else {
  console.warn('⚠️ Web Push VAPID keys not fully configured in environment variables');
}

export interface PushNotificationPayload {
  title: string;
  message: string;
  link?: string;
}

/**
 * Sends a web push notification to all registered subscriptions of a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<boolean> {
  try {
    const [subscriptions]: any = await pool.execute(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      return false;
    }

    const payload = JSON.stringify({
      title,
      message,
      link: link || '/dashboard'
    });

    const sendPromises = subscriptions.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`✅ Push notification sent successfully to endpoint: ${sub.endpoint.substring(0, 40)}...`);
      } catch (error: any) {
        console.error(`❌ Push notification failed for endpoint: ${sub.endpoint.substring(0, 40)}...`, error.statusCode);
        
        // If subscription has expired or is invalid (404 or 410), delete it
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`🧹 Removing expired subscription ID: ${sub.id}`);
          await pool.execute('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        }
      }
    });

    await Promise.all(sendPromises);
    return true;
  } catch (error) {
    console.error('❌ Error in sendPushNotification service:', error);
    return false;
  }
}
