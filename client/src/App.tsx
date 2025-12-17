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
import Gallery from "@/pages/Gallery";
import { db } from "@/lib/db";
import { useLocation } from "wouter";
import { useEffect } from "react";

function Router() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!db.isSetupComplete() && location !== "/setup") {
      setLocation("/setup");
    }
  }, [location, setLocation]);

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
      
      <Route path="/gallery" component={Gallery} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
