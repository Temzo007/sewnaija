import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Gallery() {
  const { data: gallery = [] } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => db.getGallery()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        await db.addToGallery(url);
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.length === 0 ? (
             <div className="col-span-full py-20 text-center text-muted-foreground">
               <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>Gallery is empty.</p>
               <p className="text-sm">Add photos of styles to inspire your next creation.</p>
             </div>
          ) : (
            gallery.map(item => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <Card className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-none shadow-sm group relative">
                    <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                  <img src={item.url} alt="Full View" className="w-full h-auto rounded-lg" />
                </DialogContent>
              </Dialog>
            ))
          )}
        </div>

        {/* FAB */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
           <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
           <Button 
            className="w-14 h-14 rounded-full shadow-lg z-30"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
