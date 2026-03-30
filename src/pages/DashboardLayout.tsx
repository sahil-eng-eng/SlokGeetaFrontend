import { useState } from "react";
import { Outlet } from "react-router-dom";
import { FloatingMediaPlayer } from "@/components/shared/FloatingMediaPlayer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="h-screen flex w-full bg-app-gradient bg-background overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <DashboardHeader onMenuToggle={() => setSidebarCollapsed((c) => !c)} />
        <main className="flex-1 overflow-auto p-5 lg:p-6">
          <Outlet />
        </main>
        <DashboardFooter />
      </div>
      <FloatingMediaPlayer />
    </div>
  );
}
