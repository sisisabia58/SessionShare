export type UserRole = "admin" | "member";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SharedSessionCookie {
  id: string;
  service_id: string;
  encrypted_cookie_data: string;
  generated_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface CookieAccessLog {
  id: string;
  user_id: string;
  service_id: string;
  action: "access" | "inject" | "export" | "view";
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ServicesListResponse {
  services: Omit<Service, "created_at" | "updated_at">[];
}

export interface ServiceDetailResponse {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
}

export interface CookieResponse {
  encrypted_cookie_data: string;
  expires_at: string;
}

export interface AccessLogRequest {
  service_id: string;
  action: "access" | "inject" | "export" | "view";
}

export interface CreateServiceRequest {
  name: string;
  website_url: string;
  icon_url?: string;
}

export interface UploadCookieRequest {
  encrypted_cookie_data: string;
  expires_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
