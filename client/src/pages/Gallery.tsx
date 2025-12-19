import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GalleryItem } from "@/lib/types";

export default function Gallery() {
  const { data: albums = [] } = useQuery({
    queryKey: ['gallery-albums'],
    queryFn: () => db.getGalleryAlbums()
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => db.getGallery()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [magnifiedImageIndex, setMagnifiedImageIndex] = useState<number | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showNewAlbumDialog, setShowNewAlbumDialog] = useState(false);
  const { toast } = useToast();

  // Set default album on load
  const defaultAlbum = albums[0]?.id;
  if (!selectedAlbumId && defaultAlbum) {
    setSelectedAlbumId(defaultAlbum);
  }

  const currentAlbumImages = gallery.filter(item => item.albumId === selectedAlbumId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && selectedAlbumId) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = async () => {
          const url = reader.result as string;
          await db.addToGallery(url, selectedAlbumId);
          queryClient.invalidateQueries({ queryKey: ['gallery'] });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCreateAlbum = async () => {
    if (newAlbumName.trim()) {
      await db.createGalleryAlbum(newAlbumName);
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      setNewAlbumName('');
      setShowNewAlbumDialog(false);
      toast({ title: "Album created", description: `"${newAlbumName}" album added` });
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (confirm('Delete this album and all its images?')) {
      await db.deleteGalleryAlbum(albumId);
      queryClient.invalidateQueries({ queryKey: ['gallery-albums', 'gallery'] });
      setSelectedAlbumId(albums[0]?.id || '');
      toast({ title: "Album deleted" });
    }
  };

  const handleDeleteImage = async (itemId: string) => {
    await db.deleteFromGallery(itemId);
    queryClient.invalidateQueries({ queryKey: ['gallery'] });
  };

  const handleSwipeNext = () => {
    if (magnifiedImageIndex !== null && magnifiedImageIndex < currentAlbumImages.length - 1) {
      setMagnifiedImageIndex(magnifiedImageIndex + 1);
    }
  };

  const handleSwipePrev = () => {
    if (magnifiedImageIndex !== null && magnifiedImageIndex > 0) {
      setMagnifiedImageIndex(magnifiedImageIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleSwipeNext();
    if (e.key === 'ArrowLeft') handleSwipePrev();
  };

  const magnifiedImage = magnifiedImageIndex !== null ? currentAlbumImages[magnifiedImageIndex] : null;

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto pb-24">
        {/* Albums Navigation */}
        <div className="mb-6">
          <Tabs value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-heading font-semibold">Albums</h2>
              <Dialog open={showNewAlbumDialog} onOpenChange={setShowNewAlbumDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" /> New Album
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Create New Album</h3>
                    <Input
                      placeholder="Album name"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowNewAlbumDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAlbum}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <TabsList className="w-full justify-start overflow-x-auto">
              {albums.map(album => (
                <TabsTrigger key={album.id} value={album.id} className="relative flex items-center gap-1 px-3">
                  {album.name}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAlbum(album.id);
                    }}
                    className="ml-1 text-destructive hover:bg-destructive/20 rounded p-0.5 h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>

            {albums.map(album => (
              <TabsContent key={album.id} value={album.id} className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentAlbumImages.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No images in this album.</p>
                    </div>
                  ) : (
                    currentAlbumImages.map((item, idx) => (
                      <Dialog key={item.id}>
                        <DialogTrigger asChild>
                          <Card className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-none shadow-sm group relative">
                            <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteImage(item.id);
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-4 overflow-hidden bg-transparent border-none shadow-none" onKeyDown={handleKeyDown}>
                          <div className="relative w-full h-full flex items-center justify-center">
                            {magnifiedImage ? (
                              <>
                                <img src={magnifiedImage.url} alt="Full View" className="max-w-full max-h-[80vh] rounded-lg" />
                                {/* Swipe Navigation */}
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                  {magnifiedImageIndex! > 0 && (
                                    <button
                                      onClick={handleSwipePrev}
                                      className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                                    >
                                      ←
                                    </button>
                                  )}
                                  {magnifiedImageIndex! < currentAlbumImages.length - 1 && (
                                    <button
                                      onClick={handleSwipeNext}
                                      className="ml-auto p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                                    >
                                      →
                                    </button>
                                  )}
                                </div>
                                {/* Image counter */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                  {magnifiedImageIndex! + 1} / {currentAlbumImages.length}
                                </div>
                              </>
                            ) : (
                              <img src={item.url} alt="Full View" className="max-w-full max-h-[80vh] rounded-lg" />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* FAB */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={cameraInputRef}
            onChange={handleFileUpload}
          />

          <Button
            className="w-14 h-14 rounded-full shadow-lg z-30"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Add from gallery"
          >
            <ImageIcon className="w-6 h-6" />
          </Button>

          <Button
            className="w-14 h-14 rounded-full shadow-lg z-30"
            size="icon"
            onClick={() => cameraInputRef.current?.click()}
            title="Take photo"
          >
            <Camera className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}
