import { useState } from "react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, UserPlus, Users, Eye, GitPullRequest, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFriendsListQuery } from "@/lib/api/endpoints/friends";
import type { PermissionLevel, SharedUserPermission } from "@/types";

export interface PickableUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isFriend?: boolean;
}

const PERMISSION_OPTIONS: { value: PermissionLevel; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "view", label: "View only", desc: "Can read content", icon: Eye },
  { value: "request_edit", label: "Request edit", desc: "Can propose changes (needs approval)", icon: GitPullRequest },
  { value: "direct_edit", label: "Direct edit", desc: "Changes apply immediately", icon: Pencil },
];

interface UserPickerProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: SharedUserPermission[];
  onSelectionChange: (users: SharedUserPermission[]) => void;
}

export function UserPicker({ open, onClose, selectedUsers, onSelectionChange }: UserPickerProps) {
  const [search, setSearch] = useState("");
  // Internal state: map of userId → permission level
  const [localSelected, setLocalSelected] = useState<Map<string, PermissionLevel>>(new Map());
  const { data: friendsData, isLoading } = useFriendsListQuery();

  // Sync local state when the modal opens
  React.useEffect(() => {
    if (open) {
      const map = new Map<string, PermissionLevel>();
      selectedUsers.forEach((u) => map.set(u.user_id, u.permission_level));
      setLocalSelected(map);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const allUsers: PickableUser[] = (friendsData?.data ?? []).map((f) => ({
    id: f.id,
    name: f.full_name ?? f.username,
    email: `@${f.username}`,
    avatar: f.avatar_url ?? undefined,
    isFriend: true,
  }));

  const filtered = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const friends = filtered.filter((u) => u.isFriend);

  const toggleUser = (id: string) => {
    setLocalSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, "view"); // default permission when first selected
      }
      return next;
    });
  };

  const setPermission = (id: string, level: PermissionLevel) => {
    setLocalSelected((prev) => {
      const next = new Map(prev);
      next.set(id, level);
      return next;
    });
  };

  const handleDone = () => {
    const result: SharedUserPermission[] = Array.from(localSelected.entries()).map(
      ([user_id, permission_level]) => ({ user_id, permission_level })
    );
    onSelectionChange(result);
    onClose();
  };

  const selectedCount = localSelected.size;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface w-full max-w-md rounded-xl shadow-modal border border-border/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-heading text-foreground">Share with Users</h2>
                  <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or username..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* Selected count */}
              {selectedCount > 0 && (
                <div className="px-5 pb-2">
                  <span className="text-[11px] font-medium text-accent">{selectedCount} user{selectedCount !== 1 ? "s" : ""} selected</span>
                </div>
              )}

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto px-3 pb-3">
                {isLoading && (
                  <div className="space-y-1">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 bg-muted rounded w-24" />
                          <div className="h-2 bg-muted rounded w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && friends.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                      <UserPlus className="w-3 h-3" /> Friends
                    </p>
                    {friends.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        selectedLevel={localSelected.get(user.id) ?? null}
                        onToggle={() => toggleUser(user.id)}
                        onPermissionChange={(lvl) => setPermission(user.id, lvl)}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && filtered.length === 0 && (
                  <div className="py-8 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-body text-muted-foreground">{allUsers.length === 0 ? "No friends yet" : "No users found"}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
                <button onClick={onClose} className="h-9 px-4 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={handleDone} className="h-9 px-4 rounded-md text-[13px] font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
                  Done ({selectedCount})
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

interface UserRowProps {
  user: PickableUser;
  selectedLevel: PermissionLevel | null;
  onToggle: () => void;
  onPermissionChange: (level: PermissionLevel) => void;
}

function UserRow({ user, selectedLevel, onToggle, onPermissionChange }: UserRowProps) {
  const isSelected = selectedLevel !== null;
  const currentPerm = PERMISSION_OPTIONS.find((o) => o.value === selectedLevel);

  return (
    <div className={cn("rounded-lg transition-all mb-0.5", isSelected ? "bg-accent/5" : "hover:bg-muted/30")}>
      {/* User row — click to toggle selection */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-2.5 py-2.5"
      >
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">
          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-body font-medium text-foreground truncate">{user.name}</p>
            {user.isFriend && (
              <span className="text-[9px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                Friend
              </span>
            )}
          </div>
          <p className="text-small text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          isSelected ? "border-accent bg-accent" : "border-border"
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </button>

      {/* Permission selector — only visible when the user is selected */}
      {isSelected && (
        <div className="px-2.5 pb-2.5 pl-[52px]">
          <div className="flex flex-wrap gap-1">
            {PERMISSION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selectedLevel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.desc}
                  onClick={(e) => { e.stopPropagation(); onPermissionChange(opt.value); }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all",
                    active
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {currentPerm && (
            <p className="text-[10px] text-muted-foreground mt-1">{currentPerm.desc}</p>
          )}
        </div>
      )}
    </div>
  );
}

