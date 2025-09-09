// Farm Request System TypeScript Interfaces

export interface FarmRequest {
  id: string;
  user_id: string;
  farm_name: string;
  location: string;
  notes?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmRequestWithProfile extends FarmRequest {
  profiles: {;
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
  };
  reviewer?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at?: string;
}

export interface FarmRequestCreatePayload {
  farm_name: string;
  location: string;
  notes?: string;
}

export interface FarmRequestUpdatePayload {
  farm_name?: string;
  location?: string;
  notes?: string;
}

export interface AdminReviewPayload {
  admin_notes?: string;
}

export interface FarmRequestStats {
  total: number;
  pending: number;
  approved: number;
  denied: number;
}
