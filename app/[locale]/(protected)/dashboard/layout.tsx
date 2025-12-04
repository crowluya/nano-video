import { AuthGuard } from "@/components/auth/AuthGuard";
import SidebarInsetHeader from "@/components/header/SidebarInsetHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { DashboardSidebar } from "./DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="min-w-0">
          <SidebarInsetHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0">
            <div className="min-h-screen flex-1 rounded-xl md:min-h-min min-w-0">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
