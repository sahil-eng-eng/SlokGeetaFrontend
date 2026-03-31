// ── API Wrapper ────────────────────────────────────────────

export interface ApiResponse<T = null> {
  status_code: number;
  message: string;
  data: T;
}

export interface ApiError {
  status_code: number;
  message: string;
  data: null;
}

// ── Auth ───────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  auth_provider: string;
  last_seen_at: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ── Books ──────────────────────────────────────────────────

export interface CreateBookRequest {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  source?: string;
  author_name?: string;
  visibility?: "public" | "private" | "specific_users";
}

export interface UpdateBookRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  source?: string;
  author_name?: string;
  visibility?: "public" | "private" | "specific_users";
}

export interface BookResponse {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: string | null;
  tags: string[];
  source: string | null;
  author_name: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface BookListResponse {
  items: BookResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

// ── Shloks ─────────────────────────────────────────────────

export interface CreateShlokRequest {
  book_id: string;
  content: string;
  chapter_number?: number;
  verse_number?: number;
  tags?: string[];
  visibility?: "public" | "private" | "specific_users";
  scheduled_at?: string;
}

export interface UpdateShlokRequest {
  content?: string;
  chapter_number?: number;
  verse_number?: number;
  tags?: string[];
  visibility?: "public" | "private" | "specific_users";
  scheduled_at?: string;
}

export interface ShlokResponse {
  id: string;
  book_id: string;
  owner_id: string;
  content: string;
  chapter_number: number | null;
  verse_number: number | null;
  tags: string[];
  audio_url: string | null;
  visibility: string;
  scheduled_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  /** Viewer's permission level on this shlok (null for owner or public access) */
  my_permission?: string | null;
}

export interface ShlokListResponse {
  items: ShlokResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CrossReferenceRequest {
  target_shlok_id: string;
  note?: string;
}

export interface CrossReferenceResponse {
  id: string;
  source_shlok_id: string;
  target_shlok_id: string;
  note: string | null;
  created_at: string;
}

// ── Meanings ──────────────────────────────────────────────

export interface CreateMeaningRequest {
  content: string;
  parent_id?: string;
}

export interface InsertMeaningAboveRequest {
  content: string;
  target_meaning_id: string;
}

export interface UpdateMeaningRequest {
  content?: string;
  visibility?: string;
}

export interface VoteMeaningRequest {
  direction: 1 | -1;
}

export interface MeaningReaction {
  type: "agree" | "insightful" | "disagree";
  count: number;
  reacted: boolean;
}

export interface MeaningVersion {
  id: string;
  text: string;
  editedAt: string;
  editedBy: string;
}

export interface MeaningResponse {
  id: string;
  shlok_id: string;
  parent_id: string | null;
  author_id: string;
  text: string;
  author: string;
  author_reputation: number | null;
  votes: number;
  created_at: string;
  status: "approved" | "pending" | "rejected";
  is_owner: boolean;
  visibility: string;
  /** Viewer's permission level on this meaning (null for author or public access) */
  my_permission?: string | null;
  reactions: MeaningReaction[];
  versions: MeaningVersion[];
  children: MeaningResponse[];
}

export interface MeaningListResponse {
  items: MeaningResponse[];
}

// ── Friends ────────────────────────────────────────────────

export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_friend: boolean;
  pending_request_id: string | null;
}

export interface SendFriendRequestRequest {
  receiver_id: string;
}

export interface FriendRequestResponse {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_username: string;
  sender_avatar: string | null;
  receiver_username: string | null;
  status: FriendRequestStatus;
  created_at: string;
}

export interface FriendResponse {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// ── Chat ───────────────────────────────────────────────────

export type MessageStatus = "sent" | "delivered" | "seen";

export interface SendMessageRequest {
  content: string;
}

export interface MessageResponse {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  is_deleted?: boolean;
  edited_at?: string | null;
}

export interface MessageListResponse {
  items: MessageResponse[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface ConversationPreview {
  friend_id: string;
  friend_username: string;
  friend_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// ── Shared Links ───────────────────────────────────────────

export type LinkTargetType = "book" | "shlok" | "meaning";

export interface GenerateLinkRequest {
  target_type: LinkTargetType;
  target_id: string;
  expires_at?: string | null;
}

export interface SharedLinkResponse {
  id: string;
  short_code: string;
  target_type: LinkTargetType;
  target_id: string;
  creator_id: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ResolvedLinkResponse {
  short_code: string;
  target_type: LinkTargetType;
  target_id: string;
  creator_id: string;
  expires_at: string | null;
}

// ── Content Requests ───────────────────────────────────────

export type ContentAction = "view" | "add_shlok" | "add_meaning" | "edit" | "delete";
export type ContentRequestStatus = "pending" | "approved" | "rejected";

export interface CreateContentRequestRequest {
  entity_type: "book" | "shlok" | "meaning";
  entity_id: string;
  action: ContentAction;
  proposed_content?: Record<string, unknown>;
}

export interface ReviewContentRequestRequest {
  status: "approved" | "rejected";
  reviewer_note?: string;
}

export interface ContentRequestResponse {
  id: string;
  requester_id: string;
  requester_username: string;
  entity_type: string;
  entity_id: string;
  action: ContentAction;
  proposed_content: Record<string, unknown> | null;
  status: ContentRequestStatus;
  reviewer_id: string | null;
  reviewer_note: string | null;
  created_at: string;
  context_breadcrumb?: string[] | null;
  current_content?: string | null;
}

// ── Discover ───────────────────────────────────────────────

export interface DiscoverBook {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  author_name: string | null;
  cover_image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface DiscoverShlok {
  id: string;
  content: string;
  book_id: string;
  owner_id: string;
  chapter_number: number | null;
  verse_number: number | null;
  tags: string[];
  created_at: string;
}

export interface DiscoverListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── Kirtan Library ─────────────────────────────────────────

export type KirtanCategory = "bhajan" | "aarti" | "kirtan" | "dhun" | "stuti" | "other";

export interface KirtanTrackResponse {
  id: string;
  owner_id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration_seconds: number | null;
  category: KirtanCategory;
  audio_url: string | null;
  external_link: string | null;
  cover_url: string | null;
  is_favorite: boolean;
}

export interface CreateKirtanTrackRequest {
  title: string;
  artist?: string | null;
  album?: string | null;
  duration_seconds?: number | null;
  category?: KirtanCategory;
  audio_url?: string | null;
  external_link?: string | null;
  cover_url?: string | null;
}

// ── NaamJap ────────────────────────────────────────────────

export interface NaamTargetResponse {
  id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  total_goal: number;
}

export interface SetNaamTargetRequest {
  start_date: string;
  end_date: string;
  total_goal: number;
}

export interface JapEntryResponse {
  id: string;
  owner_id: string;
  entry_date: string;
  time_slot: string;
  count: number;
}

export interface CreateJapEntryRequest {
  entry_date: string;
  time_slot: string;
  count: number;
}

export interface DayLogResponse {
  date: string;
  entries: JapEntryResponse[];
  total: number;
}

// ── Schedule ───────────────────────────────────────────────

export interface ScheduleItemType {
  id: string;
  time?: string;        // legacy
  start_time?: string;  // new: HH:MM (24h)
  end_time?: string;    // new: HH:MM (24h)
  activity: string;
}

export interface ScheduleVersionResponse {
  id: string;
  items: ScheduleItemType[];
  applies_to: string[];
  reward: string | null;
  reward_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateScheduleVersionRequest {
  items: ScheduleItemType[];
  applies_to: string[];
  reward?: string;
  reward_days?: number;
}

export interface UpdateScheduleVersionRequest {
  items: ScheduleItemType[];
  applies_to: string[];
  reward?: string | null;
  reward_days?: number | null;
}

export interface CheckInItemType {
  id: string;
  activity: string;
  done: boolean;
}

export interface CheckInResponse {
  id: string;
  version_id: string | null;
  check_in_date: string;
  items: CheckInItemType[];
  alignment: number;
  created_at: string;
}

export interface CreateCheckInRequest {
  version_id: string;
  items: CheckInItemType[];
}

// ── Groups ─────────────────────────────────────────────────────────────────

export type GroupRole = "owner" | "co_admin" | "member";

export interface GroupMemberResponse {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: GroupRole;
  is_admin: boolean;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  avatar_url: string | null;
  member_count: number;
  members: GroupMemberResponse[];
  created_at: string;
}

export interface GroupMessageResponse {
  id: string;
  group_id: string;
  sender_id: string;
  sender_username: string;
  sender_display_name: string | null;
  content: string;
  is_deleted?: boolean;
  edited_at?: string | null;
  created_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  member_ids?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
}

export interface UpdateMemberRoleRequest {
  role: "co_admin" | "member";
}

export interface SendGroupMessageRequest {
  content: string;
}

export interface EditGroupMessageRequest {
  content: string;
}

export interface AddGroupMembersRequest {
  user_ids: string[];
}

// ── Entity Permissions ─────────────────────────────────────────────────────

export type EntityType = "book" | "shlok" | "meaning";

/** What the recipient can do with a shared entity. */
export type PermissionLevel = "view" | "request_edit" | "direct_edit";

/** A user paired with their permission level — used in sharing UI. */
export interface SharedUserPermission {
  user_id: string;
  permission_level: PermissionLevel;
}

export interface SetEntityPermissionRequest {
  user_id: string;
  permission_level: PermissionLevel;
  is_hidden?: boolean;
}

export interface EntityPermissionResponse {
  id: string;
  user_id: string;
  username: string;
  entity_type: EntityType;
  entity_id: string;
  permission_level: string;
  is_structural: boolean;
  is_hidden: boolean;
}
