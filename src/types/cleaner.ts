export interface Cleaner {
  id: string;
  name: string;
  phone?: string;
  sex?: 'male' | 'female' | 'other';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCleanerData {
  name: string;
  phone?: string;
  sex?: 'male' | 'female' | 'other';
  avatar_url?: string;
}

export interface UpdateCleanerData extends Partial<CreateCleanerData> {
  is_active?: boolean;
}

export interface StaffAssignment {
  booking_id: string;
  cleaner_ids: string[];
}
