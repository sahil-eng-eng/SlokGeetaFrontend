import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { GradientButton } from "@/components/ui/gradient-button";
import { VisibilitySelector } from "@/components/ui/VisibilitySelector";
import { Visibility } from "@/types/sloka";

interface CreateSlokaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; text: string }) => void;
}

export function CreateSlokaModal({ open, onClose, onSubmit }: CreateSlokaModalProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && text.trim()) {
      onSubmit({ title: title.trim(), text });
      setTitle("");
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="surface w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded shadow-modal border border-accent/15 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading font-semibold text-foreground">Add New Sloka</h2>
                <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Sloka Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Chapter 2, Verse 47"
                    className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Sloka Text</label>
                  <RichTextEditor
                    content={text}
                    onChange={setText}
                    placeholder="Enter the sloka text with formatting..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-small font-medium text-foreground">Visibility</label>
                  <VisibilitySelector value={visibility} onChange={setVisibility} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose} className="h-9 px-4 rounded text-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <GradientButton type="submit" size="sm">
                    Create Sloka
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
