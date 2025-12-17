import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, MoreVertical, Phone, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.getCustomers()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => db.getOrders()
  });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <Layout>
      <div className="p-4 space-y-4 max-w-4xl mx-auto pb-24">
        {/* Search */}
        <div className="relative sticky top-[70px] z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search customers by name..." 
            className="pl-9 bg-card border-none shadow-sm h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="grid gap-3">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No customers found.</p>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const pendingCount = orders.filter(o => o.customerId === customer.id && o.status === 'pending').length;
              
              return (
                <Card key={customer.id} className="border-none shadow-sm overflow-hidden hover:bg-accent/10 transition-colors" data-testid={`customer-card-${customer.id}`}>
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 gap-4">
                      {/* Avatar */}
                      <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                        <AvatarImage src={customer.photo} className="object-cover" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-lg">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0" onClick={() => setLocation(`/customers/${customer.id}`)}>
                        <h3 className="font-semibold text-lg truncate leading-tight mb-1">{customer.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {pendingCount > 0 ? (
                            <span className="text-primary font-medium flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> 
                              {pendingCount} Pending Work{pendingCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span>No pending works</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/customers/${customer.id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/add-order?customerId=${customer.id}`)}>
                            Add New Order
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={async () => {
                              if (confirm(`Delete ${customer.name}?`)) {
                                await db.deleteCustomer(customer.id);
                                queryClient.invalidateQueries({ queryKey: ['customers'] });
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* FAB */}
        <Link href="/add-customer">
          <Button 
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-30"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
