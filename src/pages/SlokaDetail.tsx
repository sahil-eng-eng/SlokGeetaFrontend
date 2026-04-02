import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, ChevronRight, ScrollText, X, History, RotateCcw, Pencil,
} from "lucide-react";
import { MeaningTree } from "@/components/sloka/MeaningTree";
import { MeaningFilterBar } from "@/components/sloka/MeaningFilter";
import { AddMeaningModal, MeaningPosition } from "@/components/sloka/AddMeaningModal";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/queryKeys";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { MeaningFilter, MeaningNode, Visibility } from "@/types/sloka";
import { useShlokDetailQuery, useUpdateShlokMutation } from "@/lib/api/endpoints/shloks";
import { useBookDetailQuery } from "@/lib/api/endpoints/books";
import {
  useMeaningsQuery,
  useCreateMeaningMutation,
  useInsertMeaningAboveMutation,
  useInsertMeaningBelowMutation,
  useUpdateMeaningMutation,
} from "@/lib/api/endpoints/meanings";
import {
  useEntityPermissionsQuery,
  useSetEntityPermissionMutation,
  useRevokeEntityPermissionMutation,
} from "@/lib/api/endpoints/entityPermissions";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";
import { useCreateContentRequestMutation } from "@/lib/api/endpoints/contentRequests";
import type { MeaningResponse, SharedUserPermission, PermissionLevel } from "@/types";

function toMeaningNode(m: MeaningResponse): MeaningNode {
  return {
    id: m.id,
    shlokId: m.shlok_id,
    text: m.text,
    author: m.author,
    authorReputation: m.author_reputation ?? undefined,
    votes: m.votes,
    createdAt: m.created_at,
    status: m.status,
    isOwner: m.is_owner,
    visibility: m.visibility === "specific_users" ? "shared" : (m.visibility as Visibility) ?? "private",
    myPermission: m.my_permission ?? null,
    reactions: m.reactions,
    versions: m.versions,
    children: m.children.map(toMeaningNode),
  };
}

function findNode(nodes: MeaningNode[], id: string): MeaningNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function sortMeanings(nodes: MeaningNode[], filter: MeaningFilter): MeaningNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (filter === "most-voted") return b.votes - a.votes;
    if (filter === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.votes - a.votes;
  });
  return sorted.map((n) => ({ ...n, children: sortMeanings(n.children, filter) }));
}

