import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import WelcomeSetup from "@/pages/WelcomeSetup";
import Home from "@/pages/Home";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import AddEditCustomer from "@/pages/AddEditCustomer";
import Orders from "@/pages/Orders";
import OrderDetails from "@/pages/OrderDetails";
import AddEditOrder from "@/pages/AddEditOrder";
import { isSetupComplete } from "@/lib/db";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import Splash from "@/pages/Splash";
import InstallApp from "@/pages/InstallApp";

type AppState = 'install' | 'splash' | 'app';

function Router() {
  const [location, setLocation] = useLocation();
  const [setupChecked, setSetupChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const complete = await isSetupComplete();
      if (!complete && location !== "/setup") {
        setLocation("/setup");
      }
      setSetupChecked(true);
    };
    if (!setupChecked) check();
  }, [location, setLocation, setupChecked]);

  if (!setupChecked) return <div>Loading...</div>;

  return (
    <Switch>
      <Route path="/setup" component={WelcomeSetup} />
      <Route path="/" component={Home} />
      
      <Route path="/customers" component={Customers} />
      <Route path="/customers/:id" component={CustomerDetails} />
      <Route path="/add-customer" component={AddEditCustomer} />
      <Route path="/edit-customer/:id" component={AddEditCustomer} />
      
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetails} />
      <Route path="/add-order" component={AddEditOrder} />
      <Route path="/edit-order/:id" component={AddEditOrder} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    // Check if running as installed PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    // Check if user has already seen install page this session
    const hasSeenInstall = sessionStorage.getItem('sewnaija_seen_install') === 'true';
    
    if (isStandalone) {
      // Running as installed app - show splash
      return 'splash';
    } else if (hasSeenInstall) {
      // Already seen install page in browser - show splash
      return 'splash';
    } else {
      // First visit in browser - show install page
      return 'install';
    }
  });

  const handleInstalled = () => {
    sessionStorage.setItem('sewnaija_seen_install', 'true');
    setAppState('splash');
  };

  const handleSplashComplete = () => {
    setAppState('app');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {appState === 'install' && (
          <InstallApp onInstalled={handleInstalled} />
        )}
        {appState === 'splash' && (
          <Splash onComplete={handleSplashComplete} />
        )}
        {appState === 'app' && (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
