import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";

interface AddMeaningModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  parentText?: string;
}

export function AddMeaningModal({ open, onClose, onSubmit, parentText }: AddMeaningModalProps) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
      onClose();
    }
  };

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
              className="surface w-full max-w-lg rounded-xl shadow-modal border border-border/50 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading font-semibold text-foreground">Add Meaning</h2>
                <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {parentText && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-small text-muted-foreground mb-1">Replying to:</p>
                  <p className="text-body text-foreground line-clamp-2">{parentText}</p>
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
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Visibility</label>
                  <VisibilitySelector value={visibility} onChange={setVisibility} />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="h-9 px-4 rounded-md text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
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
