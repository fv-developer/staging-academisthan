// Mock Supabase client routing requests to the Express backend API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Auth State Callbacks Store
const authListeners = new Set<(event: string, session: any) => void>();

class SupabaseQueryBuilder {
  private tableName: string;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private filters: any[] = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = '*', options?: any) {
    this.method = 'select';
    return this;
  }

  insert(values: any) {
    this.method = 'insert';
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.method = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, value: pattern });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convert specific tables to dedicated routes if we want, OR route everything dynamically
      // Since we wrote the dynamic db endpoint, route all dynamic queries to /api/db
      const response = await fetch(`${API_URL}/db`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table: this.tableName === 'user_roles' ? 'admin_roles' : this.tableName,
          method: this.method,
          payload: this.payload,
          filters: this.filters,
          orderCol: this.orderCol,
          orderAscending: this.orderAscending,
          limitCount: this.limitCount,
          isSingle: this.isSingle
        })
      });

      const result = await response.json();
      if (!response.ok) {
        resolve({ data: null, error: { message: result.error || 'Database operation failed' } });
      } else {
        resolve({ data: result.data, error: result.error });
      }
    } catch (error: any) {
      console.error('Mock Client Query Error:', error);
      resolve({ data: null, error: { message: error.message || 'Network error' } });
    }
  }
}

// Authentication Service Helper
const auth = {
  signUp: async ({ email, password, options }: any) => {
    try {
      const fullName = options?.data?.full_name || '';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          country: options?.data?.country || 'India',
          phone: options?.data?.phone || ''
        })
      });
      const result = await response.json();
      if (!response.ok) {
        return { data: { user: null, session: null }, error: { message: result.error || 'Signup failed' } };
      }
      return { data: { user: result.user, session: null }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  signInWithPassword: async ({ email, password }: any) => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) {
        return { data: { user: null, session: null }, error: { message: result.error || 'Signin failed' } };
      }

      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));

      const session = { access_token: result.token, user: result.user };
      
      // Notify listeners
      authListeners.forEach(listener => {
        try { listener('SIGNED_IN', session); } catch (e) {}
      });

      return { data: { user: result.user, session }, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  signOut: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_URL}/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      // Ignore network errors on signout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      authListeners.forEach(listener => {
        try { listener('SIGNED_OUT', null); } catch (e) {}
      });
    }
    return { error: null };
  },

  getSession: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { data: { session: { access_token: token, user } }, error: null };
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    }
    return { data: { session: null }, error: null };
  },

  getUser: async () => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return { data: { user }, error: null };
      } catch (e) {}
    }
    return { data: { user: null }, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    authListeners.add(callback);
    
    // Immediately call back with current session if available
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setTimeout(() => callback('SIGNED_IN', { access_token: token, user }), 0);
      } catch(e) {}
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          }
        }
      }
    };
  },

  resetPasswordForEmail: async (email: string, options?: any) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) {
        return { error: { message: result.error || 'Failed to send reset email' } };
      }
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  },

  updateUser: async ({ password }: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: '', newPassword: password }) // Hack to change password without old password check
      });
      const result = await response.json();
      if (!response.ok) {
        return { error: { message: result.error || 'Failed to update password' } };
      }
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message } };
    }
  }
};

// Edge functions proxy
const functions = {
  invoke: async (functionName: string, options?: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/tools/functions/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(options?.body || {})
      });
      
      const result = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: result.error || 'Function execution failed' } };
      }
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
};

export const supabase = {
  auth,
  from: (tableName: string) => new SupabaseQueryBuilder(tableName),
  functions,
};

export default supabase;
