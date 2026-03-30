import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Trash2, Book, FileText, MessageSquare, Loader2 } from "lucide-react";
import { useMyGrantedPermissionsQuery, useRevokeEntityPermissionMutation } from "@/lib/api/endpoints/entityPermissions";
import { useToast } from "@/hooks/use-toast";
import type { EntityPermissionResponse, EntityType } from "@/types";

const ENTITY_ICON: Record<EntityType, typeof Book> = {
  book: Book,
  shlok: FileText,
  meaning: MessageSquare,
};

const ENTITY_LABEL: Record<EntityType, string> = {
  book: "Book",
  shlok: "Shlok",
  meaning: "Meaning",
};

interface PermissionRowProps {
  perm: EntityPermissionResponse;
}

function PermissionRow({ perm }: PermissionRowProps) {
  const { toast } = useToast();
  const revoke = useRevokeEntityPermissionMutation(perm.entity_type, perm.entity_id);

  const Icon = ENTITY_ICON[perm.entity_type] ?? FileText;

  const handleRevoke = () => {
    revoke.mutate(perm.user_id, {
      onSuccess: () => toast({ title: "Permission revoked" }),
      onError: () => toast({ title: "Failed to revoke", variant: "destructive" }),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl surface border border-border/50 hover:border-accent/20 transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-foreground">{perm.username}</span>
          <span className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {ENTITY_LABEL[perm.entity_type]}
          </span>
        </div>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] font-medium uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">
            {perm.permission_level}
          </span>
        </div>
      </div>
      <button
        onClick={handleRevoke}
        disabled={revoke.isPending}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
        title="Revoke permission"
      >
        {revoke.isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.div>
  );
}

export default function PermissionsPage() {
  const [filter, setFilter] = useState<EntityType | "all">("all");
  const { data, isLoading } = useMyGrantedPermissionsQuery();

  const all: EntityPermissionResponse[] = data?.data ?? [];
  const filtered = filter === "all" ? all : all.filter((p) => p.entity_type === filter);

  const filterOptions: { id: EntityType | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "book", label: "Books" },
    { id: "shlok", label: "Shloks" },
    { id: "meaning", label: "Meanings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="h-36 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent flex items-end px-6 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Permissions</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Manage access you've granted to others on your content
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">No permissions granted</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Share a book, shlok, or meaning to see granted permissions here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <PermissionRow key={p.id} perm={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
