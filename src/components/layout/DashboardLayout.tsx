import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col lg:ml-64 dashboard-layout">
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};