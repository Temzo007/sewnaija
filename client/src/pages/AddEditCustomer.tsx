import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Camera, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { DEFAULT_MEASUREMENTS } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number is invalid"),
  description: z.string().optional(),
  measurements: z.array(z.object({
    name: z.string().min(1),
    value: z.string().min(1, "Value required") // Allow string for "34 inches" etc
  }))
});

type FormData = z.infer<typeof schema>;

export default function AddEditCustomer() {
  const [, params] = useRoute("/edit-customer/:id");
  const isEdit = !!params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  
  // Custom measurement dialog state
  const [customMeasureName, setCustomMeasureName] = useState("");
  const [customMeasureOpen, setCustomMeasureOpen] = useState(false);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      measurements: DEFAULT_MEASUREMENTS
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "measurements"
  });

  useEffect(() => {
    if (isEdit && params?.id) {
      db.getCustomer(params.id).then(customer => {
        if (customer) {
          setValue('name', customer.name);
          setValue('phone', customer.phone);
          setValue('description', customer.description);
          setValue('measurements', customer.measurements);
          setPhoto(customer.photo);
        }
      });
    }
  }, [isEdit, params?.id, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && params?.id) {
        await db.updateCustomer(params.id, { ...data, photo });
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        await db.addCustomer({ ...data, photo });
        toast({ title: "Success", description: "Customer added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      window.history.back();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save customer", variant: "destructive" });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addCustomMeasurement = () => {
    if (customMeasureName) {
      append({ name: customMeasureName, value: "" });
      setCustomMeasureName("");
      setCustomMeasureOpen(false);
    }
  };

  return (
    <Layout hideSidebar title={isEdit ? "Edit Customer" : "Add New Customer"}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 max-w-2xl mx-auto space-y-6 pb-20">
        <Button type="button" variant="ghost" className="pl-0 gap-2 hover:bg-transparent" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" /> Back
        </Button>

        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden group cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 z-10 cursor-pointer" 
              onChange={handlePhotoUpload}
            />
            {photo ? (
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground group-hover:scale-110 transition-transform" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">Tap to upload photo</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Chioma Adebayo" className="h-12 bg-card" />
            {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register("phone")} placeholder="080..." className="h-12 bg-card font-mono" />
            {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg">Measurements</h3>
            <Dialog open={customMeasureOpen} onOpenChange={setCustomMeasureOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                   <Plus className="w-3 h-3 mr-1" /> Add Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Measurement</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Measurement Name (e.g. Wrist)" 
                    value={customMeasureName}
                    onChange={(e) => setCustomMeasureName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={addCustomMeasurement}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-1 relative group">
                <Label htmlFor={`measurements.${index}.value`} className="text-xs uppercase text-muted-foreground truncate block pr-4">
                  {field.name}
                </Label>
                <Input 
                  {...register(`measurements.${index}.value`)} 
                  placeholder="0.0" 
                  className="bg-card font-mono"
                />
                <input type="hidden" {...register(`measurements.${index}.name`)} value={field.name} />
                
                {/* Allow removing custom measurements (assuming standard ones are kept or user can remove them too if they want flexibility) */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Notes / Preferences</Label>
          <Textarea 
            id="description" 
            {...register("description")} 
            placeholder="Style preferences, fabric choices, notes..." 
            className="bg-card min-h-[100px]"
          />
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold shadow-md">
          Save Customer
        </Button>
      </form>
    </Layout>
  );
}
