import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCustomers, getOrder, updateOrder, addOrder } from "@/lib/db";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Camera, Plus, Trash2, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { Customer } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Grid2X2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

const schema = z.object({
  description: z.string().min(1, "Description is required"),
  customerId: z.string().min(1, "Customer is required"),
  cost: z.string().min(1, "Cost is required"),
  deadline: z.date({ required_error: "Deadline is required" }),
  notes: z.string().optional(),
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
  const [showImageSourceModal, setShowImageSourceModal] = useState<'material' | 'style' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const currentImageType = useRef<'material' | 'style'>('material');
  
  // Combobox state
  const [openCombobox, setOpenCombobox] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customMeasurements: [],
      customerId: preSelectedCustomerId || "",
      notes: ""
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "customMeasurements"
  });

  const selectedCustomerId = watch("customerId");
  const selectedDate = watch("deadline");

  useEffect(() => {
    getCustomers().then(setCustomers);

    if (isEdit && params?.id) {
      getOrder(params.id).then(order => {
        if (order) {
          setValue('description', order.description);
          setValue('customerId', order.customerId);
          setValue('cost', order.cost);
          setValue('deadline', new Date(order.deadline));
          setValue('customMeasurements', order.customMeasurements);
          setValue('notes', order.notes || '');
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
        await updateOrder(params.id, payload);
        toast({ title: "Success", description: "Order updated successfully" });
      } else {
        await addOrder(payload);
        toast({ title: "Success", description: "Order added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
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
    setShowImageSourceModal(null);
  };

  const removeImage = (index: number, type: 'material' | 'style') => {
    if (type === 'material') setMaterials(prev => prev.filter((_, i) => i !== index));
    else setStyles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageSourceSelection = (source: 'camera' | 'phone' | 'app') => {
    currentImageType.current = showImageSourceModal || 'material';
    
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else if (source === 'phone') {
      fileInputRef.current?.click();
    }
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

        {/* Deadline */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={"outline"} 
                className={cn(
                  "w-full h-14 justify-start text-left font-normal bg-card border-2 transition-all duration-200",
                  selectedDate ? "border-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                <div className="flex flex-col items-start">
                  {selectedDate ? (
                    <>
                      <span className="text-xs text-muted-foreground">Selected Date</span>
                      <span className="font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    </>
                  ) : (
                    <span>Select deadline date</span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-2" side="bottom" align="start">
              <div className="bg-card p-6 space-y-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg">Pick Deadline</h3>
                  <p className="text-xs text-muted-foreground mt-1">When should this order be completed?</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border">
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={(date) => date && setValue("deadline", date)} 
                    initialFocus
                    className="w-full"
                  />
                </div>
                {selectedDate && (
                  <div className="p-4 bg-primary/10 border-l-4 border-primary rounded">
                    <p className="text-xs text-muted-foreground">Deadline:</p>
                    <p className="font-semibold text-lg">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                    <p className="text-xs text-primary mt-2 font-medium">
                      {Math.ceil((selectedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                    </p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.deadline && <span className="text-red-500 text-sm">{errors.deadline.message}</span>}
        </div>

        {/* Cost */}
        <div className="space-y-2">
          <Label htmlFor="cost">Cost (₦)</Label>
          <Input id="cost" type="number" {...register("cost")} placeholder="0.00" className="h-12 bg-card font-mono border-2" />
          {errors.cost && <span className="text-red-500 text-sm">{errors.cost.message}</span>}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea 
            id="notes" 
            {...register("notes")} 
            placeholder="Add any additional notes about this order..." 
            className="bg-card resize-none"
            rows={3}
          />
        </div>

        {/* Images: Materials & Styles */}
        <div className="space-y-4">
           <Label className="text-base font-semibold">Images</Label>
           
           {/* Materials */}
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-sm text-muted-foreground">Materials / Fabrics</span>
               <Dialog open={showImageSourceModal === 'material'} onOpenChange={(open) => setShowImageSourceModal(open ? 'material' : null)}>
                 <DialogTrigger asChild>
                   <button className="cursor-pointer text-primary text-sm font-medium hover:underline flex items-center">
                     <Camera className="w-4 h-4 mr-1" /> Add Photo
                   </button>
                 </DialogTrigger>
                 <DialogContent className="w-80">
                   <DialogHeader>
                     <DialogTitle>Add Material Photo</DialogTitle>
                     <DialogDescription>
                       Choose how to add a photo of the material.
                     </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-2">
                     <Button variant="outline" className="w-full h-12 gap-2" onClick={() => handleImageSourceSelection('camera')}>
                       <Camera className="w-4 h-4" /> Camera
                     </Button>
                     <Button variant="outline" className="w-full h-12 gap-2" onClick={() => handleImageSourceSelection('phone')}>
                       <ImageIcon className="w-4 h-4" /> Phone Gallery
                     </Button>
                   </div>
                 </DialogContent>
               </Dialog>
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
               <Dialog open={showImageSourceModal === 'style'} onOpenChange={(open) => setShowImageSourceModal(open ? 'style' : null)}>
                 <DialogTrigger asChild>
                   <button className="cursor-pointer text-primary text-sm font-medium hover:underline flex items-center">
                     <ImageIcon className="w-4 h-4 mr-1" /> Add Image
                   </button>
                 </DialogTrigger>
                 <DialogContent className="w-80">
                   <DialogHeader>
                     <DialogTitle>Add Style Image</DialogTitle>
                     <DialogDescription>
                       Choose how to add a style image.
                     </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-2">
                     <Button variant="outline" className="w-full h-12 gap-2" onClick={() => handleImageSourceSelection('phone')}>
                       <ImageIcon className="w-4 h-4" /> Phone Gallery
                     </Button>
                     <Button variant="outline" className="w-full h-12 gap-2" onClick={() => handleImageSourceSelection('camera')}>
                       <Camera className="w-4 h-4" /> Camera
                     </Button>
                   </div>
                 </DialogContent>
               </Dialog>
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

        {/* Hidden file inputs */}
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => handleImageUpload(e, currentImageType.current)}
        />
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          ref={cameraInputRef}
          onChange={(e) => handleImageUpload(e, currentImageType.current)}
        />

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
