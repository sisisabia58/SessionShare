import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE as string;

// ── Helper ────────────────────────────────────────────────────────
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, json.error?.code ?? 'UNKNOWN_ERROR', json.error?.message ?? 'Unknown error');
  }
  return json as T;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Typed Response Interfaces ─────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'member';
  plan: 'free' | 'basic' | 'premium' | 'premium_phantom';
  premium_until: string | null;
  created_at: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
}

export interface Order {
  id: string;
  plan: string;
  plan_display_name: string;
  quantity: number;
  total_days: number;
  total_price: number;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  service_name: string | null;
  service_icon_url: string | null;
}

export interface Service {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
  category: string | null;
  cookie_count: number;
  active_cookie_count: number;
  display_order: number;
}

// ── User API ──────────────────────────────────────────────────────

export const userApi = {
  getProfile: () => apiFetch<{ profile: UserProfile }>('/user-profile'),
  updateProfile: (data: Partial<Pick<UserProfile, 'display_name' | 'username' | 'avatar_url'>>) =>
    apiFetch<{ profile: UserProfile }>('/user-profile', { method: 'PUT', body: JSON.stringify(data) }),

  getLogs: () => apiFetch<{ logs: ActivityLog[] }>('/user-logs'),

  getOrders: () => apiFetch<{ orders: Order[] }>('/user-orders'),
  getOrder: (orderId: string) => apiFetch<{ order: Order }>(`/user-orders?order_id=${orderId}`),
};

// ── Payment API ───────────────────────────────────────────────────

export interface CreateOrderResponse {
  order_id: string;
  qr_string: string;
  expired_at: string;
  total_payment: number;
}

export const paymentApi = {
  createOrder: (data: {
    plan: string;
    plan_display_name: string;
    quantity: number;
    total_days: number;
    amount: number;
  }) => apiFetch<CreateOrderResponse>('/pakasir-create', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Services API ──────────────────────────────────────────────────

export const servicesApi = {
  getServices: () => apiFetch<{ services: Service[] }>('/services'),
};

// ── Admin API ─────────────────────────────────────────────────────

export const adminApi = {
  getDashboard: () => apiFetch<any>('/admin-dashboard'),

  // Services
  getServices: () => apiFetch<{ services: any[] }>('/admin-services'),
  createService: (data: any) => apiFetch<{ service: any }>('/admin-services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: string, data: any) => apiFetch<{ service: any }>(`/admin-services?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: string) => apiFetch<{ success: boolean }>(`/admin-services?id=${id}`, { method: 'DELETE' }),

  // Cookies
  getCookies: (serviceId: string) => apiFetch<{ cookies: any[] }>(`/admin-cookies?service_id=${serviceId}`),
  createCookie: (data: any) => apiFetch<{ cookie: any }>('/admin-cookies', { method: 'POST', body: JSON.stringify(data) }),
  updateCookie: (id: string, data: any) => apiFetch<{ cookie: any }>(`/admin-cookies?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCookie: (id: string) => apiFetch<{ success: boolean }>(`/admin-cookies?id=${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (params?: { page?: number; plan?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.plan) q.set('plan', params.plan);
    if (params?.search) q.set('search', params.search);
    return apiFetch<{ users: any[]; total: number }>(`/admin-users?${q.toString()}`);
  },
  updateUser: (id: string, data: any) => apiFetch<{ user: any }>(`/admin-users?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  banUser: (id: string) => apiFetch<{ success: boolean }>(`/admin-users?id=${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params?: { page?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.status) q.set('status', params.status);
    return apiFetch<{ orders: any[]; total: number }>(`/admin-orders?${q.toString()}`);
  },
  updateOrder: (id: string, status: string) =>
    apiFetch<{ success: boolean }>(`/admin-orders?id=${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};
