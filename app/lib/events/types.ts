import type {
  EventDocument,
  EventVisibility,
  UserProfileDocument,
} from "../firestore/types";

export type UserProfile = Partial<UserProfileDocument>;

export type FeedEvent = Partial<EventDocument> & {
  id: string;
  visibility?: EventVisibility;
  recommendationReason?: string;
};

export type { EventVisibility };
