import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onSave: (val: string) => void;
  as?: "input" | "textarea";
  className?: string;
  editClassName?: string;
}

export function EditableText({ value, onSave, as = "input", className, editClassName }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      setDraft(value);
    }
  }, [editing, value]);

  const save = () => {
    if (draft.trim() && draft !== value) onSave(draft.trim());
    setEditing(false);
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <span className={cn("group/edit inline-flex items-center gap-1.5 cursor-pointer", className)} onClick={() => setEditing(true)}>
        <span>{value}</span>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
      </span>
    );
  }

  const inputCls = cn("rounded-md border border-accent/30 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all", editClassName);

  return (
    <span className="inline-flex items-center gap-1.5">
      {as === "textarea" ? (
        <textarea ref={ref as any} value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className={cn(inputCls, "resize-none text-[13px] w-full")} onKeyDown={(e) => { if (e.key === "Escape") cancel(); }} />
      ) : (
        <input ref={ref as any} value={draft} onChange={(e) => setDraft(e.target.value)} className={cn(inputCls, "text-[13px] h-7")} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }} />
      )}
      <button onClick={save} className="p-1 rounded text-success hover:bg-success/10 transition-colors"><Check className="w-3 h-3" /></button>
      <button onClick={cancel} className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"><X className="w-3 h-3" /></button>
    </span>
  );
}
