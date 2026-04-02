import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Library, MessageCircle, Settings,
  Menu, X, ChevronLeft, ChevronDown, LogOut, Globe, Users, Hand,
  ShieldCheck, ClipboardList, Zap, BookOpen,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Library",
    icon: Library,
    children: [
      { label: "My Books", href: "/dashboard/library" },
      { label: "Discover", href: "/dashboard/discover" },
      { label: "Shared With Me", href: "/dashboard/shared" },
    ],
  },
  {
    label: "Naam Jap",
    icon: Hand,
    children: [
      { label: "Tracker", href: "/dashboard/naam-jap" },
      { label: "Instant", href: "/dashboard/instant-naam-jap" },
      { label: "Schedule", href: "/dashboard/schedule" },
    ],
  },
  {
    label: "Kirtan",
    icon: Library,
    href: "/dashboard/kirtan",
  },
  {
    label: "Chat",
    icon: MessageCircle,
    children: [
      { label: "AI Assistant", href: "/dashboard/chat" },
      { label: "Messages", href: "/dashboard/messages" },
    ],
  },
  { label: "Friends", icon: Users, href: "/dashboard/friends" },
  {
    label: "Sharing",
    icon: ShieldCheck,
    children: [
      { label: "Permissions", href: "/dashboard/permissions" },
      { label: "Approvals", href: "/dashboard/approvals" },
    ],
  },
  {
    label: "Granths",
    icon: BookOpen,
    href: "/admin/granths",
    adminOnly: true,
  },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Library", "Naam Jap"]);
  const { data: currentUserData } = useCurrentUserQuery();
  const userRole = currentUserData?.data?.role ?? "user";
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  const isGroupActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some((c) => isActive(c.href)) ?? false;
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

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
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <span className="font-display text-[15px] font-bold text-foreground tracking-tight">
              Avenue
            </span>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4 lg:hidden" />}
            {!collapsed && <ChevronLeft className="w-4 h-4 hidden lg:block" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleNavItems.map((item) => {
            if (item.children) {
              const groupExpanded = expandedGroups.includes(item.label);
              const groupActive = isGroupActive(item);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={`flex items-center gap-3 w-full h-9 px-3 rounded-md text-[13px] font-medium transition-all duration-150 ${
                      groupActive
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
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
                              className={`block px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
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
                className={`flex items-center gap-3 h-9 px-3 rounded-md text-[13px] font-medium transition-all duration-150 ${
                  isActive(item.href!)
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-sidebar-border space-y-1 shrink-0">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === "light" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            {!collapsed && <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">John Doe</p>
                <p className="text-[11px] text-muted-foreground truncate">john@example.com</p>
              </div>
              <button className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
