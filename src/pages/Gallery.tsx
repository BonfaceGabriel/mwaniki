import { useState, useEffect } from "react";
import BackgroundImage from "@/components/BackgroundImage";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, X, Trash2, Edit, PlusCircle } from "lucide-react";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Photo {
  id: string;
  src: string;
  alt: string;
  caption: string;
  album_id: string | null;
}

interface Album {
  id: string;
  name: string;
  description: string;
  photos: Photo[];
}

interface SiteSettings {
  deceased_name: string;
}

const withFullSrc = <T extends { src: string }>(p: T): T => ({
  ...p,
  src: p.src.startsWith("http")
    ? p.src
    : `${API_BASE_URL}${p.src.startsWith("/") ? "" : "/"}${p.src}`,
});

interface PhotoData extends Photo {
  album_name: string;
  album_description: string;
}

const Gallery = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { isAdmin, token } = useAuth();
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadAlbumId, setUploadAlbumId] = useState<string | null>(null);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      // Fetch all albums first
      const albumsResponse = await fetch(`${API_BASE_URL}/albums`);
      const albumsData = await albumsResponse.json();

      // Fetch all photos
      const photosResponse = await fetch(`${API_BASE_URL}/photos`);
      const photosData: PhotoData[] = await photosResponse.json();

      // Create a map of albums with empty photo arrays
      const albumsMap: { [key: string]: Album } = {};
      albumsData.forEach((album: { id: string; name: string; description: string }) => {
        albumsMap[album.id] = {
          id: album.id,
          name: album.name,
          description: album.description,
          photos: [],
        };
      });

      // Distribute photos into albums
      const othersPhotos: Photo[] = [];
      photosData.forEach((photo) => {
        const albumId = photo.album_id;
        if (albumId && albumsMap[albumId]) {
          albumsMap[albumId].photos.push(withFullSrc(photo));
        } else {
          othersPhotos.push(withFullSrc(photo));
        }
      });

      // Convert albums map to array
      const fetchedAlbums = Object.values(albumsMap);

      // Add "Others" album if there are photos without an album
      if (othersPhotos.length > 0) {
        fetchedAlbums.push({
          id: "others",
          name: "Others",
          description: "A collection of various moments.",
          photos: othersPhotos,
        });
      }

      setAlbums(fetchedAlbums);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching gallery data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();

    fetch(`${API_BASE_URL}/site-settings`)
      .then((response) => response.json())
      .then((data) => setSiteSettings(data))
      .catch((error) => console.error("Error fetching site settings:", error));
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("photos", file));
    formData.append("name", uploaderName);
    formData.append("email", uploaderEmail);
    formData.append("caption", caption);
    if (uploadAlbumId && uploadAlbumId !== 'null') {
      formData.append("album_id", uploadAlbumId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/photos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        setIsUploadDialogOpen(false);
        toast.success("Photo(s) uploaded successfully!");
        fetchGalleryData(); // Refresh all data
      } else {
        toast.error("Failed to upload photo(s).");
      }
    } catch (error) {
      console.error("Error uploading photo(s):", error);
      toast.error("Error uploading photo(s).");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    try {
      const response = await fetch(`${API_BASE_URL}/photos/${editingPhoto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caption: editingPhoto.caption,
          album_id: editingPhoto.album_id === 'others' ? null : editingPhoto.album_id,
        }),
      });

      if (response.ok) {
        toast.success("Photo updated successfully!");
        setIsPhotoDialogOpen(false);
        setEditingPhoto(null);
        fetchGalleryData();
      } else {
        toast.error("Failed to save photo.");
      }
    } catch (error) {
      console.error("Error saving photo:", error);
      toast.error("Error saving photo.");
    }
  };

  const openPhotoDialog = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsPhotoDialogOpen(true);
  };

  const handleBulkMove = async (albumId: string | null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/photos/bulk-move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoIds: selectedPhotos, albumId: albumId === 'others' ? null : albumId }),
      });

      if (response.ok) {
        toast.success("Photos moved successfully!");
        setIsMoveDialogOpen(false);
        setSelectedPhotos([]);
        setIsSelectionMode(false);
        fetchGalleryData();
      } else {
        toast.error("Failed to move photos.");
      }
    } catch (error) {
      console.error("Error moving photos:", error);
      toast.error("Error moving photos.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photos/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoIds: selectedPhotos }),
      });

      if (response.ok) {
        toast.success("Photos deleted successfully!");
        setSelectedPhotos([]);
        setIsSelectionMode(false);
        fetchGalleryData();
      } else {
        toast.error("Failed to delete photos.");
      }
    } catch (error) {
      console.error("Error deleting photos:", error);
      toast.error("Error deleting photos.");
    }
  };

  const handleAlbumFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = editingAlbum && editingAlbum.id;
    const url = isEditing ? `${API_BASE_URL}/albums/${editingAlbum.id}` : `${API_BASE_URL}/albums`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingAlbum?.name, description: editingAlbum?.description }),
      });

      if (response.ok) {
        toast.success(`Album ${isEditing ? "updated" : "created"} successfully!`);
        setIsAlbumDialogOpen(false);
        setEditingAlbum(null);
        fetchGalleryData();
      } else {
        toast.error("Failed to save album.");
      }
    } catch (error) {
      console.error("Error saving album:", error);
      toast.error("Error saving album.");
    }
  };

  const openAlbumDialog = (album: Album | null) => {
    setEditingAlbum(album);
    setIsAlbumDialogOpen(true);
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Album deleted successfully!");
        fetchGalleryData();
      } else {
        toast.error("Failed to delete album.");
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      toast.error("Error deleting album.");
    }
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotos((prevSelected) =>
      prevSelected.includes(photoId)
        ? prevSelected.filter((id) => id !== photoId)
        : [...prevSelected, photoId]
    );
  };

  const renderAlbumView = () => (
    <>
      <div className="mt-8 flex justify-center space-x-4">
        <Button className="btn-primary" onClick={() => setIsUploadDialogOpen(true)}>Upload Photos</Button>
        {isAdmin && <Button className="btn-secondary" onClick={() => openAlbumDialog(null)}><PlusCircle className="w-4 h-4 mr-2" />Create Album</Button>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
        {albums.map((album) => (
          <div key={album.id} className="relative group cursor-pointer" onClick={() => setSelectedAlbum(album)}>
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
              {album.photos.length > 0 ? (
                <img src={album.photos[0].src} alt={album.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-sm">Empty Album</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="font-bold text-lg">{album.name}</h3>
              <p className="text-sm">{album.photos.length} {album.photos.length === 1 ? 'photo' : 'photos'}</p>
            </div>
            {isAdmin && album.id !== "others" && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openAlbumDialog(album); }}><Edit className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will delete the album. Photos in this album will be moved to "Others". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteAlbum(album.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderPhotosView = () => (
    <>
      <div className="flex justify-between items-center mb-8">
        <Button onClick={() => setSelectedAlbum(null)}><ArrowLeft className="w-4 h-4 mr-2" />Back to Albums</Button>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              {isSelectionMode ? (
                <>
                  <Button onClick={() => setIsMoveDialogOpen(true)} disabled={selectedPhotos.length === 0}>Move Selected</Button>
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={selectedPhotos.length === 0}>Delete Selected</Button>
                  <Button variant="secondary" onClick={() => setIsSelectionMode(false)}>Cancel</Button>
                </>
              ) : (
                <Button onClick={() => setIsSelectionMode(true)}>Select Photos</Button>
              )}
            </>
          )}
          <Button className="btn-primary" onClick={() => {
            setUploadAlbumId(selectedAlbum?.id !== 'others' ? selectedAlbum?.id || null : null);
            setIsUploadDialogOpen(true);
          }}>Upload Photos</Button>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-gold mb-4">{selectedAlbum?.name}</h2>
      <p className="text-gray-300 mb-8">{selectedAlbum?.description}</p>
      {selectedAlbum?.photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No photos in this album yet</h3>
          <p className="text-gray-500 mb-6">Upload photos to start building this collection</p>
          <Button className="btn-primary" onClick={() => {
            setUploadAlbumId(selectedAlbum?.id !== 'others' ? selectedAlbum?.id || null : null);
            setIsUploadDialogOpen(true);
          }}>Upload Photos</Button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {selectedAlbum?.photos.map((photo, index) => (
          <div key={photo.id} className={`relative group cursor-pointer break-inside-avoid mb-3 ${isSelectionMode ? 'cursor-pointer' : ''}`} onClick={() => isSelectionMode ? handleSelectPhoto(photo.id) : setSelectedImage(index)}>
            <img src={photo.src} alt={photo.alt} className="w-full h-auto object-cover rounded-lg" />
            {isSelectionMode && (
              <div className={`absolute inset-0 bg-black/50 flex items-center justify-center ${selectedPhotos.includes(photo.id) ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity`}>
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
            )}
            {isAdmin && !isSelectionMode && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openPhotoDialog(photo); }}><Edit className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the photo.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleBulkDelete()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundImage />
      <Navigation />
      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase subtle-glow">CHERISHED MEMORIES</h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">A COLLECTION OF PRECIOUS MOMENTS WITH {siteSettings?.deceased_name?.toUpperCase() || "YOUR LOVED ONE"}</p>
          </div>
          {loading ? <p>Loading...</p> : (selectedAlbum ? renderPhotosView() : renderAlbumView())}
        </main>
        <Footer />
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
          <DialogHeader>
            <DialogTitle className="text-gold text-xl">UPLOAD PHOTOS</DialogTitle>
            <DialogDescription className="text-gray-300 text-sm">SHARE YOUR CHERISHED MEMORIES. ALL FIELDS ARE OPTIONAL.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
            <Input placeholder="Your Name (Optional)" value={uploaderName} onChange={(e) => setUploaderName(e.target.value)} />
            <Input placeholder="Your Email (Optional)" value={uploaderEmail} onChange={(e) => setUploaderEmail(e.target.value)} />
            <Input placeholder="Caption (Optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <Select value={uploadAlbumId || "null"} onValueChange={setUploadAlbumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an album (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Others</SelectItem>
                {albums.filter(a => a.id !== 'others').map(album => (
                  <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleUpload} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Album Dialog */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? "Edit Album" : "Create Album"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAlbumFormSubmit}>
            <div className="grid gap-4 py-4">
              <Input placeholder="Album Name" value={editingAlbum?.name || ""} onChange={(e) => setEditingAlbum(prev => ({ ...prev, id: prev?.id || '', photos: prev?.photos || [], description: prev?.description || '', name: e.target.value }))} required />
              <Textarea placeholder="Album Description" value={editingAlbum?.description || ""} onChange={(e) => setEditingAlbum(prev => ({ ...prev, id: prev?.id || '', photos: prev?.photos || [], name: prev?.name || '', description: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Edit Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePhotoFormSubmit}>
            <div className="grid gap-4 py-4">
              <Input placeholder="Caption" value={editingPhoto?.caption || ""} onChange={(e) => setEditingPhoto(prev => prev ? { ...prev, caption: e.target.value } : null)} />
              <Select value={editingPhoto?.album_id || "others"} onValueChange={(value) => setEditingPhoto(prev => prev ? { ...prev, album_id: value } : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="others">Others</SelectItem>
                  {albums.filter(a => a.id !== 'others').map(album => (
                    <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Photos Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
          <DialogHeader>
            <DialogTitle>Move Photos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select onValueChange={(value) => handleBulkMove(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="others">Others</SelectItem>
                {albums.filter(a => a.id !== 'others').map(album => (
                  <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size modal */}
      {selectedImage !== null && selectedAlbum && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedAlbum.photos[selectedImage].src}
              alt={selectedAlbum.photos[selectedImage].alt}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
              style={{
                maxWidth: "95vw",
                maxHeight: "85vh",
              }}
            />

            {/* Navigation arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((selectedImage + selectedAlbum.photos.length - 1) % selectedAlbum.photos.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gold hover:bg-black/90 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((selectedImage + 1) % selectedAlbum.photos.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gold hover:bg-black/90 transition-colors"
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gold hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Caption */}
            {selectedAlbum.photos[selectedImage].caption && (
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                  {selectedAlbum.photos[selectedImage].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
