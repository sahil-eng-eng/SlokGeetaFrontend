import { useState, useCallback } from "react";
import { MeaningNode, ReactionType } from "@/types/sloka";
import { ChevronRight, ChevronDown, Plus, ThumbsUp, User, Clock, Shield, AlertCircle, History, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";
import {
  useEntityPermissionsQuery,
  useSetEntityPermissionMutation,
  useRevokeEntityPermissionMutation,
} from "@/lib/api/endpoints/entityPermissions";
import { useUpdateMeaningMutation } from "@/lib/api/endpoints/meanings";
import type { SharedUserPermission, PermissionLevel } from "@/types";

interface MeaningTreeProps {
  nodes: MeaningNode[];
  depth?: number;
  canAddMeaning?: boolean;
  onAddChild?: (node: { id: string; text: string }) => void;
  onViewHistory?: (node: MeaningNode) => void;
  onEdit?: (node: MeaningNode) => void;
}

const statusConfig = {
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const reactionEmoji: Record<ReactionType, string> = {
  agree: "👍",
  insightful: "💡",
  disagree: "👎",
};

export function MeaningTree({ nodes, depth = 0, canAddMeaning, onAddChild, onViewHistory, onEdit }: MeaningTreeProps) {
  return (
    <div className={cn("space-y-1.5", depth > 0 && "ml-6 relative")}>
      {depth > 0 && (
        <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-border" />
      )}
      {nodes.map((node) => (
        <MeaningTreeNode key={node.id} node={node} depth={depth} canAddMeaning={canAddMeaning} onAddChild={onAddChild} onViewHistory={onViewHistory} onEdit={onEdit} />
      ))}
    </div>
  );
}

/**
 * Rendered ONLY when node.isOwner === true.
 * Keeps the entity-permissions hooks away from non-owner nodes (avoids 403s).
 */
function MeaningVisibilityControl({ nodeId, shlokId, initialVisibility }: { nodeId: string; shlokId: string; initialVisibility: string }) {
  const queryClient = useQueryClient();
  const [visibility, setVisibility] = useState<Visibility>(
    initialVisibility === "specific_users" ? "shared" : (initialVisibility as Visibility) ?? "private"
  );

  const updateMutation = useUpdateMeaningMutation(shlokId);
  const permsQuery = useEntityPermissionsQuery("meaning", nodeId);
  const setMeaningPerm = useSetEntityPermissionMutation("meaning", nodeId);
  const revokeMeaningPerm = useRevokeEntityPermissionMutation("meaning", nodeId);

  const sharedUsers: SharedUserPermission[] = (permsQuery.data?.data ?? [])
    .filter((p) => !p.is_structural && !p.is_hidden)
    .map((p) => ({ user_id: p.user_id, permission_level: (p.permission_level || "view") as PermissionLevel }));

  /** Refetch meaning tree + all permissions after a share/revoke */
  const refetchAfterPermChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(shlokId) });
    queryClient.invalidateQueries({ queryKey: ["permissions"] });
  }, [queryClient, shlokId]);

  const handleVisibilityChange = (v: Visibility) => {
    const prevVisibility = visibility;
    const apiVis = v === "shared" ? "specific_users" : v;
    updateMutation.mutate(
      { meaningId: nodeId, data: { visibility: apiVis } },
      {
        onSuccess: () => setVisibility(v),
        onError: (error: any) => {
          setVisibility(prevVisibility);
          const message = error?.response?.data?.message || error?.message || "Failed to update visibility";
          toast.error(message);
        },
      }
    );
  };

  const handleSharedUsersChange = useCallback((newUsers: SharedUserPermission[]) => {
    const prevIds = sharedUsers.map((u) => u.user_id);
    const newIds = newUsers.map((u) => u.user_id);
    const added = newUsers.filter((u) => !prevIds.includes(u.user_id));
    const removed = prevIds.filter((id) => !newIds.includes(id));
    const levelChanged = newUsers.filter((u) => {
      const prev = sharedUsers.find((p) => p.user_id === u.user_id);
      return prev && prev.permission_level !== u.permission_level;
    });
    const onErr = (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to update permissions";
      toast.error(message);
    };
    [...added, ...levelChanged].forEach((u) =>
      setMeaningPerm.mutate(
        { user_id: u.user_id, permission_level: u.permission_level },
        { onSuccess: refetchAfterPermChange, onError: onErr }
      )
    );
    removed.forEach((uid) =>
      revokeMeaningPerm.mutate(uid, { onSuccess: refetchAfterPermChange, onError: onErr })
    );
  }, [sharedUsers, setMeaningPerm, revokeMeaningPerm, refetchAfterPermChange]);

  return (
    <VisibilitySelector
      value={visibility}
      onChange={handleVisibilityChange}
      compact
      sharedUsers={sharedUsers}
      onSharedUsersChange={handleSharedUsersChange}
    />
  );
}

