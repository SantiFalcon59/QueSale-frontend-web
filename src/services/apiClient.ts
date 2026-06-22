import { auth } from '../lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const resolveAssetUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Ensure local paths start with / if they don't already
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${path}`;
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

const handleUploadError = async (response: Response, defaultMessage: string): Promise<never> => {
  if (response.status === 413) {
    throw new Error('El archivo es demasiado grande. El límite permitido es 10MB.');
  }
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const message = payload?.error?.message || payload?.message || response.statusText || defaultMessage;
  throw new Error(message);
};

export const api = {
  // Generic HTTP Methods
  get: <T>(path: string, options: { auth?: boolean } = {}) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options: { auth?: boolean } = {}) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options: { auth?: boolean } = {}) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options: { auth?: boolean } = {}) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),

  loginWithFirebase: (idToken: string, photoURL?: string | null) =>
    apiRequest<{ user: any; token: string; isNew?: boolean }>('/api/auth/login-firebase', {
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

  registerDeviceToken: (token: string) =>
    apiRequest('/api/notifications/register-token', {
      method: 'POST',
      body: { token },
      auth: true,
    }),

  unregisterDeviceToken: (token: string) =>
    apiRequest('/api/notifications/unregister-token', {
      method: 'POST',
      body: { token },
      auth: true,
    }),

  updateProfile: (payload: { username?: string; email?: string; description?: string; instagram?: string; photo_url?: string }) =>
    apiRequest('/api/users/profile', {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  updateUserInterests: (interestIds: string[]) =>
    apiRequest('/api/users/interests', {
      method: 'POST',
      body: { interestIds },
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
      await handleUploadError(response, 'Failed to upload photo');
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
      await handleUploadError(response, 'Failed to upload logo');
    }

    const result = await response.json();
    return resolveAssetUrl(result.data?.logo_url) || '';
  },

  getPublicProfileByUsername: (username: string) =>
    apiRequest(`/api/users/username/${encodeURIComponent(username)}/profile`),

  getEventById: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}`, { auth: true }),

  getOrganizerById: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}`, { auth: true }),

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
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/events?page=${page}&limit=${limit}`, { auth: true }),

  updateOrganizer: (organizerId: string, payload: { name?: string; description?: string; logo_url?: string; instagram?: string; tiktok?: string; twitter?: string; website?: string; real_name?: string; dni?: string; address?: string; phone_number?: string }) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  getOrganizerAdmins: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins`, { auth: true }),

  getOrganizerRoles: () =>
    apiRequest('/api/organizers/roles'),

  removeOrganizerAdmin: (organizerId: string, adminId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins/${encodeURIComponent(adminId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getOrganizerDashboard: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/dashboard`, { auth: true }),

  createEvent: (payload: any) =>
    apiRequest('/api/events', {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  updateEvent: (eventId: string, payload: any) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  getEvents: (page = 1, limit = 50) =>
    apiRequest(`/api/events?page=${page}&limit=${limit}`, { auth: true }),

  getEventsWithFilters: (queryString: string) =>
    apiRequest(`/api/events?${queryString}`, { auth: true }),

  searchTags: (q: string) =>
    apiRequest(`/api/events/tags/search?q=${encodeURIComponent(q)}`),

  deleteEvent: (eventId: string) =>
    apiRequest(`/api/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      auth: true,
    }),

  getOrganizers: (page = 1, limit = 50) =>
    apiRequest(`/api/organizers?page=${page}&limit=${limit}`),

  getUsers: (page = 1, limit = 50, search = '') => 
    apiRequest(`/api/users?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`, { auth: true }),

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

  getUserTickets: (page = 1, limit = 20) =>
    apiRequest(`/api/tickets/my-tickets?page=${page}&limit=${limit}`, { auth: true }),

  purchaseTicket: (eventId: string) =>
    apiRequest('/api/tickets/purchase', { method: 'POST', body: { eventId }, auth: true }),

  verifyPurchase: (paymentId: string, eventId: string) =>
    apiRequest('/api/tickets/verify-purchase', { method: 'POST', body: { paymentId, eventId }, auth: true }),

  validateTicket: (ticketUuid: string) =>
    apiRequest(`/api/tickets/${encodeURIComponent(ticketUuid)}/validate`, { method: 'POST', auth: true }),

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

  uploadPostMedia: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/api/upload/post-media`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      await handleUploadError(response, 'Failed to upload post media');
    }

    const result = await response.json();
    return resolveAssetUrl(result.data?.media_url) || '';
  },

  uploadEventMedia: async (files: File[], eventId: string): Promise<string[]> => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('media', file);
    }
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
      await handleUploadError(response, 'Failed to upload event media');
    }

    const result = await response.json();
    return (result.data?.media_urls || []).map((url: string) => resolveAssetUrl(url));
  },

  getOrganizerFollowers: (organizerId: string, page = 1, limit = 50) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/followers?page=${page}&limit=${limit}`),

  followOrganizer: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/follow`, {
      method: 'POST',
      auth: true,
    }),

  unfollowOrganizer: (organizerId: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/follow`, {
      method: 'DELETE',
      auth: true,
    }),

  addOrganizerAdmin: (organizerId: string, adminId: string, role?: string) =>
    apiRequest(`/api/organizers/${encodeURIComponent(organizerId)}/admins`, {
      method: 'POST',
      body: { adminId, role: role || 'admin' },
      auth: true,
    }),

  getCategories: () =>
    apiRequest('/api/categories'),

  createCategory: (data: { name: string; icon_url?: string; color?: string }) =>
    apiRequest('/api/categories', {
      method: 'POST',
      body: data,
      auth: true,
    }),

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
  getWallPosts: (wallType: string, wallId: string, page = 1, limit = 20, typeFilter?: string) =>
    apiRequest(`/api/wall/${encodeURIComponent(wallType)}/${encodeURIComponent(wallId)}?page=${page}&limit=${limit}${typeFilter ? `&type=${typeFilter}` : ''}`),

  createWallPost_new: (wallType: string, wallId: string, content: string, type?: string, media?: string[], pollOptions?: string[]) =>
    apiRequest(`/api/wall/${encodeURIComponent(wallType)}/${encodeURIComponent(wallId)}`, {
      method: 'POST',
      body: { content, type: type || 'comment', media, pollOptions },
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

  toggleReaction: (postId: number, type: string) =>
    apiRequest(`/api/wall/post/${postId}/reaction`, {
      method: 'POST',
      body: { type },
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

  communitySearch: async (q: string) => {
    const [users, organizers, events] = await Promise.all([
      apiRequest(`/api/community/search?q=${encodeURIComponent(q)}&type=users`),
      apiRequest(`/api/community/search?q=${encodeURIComponent(q)}&type=organizers`),
      apiRequest(`/api/community/search?q=${encodeURIComponent(q)}&type=events`),
    ]) as [any, any, any];
    return {
      users: users?.users || [],
      organizers: organizers?.organizers || [],
      events: events?.events || [],
    };
  },

  searchUsers: (q: string) =>
    apiRequest(`/api/community/search?q=${encodeURIComponent(q)}&type=users`, { auth: true }),

  votePoll: (postId: number, optionId: number, wallId: string) =>
    apiRequest(`/api/wall/post/${postId}/vote`, {
      method: 'POST',
      auth: true,
      body: { optionId, wallId },
    }),

  // Featured Events
  getFeaturedPricing: () =>
    apiRequest('/api/featured/pricing'),

  createFeaturedEvent: (eventId: string, level: number, organizerId: string) =>
    apiRequest('/api/featured', {
      method: 'POST',
      body: { eventId, level, organizerId },
      auth: true,
    }),

  generateFeaturedPaymentLink: (featuredEventId: string, organizerName: string, organizerEmail: string) =>
    apiRequest(`/api/featured/${encodeURIComponent(featuredEventId)}/payment-link`, {
      method: 'POST',
      body: { organizerName, organizerEmail },
      auth: true,
    }),

  getOrganizerFeaturedEvents: (organizerId: string, page = 1, limit = 20) =>
    apiRequest(`/api/featured/organizer/${encodeURIComponent(organizerId)}?page=${page}&limit=${limit}`, { auth: true }),

  // --- Subscriptions ---
  verifyPremiumSubscription: (paymentId: string) =>
    apiRequest(`/api/subscriptions/verify-payment?payment_id=${encodeURIComponent(paymentId)}`, {
      auth: true,
    }),

  // --- Allowed Locations ---
  getAllowedLocations: (activeOnly = false) =>
    apiRequest<any[]>(`/api/allowed-locations${activeOnly ? '/active' : ''}`, { auth: true }),

  createAllowedLocation: (payload: { name: string; type: string; state?: string; country?: string }) =>
    apiRequest('/api/allowed-locations', {
      method: 'POST',
      body: payload,
      auth: true,
    }),

  updateAllowedLocation: (id: number, payload: { active: boolean; name?: string; type?: string; state?: string; country?: string }) =>
    apiRequest(`/api/allowed-locations/${id}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),

  deleteAllowedLocation: (id: number) =>
    apiRequest(`/api/allowed-locations/${id}`, {
      method: 'DELETE',
      auth: true,
    }),

  checkLocationAllowed: (city: string, state: string, country: string) =>
    apiRequest<{ allowed: boolean }>(
      `/api/allowed-locations/check?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}`,
      { auth: true }
    ),
};
