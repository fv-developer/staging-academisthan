import { useEffect } from 'react';
import { notifications as notificationsApi } from '@/lib/api-client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('👷 Service Worker registered successfully:', reg.scope);
          
          // If permission is already granted, verify/renew subscription
          if (Notification.permission === 'granted') {
            subscribeUserToPush(reg);
          }
        })
        .catch((err) => {
          console.error('❌ Service Worker registration failed:', err);
        });

      // Handle navigation message from service worker when inactive tab is clicked
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NAVIGATE') {
          window.location.href = event.data.url;
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, [userId]);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('⚠️ This browser does not support desktop notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('🔔 Notification permission granted.');
        
        // Register push subscription
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await subscribeUserToPush(reg);
        }
        return true;
      } else {
        console.warn('🔕 Notification permission denied.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeUserToPush = async (registration: ServiceWorkerRegistration) => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('⚠️ VAPID public key not set in frontend env.');
      return;
    }

    try {
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('📡 Creating new Push subscription...');
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
        };
        subscription = await registration.pushManager.subscribe(subscribeOptions);
      }

      // Convert keys to string for the backend payload
      const subJSON = subscription.toJSON();
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        throw new Error('Push subscription is missing keys');
      }

      // Send subscription to backend API
      await notificationsApi.subscribePush({
        endpoint: subJSON.endpoint,
        keys: {
          p256dh: subJSON.keys.p256dh,
          auth: subJSON.keys.auth
        }
      });
      console.log('✅ Registered Push Subscription on the backend');
    } catch (error) {
      console.error('❌ Failed to subscribe user to Web Push:', error);
    }
  };

  const showLocalNotification = (title: string, message: string, link?: string) => {
    if (Notification.permission !== 'granted') return;

    const options = {
      body: message,
      icon: '/favicon.png',
      badge: '/favicon.png',
      requireInteraction: true
    };

    // Use Service Worker registration if active, fallback to new Notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options);
      });
    } else {
      const notification = new Notification(title, options);
      if (link) {
        notification.onclick = () => {
          window.focus();
          window.location.href = link;
          notification.close();
        };
      }
    }
  };

  return {
    requestPermission,
    showLocalNotification,
    permissionState: typeof window !== 'undefined' ? Notification.permission : 'default'
  };
}
