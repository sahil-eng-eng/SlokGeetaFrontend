import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Menu, LogOut, ShieldCheck, ChevronLeft, ChevronDown, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface AdminNavChild {
  label: string;
  href: string;
}

interface AdminNavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: AdminNavChild[];
}

const adminNavItems: AdminNavItem[] = [
  {
    label: "Granths",
    icon: BookOpen,
    children: [
      { label: "All Granths", href: "/admin/granths" },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Granths"]);

  const isActive = (href: string) => location.pathname.startsWith(href);

  const isGroupActive = (item: AdminNavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some((c) => isActive(c.href)) ?? false;
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

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
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[60px]" : "w-[220px]"
        }`}
      >
        {/* Header — fixed h-14 keeps the toggle button at a consistent position */}
        <div className="border-b border-sidebar-border shrink-0">
          <div className="flex h-14 items-center px-3">
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/10 text-accent shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-foreground">Admin Panel</span>
                  <span className="block truncate text-[10px] text-muted-foreground">Editorial workspace</span>
                </div>
              </div>
            )}
            <button
              onClick={onToggle}
              className={`rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0 ${collapsed ? "mx-auto" : ""}`}
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {adminNavItems.map((item) => {
            if (item.children) {
              const groupExpanded = expandedGroups.includes(item.label);
              const groupActive = isGroupActive(item);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`flex items-center gap-3 w-full h-9 px-3 rounded text-[13px] font-medium transition-all duration-150 ${
                      groupActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            groupExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </>
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {groupExpanded && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[30px] border-l border-border pl-2 py-0.5 space-y-0.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={`block px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-150 ${
                                isActive(child.href)
                                  ? "text-accent"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href!}
                className={`flex items-center gap-3 h-9 px-3 rounded text-[13px] font-medium transition-all duration-150 ${
                  isActive(item.href!)
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-sidebar-border space-y-0.5 shrink-0">
          {!collapsed && (
            <div className="rounded border border-accent/15 bg-background/70 px-3 py-2 mb-1">
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                <LayoutDashboard className="h-3.5 w-3.5 text-accent" /> Workspace
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                Manage collections, pages &amp; publishing.
              </p>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 h-9 px-3 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={collapsed ? "Toggle theme" : undefined}
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px] shrink-0" />
            ) : (
              <Moon className="w-[18px] h-[18px] shrink-0" />
            )}
            {!collapsed && <span>Theme</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 h-9 px-3 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
