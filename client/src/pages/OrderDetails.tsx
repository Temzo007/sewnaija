import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, MessageCircle, Calendar, DollarSign, CheckCircle, Ruler } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useLocation, useRoute } from "wouter";
import { formatPhoneForWhatsapp } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function OrderDetails() {
  const [, params] = useRoute("/orders/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => db.getOrder(id!)
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', order?.customerId],
    queryFn: () => order ? db.getCustomer(order.customerId) : undefined,
    enabled: !!order
  });

  if (!order || !customer) return null;

  const whatsappLink = `https://wa.me/${formatPhoneForWhatsapp(customer.phone)}`;

  return (
    <Layout 
      hideSidebar 
      title="Order Details"
      actions={
        <Button variant="ghost" size="sm" onClick={() => setLocation(`/edit-order/${id}`)}>
          Edit
        </Button>
      }
    >
      <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
        <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>

        {/* Header Info */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold font-heading">{order.description}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={order.status === 'pending' ? 'outline' : 'default'} className={order.status === 'pending' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'bg-green-600'}>
                {order.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(order.deadline).toDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-sm text-muted-foreground">Total Cost</div>
             <div className="text-xl font-bold font-mono">₦{Number(order.cost).toLocaleString()}</div>
          </div>
        </div>

        {/* Customer Mini Card */}
        <Card className="bg-card shadow-sm border-none cursor-pointer hover:bg-accent/10" onClick={() => setLocation(`/customers/${customer.id}`)}>
          <CardContent className="p-4 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
               {customer.photo ? <img src={customer.photo} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground font-bold">{customer.name.charAt(0)}</div>}
             </div>
             <div className="flex-1">
               <h3 className="font-semibold">{customer.name}</h3>
               <p className="text-sm text-muted-foreground">{customer.phone}</p>
             </div>
             <div className="flex gap-2">
                <a href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"><Phone className="w-4 h-4" /></a>
                <a href={whatsappLink} onClick={(e) => e.stopPropagation()} target="_blank" className="p-2 bg-[#25D366]/20 text-[#25D366] rounded-full hover:bg-[#25D366]/30"><MessageCircle className="w-4 h-4" /></a>
             </div>
          </CardContent>
        </Card>

        {/* Images */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-lg">Materials & Styles</h3>
          <div className="grid grid-cols-3 gap-3">
             {[...order.materials, ...order.styles].length === 0 ? (
               <div className="col-span-3 py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                 No images attached
               </div>
             ) : (
               [...order.materials, ...order.styles].map((url, i) => (
                 <Dialog key={i}>
                    <DialogTrigger asChild>
                      <div className="aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer shadow-sm">
                        <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="p-0 overflow-hidden bg-transparent border-none">
                      <img src={url} className="w-full h-auto rounded-lg" />
                    </DialogContent>
                 </Dialog>
               ))
             )}
          </div>
        </div>

        {/* Custom Measurements for this Order */}
        {order.customMeasurements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Order Measurements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {order.customMeasurements.map((m, idx) => (
                <div key={idx} className="bg-card p-3 rounded-lg border shadow-sm flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.name}</span>
                  <span className="text-lg font-bold font-mono text-primary">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 space-y-3">
          {order.status === 'pending' ? (
             <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-md" onClick={async () => {
               await db.updateOrder(order.id, { status: 'completed' });
               queryClient.invalidateQueries({ queryKey: ['order', id] });
               toast({ title: "Order Completed!" });
             }}>
               <CheckCircle className="w-5 h-5 mr-2" /> Mark as Completed
             </Button>
          ) : (
             <Button variant="outline" className="w-full h-12" onClick={async () => {
               await db.updateOrder(order.id, { status: 'pending' });
               queryClient.invalidateQueries({ queryKey: ['order', id] });
             }}>
               Mark as Pending
             </Button>
          )}

           <Button variant="destructive" className="w-full bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-none" onClick={async () => {
               if(confirm("Delete this order permanently?")) {
                  await db.deleteOrder(order.id);
                  window.history.back();
               }
             }}>
               Delete Order
             </Button>
        </div>
      </div>
    </Layout>
  );
}

// Helper toast (need to import)
import { toast } from "@/hooks/use-toast";
