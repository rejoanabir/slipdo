/**
 * Supabase Client & REST API Integration
 * Native Fetch-based implementation with zero external dependencies.
 * Fully compatible with Next.js Client & Server environments.
 */

import { Business, Customer, Receipt, ReceiptItem } from './types';

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

const SESSION_STORAGE_KEY = 'slipdo_supabase_session';

export class SupabaseClient {
  public url: string;
  public anonKey: string;

  constructor(url = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY) {
    this.url = url.replace(/\/+$/, '');
    this.anonKey = anonKey;
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
          };
          if (params.password) body.password = params.password;
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

      signInWithOtp: async (params: {
        email?: string;
        phone?: string;
        options?: { emailRedirectTo?: string; data?: Record<string, any> };
      }): Promise<{ error: any }> => {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slipdo.vercel.app';
          const redirectTo = params.options?.emailRedirectTo || `${origin}/login`;
          const body: Record<string, any> = {
            create_user: true,
          };
          if (params.email) {
            body.email = params.email;
            body.email_redirect_to = redirectTo;
          }
          if (params.phone) {
            body.phone = params.phone;
          }
          if (params.options?.data) {
            body.data = params.options.data;
          }

          const res = await fetch(`${this.url}/auth/v1/otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
            },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok) {
            return { error: { message: data.msg || data.message || 'Failed to send verification link/code' } };
          }
          return { error: null };
        } catch (err: any) {
          return { error: { message: err?.message || 'Network error' } };
        }
      },

      signInWithOAuth: async (params: {
        provider: string;
        options?: { redirectTo?: string; queryParams?: Record<string, string> };
      }): Promise<{ data: { url: string } | null; error: any }> => {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://slipdo.vercel.app';
          const redirectTo = params.options?.redirectTo || `${origin}/login`;
          const url = `${this.url}/auth/v1/authorize?provider=${encodeURIComponent(params.provider)}&redirect_to=${encodeURIComponent(redirectTo)}`;
          
          // Pre-flight check to verify if the provider is enabled and configured in Supabase
          try {
            const probe = await fetch(url, { method: 'GET' });
            if (!probe.ok) {
              const errData = await probe.json().catch(() => ({}));
              const msg = errData?.msg || errData?.message || 'Unsupported provider: provider is not enabled';
              if (probe.status === 400 || msg.toLowerCase().includes('not enabled')) {
                return {
                  data: null,
                  error: {
                    message: 'Google Sign-In is not enabled yet in your Supabase project (Authentication -> Providers -> Google). Please enable it or sign in with email/password.',
                    isProviderDisabled: true,
                  },
                };
              }
              return { data: null, error: { message: msg } };
            }
          } catch {
            // If probe is blocked by network policy or CORS, fall back to navigation
          }

          if (typeof window !== 'undefined') {
            window.location.href = url;
          }
          return { data: { url }, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err?.message || 'OAuth initialization failed' } };
        }
      },

      verifyOtp: async (params: {
        email?: string;
        phone?: string;
        token: string;
        type?: string;
      }): Promise<AuthResponse> => {
        try {
          let res = await fetch(`${this.url}/auth/v1/verify`, {
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

          let data = await res.json();
          // Fallback retry with type: 'signup' if type: 'email' returns error
          if (!res.ok && params.email && (!params.type || params.type === 'email')) {
            const signupRes = await fetch(`${this.url}/auth/v1/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: this.anonKey,
              },
              body: JSON.stringify({
                email: params.email,
                token: params.token,
                type: 'signup',
              }),
            });
            if (signupRes.ok) {
              res = signupRes;
              data = await signupRes.json();
            }
          }

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
          if (typeof window !== 'undefined' && data.user) {
            try {
              localStorage.setItem(
                'slipdo_auth_user_v3',
                JSON.stringify({
                  id: data.user.id,
                  email: data.user.email || '',
                  name:
                    data.user.user_metadata?.full_name ||
                    data.user.user_metadata?.name ||
                    data.user.email?.split('@')[0] ||
                    'Store Owner',
                  phone: data.user.phone || '',
                  role: 'Store Owner',
                })
              );
            } catch {}
          }
          return { data: { user: data.user, session }, error: null };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || 'Verification error' },
          };
        }
      },

      updateUser: async (attributes: {
        data?: Record<string, any>;
        email?: string;
        password?: string;
      }): Promise<AuthResponse> => {
        try {
          const session = this.getSession();
          if (!session?.access_token) {
            return { data: { user: null, session: null }, error: { message: 'No active session' } };
          }
          const res = await fetch(`${this.url}/auth/v1/user`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              apikey: this.anonKey,
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(attributes),
          });
          const data = await res.json();
          if (!res.ok) {
            return {
              data: { user: null, session: null },
              error: { message: data.msg || data.message || 'Failed to update user profile' },
            };
          }
          const updatedSession = { ...session, user: data };
          this.setSession(updatedSession);
          return { data: { user: data, session: updatedSession }, error: null };
        } catch (err: any) {
          return {
            data: { user: null, session: null },
            error: { message: err?.message || 'Network error updating user' },
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
  public getSession(): SupabaseSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: SupabaseSession = JSON.parse(raw);
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

  async handleAuthCallback(): Promise<SupabaseSession | null> {
    if (typeof window === 'undefined') return null;

    // 1. Check hash fragment (#access_token=... or #error=...)
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const error_desc = params.get('error_description') || params.get('error');
      if (error_desc) {
        console.warn('Auth callback error from hash:', error_desc);
        return null;
      }

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const expires_in = parseInt(params.get('expires_in') || '3600', 10);
      const token_type = params.get('token_type') || 'bearer';

      if (access_token) {
        try {
          const userRes = await fetch(`${this.url}/auth/v1/user`, {
            headers: {
              apikey: this.anonKey,
              Authorization: `Bearer ${access_token}`,
            },
          });
          const user = await userRes.json();
          const session: SupabaseSession = {
            access_token,
            token_type,
            expires_in,
            expires_at: Math.floor(Date.now() / 1000) + expires_in,
            refresh_token: refresh_token || '',
            user,
          };
          this.setSession(session);
          try {
            const authUserData = {
              id: user.id,
              email: user.email || '',
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'Store Owner',
              phone: user.phone || user.user_metadata?.phone || '',
              role: 'Store Owner',
            };
            localStorage.setItem('slipdo_auth_user_v3', JSON.stringify(authUserData));
            localStorage.setItem(
              'slipdo_auth_session',
              JSON.stringify({ token: access_token, user: authUserData })
            );
          } catch {}
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          return session;
        } catch (err) {
          console.error('Failed to parse auth token:', err);
        }
      }
    }

    // 2. Check query params (?code=... or ?error=...)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (code) {
      try {
        const res = await fetch(`${this.url}/auth/v1/token?grant_type=pkce`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.anonKey,
          },
          body: JSON.stringify({ auth_code: code }),
        });
        const data = await res.json();
        if (res.ok && data.access_token) {
          const session: SupabaseSession = {
            access_token: data.access_token,
            token_type: data.token_type || 'bearer',
            expires_in: data.expires_in,
            expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            refresh_token: data.refresh_token || '',
            user: data.user,
          };
          this.setSession(session);
          try {
            const authUserData = {
              id: data.user.id,
              email: data.user.email || '',
              name:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0] ||
                'Store Owner',
              phone: data.user.phone || data.user.user_metadata?.phone || '',
              role: 'Store Owner',
            };
            localStorage.setItem('slipdo_auth_user_v3', JSON.stringify(authUserData));
            localStorage.setItem(
              'slipdo_auth_session',
              JSON.stringify({ token: data.access_token, user: authUserData })
            );
          } catch {}
          window.history.replaceState(null, '', window.location.pathname);
          return session;
        }
      } catch (err) {
        console.error('Failed to exchange code:', err);
      }
    }

    return null;
  }

  // --- PostgREST Query Helper ---
  async fetchPostgrest(path: string, options: RequestInit = {}): Promise<{ data: any; error: any }> {
    try {
      const session = this.getSession();
      const token = session?.access_token || this.anonKey;
      const headers: Record<string, string> = {
        apikey: this.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      const res = await fetch(`${this.url}/rest/v1${path}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        return { data: null, error: errJson };
      }

      if (res.status === 204) {
        return { data: null, error: null };
      }

      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Network request failed' } };
    }
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

/**
 * High-Level Database Service for SlipDo
 * Synchronizes receipts, customers, businesses, and profiles with Supabase.
 */
export const supabaseDb = {
  // --- Businesses ---
  async getBusinesses(merchantId: string): Promise<Business[]> {
    const { data, error } = await supabase.fetchPostgrest(
      `/businesses?merchant_id=eq.${encodeURIComponent(merchantId)}&order=is_default.desc,created_at.asc`
    );
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((b: any) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        address: b.address,
        phone: b.phone || '',
        bin: b.bin || '',
        currency: b.currency || 'BDT',
        currencySymbol: b.currency_symbol || '৳',
        logoUrl: b.logo_url || undefined,
        signatureUrl: b.signature_url || undefined,
        customTemplate: b.custom_template || undefined,
      }));
    }

    // Secondary fallback: Check user_metadata on the active session
    try {
      const session = supabase.getSession();
      const metaBiz = session?.user?.user_metadata?.default_business;
      if (metaBiz && metaBiz.name) {
        return [metaBiz];
      }
    } catch {}

    return [];
  },

  async saveBusiness(biz: Business, merchantId: string): Promise<boolean> {
    const body = {
      id: biz.id,
      merchant_id: merchantId,
      name: biz.name,
      category: biz.category,
      address: biz.address,
      phone: biz.phone,
      bin: biz.bin,
      currency: biz.currency || 'BDT',
      currency_symbol: biz.currencySymbol || '৳',
      logo_url: biz.logoUrl || null,
      signature_url: biz.signatureUrl || null,
      custom_template: biz.customTemplate || null,
      is_default: true,
    };

    // Lightweight metadata payload (never send massive base64 into user_metadata)
    const metaBusiness = {
      id: biz.id,
      name: biz.name,
      category: biz.category,
      address: biz.address,
      phone: biz.phone,
      bin: biz.bin,
      currency: biz.currency || 'BDT',
      currencySymbol: biz.currencySymbol || '৳',
    };

    // Non-blocking sync with 2.5s safeguard timeout
    try {
      const syncMetadata = supabase.auth.updateUser({
        data: {
          store_setup_completed: true,
          default_business: metaBusiness,
        },
      });
      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.race([syncMetadata, timeout]);
    } catch (err) {
      console.warn('Failed to sync business into user_metadata:', err);
    }

    // Upsert into businesses table in PostgREST with 2.5s safeguard timeout
    try {
      const dbUpsert = supabase.fetchPostgrest(`/businesses`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(body),
      });
      const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
      const res: any = await Promise.race([dbUpsert, timeout]);
      return !!(res && !res.error);
    } catch {
      return false;
    }
  },

  // --- Customers ---
  async getCustomers(merchantId: string): Promise<Customer[]> {
    const { data, error } = await supabase.fetchPostgrest(
      `/customers?merchant_id=eq.${encodeURIComponent(merchantId)}&order=total_spent.desc`
    );
    if (error || !Array.isArray(data)) return [];
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      totalSpent: Number(c.total_spent) || 0,
      receipts: c.total_receipts || 0,
      lastVisit: c.last_visit ? new Date(c.last_visit).toLocaleDateString('en-GB') : 'Recently',
    }));
  },

  async saveCustomer(customer: Partial<Customer> & { name: string }, merchantId: string): Promise<boolean> {
    const body: Record<string, any> = {
      merchant_id: merchantId,
      name: customer.name,
      phone: customer.phone || null,
      email: customer.email || null,
      total_spent: customer.totalSpent || 0,
      total_receipts: customer.receipts || 1,
      last_visit: new Date().toISOString(),
    };
    if (customer.id && !customer.id.startsWith('cust_')) {
      body.id = customer.id;
    }
    const { error } = await supabase.fetchPostgrest(`/customers`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(body),
    });
    return !error;
  },

  async upsertCustomerFromReceipt(receipt: Receipt, merchantId: string): Promise<void> {
    if (!receipt.customerName || receipt.customerName.trim().toLowerCase() === 'walk-in customer') return;
    try {
      const phoneParam = receipt.customerPhone ? `&phone=eq.${encodeURIComponent(receipt.customerPhone)}` : '';
      const nameParam = `name=eq.${encodeURIComponent(receipt.customerName)}`;
      const query = phoneParam
        ? `/customers?merchant_id=eq.${encodeURIComponent(merchantId)}${phoneParam}&limit=1`
        : `/customers?merchant_id=eq.${encodeURIComponent(merchantId)}&${nameParam}&limit=1`;

      const { data } = await supabase.fetchPostgrest(query);
      if (Array.isArray(data) && data.length > 0) {
        const existing = data[0];
        const newSpent = (Number(existing.total_spent) || 0) + (receipt.total || 0);
        const newReceipts = (Number(existing.total_receipts) || 0) + 1;
        await supabase.fetchPostgrest(`/customers?id=eq.${encodeURIComponent(existing.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            total_spent: newSpent,
            total_receipts: newReceipts,
            last_visit: new Date().toISOString(),
          }),
        });
      } else {
        await supabase.fetchPostgrest(`/customers`, {
          method: 'POST',
          body: JSON.stringify({
            merchant_id: merchantId,
            name: receipt.customerName,
            phone: receipt.customerPhone || null,
            total_spent: receipt.total || 0,
            total_receipts: 1,
            last_visit: new Date().toISOString(),
          }),
        });
      }
    } catch (err) {
      console.error('Failed to sync customer from receipt to Supabase:', err);
    }
  },

  // --- Receipts ---
  async getReceipts(merchantId: string): Promise<Receipt[]> {
    const { data, error } = await supabase.fetchPostgrest(
      `/receipts?merchant_id=eq.${encodeURIComponent(merchantId)}&order=created_at.desc`
    );
    if (error || !Array.isArray(data)) return [];
    return data.map(mapDbReceiptToModel);
  },

  async getReceiptByToken(token: string): Promise<Receipt | null> {
    // 1. Try secure cryptographic RPC lookup first
    const rpcRes = await supabase.fetchPostgrest(`/rpc/get_receipt_by_token`, {
      method: 'POST',
      body: JSON.stringify({ lookup_token: token }),
    });
    if (rpcRes.data && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
      return mapDbReceiptToModel(rpcRes.data[0]);
    }

    // 2. Direct fallback lookup by token
    const { data, error } = await supabase.fetchPostgrest(
      `/receipts?token=eq.${encodeURIComponent(token)}&limit=1`
    );
    if (error || !Array.isArray(data) || data.length === 0) return null;
    return mapDbReceiptToModel(data[0]);
  },

  async deleteAccount(merchantId: string): Promise<boolean> {
    if (!merchantId) return false;
    try {
      // 1. Permanently delete user from auth.users and all merchant tables via SECURITY DEFINER procedure
      const { data, error } = await supabase.fetchPostgrest(`/rpc/delete_merchant_account`, {
        method: 'POST',
        body: JSON.stringify({ target_user_id: merchantId }),
      });

      if (error) {
        console.error('Failed to execute delete_merchant_account RPC:', error);
        return false;
      }

      // 2. Clear locally cached auth session immediately upon confirmed database purge
      supabase.clearSession();

      return data === true;
    } catch (err) {
      console.error('Failed to delete merchant account:', err);
      return false;
    }
  },

  async saveReceipt(receipt: Receipt, merchantId: string, businessId?: string): Promise<boolean> {
    const body = {
      token: receipt.token,
      receipt_number: receipt.receiptNo || receipt.id,
      merchant_id: merchantId,
      business_id: businessId || null,
      customer_name: receipt.customerName || 'Walk-in Customer',
      customer_phone: receipt.customerPhone || null,
      items: receipt.items || [],
      subtotal: receipt.totals?.subtotal || receipt.total,
      tax_rate: receipt.taxRate || 0,
      tax_amount: receipt.totals?.taxAmount || 0,
      discount_amount: receipt.discount || 0,
      total_amount: receipt.total,
      paid_amount: receipt.total,
      change_due: 0,
      payment_method: receipt.paymentMethod || 'Cash',
      payment_status: receipt.status || 'Paid',
      template_name: receipt.template || 'Modern Emerald',
      notes: receipt.notes || null,
      logo_url: receipt.logoUrl || null,
      signature_url: receipt.signatureUrl || null,
      custom_template: receipt.customTemplate || null,
      issued_at: new Date().toISOString(),
    };

    const { error } = await supabase.fetchPostgrest(`/receipts`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(body),
    });

    if (!error && receipt.customerName) {
      this.upsertCustomerFromReceipt(receipt, merchantId).catch(() => {});
    }

    return !error;
  },

  async updateReceiptStatus(receiptId: string, status: 'Paid' | 'Due' | 'Void'): Promise<boolean> {
    const { error } = await supabase.fetchPostgrest(`/receipts?id=eq.${encodeURIComponent(receiptId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: status }),
    });
    return !error;
  },

  async deleteReceipt(receiptId: string): Promise<boolean> {
    const { error } = await supabase.fetchPostgrest(`/receipts?id=eq.${encodeURIComponent(receiptId)}`, {
      method: 'DELETE',
    });
    return !error;
  },
};

function mapDbReceiptToModel(r: any): Receipt {
  return {
    id: r.id || r.receipt_number,
    receiptNo: r.receipt_number,
    token: r.token,
    date: r.issued_at ? new Date(r.issued_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Today',
    customerName: r.customer_name || 'Walk-in Customer',
    customerPhone: r.customer_phone || '',
    paymentMethod: r.payment_method || 'Cash',
    status: r.payment_status || 'Paid',
    template: (r.template_name?.toLowerCase().replace(/\s+/g, '-') as any) || 'modern-emerald',
    taxRate: Number(r.tax_rate) || 0,
    enableTax: Number(r.tax_amount) > 0,
    discount: Number(r.discount_amount) || 0,
    enableDiscount: Number(r.discount_amount) > 0,
    items: Array.isArray(r.items) ? r.items : [],
    total: Number(r.total_amount) || 0,
    totals: {
      subtotal: Number(r.subtotal) || Number(r.total_amount) || 0,
      taxAmount: Number(r.tax_amount) || 0,
      discountAmount: Number(r.discount_amount) || 0,
      total: Number(r.total_amount) || 0,
    },
    notes: r.notes || undefined,
    logoUrl: r.logo_url || undefined,
    signatureUrl: r.signature_url || undefined,
    customTemplate: r.custom_template || undefined,
  };
}
