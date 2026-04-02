import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUp, ArrowDown, CornerDownRight } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";
import { cn } from "@/lib/utils";

export type MeaningPosition = "above" | "below" | "inside";

interface AddMeaningModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, position: MeaningPosition) => void;
  /** The text of the node the user clicked + on (null for root-level add) */
  targetNodeText?: string;
  /** Whether to show the position selector (true when adding relative to an existing node) */
  showPositionSelector?: boolean;
}

export function AddMeaningModal({ open, onClose, onSubmit, targetNodeText, showPositionSelector }: AddMeaningModalProps) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [position, setPosition] = useState<MeaningPosition>("inside");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setText("");
      setPosition("inside");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim(), position);
      setText("");
    }
  };

  const truncatedTitle = targetNodeText
    ? targetNodeText.length > 60 ? targetNodeText.slice(0, 60) + "…" : targetNodeText
    : "";

  const positionOptions: { value: MeaningPosition; label: string; desc: string; icon: React.ElementType }[] = [
    { value: "above", label: "Above", desc: `Insert before "${truncatedTitle}"`, icon: ArrowUp },
    { value: "below", label: "Below", desc: `Insert after "${truncatedTitle}"`, icon: ArrowDown },
    { value: "inside", label: "Inside", desc: `Add as a child of "${truncatedTitle}"`, icon: CornerDownRight },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="surface w-full max-w-lg rounded shadow-modal border border-accent/15 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading font-semibold text-foreground">Add Meaning</h2>
                <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Position selector — shown only when adding relative to an existing node */}
              {showPositionSelector && targetNodeText && (
                <div className="mb-4 space-y-2">
                  <p className="text-small font-medium text-foreground">Where would you like to add?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {positionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPosition(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-3 py-3 rounded border text-center transition-all",
                          position === opt.value
                            ? "border-accent bg-accent/10 text-accent shadow-sm"
                            : "border-border text-muted-foreground hover:border-accent/30 hover:text-foreground"
                        )}
                      >
                        <opt.icon className="w-4 h-4" />
                        <span className="text-[12px] font-semibold">{opt.label}</span>
                        <span className="text-[10px] opacity-70 line-clamp-2">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show parent context for "inside" when no position selector */}
              {!showPositionSelector && targetNodeText && (
                <div className="mb-4 p-3 rounded bg-muted/50 border border-accent/15">
                  <p className="text-small text-muted-foreground mb-1">Replying to:</p>
                  <p className="text-body text-foreground line-clamp-2">{targetNodeText}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Your interpretation</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Share your understanding of this verse or meaning..."
                    className="flex w-full rounded border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Visibility</label>
                  <VisibilitySelector value={visibility} onChange={setVisibility} />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="h-9 px-4 rounded text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <GradientButton type="submit" size="sm">
                    Add Meaning
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