export default function SlokaDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<MeaningFilter>("most-voted");
  const [meaningModalOpen, setMeaningModalOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<{ id: string; text: string } | null>(null);
  const [historyNode, setHistoryNode] = useState<MeaningNode | null>(null);
  const [editNode, setEditNode] = useState<MeaningNode | null>(null);
  const [editText, setEditText] = useState("");
  const [slokaVisibility, setSlokaVisibility] = useState<Visibility>("public");
  const [editingSloka, setEditingSloka] = useState(false);
  const [slokaContent, setSlokaContent] = useState("");

  const { data: shlokData, isLoading: shlokLoading, isError: shlokError } = useShlokDetailQuery(id ?? "");
  const shlok = shlokData?.data ?? null;

  const { data: bookData } = useBookDetailQuery(shlok?.book_id ?? "");
  const book = bookData?.data ?? null;

  const { data: currentUserData } = useCurrentUserQuery();
  const currentUserId = currentUserData?.data?.id;
  const isOwner = !!currentUserId && shlok?.owner_id === currentUserId;

  const { data: meaningsData } = useMeaningsQuery(id ?? "");
  const meaningNodes: MeaningNode[] = (meaningsData?.data?.items ?? []).map(toMeaningNode);

  const updateShlokMutation = useUpdateShlokMutation();
  const createMeaningMutation = useCreateMeaningMutation(id ?? "");
  const insertAboveMutation = useInsertMeaningAboveMutation(id ?? "");
  const insertBelowMutation = useInsertMeaningBelowMutation(id ?? "");
  const updateMeaningMutation = useUpdateMeaningMutation(id ?? "");
  const createContentReq = useCreateContentRequestMutation();

  // Entity permissions for shlok sharing — only loaded for the owner
  const { data: shlokPermsData } = useEntityPermissionsQuery("shlok", id ?? "", { enabled: isOwner });
  const setShlokPerm = useSetEntityPermissionMutation("shlok", id ?? "");
  const revokeShlokPerm = useRevokeEntityPermissionMutation("shlok", id ?? "");
  // setBookPerm no longer needed — backend auto-propagates structural access on shlok share

  const sharedUsers: SharedUserPermission[] = (shlokPermsData?.data ?? [])
    .filter((p) => !p.is_structural && !p.is_hidden)
    .map((p) => ({ user_id: p.user_id, permission_level: (p.permission_level || "view") as PermissionLevel }));

  // Initialise shlok visibility from server data once loaded
  useEffect(() => {
    if (shlok?.visibility) {
      const v = shlok.visibility === "specific_users" ? "shared" : (shlok.visibility as Visibility);
      setSlokaVisibility(v);
    }
  }, [shlok?.visibility]);

  const sortedMeanings = sortMeanings(meaningNodes, filter);

  const handleAddChild = (node: { id: string; text: string }) => {
    setParentId(node.id);
    setTargetNode(node);
    setMeaningModalOpen(true);
  };

  const handleAddRoot = () => {
    setParentId(null);
    setTargetNode(null);
    setMeaningModalOpen(true);
  };

  const handleEdit = (node: MeaningNode) => {
    setEditNode(node);
    setEditText(node.text);
  };

  const handleEditSloka = () => {
    setEditingSloka(true);
    setSlokaContent(shlok?.content ?? "");
  };

  const handleVisibilityChange = (v: Visibility) => {
    if (!id) return;
    const prevVisibility = slokaVisibility;
    const apiVisibility =
      v === "shared" ? "specific_users" : (v as "public" | "private" | "specific_users");
    updateShlokMutation.mutate(
      { shlokId: id, data: { visibility: apiVisibility } },
      {
        onSuccess: () => setSlokaVisibility(v),
        onError: (error: any) => {
          setSlokaVisibility(prevVisibility);
          const message = error?.response?.data?.message || error?.message || "Failed to update visibility";
          toast.error(message);
        },
      }
    );
  };

  const handleSharedUsersChange = useCallback(
    (newUsers: SharedUserPermission[]) => {
      const prevIds = sharedUsers.map((u) => u.user_id);
      const newIds = newUsers.map((u) => u.user_id);
      const added = newUsers.filter((u) => !prevIds.includes(u.user_id));
      const removed = prevIds.filter((id) => !newIds.includes(id));
      // Also detect users whose permission_level changed
      const levelChanged = newUsers.filter((u) => {
        const prev = sharedUsers.find((p) => p.user_id === u.user_id);
        return prev && prev.permission_level !== u.permission_level;
      });
      const refetchAll = () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEANINGS_BY_SHLOK(id ?? "") });
        queryClient.invalidateQueries({ queryKey: ["permissions"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHLOK_DETAIL(id ?? "") });
      };
      const onErr = (error: any) => {
        const message = error?.response?.data?.message || error?.message || "Failed to update permissions";
        toast.error(message);
      };
      // Grant / revoke permissions on this shlok (backend auto-propagates structural access to parent book)
      ;[...added, ...levelChanged].forEach((u) =>
        setShlokPerm.mutate(
          { user_id: u.user_id, permission_level: u.permission_level },
          { onSuccess: refetchAll, onError: onErr }
        )
      );
      removed.forEach((uid) =>
        revokeShlokPerm.mutate(uid, { onSuccess: refetchAll, onError: onErr })
      );
    },
    [sharedUsers, setShlokPerm, revokeShlokPerm, queryClient, id]
  );

  const handleAddMeaning = (text: string, position: MeaningPosition) => {
    if (!id) return;
    const onDone = () => {
      setMeaningModalOpen(false);
      setParentId(null);
      setTargetNode(null);
    };
    if (targetNode && position === "above") {
      insertAboveMutation.mutate(
        { shlokId: id, data: { content: text, target_meaning_id: targetNode.id } },
        { onSuccess: onDone }
      );
    } else if (targetNode && position === "below") {
      insertBelowMutation.mutate(
        { shlokId: id, data: { content: text, target_meaning_id: targetNode.id } },
        { onSuccess: onDone }
      );
    } else {
      // position === "inside" or root-level add
      createMeaningMutation.mutate(
        { shlokId: id, data: { content: text, parent_id: parentId ?? undefined } },
        { onSuccess: onDone }
      );
    }
  };

  const handleSaveMeaning = () => {
    if (!editNode) return;
    if (editNode.myPermission === "request_edit") {
      // Submit as a content change request — goes to owner's approval queue
      createContentReq.mutate(
        { entity_type: "meaning", entity_id: editNode.id, action: "edit", proposed_content: { content: editText } },
        { onSuccess: () => setEditNode(null) }
      );
    } else {
      updateMeaningMutation.mutate(
        { meaningId: editNode.id, data: { content: editText } },
        { onSuccess: () => setEditNode(null) }
      );
    }
  };

  const handleSaveSloka = () => {
    if (!id) return;
    if (shlok?.my_permission === "request_edit") {
      // Submit as a content change request — goes to owner's approval queue
      createContentReq.mutate(
        { entity_type: "shlok", entity_id: id, action: "edit", proposed_content: { content: slokaContent } },
        { onSuccess: () => setEditingSloka(false) }
      );
    } else {
      updateShlokMutation.mutate(
        { shlokId: id, data: { content: slokaContent } },
        { onSuccess: () => setEditingSloka(false) }
      );
    }
  };

  const parentNode = parentId ? findNode(sortedMeanings, parentId) : null;
  const targetNodeText = targetNode?.text ?? parentNode?.text;

  if (shlokLoading) {
    return (
      <div className="space-y-5">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 bg-muted animate-pulse rounded w-12" />
          <div className="h-3 bg-muted/50 animate-pulse rounded w-2" />
          <div className="h-3.5 bg-muted animate-pulse rounded w-24" />
          <div className="h-3 bg-muted/50 animate-pulse rounded w-2" />
          <div className="h-3.5 bg-muted animate-pulse rounded w-36" />
        </div>

        {/* Back link */}
        <div className="h-4 bg-muted animate-pulse rounded w-28" />

        {/* Sloka card */}
        <div className="surface rounded border border-border p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="h-7 bg-muted animate-pulse rounded w-52" />
            <div className="flex items-center gap-2">
              <div className="h-7 bg-muted animate-pulse rounded w-20" />
              <div className="h-7 bg-muted animate-pulse rounded w-7" />
            </div>
          </div>
          <div className="p-4 rounded bg-muted/40 border border-accent/15 space-y-2.5">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
            <div className="h-4 bg-muted animate-pulse rounded w-4/5" />
            <div className="h-4 bg-muted animate-pulse rounded w-9/12" />
          </div>
        </div>

        {/* Meanings section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-6 bg-muted animate-pulse rounded w-52" />
            <div className="h-8 bg-muted animate-pulse rounded w-28" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-muted animate-pulse rounded-full w-24" />
            <div className="h-8 bg-muted animate-pulse rounded-full w-20" />
          </div>
          <div className="space-y-3">
            <div className="surface rounded border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-28" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-14 ml-auto" />
              </div>
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted animate-pulse rounded w-12" />
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
              </div>
            </div>
            <div className="surface rounded border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-20" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-10 ml-auto" />
              </div>
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted animate-pulse rounded w-12" />
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
              </div>
            </div>
            <div className="ml-8 surface rounded border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-32" />
                <div className="h-3.5 bg-muted animate-pulse rounded w-12 ml-auto" />
              </div>
              <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
              <div className="flex gap-2">
                <div className="h-6 bg-muted animate-pulse rounded w-12" />
                <div className="h-6 bg-muted animate-pulse rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (shlokError || !shlok) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard/library" className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="surface rounded border border-border p-12 text-center">
          <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-body text-muted-foreground">Sloka not found.</p>
        </div>
      </div>
    );
  }

  const shlokTitle =
    shlok.chapter_number != null && shlok.verse_number != null
      ? `Chapter ${shlok.chapter_number}, Verse ${shlok.verse_number}`
      : shlok.chapter_number != null
      ? `Chapter ${shlok.chapter_number}`
      : shlok.content.slice(0, 60);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-small text-muted-foreground">
        <Link to="/dashboard/library" className="hover:text-foreground transition-colors">Library</Link>
        <ChevronRight className="w-3 h-3" />
        {book && (
          <>
            <Link to={`/dashboard/library/${book.id}`} className="hover:text-foreground transition-colors">{book.title}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-foreground">{shlokTitle}</span>
      </div>

      <Link
        to={book ? `/dashboard/library/${book.id}` : "/dashboard/library"}
        className="inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {book ? `Back to ${book.title}` : "Back"}
      </Link>

      {/* Sloka content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface rounded border border-border p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-display text-foreground">{shlokTitle}</h1>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <VisibilitySelector
                value={slokaVisibility}
                onChange={handleVisibilityChange}
                compact
                sharedUsers={sharedUsers}
                onSharedUsersChange={handleSharedUsersChange}
              />
              <button onClick={handleEditSloka} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit sloka">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {!isOwner && shlok?.my_permission && shlok.my_permission !== "view" && (
            <button onClick={handleEditSloka} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={shlok.my_permission === "request_edit" ? "Suggest edit" : "Edit sloka"}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 p-4 rounded bg-muted/30 border border-accent/15">
          <p className="text-body text-foreground whitespace-pre-line leading-relaxed font-medium">{shlok.content}</p>
        </div>
      </motion.div>

      {/* Meanings section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-heading text-foreground">Meanings &amp; Interpretations</h2>
          {isOwner && (
            <GradientButton onClick={handleAddRoot} size="sm">
              <Plus className="w-4 h-4" /> Add Meaning
            </GradientButton>
          )}
        </div>

        <MeaningFilterBar active={filter} onChange={setFilter} />

        <div className="space-y-2">
          <MeaningTree
            nodes={sortedMeanings}
            canAddMeaning={isOwner}
            onAddChild={handleAddChild}
            onViewHistory={(node) => setHistoryNode(node)}
            onEdit={handleEdit}
          />
        </div>
      </div>

      <AddMeaningModal
        open={meaningModalOpen}
        onClose={() => { setMeaningModalOpen(false); setParentId(null); setTargetNode(null); }}
        onSubmit={handleAddMeaning}
        targetNodeText={targetNodeText}
        showPositionSelector={!!targetNode}
      />

      {/* Edit Meaning Modal */}
      <AnimatePresence>
        {editNode && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setEditNode(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-lg rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-heading text-foreground flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-accent" />
                    {editNode?.myPermission === "request_edit" ? "Suggest Edit" : "Edit Meaning"}
                  </h2>
                  <button onClick={() => setEditNode(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {editNode?.myPermission === "request_edit" && (
                    <p className="text-small text-muted-foreground">Your changes will be sent to the owner for review.</p>
                  )}
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="flex w-full rounded border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditNode(null)} className="h-9 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                    <GradientButton
                      size="sm"
                      onClick={handleSaveMeaning}
                      disabled={updateMeaningMutation.isPending || createContentReq.isPending}
                    >
                      {(updateMeaningMutation.isPending || createContentReq.isPending)
                        ? "Saving..."
                        : (editNode?.myPermission === "request_edit" ? "Submit for Review" : "Save Changes")}
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Sloka Modal */}
      <AnimatePresence>
        {editingSloka && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setEditingSloka(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-lg rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-heading text-foreground flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-accent" />
                    {shlok?.my_permission === "request_edit" ? "Suggest Edit" : "Edit Sloka"}
                  </h2>
                  <button onClick={() => setEditingSloka(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {shlok?.my_permission === "request_edit" && (
                  <p className="text-small text-muted-foreground -mt-2 mb-3">Your changes will be sent to the owner for review.</p>
                )}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-small font-medium text-foreground">Content</label>
                    <textarea
                      value={slokaContent}
                      onChange={(e) => setSlokaContent(e.target.value)}
                      rows={6}
                      className="flex w-full rounded border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditingSloka(false)} className="h-9 px-4 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">Cancel</button>
                    <GradientButton
                      size="sm"
                      onClick={handleSaveSloka}
                      disabled={updateShlokMutation.isPending || createContentReq.isPending}
                    >
                      {(updateShlokMutation.isPending || createContentReq.isPending)
                        ? "Saving..."
                        : (shlok?.my_permission === "request_edit" ? "Submit for Review" : "Save Changes")}
                    </GradientButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Version History Modal */}
      <AnimatePresence>
        {historyNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setHistoryNode(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface w-full max-w-lg rounded shadow-modal border border-accent/15 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-heading text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-accent" />
                    Version History
                  </h2>
                  <button onClick={() => setHistoryNode(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {historyNode.versions.length === 0 ? (
                    <p className="text-small text-muted-foreground text-center py-4">No version history available.</p>
                  ) : (
                    historyNode.versions.map((v, i) => (
                      <div key={v.id} className="relative pl-5 pb-3 border-l-2 border-border last:border-0">
                        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-accent border-2 border-surface" />
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-small font-medium text-foreground">v{historyNode.versions.length - i}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{v.editedAt} by {v.editedBy}</span>
                            {i > 0 && (
                              <button className="inline-flex items-center gap-1 text-[10px] text-accent font-medium hover:underline">
                                <RotateCcw className="w-2.5 h-2.5" /> Restore
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{v.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}