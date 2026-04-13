import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Eye, Lock, Users, ChevronDown, Check, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Visibility } from "@/types/sloka";
import { UserPicker } from "./UserPicker";
import type { SharedUserPermission } from "@/types";

const options: { value: Visibility; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "public", label: "Public", icon: Eye, desc: "Visible to everyone" },
  { value: "private", label: "Private", icon: Lock, desc: "Only you can see" },
  { value: "shared", label: "Shared", icon: Users, desc: "Specific users only" },
];

const triggerStyle: Record<Visibility, string> = {
  public:  "border-success/30 bg-success/8 text-success hover:border-success/50 hover:bg-success/12",
  private: "border-border bg-muted/40 text-muted-foreground hover:border-accent/25 hover:text-foreground",
  shared:  "border-accent/30 bg-accent/8 text-accent hover:border-accent/50 hover:bg-accent/12",
};

const dropdownStyle: Record<Visibility, string> = {
  public:  "bg-success/10 text-success border-success/20",
  private: "bg-muted/60 text-foreground border-border",
  shared:  "bg-accent/10 text-accent border-accent/20",
};

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (v: Visibility) => void;
  compact?: boolean;
  sharedUsers?: SharedUserPermission[];
  onSharedUsersChange?: (users: SharedUserPermission[]) => void;
}

export function VisibilitySelector({ value, onChange, compact, sharedUsers = [], onSharedUsersChange }: VisibilitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value)!;

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 208; // w-52
      const spaceOnRight = window.innerWidth - rect.left;
      if (spaceOnRight < dropdownWidth + 8) {
        // Not enough space on right — align to button's right edge
        setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      } else {
        setDropPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((v) => !v);
  };

  const handleSelect = (v: Visibility) => {
    onChange(v);
    setOpen(false);
    if (v === "shared") {
      setPickerOpen(true);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center gap-1.5 rounded border font-medium transition-all",
          compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-[12px]",
          triggerStyle[value],
          open && "ring-2 ring-offset-0",
          value === "public"  && open && "ring-success/20",
          value === "private" && open && "ring-accent/10",
          value === "shared"  && open && "ring-accent/20",
        )}
      >
        <current.icon className={cn("shrink-0", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
        <span>{current.label}</span>
        {value === "shared" && sharedUsers.length > 0 && (
          <span className="bg-accent/20 text-accent text-[10px] font-bold px-1 rounded">
            {sharedUsers.length}
          </span>
        )}
        <ChevronDown className={cn("transition-transform shrink-0", compact ? "w-2.5 h-2.5" : "w-3 h-3", open && "rotate-180")} />
      </button>

      {/* Dropdown rendered in a portal to escape any overflow-hidden ancestors.
          AnimatePresence must live INSIDE the portal — motion.div can't receive
          animate signals from an AnimatePresence that is outside its portal. */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
              <motion.div
                key="visibility-dropdown"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{ top: dropPos.top, left: dropPos.left, right: dropPos.right }}
                className="fixed w-56 p-1.5 rounded border border-border surface shadow-elevated z-[9999]"
              >
                <p className="px-2.5 pb-1 pt-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
                  Visibility
                </p>
                {options.map((opt) => {
                  const isActive = value === opt.value;
                  const activeColors: Record<Visibility, string> = {
                    public:  "bg-success/8 text-success",
                    private: "bg-muted/50 text-foreground",
                    shared:  "bg-accent/8 text-accent",
                  };
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-2.5 py-2 rounded text-left transition-colors",
                        isActive
                          ? activeColors[opt.value]
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <opt.icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold leading-tight">{opt.label}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{opt.desc}</p>
                      </div>
                      {isActive && <Check className="w-3 h-3 shrink-0 opacity-80" />}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* User picker for "shared" */}
      <UserPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedUsers={sharedUsers}
        onSelectionChange={(users) => onSharedUsersChange?.(users)}
      />

      {/* Quick button to edit the shared user list */}
      {value === "shared" && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 rounded border border-accent/25 bg-accent/8 px-2 py-1 text-[11px] font-medium text-accent hover:border-accent/40 hover:bg-accent/12 transition-all"
        >
          <Pencil className="w-2.5 h-2.5 shrink-0" />
          {sharedUsers.length > 0 ? `${sharedUsers.length} user${sharedUsers.length !== 1 ? "s" : ""}` : "Add users"}
        </button>
      )}
    </div>
  );
}

