import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, MoreVertical, Package, UserPlus, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { queryClient } from "@/lib/queryClient";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => db.getOrders()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.getCustomers()
  });

  const pendingOrders = orders
    .filter(o => o.status === 'pending')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const filteredOrders = pendingOrders.filter(o => {
    const customer = customers.find(c => c.id === o.customerId);
    const matchName = customer?.name.toLowerCase().includes(search.toLowerCase());
    const matchDesc = o.description.toLowerCase().includes(search.toLowerCase());
    return matchName || matchDesc;
  });

  // Take top 5 for "Recent"
  const recentOrders = filteredOrders.slice(0, 5);

  return (
    <Layout>
      <div className="p-4 space-y-6 max-w-4xl mx-auto pb-20">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search customers or orders..." 
            className="pl-9 bg-card border-none shadow-sm h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/add-customer">
            <Card className="bg-primary text-primary-foreground border-none shadow-md hover:opacity-90 transition-opacity cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full min-h-[120px]">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="font-heading font-semibold text-sm">Add New Customer</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/orders">
            <Card className="bg-card text-card-foreground border-none shadow-md hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full min-h-[120px]">
                <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center mb-1">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-heading">{pendingOrders.length}</span>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Orders</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Add Order Button */}
        <Link href="/add-order">
          <Button className="w-full h-12 rounded-xl text-base shadow-sm" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add New Order
          </Button>
        </Link>

        {/* Recent Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold">Recent Orders (Pending)</h2>
            <Link href="/orders" className="text-sm text-primary font-medium hover:underline">See All</Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-card/50 rounded-xl border border-dashed border-border">
                <p>No pending orders found</p>
              </div>
            ) : (
              recentOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <Card key={order.id} className="border-none shadow-sm overflow-hidden" data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {customer?.photo ? (
                            <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground font-bold text-lg">
                              {customer?.name.charAt(0) || '?'}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{customer?.name || 'Unknown Customer'}</h3>
                          <p className="text-sm text-muted-foreground truncate">{order.description}</p>
                          <p className="text-xs text-primary mt-1 font-medium">Due: {new Date(order.deadline).toLocaleDateString()}</p>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/orders/${order.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/edit-order/${order.id}`)}>
                              Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-green-600 focus:text-green-600"
                              onClick={async () => {
                                await db.updateOrder(order.id, { status: 'completed' });
                                queryClient.invalidateQueries({ queryKey: ['orders'] });
                              }}
                            >
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={async () => {
                                if (confirm("Delete this order?")) {
                                  await db.deleteOrder(order.id);
                                  queryClient.invalidateQueries({ queryKey: ['orders'] });
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
        </div>
      </div>
    </Layout>
  );
}
