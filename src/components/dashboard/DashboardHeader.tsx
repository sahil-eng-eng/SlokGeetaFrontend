import { Menu, Search, Bell, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: userData } = useCurrentUserQuery();
  const role = userData?.data?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <header className="h-14 surface border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Search books, slokas, meanings..."
            className="w-full h-8 pl-9 pr-3 rounded border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-surface transition-all"
          />
          {searchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded border border-border surface shadow-elevated z-50">
              <p className="text-[12px] text-muted-foreground px-2 py-1">
                Search results for "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Panel shortcut */}
      {isAdmin && (
        <Link
          to="/admin"
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded border border-accent/20 bg-accent/5 text-[12px] font-medium text-accent hover:bg-accent/10 hover:border-accent/30 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Panel
        </Link>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <NotificationsDropdown onClose={() => setNotifOpen(false)} />
          </>
        )}
      </div>
    </header>
  );
}
