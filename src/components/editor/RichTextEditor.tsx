import { useState, useRef, useEffect } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered,
  Quote, Heading1, Heading2, Undo, Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content = "", onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastExternalHTML = useRef<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Only update innerHTML when content changes from outside (e.g. initial load or reset).
  // This avoids resetting the cursor position on every keystroke.
  useEffect(() => {
    if (editorRef.current && content !== lastExternalHTML.current) {
      editorRef.current.innerHTML = content;
      lastExternalHTML.current = content;
    }
  }, [content]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn(
      "border border-input rounded-lg overflow-hidden bg-background transition-all",
      isFocused && "ring-2 ring-accent/20 border-accent"
    )}>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30">
        <ToolButton title="Bold" onClick={() => exec("bold")}>
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Italic" onClick={() => exec("italic")}>
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Underline" onClick={() => exec("underline")}>
          <Underline className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolButton title="Heading 1" onClick={() => exec("formatBlock", "h1")}>
          <Heading1 className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Heading 2" onClick={() => exec("formatBlock", "h2")}>
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolButton title="Bullet List" onClick={() => exec("insertUnorderedList")}>
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Ordered List" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Blockquote" onClick={() => exec("formatBlock", "blockquote")}>
          <Quote className="w-4 h-4" />
        </ToolButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolButton title="Undo" onClick={() => exec("undo")}>
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton title="Redo" onClick={() => exec("redo")}>
          <Redo className="w-4 h-4" />
        </ToolButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={() => {
          if (onChange && editorRef.current) {
            const html = editorRef.current.innerHTML;
            // Mark this as an internal change so the useEffect won't reset innerHTML
            lastExternalHTML.current = html;
            onChange(html);
          }
        }}
        dir="ltr"
        data-placeholder={placeholder}
        className="min-h-[180px] p-4 text-body text-foreground outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none"
      />
    </div>
  );
}
