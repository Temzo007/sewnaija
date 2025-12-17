import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  title?: string; // Optional title override
  hideSidebar?: boolean; // For Add/Edit pages
  showBack?: boolean; // For Add/Edit pages
  onBack?: () => void;
  actions?: ReactNode; // Extra actions in header
}

export function Layout({ children, title, hideSidebar = false, actions }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Determine title based on location if not provided
  const getTitle = () => {
    if (title) return title;
    if (location === '/') return 'Home';
    if (location.startsWith('/customers')) return 'Customers';
    if (location.startsWith('/orders')) return 'Orders';
    if (location.startsWith('/gallery')) return 'Gallery';
    return 'SewNaija';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - conditionally rendered or always present but hidden on specific pages? 
          Request says: "Hidden on: Add / Edit pages and Details pages". 
          So we only show it on main pages.
      */}
      {!hideSidebar && (
        <AppSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${!hideSidebar ? 'md:ml-64' : ''}`}>
        
        {/* Header - Only show if we are on a main page or if we want a custom header */}
        {!hideSidebar && (
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-heading font-bold">{getTitle()}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className="flex-1 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