function MeaningTreeNode({ node, depth, canAddMeaning, onAddChild, onViewHistory, onEdit }: { node: MeaningNode; depth: number; canAddMeaning?: boolean; onAddChild?: (node: { id: string; text: string }) => void; onViewHistory?: (node: MeaningNode) => void; onEdit?: (node: MeaningNode) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [reactions, setReactions] = useState(node.reactions);
  const hasChildren = node.children.length > 0;
  const status = statusConfig[node.status];

  const toggleReaction = (type: ReactionType) => {
    setReactions(prev => prev.map(r => {
      if (r.type === type) {
        return { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 };
      }
      return r;
    }));
  };

  return (
    <div className="relative">
      {depth > 0 && (
        <div className="absolute left-[-16px] top-[18px] w-3 h-px bg-border" />
      )}
      <div className={cn(
        "group rounded-lg border p-3 surface transition-all hover:shadow-surface",
        node.status === "pending"
          ? "border-warning/30 bg-warning/[0.02]"
          : "border-border/60 hover:border-accent/20"
      )}>
        <div className="flex items-start gap-2">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-4.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-body text-foreground leading-relaxed">{node.text}</p>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-small text-muted-foreground">
                <User className="w-3 h-3" />
                {node.author}
                {node.authorReputation && (
                  <span className="inline-flex items-center gap-0.5 text-accent">
                    <Star className="w-2.5 h-2.5" />
                    {node.authorReputation}
                  </span>
                )}
              </span>
              {node.isOwner && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-accent px-1.5 py-0.5 rounded-full bg-accent/10">
                  <Shield className="w-2.5 h-2.5" /> Owner
                </span>
              )}
              <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border", status.className)}>
                {node.status === "pending" && <AlertCircle className="w-2.5 h-2.5" />}
                {status.label}
              </span>
            {node.isOwner && (
                <MeaningVisibilityControl nodeId={node.id} shlokId={node.shlokId} initialVisibility={node.visibility} />
              )}
              <span className="inline-flex items-center gap-1 text-small text-muted-foreground">
                <ThumbsUp className="w-3 h-3" />
                {node.votes}
              </span>
              <span className="inline-flex items-center gap-1 text-small text-muted-foreground">
                <Clock className="w-3 h-3" />
                {node.createdAt}
              </span>
            </div>

            {/* Reactions - Interactive */}
            <div className="flex items-center gap-1.5 mt-2">
              {reactions.map((r) => (
                <button
                  key={r.type}
                  onClick={() => toggleReaction(r.type)}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all duration-200 hover:scale-105 active:scale-95",
                    r.reacted
                      ? "border-accent/30 bg-accent/10 text-accent shadow-sm"
                      : "border-border text-muted-foreground hover:border-accent/20 hover:text-foreground"
                  )}
                >
                  {reactionEmoji[r.type]} {r.count > 0 ? r.count : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            {/* Show Edit button for owners AND for users with explicit permissions (Bug 2/5) */}
            {(node.isOwner || (node.myPermission && node.myPermission !== "view")) && (
              <button
                onClick={() => onEdit?.(node)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title={node.myPermission === "request_edit" ? "Suggest edit" : "Edit meaning"}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {node.versions.length > 0 && (
              <button
                onClick={() => onViewHistory?.(node)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="View history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}
            {canAddMeaning && (
              <button
                onClick={() => onAddChild?.({ id: node.id, text: node.text })}
                className="p-1 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                title="Add meaning"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5">
              <MeaningTree nodes={node.children} depth={depth + 1} canAddMeaning={canAddMeaning} onAddChild={onAddChild} onViewHistory={onViewHistory} onEdit={onEdit} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
