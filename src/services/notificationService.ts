import { api } from './apiClient';

export type NotificationType = 'like' | 'comment' | 'mention' | 'event_update' | 'new_follower';

export interface NotificationData {
  type: NotificationType;
  fromId: string;
  fromName: string;
  fromPhoto?: string;
  targetId: string;
  targetType: 'post' | 'event' | 'user';
  targetLink?: string;
  message: string;
}

export const createNotification = async (toUserId: string, data: Omit<NotificationData, 'isRead' | 'createdAt'>) => {
  if (toUserId === data.fromId) return;

  try {
    await api.createNotification(toUserId, data);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
