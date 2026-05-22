import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type NotificationType = 'like' | 'comment' | 'mention' | 'event_update' | 'new_follower';

export interface NotificationData {
  type: NotificationType;
  fromId: string;
  fromName: string;
  fromPhoto?: string;
  targetId: string; // The ID of the post, event, etc.
  targetType: 'post' | 'event' | 'user';
  targetLink?: string; // Deep link to the target
  message: string;
  isRead: boolean;
  createdAt: any;
}

export const createNotification = async (toUserId: string, data: Omit<NotificationData, 'isRead' | 'createdAt'>) => {
  if (toUserId === data.fromId) return; // Don't notify yourself

  try {
    const notifsRef = collection(db, 'users', toUserId, 'notifications');
    await addDoc(notifsRef, {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
