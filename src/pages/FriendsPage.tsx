import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, UserCheck, UserX, Users, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import friendsHero from "@/assets/friends-hero.jpg";
import {
  useUserSearchQuery,
  useFriendsListQuery,
  useIncomingRequestsQuery,
  useOutgoingRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptRequestMutation,
  useRejectRequestMutation,
  useCancelRequestMutation,
  useUnfriendMutation,
  useFriendsSocket,
} from "@/lib/api/endpoints/friends";

type Tab = "friends" | "incoming" | "outgoing" | "search";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Real-time updates via WebSocket — auto-refreshes queries when a friend event arrives
  useFriendsSocket();

  const { data: friendsData, isLoading: friendsLoading } = useFriendsListQuery();
  const { data: incomingData, isLoading: incomingLoading } = useIncomingRequestsQuery();
  const { data: outgoingData } = useOutgoingRequestsQuery();
  const { data: searchData, isLoading: searchLoading } = useUserSearchQuery(searchQuery);

  const sendRequest = useSendFriendRequestMutation();
  const acceptRequest = useAcceptRequestMutation();
  const rejectRequest = useRejectRequestMutation();
  const cancelRequest = useCancelRequestMutation();
  const unfriend = useUnfriendMutation();

  const friends = friendsData?.data ?? [];
  const incoming = incomingData?.data ?? [];
  const outgoing = outgoingData?.data ?? [];
  const searchResults = searchData?.data ?? [];

  const tabs: { id: Tab; label: string; count?: number; icon: typeof Users }[] = [
    { id: "friends", label: "Friends", count: friends.length, icon: Users },
    { id: "incoming", label: "Requests", count: incoming.length, icon: UserPlus },
    { id: "outgoing", label: "Sent", count: outgoing.length, icon: Clock },
    { id: "search", label: "Find People", icon: Search },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded overflow-hidden h-36"
      >
        <img src={friendsHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="text-[1.35rem] font-display font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" /> Friends
          </h1>
          <p className="text-[13px] text-white/70 mt-1">Manage your connections and discover people</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded bg-muted/50 border border-accent/15 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-[12px] font-medium transition-all ${
              activeTab === tab.id
                ? "surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-accent/15 text-accent text-[10px] font-semibold px-1.5 py-0.5 rounded min-w-[20px] text-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {activeTab === "friends" && (
        <div className="space-y-2">
          {friendsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="surface rounded border border-border p-4 animate-pulse flex items-center gap-3">
                  <div className="w-11 h-11 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-32" />
                    <div className="h-2 bg-muted rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!friendsLoading && friends.length === 0 && (
            <div className="surface rounded border border-border p-12 text-center">
              <div className="w-16 h-16 rounded bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <p className="text-body font-medium text-foreground">No friends yet</p>
              <p className="text-small text-muted-foreground mt-1">Use "Find People" to connect with others</p>
            </div>
          )}
          {friends.map((friend, i) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="surface rounded border border-border p-4 flex items-center gap-3 hover:shadow-elevated hover:border-accent/15 transition-all"
            >
              <div className="w-11 h-11 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                {(friend.full_name ?? friend.username)?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{friend.full_name ?? friend.username}</p>
                <p className="text-[11px] text-muted-foreground">@{friend.username}</p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/messages/${friend.id}`)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-accent bg-accent/10 hover:bg-accent/20 px-3 py-2 rounded transition-colors mr-1"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={() => unfriend.mutate(friend.id)}
                disabled={unfriend.isPending}
                className="text-[12px] text-muted-foreground hover:text-destructive transition-colors px-2.5 py-2 rounded hover:bg-destructive/5"
              >
                Unfriend
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Incoming Requests */}
      {activeTab === "incoming" && (
        <div className="space-y-2">
          {incomingLoading && (
            <div className="surface rounded border border-border p-4 animate-pulse flex items-center gap-3">
              <div className="w-11 h-11 rounded bg-muted" />
              <div className="flex-1 h-3 bg-muted rounded" />
            </div>
          )}
          {!incomingLoading && incoming.length === 0 && (
            <div className="surface rounded border border-border p-12 text-center">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-body font-medium text-foreground">No incoming requests</p>
              <p className="text-small text-muted-foreground mt-1">When someone sends you a friend request, it will appear here</p>
            </div>
          )}
          {incoming.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="surface rounded border border-border p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                {req.sender_username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{req.sender_username}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest.mutate(req.id)}
                  disabled={acceptRequest.isPending}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-success bg-success/10 hover:bg-success/20 px-3 py-2 rounded transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => rejectRequest.mutate(req.id)}
                  disabled={rejectRequest.isPending}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-destructive px-3 py-2 rounded transition-colors hover:bg-destructive/5"
                >
                  <UserX className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Outgoing Requests */}
      {activeTab === "outgoing" && (
        <div className="space-y-2">
          {outgoing.length === 0 && (
            <div className="surface rounded border border-border p-12 text-center">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-body font-medium text-foreground">No pending sent requests</p>
              <p className="text-small text-muted-foreground mt-1">Requests you send will show up here</p>
            </div>
          )}
          {outgoing.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="surface rounded border border-border p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                {(req.receiver_username ?? req.receiver_id)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground">{req.receiver_username ?? req.receiver_id}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{req.status}</p>
              </div>
              <button
                onClick={() => cancelRequest.mutate(req.id)}
                disabled={cancelRequest.isPending}
                className="text-[12px] text-muted-foreground hover:text-destructive transition-colors px-2.5 py-2 rounded hover:bg-destructive/5"
              >
                Cancel
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search / Find People */}
      {activeTab === "search" && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full h-10 pl-9 pr-3 rounded border border-input bg-surface text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
          </div>

          {searchLoading && searchQuery.length >= 2 && (
            <div className="space-y-2">
              {[1, 2].map((n) => (
                <div key={n} className="surface rounded border border-border p-4 animate-pulse flex items-center gap-3">
                  <div className="w-11 h-11 rounded bg-muted" />
                  <div className="flex-1 h-3 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="surface rounded border border-border p-4 flex items-center gap-3 hover:shadow-elevated transition-all"
                >
                  <div className="w-11 h-11 rounded bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                    {(user.full_name ?? user.username)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{user.full_name ?? user.username}</p>
                    <p className="text-[11px] text-muted-foreground">@{user.username}</p>
                  </div>
                  {user.is_friend ? (
                    <span className="text-[12px] text-success flex items-center gap-1.5 bg-success/10 px-2.5 py-1.5 rounded">
                      <UserCheck className="w-3.5 h-3.5" /> Friends
                    </span>
                  ) : user.pending_request_id ? (
                    <span className="text-[12px] text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => sendRequest.mutate({ receiver_id: user.id })}
                      disabled={sendRequest.isPending}
                      className="flex items-center gap-1.5 text-[12px] font-medium text-accent bg-accent/10 hover:bg-accent/20 px-3 py-2 rounded transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="surface rounded border border-border p-8 text-center">
              <p className="text-body text-muted-foreground">No users found for "{searchQuery}"</p>
            </div>
          )}

          {searchQuery.length < 2 && (
            <div className="surface rounded border border-border p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-body text-muted-foreground">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
