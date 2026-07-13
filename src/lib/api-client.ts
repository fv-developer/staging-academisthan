// API client for backend server (replaces Supabase)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Store token in localStorage
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

// Generic API request function
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth API
export const auth = {
  signUp: async (email: string, password: string, fullName: string, country?: string, phone?: string) => {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, country, phone }),
    });
    return data;
  },

  signIn: async (email: string, password: string) => {
    const data = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  signOut: async () => {
    try {
      await apiRequest('/auth/signout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  getUser: async () => {
    return apiRequest('/auth/me');
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  resendVerification: async (email: string) => {
    return apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyEmail: async (token: string) => {
    return apiRequest(`/auth/verify-email/${token}`);
  },
};

// Profiles API
export const profiles = {
  get: async (id: string) => {
    return apiRequest(`/profiles/${id}`);
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  uploadAvatar: async (base64Image: string) => {
    return apiRequest('/profiles/upload-avatar', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/profiles/${id}`, {
      method: 'DELETE',
    });
  },

  requestEmailChange: async (newEmail: string) => {
    return apiRequest('/profiles/request-email-change', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
    });
  },
};

// Admin API
export const admin = {
  getRole: async () => {
    return apiRequest('/admin/role');
  },

  getInstitutions: async (params?: { 
    status?: string; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: string;
    country?: string;
    state?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    fellowName?: string;
    fellowEmail?: string;
    page?: number;
    limit?: number;
  }) => {
    const cleanParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ) : {};
    const query = new URLSearchParams(cleanParams as any).toString();
    return apiRequest(`/admin/institutions${query ? `?${query}` : ''}`);
  },

  getInstitution: async (id: string) => {
    return apiRequest(`/admin/institutions/${id}`);
  },

  approveInstitution: async (id: string, notes?: string) => {
    return apiRequest(`/admin/institutions/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  },

  rejectInstitution: async (id: string, reason: string, notes?: string) => {
    return apiRequest(`/admin/institutions/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason, notes }),
    });
  },

  suspendInstitution: async (id: string, reason: string) => {
    return apiRequest(`/admin/institutions/${id}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  approveChangeRequest: async (id: string) => {
    return apiRequest(`/admin/institutions/${id}/change-requests/approve`, {
      method: 'PUT',
    });
  },

  rejectChangeRequest: async (id: string, reason: string) => {
    return apiRequest(`/admin/institutions/${id}/change-requests/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  bulkApproveInstitutions: async (ids: string[], notes?: string) => {
    return apiRequest('/admin/institutions/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids, notes }),
    });
  },

  bulkRejectInstitutions: async (ids: string[], reason: string, notes?: string) => {
    return apiRequest('/admin/institutions/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, reason, notes }),
    });
  },

  bulkDeleteInstitutions: async (ids: string[]) => {
    return apiRequest('/admin/institutions/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  getInstitutionLogs: async (id: string) => {
    return apiRequest(`/admin/institutions/${id}/logs`);
  },

  getStats: async () => {
    return apiRequest('/admin/stats');
  },

  getUsers: async () => {
    return apiRequest('/admin/users');
  },

  updateUserStatus: async (id: string, membershipStatus: string) => {
    return apiRequest(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ membership_status: membershipStatus }),
    });
  },

  getToolResults: async () => {
    return apiRequest('/admin/tool-results');
  },

  getUserActivity: async (id: string) => {
    return apiRequest(`/admin/users/${id}/activity`);
  },

  sendUserNotification: async (id: string, data: { type: string; title: string; message: string; link?: string }) => {
    return apiRequest(`/admin/users/${id}/notifications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEmailChangeRequests: async () => {
    return apiRequest('/admin/email-change-requests');
  },

  approveEmailChange: async (id: string, adminNotes?: string) => {
    return apiRequest(`/admin/email-change-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  rejectEmailChange: async (id: string, adminNotes: string) => {
    return apiRequest(`/admin/email-change-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  getToolResults: async () => {
    return apiRequest('/admin/tool-results');
  },

  deleteToolResult: async (id: string) => {
    return apiRequest(`/admin/tool-results/${id}`, {
      method: 'DELETE',
    });
  },

  bulkDeleteToolResults: async (ids: string[]) => {
    return apiRequest('/admin/tool-results/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// Institutions API
export const institutions = {
  create: async (data: any) => {
    return apiRequest('/institutions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (id: string) => {
    return apiRequest(`/institutions/${id}`);
  },

  getAll: async (params?: { search?: string; state?: string; type?: string }) => {
    const cleanParams = params ? Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ) : {};
    const query = new URLSearchParams(cleanParams as any).toString();
    return apiRequest(`/institutions${query ? `?${query}` : ''}`);
  },

  getMyRegistered: async () => {
    return apiRequest('/institutions/my');
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/institutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  autocomplete: async (query: string) => {
    return apiRequest(`/institutions/autocomplete?query=${encodeURIComponent(query)}`);
  },

  uploadDocument: async (base64Data: string, filename: string) => {
    return apiRequest('/institutions/upload-document', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename }),
    });
  },
};

// Tools API
export const tools = {
  saveResult: async (data: {
    tool_name: string;
    tool_type?: string;
    input_data?: any;
    result_data?: any;
    score?: number;
  }) => {
    return apiRequest('/tools/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getResults: async (tool_name?: string) => {
    const query = tool_name ? `?tool_name=${encodeURIComponent(tool_name)}` : '';
    return apiRequest(`/tools/results${query}`);
  },

  getResult: async (id: string) => {
    return apiRequest(`/tools/results/${id}`);
  },

  deleteResult: async (id: string) => {
    return apiRequest(`/tools/results/${id}`, {
      method: 'DELETE',
    });
  },

  logDownload: async (id: string, tool_name: string) => {
    return apiRequest(`/tools/results/${id}/log-download`, {
      method: 'POST',
      body: JSON.stringify({ tool_name }),
    });
  },

  getCertifications: async () => {
    return apiRequest('/tools/certifications');
  },
};

// Programs API
export const programs = {
  getAll: async () => {
    return apiRequest('/programs');
  },

  getBySlug: async (slug: string) => {
    return apiRequest(`/programs/${slug}`);
  },

  create: async (data: any) => {
    return apiRequest('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getEnrollments: async () => {
    return apiRequest('/programs/enrollments');
  },

  getCertificates: async () => {
    return apiRequest('/programs/enrollments/certificates');
  },

  enrollUser: async (programId: string, userId?: string) => {
    return apiRequest('/programs/enroll', {
      method: 'POST',
      body: JSON.stringify({ program_id: programId, user_id: userId }),
    });
  },

  updateProgress: async (enrollmentId: string, progress: number, status?: string) => {
    return apiRequest(`/programs/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ progress_percentage: progress, status }),
    });
  },

  deleteEnrollment: async (enrollmentId: string) => {
    return apiRequest(`/programs/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/programs/${id}`, {
      method: 'DELETE',
    });
  },

  getModules: async (programId: string) => {
    return apiRequest(`/programs/${programId}/modules`);
  },

  addModule: async (programId: string, data: any) => {
    return apiRequest(`/programs/${programId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateModule: async (moduleId: string, data: any) => {
    return apiRequest(`/programs/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteModule: async (moduleId: string) => {
    return apiRequest(`/programs/modules/${moduleId}`, {
      method: 'DELETE',
    });
  },

  getUserEnrollments: async (userId: string) => {
    return apiRequest(`/programs/users/${userId}/enrollments`);
  },

  getSyllabusSteps: async (moduleId: string) => {
    return apiRequest(`/programs/modules/${moduleId}/steps`);
  },

  addSyllabusStep: async (moduleId: string, data: any) => {
    return apiRequest(`/programs/modules/${moduleId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSyllabusStep: async (stepId: string, data: any) => {
    return apiRequest(`/programs/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSyllabusStep: async (stepId: string) => {
    return apiRequest(`/programs/steps/${stepId}`, {
      method: 'DELETE',
    });
  },

  getStudentProgress: async (enrollmentId: string) => {
    return apiRequest(`/programs/enrollments/${enrollmentId}/progress`);
  },

  completeSyllabusStep: async (enrollmentId: string, stepId: string, data?: { score?: number }) => {
    return apiRequest(`/programs/enrollments/${enrollmentId}/steps/${stepId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  getProgressReports: async () => {
    return apiRequest('/programs/admin/progress-reports');
  },

  reorderModules: async (programId: string, moduleIds: string[]) => {
    return apiRequest(`/programs/${programId}/modules/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ moduleIds }),
    });
  },

  reorderSyllabusSteps: async (moduleId: string, stepIds: string[]) => {
    return apiRequest(`/programs/modules/${moduleId}/steps/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ stepIds }),
    });
  },
};

// Notifications API
export const notifications = {
  getAll: async () => {
    return apiRequest('/notifications');
  },

  getUnreadCount: async () => {
    return apiRequest('/notifications/unread-count');
  },

  markAsRead: async (id: string) => {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  subscribePush: async (subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
    return apiRequest('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
  },
};

// Connections API
export const connections = {
  getDirectory: async () => {
    return apiRequest('/connections/directory');
  },

  sendRequest: async (receiverId: string) => {
    return apiRequest('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  },

  getReceivedRequests: async () => {
    return apiRequest('/connections/received-requests');
  },

  getSentRequests: async () => {
    return apiRequest('/connections/sent-requests');
  },

  getConnections: async () => {
    return apiRequest('/connections/my-connections');
  },

  cancelRequest: async (id: string) => {
    return apiRequest(`/connections/cancel/${id}`, {
      method: 'DELETE',
    });
  },

  respond: async (id: string, status: 'accepted' | 'rejected') => {
    return apiRequest(`/connections/respond/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  removeConnection: async (id: string) => {
    return apiRequest(`/connections/remove/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminConnectionsList: async () => {
    return apiRequest('/connections/admin/all');
  },

  adminRemoveConnection: async (id: string) => {
    return apiRequest(`/connections/admin/remove/${id}`, {
      method: 'DELETE',
    });
  },

  getAdminStats: async () => {
    return apiRequest('/connections/admin/stats');
  },
};

export const blogs = {
  list: async (params: { search?: string; category?: string; tag?: string; sort?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.tag) query.append('tag', params.tag);
    if (params.sort) query.append('sort', params.sort);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.offset) query.append('offset', String(params.offset));
    
    return apiRequest(`/blogs?${query.toString()}`);
  },

  getBySlug: async (slug: string) => {
    return apiRequest(`/blogs/${slug}`);
  },

  getMyPosts: async () => {
    return apiRequest('/blogs/my-posts');
  },

  getSaved: async () => {
    return apiRequest('/blogs/saved');
  },

  getPending: async () => {
    return apiRequest('/blogs/admin/pending');
  },

  getAllForAdmin: async () => {
    return apiRequest('/blogs/admin/all');
  },

  create: async (data: { title: string; summary?: string; content: string; cover_image_url?: string; category?: string; tags?: string[]; status?: string }) => {
    return apiRequest('/blogs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: async (id: string, data: { title?: string; summary?: string; content?: string; cover_image_url?: string; category?: string; tags?: string[]; status?: string }) => {
    return apiRequest(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/blogs/${id}`, {
      method: 'DELETE'
    });
  },

  toggleLike: async (id: string) => {
    return apiRequest(`/blogs/${id}/like`, {
      method: 'POST'
    });
  },

  toggleBookmark: async (id: string) => {
    return apiRequest(`/blogs/${id}/bookmark`, {
      method: 'POST'
    });
  },

  getComments: async (id: string) => {
    return apiRequest(`/blogs/${id}/comments`);
  },

  postComment: async (id: string, content: string, parent_id?: string | null) => {
    return apiRequest(`/blogs/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id })
    });
  },

  deleteComment: async (commentId: string) => {
    return apiRequest(`/blogs/comments/${commentId}`, {
      method: 'DELETE'
    });
  },

  approve: async (id: string) => {
    return apiRequest(`/blogs/admin/approve/${id}`, {
      method: 'PUT'
    });
  },

  reject: async (id: string, reason?: string) => {
    return apiRequest(`/blogs/admin/reject/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  uploadCover: async (base64Image: string) => {
    return apiRequest('/blogs/upload-cover', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image })
    });
  },

  getCategories: async () => {
    return apiRequest('/blogs/categories');
  }
};

// Export a mock Supabase-like client for minimal code changes
export const api = {
  auth,
  profiles,
  admin,
  institutions,
  tools,
  programs,
  notifications,
  connections,
  blogs,
  apiRequest,
};

export default api;
