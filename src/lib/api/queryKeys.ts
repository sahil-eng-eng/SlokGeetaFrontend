export const QUERY_KEYS = {
  AUTH_ME: ["auth", "me"],
  BOOKS_MY: ["books", "my"],
  BOOKS_PUBLIC: ["books", "public"],
  BOOK_DETAIL: (id: string) => ["books", "detail", id],
  SHLOKS_BY_BOOK: (bookId: string) => ["shloks", "book", bookId],
  SHLOK_DETAIL: (id: string) => ["shloks", "detail", id],
  SHLOK_RELATED: (id: string) => ["shloks", "related", id],
  SHLOK_CROSS_REFS: (id: string) => ["shloks", "cross-references", id],
  MEANINGS_BY_SHLOK: (shlokId: string) => ["meanings", "shlok", shlokId],
  // Friends
  FRIENDS_LIST: ["friends", "list"],
  FRIENDS_REQUESTS_INCOMING: ["friends", "requests", "incoming"],
  FRIENDS_REQUESTS_OUTGOING: ["friends", "requests", "outgoing"],
  USERS_SEARCH: (q: string) => ["users", "search", q],
  // Chat
  CHAT_CONVERSATIONS: ["chat", "conversations"],
  CHAT_MESSAGES: (partnerId: string) => ["chat", "messages", partnerId],
  // Links
  LINKS_MY: ["links", "my"],
  // Content Requests
  CONTENT_REQUESTS_INCOMING: ["requests", "incoming"],
  CONTENT_REQUESTS_OUTGOING: ["requests", "outgoing"],
  CONTENT_REQUESTS_PENDING_COUNT: ["requests", "pending-count"],
  // Discover
  DISCOVER_BOOKS: (page: number) => ["discover", "books", page],
  DISCOVER_SHLOKS: (page: number) => ["discover", "shloks", page],
  // Kirtan Library
  KIRTAN_TRACKS: ["kirtan", "tracks"],
  // NaamJap
  NAAM_JAP_TARGET: ["naam-jap", "target"],
  NAAM_JAP_TODAY: ["naam-jap", "today"],
  NAAM_JAP_HISTORY: ["naam-jap", "history"],
  // Schedule
  SCHEDULE_VERSIONS: ["schedule", "versions"],
  SCHEDULE_ACTIVE: ["schedule", "versions", "active"],
  SCHEDULE_CHECKINS: ["schedule", "checkins"],
  SCHEDULE_TODAY_CHECKIN: ["schedule", "checkins", "today"],
  // Entity permissions + shared
  ENTITY_PERMISSIONS: (type: string, id: string) => ["permissions", type, id],
  PERMISSIONS_MINE: ["permissions", "mine"],
  BOOKS_SHARED_WITH_ME: ["books", "shared-with-me"],
  // Groups
  GROUPS_LIST: ["groups", "list"],
  GROUP_MESSAGES: (groupId: string) => ["groups", "messages", groupId],
} as const;
