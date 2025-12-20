import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Plus, Trash2, Share2, MoreVertical } from "lucide-react";
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
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [magnifiedImage, setMagnifiedImage] = useState<GalleryItem | null>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, albumId?: string) => {
    const files = e.target.files;
    const targetAlbumId = albumId || selectedAlbumId;
    if (files && targetAlbumId) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = async () => {
          const url = reader.result as string;
          await db.addToGallery(url, targetAlbumId);
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
      setSelectedAlbumId(albums.find(a => a.id !== albumId)?.id || '');
      toast({ title: "Album deleted" });
    }
  };

  const handleDeleteImage = async (itemId: string) => {
    if (confirm('Delete this image?')) {
      await db.deleteFromGallery(itemId);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      setMagnifiedImage(null);
    }
  };

  const handleShareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share Image',
          text: 'Check out this image from SewNaija',
          url: imageUrl
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
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
      setMagnifiedImage(currentAlbumImages[magnifiedImageIndex + 1]);
    }
  };

  const handleSwipePrev = () => {
    if (magnifiedImageIndex !== null && magnifiedImageIndex > 0) {
      setMagnifiedImageIndex(magnifiedImageIndex - 1);
      setMagnifiedImage(currentAlbumImages[magnifiedImageIndex - 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleSwipeNext();
    if (e.key === 'ArrowLeft') handleSwipePrev();
  };

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto pb-24 space-y-6">
        {/* Albums Grid Header */}
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

        {/* Albums Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map(album => {
            const albumImageCount = gallery.filter(item => item.albumId === album.id).length;
            const firstImage = gallery.find(item => item.albumId === album.id);
            return (
              <Card 
                key={album.id}
                className={`overflow-hidden shadow-sm border-2 cursor-pointer transition-all ${selectedAlbumId === album.id ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}
                onClick={() => setSelectedAlbumId(album.id)}
              >
                <CardContent className="p-0 relative aspect-square group">
                  {firstImage ? (
                    <img src={firstImage.url} alt={album.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <div className="text-white">
                      <h3 className="font-semibold text-sm">{album.name}</h3>
                      <p className="text-xs opacity-90">{albumImageCount} image{albumImageCount !== 1 ? 's' : ''}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Album Images */}
        {selectedAlbumId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-semibold">{albums.find(a => a.id === selectedAlbumId)?.name}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-1" /> Add Photos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-1" /> Camera
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentAlbumImages.length === 0 ? (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No images in this album.</p>
                </div>
              ) : (
                currentAlbumImages.map((item, idx) => (
                  <Dialog key={item.id} open={magnifiedImage?.id === item.id} onOpenChange={(open) => !open && setMagnifiedImage(null)}>
                    <DialogTrigger asChild>
                      <Card className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-none shadow-sm group relative">
                        <img src={item.url} alt="Gallery Item" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Card>
                    </DialogTrigger>
                    <DialogContent 
                      className="max-w-4xl p-4 overflow-hidden bg-transparent border-none shadow-none" 
                      onKeyDown={handleKeyDown}
                      onClick={() => {
                        setMagnifiedImage(item);
                        setMagnifiedImageIndex(idx);
                      }}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                        <img src={item.url} alt="Full View" className="max-w-full max-h-[70vh] rounded-lg" />
                        
                        {/* Swipe Navigation */}
                        <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                          {idx > 0 && (
                            <button
                              onClick={handleSwipePrev}
                              className="pointer-events-auto p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                            >
                              ←
                            </button>
                          )}
                          {idx < currentAlbumImages.length - 1 && (
                            <button
                              onClick={handleSwipeNext}
                              className="pointer-events-auto ml-auto p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                            >
                              →
                            </button>
                          )}
                        </div>

                        {/* Image counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full pointer-events-none">
                          {idx + 1} / {currentAlbumImages.length}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 z-50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareImage(item.url)}
                            className="bg-white/90 hover:bg-white"
                          >
                            <Share2 className="w-4 h-4 mr-1" /> Share
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(item.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))
              )}
            </div>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e)}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={(e) => handleFileUpload(e)}
        />
      </div>
    </Layout>
  );
}
