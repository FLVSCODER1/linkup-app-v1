import type { Timestamp } from "firebase/firestore";

export type FirestoreDate = Timestamp | Date | string | null;

export type GradeLevel = "9" | "10" | "11" | "12";

export interface UserProfileDocument {
  uid: string;
  email: string;
  firstName: string;
  lastInitial: string;
  displayName: string;
  bio: string;
  grade: GradeLevel;
  interests: string[];
  district: string | null;
  districtId?: string | null;
  school: string | null;
  schoolId?: string | null;
  profileComplete: boolean;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface PrivateUserProfileDocument {
  uid: string;
  lastName: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface DistrictDirectoryDocument {
  active: boolean;
  name: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface SchoolDomainDirectoryDocument {
  active: boolean;
  districtId: string;
  schoolId: string | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface SchoolDirectoryDocument {
  active: boolean;
  districtId: string;
  name: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export type SchoolRequestStatus = "pending" | "approved" | "rejected";

export interface SchoolRequestDocument {
  domain: string;
  schoolName: string;
  city: string;
  state: string;
  districtName: string | null;
  officialWebsite: string;
  calendarUrl: string | null;
  status: SchoolRequestStatus;
  requestCount: number;
  requestedAt: FirestoreDate;
  lastRequestedAt: FirestoreDate;
  reviewedAt: FirestoreDate;
  reviewedBy: string | null;
  rejectionReason: string | null;
  approvedDistrictId?: string | null;
  approvedSchoolId?: string | null;
  approvedDomainScope?: "school" | "district";
}

export interface SchoolRequesterDocument {
  email: string;
  requestedAt: FirestoreDate;
}

export type AccountVerificationStatus = "pending" | "approved" | "rejected";
export type ManualReviewMethod =
  | "official_roster"
  | "in_person"
  | "school_staff_confirmation";

export interface AccountVerificationDocument {
  uid: string;
  email: string;
  emailDomain: string;
  districtId: string;
  district: string;
  schoolId: string;
  school: string;
  status: AccountVerificationStatus;
  requestedAt: FirestoreDate;
  reviewedAt: FirestoreDate;
  reviewedBy: string | null;
  reviewMethod: ManualReviewMethod | null;
  rejectionReason: string | null;
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
  coverImagePath?: string | null;
  capacity?: number | null;
  rsvpDeadline?: FirestoreDate;
  startTime: FirestoreDate;
  endTime: FirestoreDate;
  createdBy: string;
  hostName?: string;
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

export interface SavedEventDocument {
  uid: string;
  eventId: string;
  savedAt: FirestoreDate;
}

export interface InterestDocument {
  fromUserId: string;
  toUserId: string;
  eventId: string;
  createdAt: FirestoreDate;
}

export interface CalendarSourceDocument {
  active: boolean;
  districtId?: string;
  district: string;
  schoolId?: string;
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
  approvedAt?: FirestoreDate;
  approvedBy?: string;
  requestId?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

export type CalendarImportRequestStatus = "pending" | "approved" | "rejected";

export interface CalendarImportRequestDocument {
  requestedBy: string;
  requesterEmail: string;
  districtId: string;
  district: string;
  schoolId: string;
  school: string;
  sourceUrl: string;
  visibility: "school";
  status: CalendarImportRequestStatus;
  requestedAt: FirestoreDate;
  reviewedAt: FirestoreDate;
  reviewedBy: string | null;
  rejectionReason: string | null;
  calendarSourceId: string | null;
}
