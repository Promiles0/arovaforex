import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ResponsiveSidebar } from "./ResponsiveSidebar";
import { MobileHeader } from "./MobileHeader";
import { Header } from "./Header";
import { ArovaAssistant } from "@/components/assistant";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { PageSummaryBubble } from "@/components/assistant/PageSummaryBubble";
import { useSignalNotifications } from "@/hooks/useSignalNotifications";

export const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useSignalNotifications();

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Mobile Header - Only visible on mobile/tablet */}
      <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Responsive Sidebar */}
      <ResponsiveSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className="flex flex-col lg:ml-60 min-h-screen">
        {/* Desktop Header - Hidden on mobile since we have MobileHeader */}
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <PageSummaryBubble />
          <Outlet />
        </main>
      </div>
      
      {/* AI Assistant Widget */}
      <ArovaAssistant />
      
      {/* Onboarding Tour for new users */}
      <OnboardingTour />
    </div>
  );
};