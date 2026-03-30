import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Check, X, Loader2, ChevronDown, ChevronUp,
  BookOpen, ScrollText, MessageSquare, User,
} from "lucide-react";
import {
  useIncomingContentRequestsQuery,
  useReviewContentRequestMutation,
} from "@/lib/api/endpoints/contentRequests";
import { useToast } from "@/hooks/use-toast";
import type { ContentRequestResponse, ContentRequestStatus } from "@/types";

const STATUS_STYLES: Record<ContentRequestStatus, string> = {
  pending:  "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-green-600 bg-green-500/10 border-green-500/20",
  rejected: "text-red-500 bg-red-500/10 border-red-500/20",
};

const ACTION_LABELS: Record<string, string> = {
  add_shlok: "Add Shlok",
  add_meaning: "Add Meaning",
  edit: "Edit",
  delete: "Delete",
};

// Match the prefix labels built in the backend _build_context()
// e.g. "Book: Bhagavad Gita Notes" → type=book, label="Bhagavad Gita Notes"
type TreeLevel = { type: "book" | "shlok" | "meaning"; text: string };

const LEVEL_META: Record<TreeLevel["type"], { icon: React.ElementType; color: string }> = {
  book:    { icon: BookOpen,     color: "text-blue-500" },
  shlok:   { icon: ScrollText,   color: "text-amber-500" },
  meaning: { icon: MessageSquare, color: "text-accent" },
};

function parseBreadcrumb(crumbs: string[]): TreeLevel[] {
  return crumbs.map((c) => {
    if (c.startsWith("Book:"))    return { type: "book",    text: c.slice(5).trim() };
    if (c.startsWith("Shlok:"))   return { type: "shlok",   text: c.slice(6).trim() };
    return                                { type: "meaning", text: c.replace(/^Meaning:\s*/, "") };
  });
}

interface RequestCardProps { req: ContentRequestResponse }

function RequestCard({ req }: RequestCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const review = useReviewContentRequestMutation();

  const handleReview = (approved: boolean) => {
    review.mutate(
      { id: req.id, data: { status: approved ? "approved" : "rejected" } },
      {
        onSuccess: () =>
          toast({
            title: approved ? "Request approved" : "Request rejected",
            description: `${req.requester_username}'s ${ACTION_LABELS[req.action] ?? req.action} request has been ${approved ? "approved" : "rejected"}.`,
          }),
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      }
    );
  };

  const proposedKeys = Object.keys(req.proposed_content ?? {});
  const isPending = req.status === "pending";
  const treeNodes = req.context_breadcrumb ? parseBreadcrumb(req.context_breadcrumb) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl surface border border-border/50 hover:border-accent/20 transition-all overflow-hidden"
    >
      {/* ── Context Tree ─────────────────────────────────── */}
      {treeNodes.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-border/30 bg-muted/20">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Location
          </p>
          <div className="space-y-0">
            {treeNodes.map((node, i) => {
              const { icon: Icon, color } = LEVEL_META[node.type];
              const isLast = i === treeNodes.length - 1;
              const indent = i * 16;
              return (
                <div key={i} className="flex items-start gap-2 relative" style={{ paddingLeft: indent }}>
                  {/* Connector line from parent */}
                  {i > 0 && (
                    <div
                      className="absolute top-0 bottom-0 border-l border-border/40"
                      style={{ left: indent - 8 }}
                    />
                  )}
                  <div className={`flex items-center gap-1.5 py-0.5 ${isLast ? "font-medium" : ""}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isLast ? "bg-accent/10" : "bg-muted/60"}`}>
                      <Icon className={`w-3 h-3 ${isLast ? color : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-[12px] leading-tight ${isLast ? "text-foreground" : "text-muted-foreground"} max-w-[280px] truncate`}>
                      {node.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Request Header ───────────────────────────────── */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Action + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground capitalize">
              {ACTION_LABELS[req.action] ?? req.action}
            </span>
            <span
              className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[req.status]}`}
            >
              {req.status}
            </span>
          </div>

          {/* Requester + date */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="text-foreground font-medium">{req.requester_username}</span>
              <span className="opacity-60">requested this change</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(req.created_at).toLocaleDateString("en-US", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </span>
          </div>

          {/* Current content preview */}
          {req.current_content && (
            <div className="mt-2 rounded-md bg-muted/40 border border-border/40 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Current</p>
              <p className="text-[12px] text-foreground line-clamp-2 whitespace-pre-line">{req.current_content}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {proposedKeys.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          {isPending && (
            <>
              <button
                onClick={() => handleReview(true)}
                disabled={review.isPending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                aria-label="Approve request"
              >
                {review.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => handleReview(false)}
                disabled={review.isPending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                aria-label="Reject request"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Proposed changes diff ────────────────────────── */}
      <AnimatePresence>
        {expanded && proposedKeys.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border/30 pt-2 bg-muted/10">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Proposed Changes
              </p>
              <div className="space-y-1.5">
                {proposedKeys.map((key) => (
                  <div key={key} className="rounded-md bg-accent/5 border border-accent/10 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground mb-0.5 capitalize">{key}</p>
                    <p className="text-[12px] text-foreground whitespace-pre-wrap break-words">
                      {String((req.proposed_content as Record<string, unknown>)[key] ?? "")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviewer note */}
      {req.reviewer_note && (
        <div className="px-4 pb-3 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
          <span className="font-medium">Reviewer note: </span>
          {req.reviewer_note}
        </div>
      )}
    </motion.div>
  );
}

type FilterStatus = ContentRequestStatus | "all";

export default function ApprovalsPage() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const { data, isLoading } = useIncomingContentRequestsQuery(
    filter === "all" ? undefined : filter
  );

  const requests: ContentRequestResponse[] = data?.data ?? [];

  const filterOptions: { id: FilterStatus; label: string }[] = [
    { id: "pending",  label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "all",      label: "All" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="h-36 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent flex items-end px-6 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Approvals</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Review edit requests submitted for your content
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 max-w-2xl">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                filter === opt.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-6 h-6 text-accent" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">No requests</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Pending edit approvals for your content will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
