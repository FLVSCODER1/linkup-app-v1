import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  district?: string | null;
  school?: string | null;
  displayName?: string | null;
};

export type EventVisibility = "district" | "school" | "public";

export type FeedEvent = {
  id: string;

  title?: string;
  description?: string;
  location?: string;
  category?: string;

  district?: string | null;
  school?: string | null;
  visibility?: EventVisibility | string;

  status?: string;

  source?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceId?: string;
  imported?: boolean;

  attendeeCount?: number;

  startTime?: Timestamp | Date | string | null;
  endTime?: Timestamp | Date | string | null;

  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
  publishedAt?: Timestamp | Date | string | null;

  date?: string;

  moderationStatus?: "pending" | "approved" | "auto_approved" | "suppressed" | "needs_review" | string;
  suppressionReason?: string | null;
  relevanceScore?: number | null;
  aiCategory?: string | null;
  reviewedAt?: Timestamp | Date | string | null;
  reviewedBy?: string | null;





};

