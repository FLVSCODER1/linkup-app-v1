import type { Timestamp } from "firebase/firestore";

export type FirestoreDate = Timestamp | Date | string | null;

export type GradeLevel = "9" | "10" | "11" | "12";

export interface UserProfileDocument {
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  grade: GradeLevel;
  interests: string[];
  district: string | null;
  school: string | null;
  profileComplete: boolean;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export type EventVisibility = "district" | "school" | "public";
export type EventStatus = "draft" | "published" | "cancelled";
export type ModerationStatus =
  | "pending"
  | "approved"
  | "auto_approved"
  | "suppressed"
  | "needs_review";

export interface EventDocument {
  title: string;
  description: string;
  location: string;
  category: string;
  district: string | null;
  school: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  source: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceId?: string;
  imported: boolean;
  attendeeCount: number;
  startTime: FirestoreDate;
  endTime: FirestoreDate;
  createdBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
  publishedAt: FirestoreDate;
  moderationStatus: ModerationStatus;
  suppressionReason: string | null;
  relevanceScore: number | null;
  aiCategory: string | null;
  reviewedAt: FirestoreDate;
  reviewedBy: string | null;
  // Legacy display value retained while old event records are migrated.
  date?: string;
}

export interface EventPreferenceDocument {
  userId: string;
  eventId: string;
  school: string | null;
  attendanceStatus: "going" | "maybe" | "not-going";
  connectionGoal: "friends" | "group" | "browsing";
  updatedAt: FirestoreDate;
  // Legacy keys read during the migration away from prom/dating terminology.
  promStatus?: string;
  lookingFor?: string;
}

export interface EventAttendeeDocument {
  uid: string;
  school: string | null;
  joinedAt: FirestoreDate;
}

export interface InterestDocument {
  fromUserId: string;
  toUserId: string;
  eventId: string;
  createdAt: FirestoreDate;
}

export interface CalendarSourceDocument {
  active: boolean;
  district: string;
  school: string | null;
  sourceType: "ics";
  sourceUrl: string;
  visibility: "district" | "school";
  lastSyncedAt?: FirestoreDate;
  lastSyncStatus?: "success" | "error";
  lastSyncParsedCount?: number;
  lastSyncCreatedCount?: number;
  lastSyncSkippedCount?: number;
  lastSyncError?: string | null;
}

