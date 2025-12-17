import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Camera, Plus, Trash2, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Customer } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const schema = z.object({
  description: z.string().min(1, "Description is required"),
  customerId: z.string().min(1, "Customer is required"),
  cost: z.string().min(1, "Cost is required"),
  deadline: z.date({ required_error: "Deadline is required" }),
  customMeasurements: z.array(z.object({
    name: z.string().min(1),
    value: z.string()
  }))
});

type FormData = z.infer<typeof schema>;

export default function AddEditOrder() {
  const [, params] = useRoute("/edit-order/:id");
  const isEdit = !!params?.id;
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const preSelectedCustomerId = searchParams.get("customerId");

  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  
  // Combobox state
  const [openCombobox, setOpenCombobox] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customMeasurements: [],
      customerId: preSelectedCustomerId || ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "customMeasurements"
  });

  const selectedCustomerId = watch("customerId");
  const selectedDate = watch("deadline");

  useEffect(() => {
    db.getCustomers().then(setCustomers);

    if (isEdit && params?.id) {
      db.getOrder(params.id).then(order => {
        if (order) {
          setValue('description', order.description);
          setValue('customerId', order.customerId);
          setValue('cost', order.cost);
          setValue('deadline', new Date(order.deadline));
          setValue('customMeasurements', order.customMeasurements);
          setMaterials(order.materials);
          setStyles(order.styles);
        }
      });
    }
  }, [isEdit, params?.id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        deadline: data.deadline.toISOString(),
        materials,
        styles
      };

      if (isEdit && params?.id) {
        await db.updateOrder(params.id, payload);
        toast({ title: "Success", description: "Order updated successfully" });
      } else {
        await db.addOrder(payload);
        toast({ title: "Success", description: "Order added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      // If we came from a specific customer details page, maybe go back there? 
      // Default: go back to history which might be Home or Customers or Details.
      window.history.back();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save order", variant: "destructive" });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'material' | 'style') => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (type === 'material') setMaterials(prev => [...prev, reader.result as string]);
          else setStyles(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number, type: 'material' | 'style') => {
    if (type === 'material') setMaterials(prev => prev.filter((_, i) => i !== index));
    else setStyles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Layout hideSidebar title={isEdit ? "Edit Order" : "Add New Order"}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        <Button type="button" variant="ghost" className="pl-0 gap-2 hover:bg-transparent" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>

        {/* Description / ID */}
        <div className="space-y-2">
          <Label htmlFor="description">Order Description (ID)</Label>
          <Input id="description" {...register("description")} placeholder="e.g. Wedding Aso Ebi - ORD002" className="h-12 bg-card" />
          {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
        </div>

        {/* Customer Selector */}
        <div className="space-y-2 flex flex-col">
          <Label>Customer</Label>
          <div className="flex gap-2">
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="flex-1 justify-between h-12 bg-card">
                  {selectedCustomerId
                    ? customers.find((c) => c.id === selectedCustomerId)?.name
                    : "Select customer..."}
                  <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-45" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={() => {
                            setValue("customerId", customer.id);
                            setOpenCombobox(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                          {customer.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button type="button" size="icon" className="h-12 w-12" onClick={() => setLocation('/add-customer')}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          {errors.customerId && <span className="text-red-500 text-sm">{errors.customerId.message}</span>}
        </div>

        {/* Deadline & Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full h-12 justify-start text-left font-normal bg-card", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setValue("deadline", date)} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.deadline && <span className="text-red-500 text-sm">{errors.deadline.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (₦)</Label>
            <Input id="cost" type="number" {...register("cost")} placeholder="0.00" className="h-12 bg-card font-mono" />
            {errors.cost && <span className="text-red-500 text-sm">{errors.cost.message}</span>}
          </div>
        </div>

        {/* Images: Materials & Styles */}
        <div className="space-y-4">
           <Label className="text-base font-semibold">Images</Label>
           
           {/* Materials */}
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Materials / Fabrics</span>
               <label className="cursor-pointer text-primary text-sm font-medium hover:underline flex items-center">
                 <Camera className="w-4 h-4 mr-1" /> Add Photo
                 <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, 'material')} />
               </label>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2">
               {materials.map((src, idx) => (
                 <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden shrink-0 group">
                   <img src={src} className="w-full h-full object-cover" />
                   <button type="button" onClick={() => removeImage(idx, 'material')} className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </div>
               ))}
               {materials.length === 0 && <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded w-full">No material photos</div>}
             </div>
           </div>

           {/* Styles */}
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Style Inspirations</span>
               <label className="cursor-pointer text-primary text-sm font-medium hover:underline flex items-center">
                 <ImageIcon className="w-4 h-4 mr-1" /> Add Image
                 <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, 'style')} />
               </label>
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2">
               {styles.map((src, idx) => (
                 <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden shrink-0 group">
                   <img src={src} className="w-full h-full object-cover" />
                   <button type="button" onClick={() => removeImage(idx, 'style')} className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </div>
               ))}
               {styles.length === 0 && <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded w-full">No style images</div>}
             </div>
           </div>
        </div>

        {/* Custom Measurements */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Order Specific Measurements</Label>
            <Button type="button" size="sm" variant="ghost" onClick={() => append({ name: "", value: "" })}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1 relative group">
                  <Input 
                    {...register(`customMeasurements.${index}.name`)} 
                    placeholder="Label" 
                    className="h-7 text-xs bg-muted/50 border-none mb-1 text-center px-1" 
                  />
                  <div className="relative">
                    <Input 
                      {...register(`customMeasurements.${index}.value`)} 
                      placeholder="0.0" 
                      type="number"
                      inputMode="decimal"
                      className="h-10 bg-card font-mono text-center px-1" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-1 -right-1 h-5 w-5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-lg font-bold shadow-lg sticky bottom-6">
          Save Order
        </Button>
      </form>
    </Layout>
  );
}
