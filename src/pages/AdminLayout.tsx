import { useState } from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useCurrentUserQuery } from "@/lib/api/endpoints/auth";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const { data, isLoading } = useCurrentUserQuery();

  if (isLoading) return null;

  const role = data?.data?.role;
  if (role !== "superadmin" && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen flex w-full bg-app-gradient bg-background overflow-hidden">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex min-h-16 items-center gap-3 border-b border-accent/20 surface px-5 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div>
              <p className="text-small uppercase tracking-[0.18em] text-muted-foreground">Admin workspace</p>
              <p className="text-heading text-foreground">Manage content with a calmer, more editorial interface</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded border border-accent/20 bg-accent/5 text-[12px] font-medium text-accent hover:bg-accent/10 hover:border-accent/30 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <div className="hidden max-w-[240px] rounded border border-accent/15 bg-background/80 px-3 py-2 text-right md:block">
                <p className="text-small text-muted-foreground">Logged in as</p>
                <p className="truncate text-body font-medium text-foreground">
                  {data?.data?.full_name ?? data?.data?.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-4 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
