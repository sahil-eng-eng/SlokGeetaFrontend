import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Menu, X, Settings, LogOut, ShieldCheck, ChevronLeft } from "lucide-react";
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
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[56px]" : "w-[200px]"
        }`}
      >
        {/* Branding */}
        <div className="h-13 flex items-center justify-between px-3 py-3 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span className="text-[13px] font-semibold text-foreground truncate">
                Admin Panel
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {adminNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-all ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-2 py-2 space-y-0.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
