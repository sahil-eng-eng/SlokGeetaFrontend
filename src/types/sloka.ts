export type ApprovalStatus = "approved" | "pending" | "rejected";
export type Visibility = "public" | "private" | "shared";
export type ReactionType = "agree" | "insightful" | "disagree";

export interface MeaningReaction {
  type: ReactionType;
  count: number;
  reacted: boolean;
}

export interface MeaningVersion {
  id: string;
  text: string;
  editedAt: string;
  editedBy: string;
}

export interface MeaningNode {
  id: string;
  shlokId: string;
  text: string;
  author: string;
  authorReputation?: number;
  votes: number;
  createdAt: string;
  status: ApprovalStatus;
  isOwner: boolean;
  visibility: Visibility;
  /** Viewer's permission level when they're not the owner (null = owner or public) */
  myPermission?: string | null;
  reactions: MeaningReaction[];
  versions: MeaningVersion[];
  children: MeaningNode[];
}

export interface Sloka {
  id: string;
  title: string;
  text: string;
  bookId: string;
  order: number;
  visibility: Visibility;
  meanings: MeaningNode[];
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  slokaCount: number;
  visibility: Visibility;
  followers?: number;
  sharedBy?: string;
  sharedAt?: string;
}

export type MeaningFilter = "most-voted" | "newest" | "most-relevant" | "by-user";
