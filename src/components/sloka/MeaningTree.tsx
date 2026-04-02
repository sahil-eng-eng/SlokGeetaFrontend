import { useState, useCallback } from "react";
import { MeaningNode, ReactionType } from "@/types/sloka";
import { ChevronRight, ChevronDown, Reply, ThumbsUp, Shield, AlertCircle, History, Star, PenLine } from "lucide-react";
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function MeaningTree({ nodes, depth = 0, canAddMeaning, onAddChild, onViewHistory, onEdit }: MeaningTreeProps) {
  return (
    <div className={cn("space-y-2", depth > 0 && "mt-2 ml-5")}>
      {nodes.map((node, idx) => {
        const isLast = idx === nodes.length - 1;
        return (
          <div key={node.id} className="relative">
            {/* Tree branch connectors for non-root nodes */}
            {depth > 0 && (
              <>
                {/* Vertical trunk line — bridges gap to next sibling, or stops at arm for last child */}
                <div
                  className={cn(
                    "absolute left-[-12px] w-0.5 bg-accent/30",
                    isLast ? "top-0 h-5" : "top-0 bottom-[-8px]"
                  )}
                />
                {/* Horizontal arm pointing to card */}
                <div className="absolute left-[-12px] top-5 w-3 h-0.5 bg-accent/30" />
              </>
            )}
            <MeaningTreeNode
              node={node}
              depth={depth}
              canAddMeaning={canAddMeaning}
              onAddChild={onAddChild}
              onViewHistory={onViewHistory}
              onEdit={onEdit}
            />
          </div>
        );
      })}
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

  const hue = (node.author || "?").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const authorInitial = (node.author || "?").charAt(0).toUpperCase();

  const toggleReaction = (type: ReactionType) => {
    setReactions(prev => prev.map(r =>
      r.type === type ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 } : r
    ));
  };

  return (
    <div>
      {/* Card */}
      <div className={cn(
        "group/card surface rounded border transition-all",
        depth === 0
          ? "border-l-2 border-accent/35 hover:border-accent/50 hover:shadow-elevated"
          : "border-accent/10 hover:border-accent/20 hover:shadow-surface",
        node.status === "pending" && "border-warning/20 bg-warning/[0.015]"
      )}>
        <div className="p-3">
          {/* Top row: avatar + content | right actions */}
          <div className="flex items-start gap-2.5">
            {/* Author avatar — square with small radius */}
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
              style={{ background: `hsl(${hue} 40% 85%)`, color: `hsl(${hue} 55% 30%)` }}
            >
              {authorInitial}
            </div>

            {/* Center: author row + text + footer */}
            <div className="flex-1 min-w-0">
              {/* Author + badges + date — no ml-auto, no right-side actions here */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[12px] font-semibold text-foreground">{node.author}</span>
                {node.authorReputation && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-accent">
                    <Star className="w-2.5 h-2.5" />{node.authorReputation}
                  </span>
                )}
                {node.isOwner && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-accent px-1 py-px rounded border border-accent/20 bg-accent/5">
                    <Shield className="w-2.5 h-2.5" /> Owner
                  </span>
                )}
                {node.status !== "approved" && (
                  <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1 py-px rounded border", status.className)}>
                    {node.status === "pending" && <AlertCircle className="w-2.5 h-2.5" />}
                    {status.label}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/60">{formatDate(node.createdAt)}</span>
              </div>

              {/* Meaning text */}
              <p className="mt-1 text-[13px] text-foreground leading-relaxed">{node.text}</p>

              {/* Footer: reactions, votes, reply, expand */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {/* Emoji reactions */}
                {reactions.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => toggleReaction(r.type)}
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] px-1.5 py-px rounded transition-all hover:scale-105 active:scale-95",
                      r.reacted
                        ? "bg-accent/10 text-accent"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {reactionEmoji[r.type]}{r.count > 0 ? <span className="ml-0.5">{r.count}</span> : null}
                  </button>
                ))}

                <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <ThumbsUp className="w-3 h-3" /> {node.votes}
                </span>

                {/* Reply button — always accented */}
                {canAddMeaning && (
                  <button
                    onClick={() => onAddChild?.({ id: node.id, text: node.text })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent/80 hover:text-accent bg-accent/5 hover:bg-accent/10 px-2 py-0.5 rounded transition-colors"
                  >
                    <Reply className="w-3 h-3" /> Reply
                  </button>
                )}

                {/* Expand/collapse replies */}
                {hasChildren && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-medium transition-colors",
                      !canAddMeaning && "ml-auto",
                      expanded ? "text-accent" : "text-muted-foreground hover:text-accent"
                    )}
                  >
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {node.children.length} {node.children.length === 1 ? "reply" : "replies"}
                  </button>
                )}
              </div>
            </div>

            {/* Right column: visibility badge + edit/history on hover — sits flush next to content, no ml-auto gap */}
            <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
              {node.isOwner && (
                <MeaningVisibilityControl nodeId={node.id} shlokId={node.shlokId} initialVisibility={node.visibility} />
              )}
              <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                {(node.isOwner || (node.myPermission && node.myPermission !== "view")) && (
                  <button
                    onClick={() => onEdit?.(node)}
                    className="p-1 rounded text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                    title={node.myPermission === "request_edit" ? "Suggest edit" : "Edit"}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                )}
                {node.versions.length > 0 && (
                  <button
                    onClick={() => onViewHistory?.(node)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children tree */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <MeaningTree nodes={node.children} depth={depth + 1} canAddMeaning={canAddMeaning} onAddChild={onAddChild} onViewHistory={onViewHistory} onEdit={onEdit} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
