import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Plus, Trash2, Share2, X, ChevronLeft, ChevronRight, MoreVertical, Grid3x3, Maximize2 } from "lucide-react";
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
  const selectedAlbumName = albums.find(a => a.id === selectedAlbumId)?.name;

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
          toast({ title: "Success", description: "Image added to album" });
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
        setMagnifiedImageIndex(null);
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

  // Full Screen Gallery View
  if (selectedAlbumId && magnifiedImageIndex !== null && magnifiedImage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black via-black to-black/95 z-50 flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
        {/* Top Bar */}
        <div className="backdrop-blur-sm bg-black/40 border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-white font-heading font-semibold truncate">{selectedAlbumName}</h2>
            <p className="text-white/60 text-xs mt-0.5">{magnifiedImageIndex + 1} of {currentAlbumImages.length}</p>
          </div>
          <button 
            onClick={() => setMagnifiedImageIndex(null)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/80 hover:text-white"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setSelectedAlbumId(null)}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Viewer */}
        <div className="flex-1 flex items-center justify-center relative group">
          <img 
            src={magnifiedImage.url} 
            alt="Gallery Item" 
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            {magnifiedImageIndex > 0 && (
              <button
                onClick={handleSwipePrev}
                className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {magnifiedImageIndex < currentAlbumImages.length - 1 && (
              <button
                onClick={handleSwipeNext}
                className="pointer-events-auto ml-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-sm active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="backdrop-blur-sm bg-black/40 border-t border-white/10 px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex-1 flex gap-2">
            <Button
              size="sm"
              onClick={() => handleShareImage(magnifiedImage.url)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-200"
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button
              size="sm"
              onClick={() => handleDeleteImage(magnifiedImage.id)}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all duration-200"
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        {/* Hidden Inputs */}
        <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
      </div>
    );
  }

  // Album Content View
  if (selectedAlbumId) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95 z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-semibold">{selectedAlbumName}</h2>
            <p className="text-xs text-muted-foreground mt-1">{currentAlbumImages.length} image{currentAlbumImages.length !== 1 ? 's' : ''}</p>
          </div>
          <button 
            onClick={() => setSelectedAlbumId(null)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {currentAlbumImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground text-center">No images in this album yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentAlbumImages.map((item, idx) => (
                <div
                  key={item.id}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative transition-transform duration-200 hover:scale-105 active:scale-95"
                  onClick={() => setMagnifiedImageIndex(idx)}
                >
                  <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/50 px-4 py-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 transition-all duration-200"
            variant="outline"
          >
            <Camera className="w-4 h-4 mr-2" /> Camera
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 transition-all duration-200"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Photos
          </Button>
        </div>

        {/* Hidden Inputs */}
        <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileUpload} />
      </div>
    );
  }

  // Albums List View
  return (
    <Layout>
      <div className="p-4 max-w-5xl mx-auto pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Gallery</h1>
            <p className="text-sm text-muted-foreground mt-1">{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
          </div>
          <Dialog open={showNewAlbumDialog} onOpenChange={setShowNewAlbumDialog}>
            <DialogTrigger asChild>
              <Button className="transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" /> New Album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading font-semibold text-lg">Create Album</h3>
                  <p className="text-sm text-muted-foreground">Name your new photo album</p>
                </div>
                <Input
                  placeholder="e.g., Summer Collection"
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
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No albums yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first album to organize photos</p>
            <Button onClick={() => setShowNewAlbumDialog(true)}>Create Album</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map(album => {
              const albumImageCount = gallery.filter(item => item.albumId === album.id).length;
              const firstImage = gallery.find(item => item.albumId === album.id);

              return (
                <div key={album.id} className="group">
                  <Card
                    className="overflow-hidden shadow-sm border-border hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedAlbumId(album.id)}
                  >
                    <CardContent className="p-0 aspect-square relative bg-muted">
                      {firstImage ? (
                        <img src={firstImage.url} alt={album.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                        <h3 className="text-white font-semibold text-sm leading-tight">{album.name}</h3>
                        <p className="text-white/70 text-xs mt-1">{albumImageCount} image{albumImageCount !== 1 ? 's' : ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10">
                          <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAlbum(album.id)} 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
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
