import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreVertical, Calendar, User, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Link, useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

export default function Orders() {
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
    
  const completedOrders = orders
    .filter(o => o.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest completed first

  const OrderList = ({ list }: { list: typeof orders }) => (
    <div className="space-y-3 mt-4">
      {list.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-card/50 rounded-xl border border-dashed border-border">
          <p>No orders in this section</p>
        </div>
      ) : (
        list.map(order => {
          const customer = customers.find(c => c.id === order.customerId);
          return (
            <Card key={order.id} className="border-none shadow-sm overflow-hidden" data-testid={`order-card-${order.id}`}>
              <CardContent className="p-0">
                <div className="flex items-start p-4 gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 mt-1">
                    {customer?.photo ? (
                      <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground font-bold">
                        {customer?.name.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-base">{customer?.name || 'Unknown'}</h3>
                      {order.status === 'pending' ? (
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px]">
                          Pending
                        </Badge>
                      ) : (
                         <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px]">
                          Completed
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-foreground/80 font-medium mt-0.5">{order.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(order.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
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
                      {order.status === 'pending' ? (
                        <DropdownMenuItem 
                          className="text-green-600 focus:text-green-600"
                          onClick={async () => {
                            await db.updateOrder(order.id, { status: 'completed' });
                            queryClient.invalidateQueries({ queryKey: ['orders'] });
                          }}
                        >
                          Mark as Completed
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={async () => {
                            await db.updateOrder(order.id, { status: 'pending' });
                            queryClient.invalidateQueries({ queryKey: ['orders'] });
                          }}
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                      )}
                      
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
  );

  return (
    <Layout>
      <div className="p-4 max-w-4xl mx-auto pb-20">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Pending <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-none">{pendingOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Completed <Badge className="ml-2 bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20 shadow-none border-none">{completedOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <OrderList list={pendingOrders} />
          </TabsContent>
          <TabsContent value="completed">
            <OrderList list={completedOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
