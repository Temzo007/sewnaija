import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Plus, Trash2, Share2, X, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { GalleryItem } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [magnifiedImageIndex, setMagnifiedImageIndex] = useState<number | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [showNewAlbumDialog, setShowNewAlbumDialog] = useState(false);
  const { toast } = useToast();

  const currentAlbumImages = selectedAlbumId ? gallery.filter(item => item.albumId === selectedAlbumId) : [];

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
      setSelectedAlbumId(null);
      toast({ title: "Album deleted" });
    }
  };

  const handleDeleteImage = async (itemId: string) => {
    if (confirm('Delete this image?')) {
      await db.deleteFromGallery(itemId);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      if (magnifiedImageIndex !== null && magnifiedImageIndex >= currentAlbumImages.length - 1) {
        setMagnifiedImageIndex(magnifiedImageIndex - 1);
      }
    }
  };

  const handleShareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        await navigator.share({
          files: [file],
          title: 'Share Image',
          text: 'Check out this image from SewNaija'
        });
      } catch (err) {
        toast({ title: "Error", description: "Could not share image", variant: "destructive" });
      }
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast({ title: "Copied", description: "Image URL copied to clipboard" });
      } catch (err) {
        toast({ title: "Error", description: "Could not share image", variant: "destructive" });
      }
    }
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

  // Native Gallery View - Full Screen
  if (selectedAlbumId) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="bg-black/80 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold">{albums.find(a => a.id === selectedAlbumId)?.name}</h2>
          <button onClick={() => setSelectedAlbumId(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {currentAlbumImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 text-white">
              <ImageIcon className="w-16 h-16 opacity-50" />
              <p className="text-lg opacity-75">No images in this album</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  <Camera className="w-4 h-4 mr-2" /> Camera
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  <Plus className="w-4 h-4 mr-2" /> Add Photos
                </Button>
              </div>
            </div>
          ) : magnifiedImageIndex !== null ? (
            <>
              <img src={currentAlbumImages[magnifiedImageIndex].url} alt="Gallery Item" className="max-w-full max-h-[calc(100vh-160px)] object-contain" />

              {/* Navigation Arrows */}
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                {magnifiedImageIndex > 0 && (
                  <button
                    onClick={handleSwipePrev}
                    className="pointer-events-auto p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {magnifiedImageIndex < currentAlbumImages.length - 1 && (
                  <button
                    onClick={handleSwipeNext}
                    className="pointer-events-auto ml-auto p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {magnifiedImageIndex + 1} / {currentAlbumImages.length}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 w-full overflow-y-auto">
              {currentAlbumImages.map((item, idx) => (
                <div
                  key={item.id}
                  className="aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  onClick={() => setMagnifiedImageIndex(idx)}
                >
                  <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        {magnifiedImageIndex !== null && (
          <div className="bg-black/80 text-white p-4 flex items-center justify-between">
            <button onClick={() => setMagnifiedImageIndex(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleShareImage(currentAlbumImages[magnifiedImageIndex].url)} className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteImage(currentAlbumImages[magnifiedImageIndex].id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
            <div className="text-sm text-white/60">
              {magnifiedImageIndex + 1} / {currentAlbumImages.length}
            </div>
          </div>
        )}

        {/* Footer - Grid/Add View */}
        {magnifiedImageIndex === null && currentAlbumImages.length > 0 && (
          <div className="bg-black/80 text-white p-4 flex items-center justify-between">
            <span className="text-sm opacity-75">{currentAlbumImages.length} image{currentAlbumImages.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Camera className="w-4 h-4 mr-1" /> Camera
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}

        {/* Hidden Inputs */}
        <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
      </div>
    );
  }

  // Albums List View
  return (
    <Layout>
      <div className="p-4 max-w-4xl mx-auto pb-24 space-y-6">
        <div className="flex items-center justify-between">
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

        {albums.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No albums yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {albums.map(album => {
              const albumImageCount = gallery.filter(item => item.albumId === album.id).length;
              const firstImage = gallery.find(item => item.albumId === album.id);

              return (
                <div key={album.id} className="group">
                  <Card
                    className="overflow-hidden shadow-sm border-none cursor-pointer transition-all hover:shadow-md active:scale-95"
                    onClick={() => setSelectedAlbumId(album.id)}
                  >
                    <CardContent className="p-0 aspect-square relative">
                      {firstImage ? (
                        <img src={firstImage.url} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-end justify-end p-3">
                        <h3 className="text-white font-semibold text-sm">{album.name}</h3>
                        <p className="text-white/80 text-xs">{albumImageCount} image{albumImageCount !== 1 ? 's' : ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteAlbum(album.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Album
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
