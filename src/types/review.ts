export interface Review {
  id: number;
  booking_id: number;
  customer_id: string;
  team_id?: number;
  rating: number; // 1-5 stars
  comment?: string;
  created_at: string;
}

export interface CreateReviewData {
  booking_id: number;
  rating: number;
  comment?: string;
}

export interface ReviewFormData {
  rating: number;
  comment: string;
} 