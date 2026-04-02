import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
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
    <div className="h-screen flex w-full bg-background overflow-hidden">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-13 flex items-center gap-3 px-5 border-b border-border surface shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
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
          <span className="text-[13px] text-muted-foreground">
            Logged in as{" "}
            <span className="font-medium text-foreground">
              {data?.data?.full_name ?? data?.data?.email}
            </span>
          </span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
