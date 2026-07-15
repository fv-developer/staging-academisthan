import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type User = {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
};

type Session = {
  access_token: string;
  user: User;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  institution: string | null;
  city: string | null;
  state: string | null;
  specialization: string | null;
  experience_years: number | null;
  avatar_url: string | null;
  membership_id: string | null;
  membership_status: string | null;
  bio: string | null;
  linkedin_url: string | null;
  google_scholar_url: string | null;
  teacher_type: string | null;
  country: string | null;
  work_email: string | null;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, country?: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user && session) {
      await fetchProfile(user.id, session.access_token);
    }
  };

  useEffect(() => {
    // Check for existing session in localStorage
    const storedSession = localStorage.getItem('auth_session');
    if (storedSession) {
      try {
        const parsedSession: Session = JSON.parse(storedSession);
        setSession(parsedSession);
        setUser(parsedSession.user);
        localStorage.setItem('auth_token', parsedSession.access_token); // Ensure token is also stored
        fetchProfile(parsedSession.user.id, parsedSession.access_token);
      } catch (error) {
        console.error('Failed to parse stored session:', error);
        localStorage.removeItem('auth_session');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string, country?: string, phone?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          country: country || 'India',
          phone: phone || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.error || 'Sign up failed' } };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign up failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: { message: data.error || 'Sign in failed' } };
      }

      // Store session
      const newSession: Session = {
        access_token: data.token,
        user: data.user,
      };

      localStorage.setItem('auth_session', JSON.stringify(newSession));
      localStorage.setItem('auth_token', data.token); // Store token separately for api-client
      setSession(newSession);
      setUser(data.user);
      
      if (data.profile) {
        setProfile(data.profile);
      } else {
        await fetchProfile(data.user.id, data.token);
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_token'); // Also remove the token
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
