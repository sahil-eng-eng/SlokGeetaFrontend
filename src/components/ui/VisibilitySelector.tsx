import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Eye, Lock, Users, ChevronDown, Check } from "lucide-react";
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
          "inline-flex items-center gap-1.5 rounded border border-border text-[12px] font-medium transition-all hover:border-accent/30",
          compact ? "px-2 py-1" : "px-3 py-1.5",
          value === "public" && "text-success",
          value === "private" && "text-muted-foreground",
          value === "shared" && "text-accent"
        )}
      >
        <current.icon className="w-3 h-3" />
        {current.label}
        {value === "shared" && sharedUsers.length > 0 && (
          <span className="text-[10px] opacity-70">({sharedUsers.length})</span>
        )}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
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
                className="fixed w-52 p-1.5 rounded border border-border surface shadow-elevated z-[9999]"
              >
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-2 rounded text-left transition-colors",
                      value === opt.value ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <opt.icon className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium">{opt.label}</p>
                      <p className="text-[10px] opacity-70">{opt.desc}</p>
                    </div>
                    {value === opt.value && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))}
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
          className="text-[11px] text-accent hover:text-accent-glow font-medium transition-colors"
        >
          {sharedUsers.length > 0 ? `${sharedUsers.length} user${sharedUsers.length !== 1 ? "s" : ""}` : "Add users"}
        </button>
      )}
    </div>
  );
}

