import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Menu, LogOut, ShieldCheck, ChevronLeft, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface AdminNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const adminNavItems: AdminNavItem[] = [
  { label: "Granths", icon: BookOpen, href: "/admin/granths" },
  // More modules will be added here
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => location.pathname.startsWith(href);

  function handleLogout() {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col surface border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[68px]" : "w-[246px]"
        }`}
      >
        <div className="border-b border-sidebar-border px-3 py-3 shrink-0">
          {!collapsed && (
            <div className="rounded-2xl border border-border/70 bg-background/80 px-3 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-foreground">Admin Panel</span>
                  <span className="block truncate text-[11px] text-muted-foreground">Editorial workspace</span>
                </div>
              </div>
            </div>
          )}
          <div className={`mt-3 flex ${collapsed ? "justify-center" : "justify-end"}`}>
            <button
              onClick={onToggle}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {adminNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all ${
                  active
                    ? "border-accent/10 bg-accent/10 text-accent"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-2 py-2 space-y-1 shrink-0">
          {!collapsed && (
            <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
              <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                <LayoutDashboard className="h-4 w-4 text-accent" /> Workspace status
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Manage collections, pages, and publishing in one cleaner flow.
              </p>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={collapsed ? "Toggle theme" : undefined}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 shrink-0" />
            )}
            {!collapsed && <span>Theme</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
