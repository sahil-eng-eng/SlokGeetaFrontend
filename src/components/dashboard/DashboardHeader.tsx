import { Menu, Search, Bell } from "lucide-react";
import { useState } from "react";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-14 surface border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
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
            className="w-full h-8 pl-9 pr-3 rounded-md border border-border bg-muted/40 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-surface transition-all"
          />
          {searchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-lg border border-border surface shadow-elevated z-50">
              <p className="text-[12px] text-muted-foreground px-2 py-1">
                Search results for "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
