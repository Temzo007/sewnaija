import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MessageCircle, Pencil, Trash2, ArrowLeft, Ruler, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useLocation, useRoute } from "wouter";
import { formatPhoneForWhatsapp } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";

export default function CustomerDetails() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => db.getCustomer(id!)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => db.getOrdersByCustomer(id!)
  });

  if (!customer) return null; // Or loading state

  const whatsappLink = `https://wa.me/${formatPhoneForWhatsapp(customer.phone)}`;

  return (
    <Layout 
      hideSidebar 
      title=""
      actions={
        <Button variant="ghost" size="sm" onClick={() => setLocation(`/edit-customer/${id}`)}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
      }
    >
      <div className="p-4 max-w-3xl mx-auto space-y-6 pb-20">
        {/* Back Button */}
        <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>

        {/* Customer Header - Name and Photo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={customer.photo} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-heading">{customer.name}</h1>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm" asChild>
            <a href={`tel:${customer.phone}`}>
              <Phone className="w-4 h-4 mr-2" /> Call
            </a>
          </Button>
          <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </a>
          </Button>
        </div>

        {/* Phone Display */}
        <div className="text-center text-lg font-medium tracking-wide font-mono text-muted-foreground">
          {customer.phone}
        </div>

        {/* Description */}
        {customer.description && (
          <Card className="bg-muted/30 border-none shadow-sm">
             <CardContent className="p-4 text-sm text-foreground/80 italic">
               "{customer.description}"
             </CardContent>
          </Card>
        )}

        <Tabs defaultValue="measurements" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="measurements" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" /> Body Measurements
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {customer.measurements.map((m, idx) => (
                <div key={idx} className="bg-card p-3 rounded-lg border shadow-sm flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.name}</span>
                  <span className="text-lg font-bold font-mono text-primary">{m.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Order History
              </h3>
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                  No orders yet
                </div>
              ) : (
                orders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(order => (
                  <Card key={order.id} className="border-none shadow-sm overflow-hidden" onClick={() => setLocation(`/orders/${order.id}`)}>
                    <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-semibold">{order.description}</div>
                        <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Badge variant={order.status === 'pending' ? 'destructive' : 'default'} className={order.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}>
                        {order.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}

              <Button className="w-full mt-4" variant="outline" onClick={() => setLocation(`/add-order?customerId=${id}`)}>
                + Add New Order
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
