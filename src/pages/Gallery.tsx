import { useState, useEffect } from "react";
import BackgroundImage from "@/components/BackgroundImage";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, X, Trash2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption: string;
}

const withFullSrc = <T extends { src: string }>(p: T): T => ({
  ...p,
  src: p.src.startsWith("http")
    ? p.src
    : `${API_BASE_URL}${p.src.startsWith("/") ? "" : "/"}${p.src}`,
});

const Gallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const { isAdmin } = useAuth();
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<number>>(new Set());

  const handleImageLoad = (photoId: number) => {
    setLoadedPhotoIds((prev) => new Set(prev).add(photoId));
  };

  const handleImageError = (photoId: number) => {
    console.warn(`Failed to load image with ID: ${photoId}`);
    // Optionally, you could remove the photo from the main 'photos' state here
    // if you want to permanently hide it after a load error.
    // For now, we just won't add it to loadedPhotoIds, so it won't render.
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });
    formData.append("name", uploaderName);
    formData.append("email", uploaderEmail);
    formData.append("caption", caption);

    try {
      const response = await fetch(`${API_BASE_URL}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newPhotos = await response.json();
        if (newPhotos && newPhotos.length > 0) {
          setPhotos((prevPhotos) => [
            ...prevPhotos,
            ...newPhotos.map(withFullSrc),
          ]);
        }
        setUploaderName("");
        setUploaderEmail("");
        setCaption("");
        setSelectedFiles([]);
        toast.success("Photo(s) uploaded successfully!");
        // Refresh photos after upload
        fetch(`${API_BASE_URL}/photos`)
          .then((response) => response.json())
          .then((data) => {
            setPhotos(data.map(withFullSrc));
          })
          .catch((error) =>
            console.error("Error fetching photos after upload:", error),
          );
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

  const handleSelectPhoto = (photoId: number) => {
    setSelectedPhotos((prevSelected) =>
      prevSelected.includes(photoId)
        ? prevSelected.filter((id) => id !== photoId)
        : [...prevSelected, photoId],
    );
  };

  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);
  const [selectedPhotosToDelete, setSelectedPhotosToDelete] = useState<
    number[]
  >([]);

  const performDeleteSelectedPhotos = async (photoIds: number[]) => {
    if (photoIds.length === 0) return;

    try {
      const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }

      await Promise.all(
        photoIds.map((photoId) =>
          fetch(`${API_BASE_URL}/photos/${photoId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ),
      );
      setPhotos((prevPhotos) =>
        prevPhotos.filter((photo) => !photoIds.includes(photo.id)),
      );
      setSelectedPhotos([]);
      setIsSelectionMode(false);
      setShowMultiDeleteConfirm(false); // Close the dialog after deletion
      setSelectedPhotosToDelete([]); // Clear the photos to delete
      toast.success("Selected photo(s) deleted successfully!");
    } catch (error) {
      console.error("Error deleting photos:", error);
      toast.error("Failed to delete selected photo(s).");
    }
  };

  const handleDeleteSelectedPhotos = (photoIds: number[]) => {
    setSelectedPhotosToDelete(photoIds);
    setShowMultiDeleteConfirm(true);
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/photos`)
      .then((response) => response.json())
      .then((data) => {
        setPhotos(data.map(withFullSrc));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching photos:", error);
        setLoading(false);
      });
  }, []);

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % photos.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? photos.length - 1 : selectedImage - 1,
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <BackgroundImage opacity={0.3} />
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase subtle-glow">
              CHERISHED MEMORIES
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              A COLLECTION OF PRECIOUS MOMENTS WITH BERNARD "BK" KASEMA
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-lg aspect-square"
              >
                <Skeleton className="w-full h-full bg-purple-dark/30" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background with seamless scroll */}
      <BackgroundImage opacity={0.3} />

      <Navigation />

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase subtle-glow">
              CHERISHED MEMORIES
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              A COLLECTION OF PRECIOUS MOMENTS WITH BERNARD "BK" KASEMA
            </p>
          </div>

          <div className="w-full">
              <div className="mt-8 flex justify-center space-x-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">Upload Photos</Button>
                  </DialogTrigger>
                  <br />
                  <DialogContent className="sm:max-w-[425px] bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
                    <DialogHeader>
                      <DialogTitle className="text-gold">
                        UPLOAD PHOTOS
                      </DialogTitle>
                      <DialogDescription className="text-gray-300">
                        SHARE YOUR CHERISHED MEMORIES. ALL FIELDS ARE OPTIONAL.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          YOUR NAME
                        </Label>
                        <Input
                          id="name"
                          value={uploaderName}
                          onChange={(e) => setUploaderName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          YOUR EMAIL
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={uploaderEmail}
                          onChange={(e) => setUploaderEmail(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="caption" className="text-right">
                          CAPTION
                        </Label>
                        <Input
                          id="caption"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="picture" className="text-right">
                          PICTURES
                        </Label>
                        <Input
                          id="picture"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="col-span-3"
                        />
                      </div>
                      {selectedFiles.length > 0 && (
                        <div className="text-sm text-right text-gray-500 col-span-4">
                          {selectedFiles.length} file(s) selected
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                      >
                        {uploading
                          ? "Uploading..."
                          : `Upload ${selectedFiles.length} Photo(s)`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {isAdmin && (
                  <Button
                    className="btn-secondary"
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                  >
                    {isSelectionMode ? "Cancel Selection" : "Select Photos"}
                  </Button>
                )}
                {isAdmin && isSelectionMode && selectedPhotos.length > 0 && (
                  <Button
                    className="btn-danger"
                    onClick={() => handleDeleteSelectedPhotos(selectedPhotos)}
                  >
                    Delete Selected ({selectedPhotos.length})
                  </Button>
                )}
              </div>

              {/* Uniform grid layout */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`relative overflow-hidden rounded-lg bg-purple-dark/30 border border-gold/20 transition-all duration-200 cursor-pointer group hover:scale-105 aspect-square animate-fade-in ${isSelectionMode ? "hover:border-blue-400" : "hover:border-gold/60"} ${selectedPhotos.includes(photo.id) ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-black" : ""}`}
                    onClick={() =>
                      isSelectionMode
                        ? handleSelectPhoto(photo.id)
                        : setSelectedImage(index)
                    }
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {photo.caption}
                      </div>
                    )}
                    {isSelectionMode && (
                      <div className="absolute top-2 right-2">
                        <input
                          type="checkbox"
                          checked={selectedPhotos.includes(photo.id)}
                          onChange={() => handleSelectPhoto(photo.id)}
                          className="form-checkbox h-5 w-5 text-blue-600 bg-black border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}
                    {isAdmin && !isSelectionMode && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 transition-opacity duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gold">
                              ARE YOU SURE?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              This action cannot be undone. This will
                              permanently delete the photo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteSelectedPhotos([photo.id])
                              }
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>

              {photos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    No photos available at the moment.
                  </p>
                </div>
              )}
          </div>
        </main>

        {/* Multi-delete confirmation modal */}
        <AlertDialog
          open={showMultiDeleteConfirm}
          onOpenChange={setShowMultiDeleteConfirm}
        >
          <AlertDialogContent className="bg-purple-dark/90 border border-gold/30 text-white shadow-lg shadow-gold/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gold">
                CONFIRM DELETION
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to delete {selectedPhotosToDelete.length}{" "}
                selected photo(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  performDeleteSelectedPhotos(selectedPhotosToDelete)
                }
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Full-size modal */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative w-full h-full flex items-center justify-center animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[selectedImage].src}
                alt={photos[selectedImage].alt}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '85vh'
                }}
              />

              {/* Navigation arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gold hover:bg-black/90 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
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
              {photos[selectedImage].caption && (
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
                    {photos[selectedImage].caption}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default Gallery;
