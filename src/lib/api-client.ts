/**
 * Centralized API Client for MySQL Backend
 * Replaces all Supabase client calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  data: T | null;
  error: { message: string } | null;
  count?: number;
}

class ApiClient {
  private token: string | null = null;

  // Custom modules via lazy getters to avoid initialization order issues
  get blogs() { return blogs; }
  get institutions() { return institutions; }
  get profiles() { return profiles; }
  get programs() { return programs; }
  get admin() { return admin; }
  get notifications() { return notifications; }
  get connections() { return connections; }
  get tools() { return tools; }

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: data.message || data.error || 'Request failed' },
        };
      }

      return {
        data: data.data || data,
        error: null,
        count: data.count,
      };
    } catch (err: any) {
      return {
        data: null,
        error: { message: err.message || 'Network error' },
      };
    }
  }

  // ============================================================================
  // AUTH API
  // ============================================================================

  auth = {
    signIn: async (email: string, password: string) => {
      const response = await this.request<{ token: string; user: any }>(
        '/auth/signin',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.data?.token) {
        this.setToken(response.data.token);
      }

      return response;
    },

    signUp: async (email: string, password: string, userData: any) => {
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, ...userData }),
      });
    },

    signOut: async () => {
      this.clearToken();
      return { data: {}, error: null };
    },

    resetPasswordForEmail: async (email: string, options?: any) => {
      return this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, ...options }),
      });
    },

    updateUser: async (updates: { password?: string; email?: string }) => {
      return this.request('/auth/update-user', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    getUser: async () => {
      const response = await this.request<any>('/auth/me');
      return {
        data: { user: response.data },
        error: response.error,
      };
    },

    resendVerification: async (email: string) => {
      const response = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to resend verification email');
      }
      return response.json();
    },

    verifyEmail: async (token: string) => {
      const response = await fetch(`${API_BASE}/auth/verify-email/${token}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Verification failed');
      }
      return response.json();
    },
  };

  // ============================================================================
  // DATABASE API (mimics Supabase .from() syntax)
  // ============================================================================

  from(table: string) {
    return new TableQuery(table, this);
  }

  // ============================================================================
  // GENERIC API REQUEST (for custom endpoints)
  // ============================================================================
  async apiRequest(endpoint: string, options: { method?: string; body?: any } = {}) {
    const method = options.method || 'GET';
    
    // Always get fresh token from localStorage
    const token = localStorage.getItem('auth_token') || this.token;
    
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }
}

// ============================================================================
// CONNECTIONS API (custom endpoint)
// ============================================================================
export const connections = {
  getDirectory: async () => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/connections/directory`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch directory');
    }
    
    return response.json();
  },

  sendRequest: async (targetUserId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send request');
    }
    
    return response.json();
  },

  getConnections: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/my-connections`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch connections');
    }
    return response.json();
  },

  getReceivedRequests: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/received-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch received requests');
    }
    return response.json();
  },

  getSentRequests: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/sent-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sent requests');
    }
    return response.json();
  },

  cancelRequest: async (connectionId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/cancel/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to cancel request');
    }
    return response.json();
  },

  respond: async (connectionId: string, status: 'accepted' | 'rejected') => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/respond/${connectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to respond to request');
    }
    
    return response.json();
  },

  removeConnection: async (connectionId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/remove/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to remove connection');
    }
    return response.json();
  },

  getAdminConnectionsList: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch admin connections list');
    }
    return response.json();
  },

  getAdminStats: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    return response.json();
  },

  adminRemoveConnection: async (connectionId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/connections/admin/remove/${connectionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to remove connection');
    }
    return response.json();
  },
};

// ============================================================================
// TOOLS API (custom endpoint)
// ============================================================================
export const tools = {
  saveResult: async (toolData: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/tools/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(toolData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save tool result');
    }
    
    return response.json();
  },

  getResults: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/tools/results`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tool results');
    }
    
    return response.json();
  },

  deleteResult: async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/tools/results/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete tool result');
    }
    
    return response.json();
  },
};

class TableQuery {
  private table: string;
  private client: ApiClient;
  private selectFields = '*';
  private filters: Array<{ field: string; operator: string; value: any }> = [];
  private orderField?: string;
  private orderAscending = true;
  private limitValue?: number;
  private offsetValue?: number;
  private singleMode = false;
  private headOnly = false;
  private countMode: 'exact' | 'planned' | 'estimated' | null = null;

  constructor(table: string, client: ApiClient) {
    this.table = table;
    this.client = client;
  }

  select(fields: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    this.selectFields = fields;
    if (options?.count) {
      this.countMode = options.count;
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  private addFilter(field: string, operator: string, value: any) {
    let val = value;
    if (val === true) val = 1;
    else if (val === false) val = 0;
    this.filters.push({ field, operator, value: val });
  }

  eq(field: string, value: any) {
    this.addFilter(field, 'eq', value);
    return this;
  }

  neq(field: string, value: any) {
    this.addFilter(field, 'neq', value);
    return this;
  }

  gt(field: string, value: any) {
    this.addFilter(field, 'gt', value);
    return this;
  }

  gte(field: string, value: any) {
    this.addFilter(field, 'gte', value);
    return this;
  }

  lt(field: string, value: any) {
    this.addFilter(field, 'lt', value);
    return this;
  }

  lte(field: string, value: any) {
    this.addFilter(field, 'lte', value);
    return this;
  }

  like(field: string, value: string) {
    this.addFilter(field, 'like', value);
    return this;
  }

  ilike(field: string, value: string) {
    this.addFilter(field, 'ilike', value);
    return this;
  }

  in(field: string, values: any[]) {
    const val = values.map(v => (v === true ? 1 : v === false ? 0 : v));
    this.filters.push({ field, operator: 'in', value: val });
    return this;
  }

  is(field: string, value: any) {
    this.addFilter(field, 'is', value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.singleMode = true;
    this.limitValue = 1;
    return this;
  }

  async then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }

  private async execute(): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();

    // Select fields
    if (this.selectFields !== '*') {
      params.append('select', this.selectFields);
    }

    // Filters
    this.filters.forEach((filter, idx) => {
      params.append(`filter[${idx}][field]`, filter.field);
      params.append(`filter[${idx}][op]`, filter.operator);
      params.append(
        `filter[${idx}][value]`,
        Array.isArray(filter.value) ? JSON.stringify(filter.value) : String(filter.value)
      );
    });

    // Order
    if (this.orderField) {
      params.append('order', this.orderField);
      params.append('ascending', String(this.orderAscending));
    }

    // Pagination
    if (this.limitValue !== undefined) {
      params.append('limit', String(this.limitValue));
    }
    if (this.offsetValue !== undefined) {
      params.append('offset', String(this.offsetValue));
    }

    // Count mode
    if (this.countMode) {
      params.append('count', this.countMode);
    }

    // Head only
    if (this.headOnly) {
      params.append('head', 'true');
    }

    const queryString = params.toString();
    const endpoint = `/db/${this.table}${queryString ? '?' + queryString : ''}`;

    const response = await this.client['request'](endpoint);

    if (this.singleMode && response.data && Array.isArray(response.data)) {
      response.data = response.data[0] || null;
    }

    return response;
  }

  // Insert
  async insert(data: any | any[]) {
    const endpoint = `/db/${this.table}`;
    const response = await this.client['request'](endpoint, {
      method: 'POST',
      body: JSON.stringify(Array.isArray(data) ? data : [data]),
    });

    return response;
  }

  // Update
  async update(data: any) {
    const params = new URLSearchParams();

    this.filters.forEach((filter, idx) => {
      params.append(`filter[${idx}][field]`, filter.field);
      params.append(`filter[${idx}][op]`, filter.operator);
      params.append(
        `filter[${idx}][value]`,
        Array.isArray(filter.value) ? JSON.stringify(filter.value) : String(filter.value)
      );
    });

    const queryString = params.toString();
    const endpoint = `/db/${this.table}${queryString ? '?' + queryString : ''}`;

    return this.client['request'](endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete
  async delete() {
    const params = new URLSearchParams();

    this.filters.forEach((filter, idx) => {
      params.append(`filter[${idx}][field]`, filter.field);
      params.append(`filter[${idx}][op]`, filter.operator);
      params.append(
        `filter[${idx}][value]`,
        Array.isArray(filter.value) ? JSON.stringify(filter.value) : String(filter.value)
      );
    });

    const queryString = params.toString();
    const endpoint = `/db/${this.table}${queryString ? '?' + queryString : ''}`;

    return this.client['request'](endpoint, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export auth separately for convenience
export const auth = api.auth;

// Export as supabase-like interface for easy drop-in replacement
export const supabase = api;

// Export as default for backward compatibility
export default api;


// ============================================================================
// ADDITIONAL APIs (custom endpoints)
// ============================================================================
export const institutions = {
  register: async (data: any) => {
    const response = await fetch(`${API_BASE}/institutions/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to register institution');
    return response.json();
  },

  getMyRegistered: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/institutions/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch registered institutions');
    const data = await response.json();
    return data.institutions || [];
  },

  autocomplete: async (query: string) => {
    const response = await fetch(`${API_BASE}/institutions/autocomplete?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch autocomplete suggestions');
    return response.json();
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE}/institutions`);
    if (!response.ok) throw new Error('Failed to fetch institutions');
    const result = await response.json();
    return Array.isArray(result) ? result : result.institutions || result.data || [];
  },

  uploadDocument: async (base64Data: string, filename: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/institutions/upload-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ base64Data, filename }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to upload document');
    }
    return response.json();
  },

  create: async (data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/institutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create institution');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/institutions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update institution');
    return response.json();
  },

  delete: async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/institutions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete institution');
    return response.json();
  },
};

export const profiles = {
  update: async (userId: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/profiles/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },
  
  delete: async (userId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/profiles/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete profile');
    return response.json();
  },
};

export const blogs = {
  getBySlug: async (slug: string) => {
    const response = await fetch(`${API_BASE}/blogs/slug/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch blog');
    return response.json();
  },
  
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE}/blogs/categories`);
      if (!response.ok) {
        console.error('Failed to fetch categories');
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },
  
  list: async (filters?: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            queryParams.append(key, String(filters[key]));
          }
        });
      }
      const url = `${API_BASE}/blogs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch blogs');
      const result = await response.json();
      return { 
        posts: result.posts || result.data || (Array.isArray(result) ? result : []), 
        count: result.total || result.count || 0 
      };
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return { posts: [], count: 0 };
    }
  },
  
  uploadCover: async (base64Image: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/upload-cover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!response.ok) throw new Error('Failed to upload cover image');
    return response.json();
  },
  
  create: async (data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create blog');
    return response.json();
  },
  
  update: async (blogId: string, data: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/${blogId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update blog');
    return response.json();
  },

  getMyPosts: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/my-posts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user posts');
    return response.json();
  },
  
  getSaved: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return [];
    try {
      const response = await fetch(`${API_BASE}/blogs/saved`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      console.error('Error fetching saved blogs:', error);
      return [];
    }
  },
  
  delete: async (blogId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete blog');
    return response.json();
  },

  toggleBookmark: async (blogId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/${blogId}/bookmark`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to bookmark post');
    return response.json();
  },

  toggleLike: async (blogId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/${blogId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to register like');
    return response.json();
  },

  getComments: async (blogId: string) => {
    const response = await fetch(`${API_BASE}/blogs/${blogId}/comments`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  createComment: async (blogId: string, content: string, parentId?: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, parent_id: parentId }),
    });
    if (!response.ok) throw new Error('Failed to post comment');
    return response.json();
  },

  deleteComment: async (commentId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/blogs/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
  },
};

export const programs = {
  getAll: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch programs');
    return response.json();
  },
  
  enroll: async (programId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/${programId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to enroll in program');
    return response.json();
  },

  getEnrollments: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/enrollments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    return response.json();
  },

  enrollUser: async (programId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ program_id: programId }),
    });
    if (!response.ok) throw new Error('Failed to enroll in program');
    return response.json();
  },

  getBySlug: async (slug: string) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/programs/${slug}`, {
      headers,
    });
    if (!response.ok) throw new Error('Failed to fetch program details');
    return response.json();
  },

  getStudentProgress: async (enrollmentId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/enrollments/${enrollmentId}/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch student progress');
    return response.json();
  },

  getProgressReports: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/admin/progress-reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch progress reports');
    return response.json();
  },

  completeSyllabusStep: async (enrollmentId: string, stepId: string, options?: { score?: number }) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/enrollments/${enrollmentId}/steps/${stepId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ score: options?.score }),
    });
    if (!response.ok) throw new Error('Failed to complete syllabus step');
    return response.json();
  },

  getModules: async (programId: string) => {
    const response = await fetch(`${API_BASE}/programs/${programId}/modules`);
    if (!response.ok) throw new Error('Failed to fetch modules');
    return response.json();
  },

  addModule: async (programId: string, payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/${programId}/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to add module');
    return response.json();
  },

  updateModule: async (moduleId: string, payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/modules/${moduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update module');
    return response.json();
  },

  deleteModule: async (moduleId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/modules/${moduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete module');
    return response.json();
  },

  reorderModules: async (programId: string, moduleIds: string[]) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/${programId}/modules/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ moduleIds }),
    });
    if (!response.ok) throw new Error('Failed to reorder modules');
    return response.json();
  },

  getSyllabusSteps: async (moduleId: string) => {
    const response = await fetch(`${API_BASE}/programs/modules/${moduleId}/steps`);
    if (!response.ok) throw new Error('Failed to fetch syllabus steps');
    return response.json();
  },

  addSyllabusStep: async (moduleId: string, payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/modules/${moduleId}/steps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to add syllabus step');
    return response.json();
  },

  updateSyllabusStep: async (stepId: string, payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/steps/${stepId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update syllabus step');
    return response.json();
  },

  deleteSyllabusStep: async (stepId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/steps/${stepId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete syllabus step');
    return response.json();
  },

  reorderSyllabusSteps: async (moduleId: string, stepIds: string[]) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/modules/${moduleId}/steps/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ stepIds }),
    });
    if (!response.ok) throw new Error('Failed to reorder syllabus steps');
    return response.json();
  },

  create: async (payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create program');
    return response.json();
  },

  update: async (programId: string, payload: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/${programId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update program');
    return response.json();
  },

  delete: async (programId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/programs/${programId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete program');
    return response.json();
  },
};

export const admin = {
  verifyProfile: async (profileId: string, status: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/profiles/${profileId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to verify profile');
    return response.json();
  },
  
  bulkDeleteInstitutions: async (ids: string[]) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/institutions/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to delete institutions');
    return response.json();
  },

  getRole: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/role`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch admin role');
    return response.json();
  },

  getToolResults: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/tool-results`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch tool results');
    return response.json();
  },

  deleteToolResult: async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/tool-results/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete tool result');
    return response.json();
  },

  bulkDeleteToolResults: async (ids: string[]) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/admin/tool-results/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to bulk delete tool results');
    return response.json();
  },
};

export const notifications = {
  getUnread: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/notifications/unread`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },
  markAsRead: async (notificationId: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },
};
