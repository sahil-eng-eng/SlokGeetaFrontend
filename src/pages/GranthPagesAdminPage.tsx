import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  useGranthQuery,
  useGranthPagesQuery,
  useAddGranthPageMutation,
  useUpdateGranthPageMutation,
  useDeleteGranthPageMutation,
} from "@/lib/api/endpoints/granths";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  RotateCcw,
  RotateCw,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/utils";
import type { GranthPageResponse } from "@/types";

// ── Toolbar Button ───────────────────────────────────────────────────────────

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, active, title, disabled, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focused
        onClick();
      }}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-accent/20 text-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-30 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

// ── Toolbar separator ───────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}

// ── Rich Text Toolbar ────────────────────────────────────────────────────────

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

function RichTextToolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
      {/* Undo / Redo */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
        disabled={!editor.can().undo()}
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)"
        disabled={!editor.can().redo()}
      >
        <RotateCw className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Inline formatting */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Text Alignment */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <Sep />

      {/* Horizontal Rule */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  );
}

// ── Page Editor Modal ────────────────────────────────────────────────────────

interface PageEditorModalProps {
  granthId: string;
  totalPages: number;
  editingPage: GranthPageResponse | null;
  onClose: () => void;
}

function PageEditorModal({ granthId, totalPages, editingPage, onClose }: PageEditorModalProps) {
  const [pageNumber, setPageNumber] = useState<number>(
    editingPage ? editingPage.page_number : totalPages + 1
  );

  const addMutation = useAddGranthPageMutation(granthId);
  const updateMutation = useUpdateGranthPageMutation(granthId);

  const isPending = addMutation.isPending || updateMutation.isPending;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Start typing page content here… You can paste formatted text directly.",
      }),
    ],
    content: editingPage?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[320px] px-4 py-3 text-[13px] leading-relaxed text-foreground",
      },
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === "<p></p>") {
      toast.error("Page content cannot be empty");
      return;
    }

    if (editingPage) {
      updateMutation.mutate(
        { granthId, pageNumber: editingPage.page_number, data: { content: html } },
        {
          onSuccess: () => {
            toast.success(`Page ${editingPage.page_number} updated`);
            onClose();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      addMutation.mutate(
        { granthId, pageNumber, content: html },
        {
          onSuccess: () => {
            toast.success(`Page ${pageNumber} added`);
            onClose();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    }
  }, [editor, editingPage, granthId, pageNumber, addMutation, updateMutation, onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18 }}
          className="surface w-full max-w-4xl rounded-2xl border border-border/70 shadow-elevated flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-[14px] font-semibold text-foreground">
                {editingPage ? `Edit Page ${editingPage.page_number}` : "Add New Page"}
              </h3>
              {!editingPage && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Page number:</span>
                  <input
                    type="number"
                    min={1}
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                    className="w-16 h-8 px-2 rounded-lg border border-border bg-muted/30 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-center"
                  />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="shrink-0">
            <RichTextToolbar editor={editor} />
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
            <p className="text-[11px] text-muted-foreground">
              HTML content is stored. Paste formatted text — bold, italic, headings are preserved.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="h-8 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <GradientButton size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {editingPage ? "Save Changes" : "Add Page"}
              </GradientButton>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function GranthPagesAdminPage() {
  const { granthId } = useParams<{ granthId: string }>();
  const navigate = useNavigate();

  const { data: granthData, isLoading: granthLoading } = useGranthQuery(granthId ?? "");
  const { data: pagesData, isLoading: pagesLoading } = useGranthPagesQuery(granthId ?? "");
  const deleteMutation = useDeleteGranthPageMutation(granthId ?? "");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<GranthPageResponse | null>(null);

  const granth = granthData?.data;
  const pages = pagesData?.data ?? [];
  const isLoading = granthLoading || pagesLoading;

  function openAdd() {
    setEditingPage(null);
    setModalOpen(true);
  }

  function openEdit(page: GranthPageResponse) {
    setEditingPage(page);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPage(null);
  }

  function handleDelete(page: GranthPageResponse) {
    if (!confirm(`Delete page ${page.page_number}? This cannot be undone.`)) return;
    deleteMutation.mutate(
      { granthId: granthId!, pageNumber: page.page_number },
      {
        onSuccess: () => toast.success(`Page ${page.page_number} deleted`),
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!granth) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] text-muted-foreground">
        Granth not found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/70 surface px-5 py-5 sm:px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-background" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin/granths")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            onClick={() => navigate("/admin/granths")}
          >
            Granths
          </span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground truncate max-w-[200px]">{granth.title}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">Pages</span>
        </div>
      </div>

            <div>
              <h1 className="text-display text-foreground">Page Management</h1>
              <p className="mt-1 text-body text-muted-foreground">
                Add, refine, and maintain pages for <span className="font-medium text-foreground">{granth.title}</span> with a clearer editorial workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[430px]">
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Pages</p>
              <p className="mt-1 text-heading text-foreground">{pages.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-small text-muted-foreground">Language</p>
              <p className="mt-1 text-body font-medium capitalize text-foreground">{granth.language}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/60 bg-background/80 p-3 sm:col-span-1">
              <p className="text-small text-muted-foreground">Next page</p>
              <p className="mt-1 text-heading text-foreground">{pages.length + 1}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">All pages</h2>
          <p className="text-small text-muted-foreground mt-1">Open any page to edit rich text content without changing the underlying flow.</p>
        </div>
        <GradientButton size="sm" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Page
        </GradientButton>
      </div>

      {/* Pages list */}
      {pages.length === 0 ? (
        <div className="surface border border-border rounded-2xl py-16 flex flex-col items-center gap-3 text-muted-foreground">
          <FileText className="w-8 h-8 opacity-40" />
          <p className="text-[13px]">No pages yet. Add the first page to get started.</p>
          <GradientButton size="sm" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> Add First Page
          </GradientButton>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface border border-border/70 rounded-2xl p-4 flex flex-col gap-4 hover:border-accent/20 transition-all hover:shadow-surface group"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 text-accent text-[13px] font-semibold flex items-center justify-center">
                  {page.page_number}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-xl border border-border/60 bg-background/70 px-1 py-1">
                  <button
                    onClick={() => openEdit(page)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit page content"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(page)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed prose-preview"
                  dangerouslySetInnerHTML={{
                    __html: page.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
                  }}
                />
                {page.content.length > 0 && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {page.content.replace(/<[^>]*>/g, "").trim().length} characters
                  </p>
                )}
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <PageEditorModal
            granthId={granthId!}
            totalPages={pages.length}
            editingPage={editingPage}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
