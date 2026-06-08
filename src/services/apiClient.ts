import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const resolveAssetUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

const buildHeaders = async (useAuth: boolean) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useAuth) {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

export const apiRequest = async <T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> => {
  const { method = 'GET', body, auth: useAuth = false } = options;
  const headers = await buildHeaders(useAuth);

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || response.statusText;
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  return (payload?.data ?? payload) as T;
};

export const api = {
  loginWithFirebase: (idToken: string, photoURL?: string | null) =>
    apiRequest<{ user: any; token: string }>('/api/auth/login-firebase', {
      method: 'POST',
      body: { idToken, photoURL },
    }),

  registerWithEmail: (email: string, password: string, username: string, photoURL?: string) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email, password, confirmPassword: password, username, photoURL },
    }),

  getProfile: () => apiRequest('/api/users/profile', { auth: true }),

  createNotification: (userId: string, data: { type: string; fromId: string; fromName: string; fromPhoto?: string; targetId: string; targetType: string; targetLink?: string; message: string }) =>
    apiRequest(`/api/notifications/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: data,
      auth: true,
    }),

  updateProfile: (payload: { username?: string; email?: string; description?: string; instagram?: string; photo_url?: string }) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  uploadProfilePhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', file);

    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const result = await response.json();
    return resolveAssetUrl(result.data?.photo_url) || '';
  },

  uploadOrganizerLogo: async (file: File, organizerId: string): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('organizerId', organizerId);

    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/upload/organizer-logo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload logo');
    }

    const result = await response.json();
    return resolveAssetUrl(result.data?.logo_url) || '';
  },

  getPublicProfileByUsername: (username: string) =>
    apiRequest(`/api/users/username/${encodeURIComponent(username)}/profile`),

  getEventById: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}`),

  getOrganizerById: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}`),

  getEventPosts: (eventId: string, type?: string, page = 1, limit = 20) => {
    const typeQuery = type ? `&type=${encodeURIComponent(type)}` : '';
    return apiRequest(`/api/events/${encodeURIComponent(eventId)}/posts?page=${page}&limit=${limit}${typeQuery}`);
  },

  createEventPost: (eventId: string, payload: { content: string; type?: string }) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}/posts`, {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  getMyOrganizers: (page = 1, limit = 20) =>
    apiRequest(`/api/organizers/me?page=${page}&limit=${limit}`, { auth: true }),

  createOrganizer: (payload: { name: string; description?: string }) =>
    apiRequest('/api/organizers', {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  getOrganizerEvents: (organizerId: string, page = 1, limit = 50) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/events?page=${page}&limit=${limit}`),

  updateOrganizer: (organizerId: string, payload: { name?: string; description?: string; logo_url?: string }) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  getOrganizerAdmins: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins`, { auth: true }),

  removeOrganizerAdmin: (organizerId: string, adminId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins/${encodeURIComponent(adminId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getOrganizerDashboard: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/dashboard`, { auth: true }),

  createEvent: (payload: {
    title: string;
    description: string;
    date: string | Date;
    location: string;
    organizerId: string;
    interestIds?: number[];
  }) =>
    apiRequest('/api/events', {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  getEvents: (page = 1, limit = 50) =>
    apiRequest(`/api/events?page=${page}&limit=${limit}`),

  getEventsWithFilters: (queryString: string) =>
    apiRequest(`/api/events?${queryString}`),

  deleteEvent: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getOrganizers: (page = 1, limit = 50) =>
    apiRequest(`/api/organizers?page=${page}&limit=${limit}`),

  getUsers: (page = 1, limit = 50) =>
    apiRequest(`/api/users?page=${page}&limit=${limit}`, { auth: true }),

  getUserWall: (userId: string, page = 1, limit = 20) =>
    apiRequest(`/api/users/${encodeURIComponent(userId)}/wall?page=${page}&limit=${limit}`),

  createWallPost: (userId: string, content: string) =>
    apiRequest(`/api/users/${encodeURIComponent(userId)}/wall`, {
      method: 'POST',
      body: { content },
      auth: true,
    }),

  createWallComment: (postId: string, content: string) =>
    apiRequest(`/api/users/wall/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: { content },
      auth: true,
    }),

  deleteWallPost: (postId: string) =>
    apiRequest(`/api/users/wall/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  deleteWallComment: (commentId: string) =>
    apiRequest(`/api/users/wall/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  toggleWallPostLike: (postId: string) =>
    apiRequest(`/api/users/wall/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
      auth: true,
    }),

  toggleWallCommentLike: (commentId: string) =>
    apiRequest(`/api/users/wall/comments/${encodeURIComponent(commentId)}/like`, {
      method: 'POST',
      auth: true,
    }),

  saveEvent: (eventId: string) =>
    apiRequest(`/api/users/saved-events/${encodeURIComponent(eventId)}`, {
      method: 'POST',
      auth: true,
    }),

  unsaveEvent: (eventId: string) =>
    apiRequest(`/api/users/saved-events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getSavedEvents: (page = 1, limit = 20) =>
    apiRequest(`/api/users/saved-events?page=${page}&limit=${limit}`, { auth: true }),

  createEventComment: (postId: string, content: string) =>
    apiRequest(`/api/events/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: { content },
      auth: true,
    }),

  deleteEventPost: (postId: string) =>
    apiRequest(`/api/events/posts/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  deleteEventComment: (commentId: string) =>
    apiRequest(`/api/events/posts/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  toggleEventPostLike: (postId: string) =>
    apiRequest(`/api/events/posts/${encodeURIComponent(postId)}/like`, {
      method: 'POST',
      auth: true,
    }),

  toggleEventCommentLike: (commentId: string) =>
    apiRequest(`/api/events/posts/comments/${encodeURIComponent(commentId)}/like`, {
      method: 'POST',
      auth: true,
    }),

  uploadEventMedia: async (file: File, eventId: string): Promise<string> => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('eventId', eventId);

    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/upload/event-media`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload event media');
    }

    const result = await response.json();
    return resolveAssetUrl(result.data?.media_url) || '';
  },

  getOrganizerFollowers: (organizerId: string, page = 1, limit = 50) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/followers?page=${page}&limit=${limit}`),

  addOrganizerAdmin: (organizerId: string, adminId: string, role?: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins`, {
      method: 'POST',
      body: { adminId, role: role || 'admin' },
      auth: true,
    }),

  getCategories: () =>
    apiRequest('/api/categories'),

  getModeratorStatus: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}/moderator-status`, { auth: true }),

  blockUserFromEvent: (eventId: string, userId: string, reason?: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}/block`, {
      method: 'POST',
      body: { userId, reason },
      auth: true,
    }),

  unblockUserFromEvent: (eventId: string, userId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}/block/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getBlockedUsers: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}/blocked-users`, { auth: true }),

  // Unified wall API
  getWallPosts: (wallType: string, wallId: string, page = 1, limit = 20) =>
    apiRequest(`/api/wall/${encodeURIComponent(wallType)}/${encodeURIComponent(wallId)}?page=${page}&limit=${limit}`),

  createWallPost_new: (wallType: string, wallId: string, content: string, type?: string) =>
    apiRequest(`/api/wall/${encodeURIComponent(wallType)}/${encodeURIComponent(wallId)}`, {
      method: 'POST',
      body: { content, type: type || 'comment' },
      auth: true,
    }),

  deleteWallPost_new: (postId: number) =>
    apiRequest(`/api/wall/post/${postId}`, { method: 'DELETE', auth: true }),

  createWallComment_new: (postId: number, content: string) =>
    apiRequest(`/api/wall/post/${postId}/comments`, {
      method: 'POST',
      body: { content },
      auth: true,
    }),

  toggleWallPostLike_new: (postId: number) =>
    apiRequest(`/api/wall/post/${postId}/like`, {
      method: 'POST',
      auth: true,
    }),

  deleteWallComment_new: (commentId: number) =>
    apiRequest(`/api/wall/post/0/comments/${commentId}`, {
      method: 'DELETE',
      auth: true,
    }),

  // Followers / Following
  getUserFollowers: (userId: string) =>
    apiRequest(`/api/community/users/${encodeURIComponent(userId)}/followers`),

  getUserFollowing: (userId: string) =>
    apiRequest(`/api/community/users/${encodeURIComponent(userId)}/following`),

  followUser: (userId: string) =>
    apiRequest(`/api/community/users/${encodeURIComponent(userId)}/follow`, {
      method: 'POST',
      auth: true,
    }),

  unfollowUser: (userId: string) =>
    apiRequest(`/api/community/users/${encodeURIComponent(userId)}/follow`, {
      method: 'DELETE',
      auth: true,
    }),

  checkFollowing: (userId: string) =>
    apiRequest(`/api/community/users/${encodeURIComponent(userId)}/is-following`, { auth: true }),
};
