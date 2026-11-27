/**
 * Supabase Client & REST API Integration
 * Native Fetch-based implementation with zero external dependencies.
 * Fully compatible with Next.js Client & Server environments.
 */

export interface SupabaseAuthUser {
  id: string;
  email: string;
  phone?: string;
  role?: string;
  email_confirmed_at?: string;
  user_metadata?: {
    name?: string;
    business_name?: string;
    category?: string;
    phone?: string;
    [key: string]: any;
  };
  created_at?: string;
}

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: SupabaseAuthUser;
}

export interface AuthResponse {
  data: {
    user: SupabaseAuthUser | null;
    session: SupabaseSession | null;
  };
  error: { message: string; status?: number } | null;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lexyffenbdoysbfxdsen.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_CmqOCzZ1r0ZX9AtQzKH4nA_c_g0rEBx';

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_ws8Cj-jZ8670EjBts2mjNg_YA4WMS64';

const SESSION_STORAGE_KEY = 'slipdo_supabase_session';

export class SupabaseClient {
  private url: string;
  private anonKey: string;
  private serviceKey: string;

  constructor(url = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY, serviceKey = SUPABASE_SERVICE_KEY) {
    this.url = url.replace(/\/+$/, '');
    this.anonKey = anonKey;
    this.serviceKey = serviceKey;
  }

  // --- Auth APIs ---
  get auth() {
    return {
      signUp: async (params: {
        email: string;
        password?: string;
        phone?: string;
        options?: { data?: Record<string, any> };
      }): Promise<AuthResponse> => {
        try {
          const body: Record<string, any> = {
            email: params.email,
            password: params.password || 'SlipDoMerchant2026!',
          };
          if (params.phone) body.phone = params.phone;
          if (params.options?.data) body.data = params.options.data;

          const res = await fetch(`${this.url}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
            },
            body: JSON.stringify(body),
          });

          const data = await res.json();
          if (!res.ok) {
            return {
              data: { user: null, session: null },
              error: { message: data.msg || data.message || 'Failed to sign up', status: res.status },
            };
          }

          const session: SupabaseSession | null = data.access_token ? data : null;
          if (session) {
            this.setSession(session);
          }

          return {
            data: { user: data.user || data, session },
            error: null,
          };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || 'Network error contacting Supabase Auth' },
          };
        }
      },

      signInWithPassword: async (params: {
        email: string;
        password: string;
      }): Promise<AuthResponse> => {
        try {
          const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
            },
            body: JSON.stringify({
              email: params.email,
              password: params.password,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return {
              data: { user: null, session: null },
              error: {
                message: data.error_description || data.msg || data.message || 'Invalid credentials',
                status: res.status,
              },
            };
          }

          const session: SupabaseSession = {
            access_token: data.access_token,
            token_type: data.token_type || 'bearer',
            expires_in: data.expires_in,
            expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            refresh_token: data.refresh_token,
            user: data.user,
          };

          this.setSession(session);
          return {
            data: { user: data.user, session },
            error: null,
          };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || 'Network error signing in' },
          };
        }
      },

      signInWithOtp: async (params: { email?: string; phone?: string }): Promise<{ error: any }> => {
        try {
          const res = await fetch(`${this.url}/auth/v1/otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
            },
            body: JSON.stringify(params),
          });
          const data = await res.json();
          if (!res.ok) {
            return { error: { message: data.msg || data.message || 'Failed to send OTP' } };
          }
          return { error: null };
        } catch (err: any) {
          return { error: { message: err?.message || 'Network error' } };
        }
      },

      verifyOtp: async (params: {
        email?: string;
        phone?: string;
        token: string;
        type?: string;
      }): Promise<AuthResponse> => {
        try {
          const res = await fetch(`${this.url}/auth/v1/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
            },
            body: JSON.stringify({
              email: params.email,
              phone: params.phone,
              token: params.token,
              type: params.type || (params.phone ? 'sms' : 'email'),
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            return {
              data: { user: null, session: null },
              error: { message: data.msg || data.message || 'Invalid OTP code' },
            };
          }

          const session: SupabaseSession = {
            access_token: data.access_token,
            token_type: data.token_type || 'bearer',
            expires_in: data.expires_in,
            expires_at: data.expires_at || Math.floor(Date.now() / 1000) + 3600,
            refresh_token: data.refresh_token,
            user: data.user,
          };

          this.setSession(session);
          return { data: { user: data.user, session }, error: null };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || 'Verification error' },
          };
        }
      },

      signOut: async (): Promise<{ error: any }> => {
        try {
          const session = this.getSession();
          if (session?.access_token) {
            await fetch(`${this.url}/auth/v1/logout`, {
              method: 'POST',
              headers: {
                apikey: this.anonKey,
                Authorization: `Bearer ${session.access_token}`,
              },
            }).catch(() => {});
          }
        } catch {
          // Ignore network errors on logout
        } finally {
          this.removeSession();
        }
        return { error: null };
      },

      getSession: (): SupabaseSession | null => {
        return this.getSession();
      },

      getUser: (): SupabaseAuthUser | null => {
        const session = this.getSession();
        return session?.user || null;
      },
    };
  }

  // --- Session Management in localStorage ---
  private getSession(): SupabaseSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: SupabaseSession = JSON.parse(raw);
      // If token expired, clear
      if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  setSession(session: SupabaseSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }

  removeSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  }

  // --- PostgREST Database API ---
  from(tableName: string) {
    const session = this.getSession();
    const token = session?.access_token || this.anonKey;

    return {
      select: async (query = '*') => {
        try {
          const res = await fetch(`${this.url}/rest/v1/${tableName}?select=${encodeURIComponent(query)}`, {
            headers: {
              apikey: this.anonKey,
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          return { data: res.ok ? data : null, error: res.ok ? null : data };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },

      insert: async (records: Record<string, any> | Record<string, any>[]) => {
        try {
          const res = await fetch(`${this.url}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
              Authorization: `Bearer ${token}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify(records),
          });
          const data = await res.json();
          return { data: res.ok ? data : null, error: res.ok ? null : data };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
    };
  }

  // --- Health Check / Diagnostic ---
  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.url}/auth/v1/settings`, {
        headers: { apikey: this.anonKey },
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          ok: true,
          message: `Connected to Supabase project (${this.url}) in ${latencyMs}ms`,
          latencyMs,
        };
      } else {
        return {
          ok: false,
          message: `Supabase responded with HTTP ${res.status}`,
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        message: err?.message || 'Failed to reach Supabase endpoint',
        latencyMs: Date.now() - start,
      };
    }
  }
}

export const supabase = new SupabaseClient();
