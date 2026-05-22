import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    apiRequest('/api/auth/login-firebase', {
      method: 'POST',
      body: { idToken, photoURL },
    }),

  getProfile: () => apiRequest('/api/users/profile', { auth: true }),

  updateProfile: (payload: { username?: string; email?: string; description?: string }) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

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
};
