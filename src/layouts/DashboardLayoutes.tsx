// src/Layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../Components";
import Sidesuperadmin from "../Components/super-admin/Sidesuperadmin";

export default function DashboardLayoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen min-w-0 flex-col bg-gray-100 lg:flex-row">
      <Sidesuperadmin isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex min-w-0 w-full flex-1 flex-col">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


