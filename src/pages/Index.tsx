import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundImage from "@/components/BackgroundImage";
import { Calendar, Clock, Edit, Save, X, Loader2, Upload } from "lucide-react";
import EventCard from "@/components/EventCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAuth from "@/hooks/use-auth";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption: string;
}

interface Tribute {
  id: number;
  name: string;
  relationship: string;
  message: string;
  timestamp: string;
  type: string;
}

const withFullSrc = <T extends { src: string }>(p: T): T => ({
  ...p,
  src: p.src.startsWith("http")
    ? p.src
    : `${API_BASE_URL}${p.src.startsWith("/") ? "" : "/"}${p.src}`,
});

interface SiteSettings {
  deceased_name: string;
  deceased_nickname: string;
  birth_year: string;
  death_year: string;
  profile_photo_url: string;
  background_photo_url: string;
  roles_titles: string;
  life_summary: string;
  memorial_event_1_title: string;
  memorial_event_1_date: string;
  memorial_event_1_location: string;
  memorial_event_2_title: string;
  memorial_event_2_date: string;
  memorial_event_2_location: string;
}

interface InformationEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  content: string;
  type: string;
}

const Index = () => {
  const { isAdmin, token } = useAuth();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [previewImages, setPreviewImages] = useState<Photo[]>([]);
  const [recentTributes, setRecentTributes] = useState<Tribute[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [eulogyPreview, setEulogyPreview] = useState<string>("");
  const [infoEvents, setInfoEvents] = useState<InformationEvent[]>([]);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [editFormData, setEditFormData] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/photos`)
      .then((response) => response.json())
      .then((data) => {
        setPreviewImages(data.slice(0, 6).map(withFullSrc));
      })
      .catch((error) => console.error("Error fetching photos:", error));

    fetch(`${API_BASE_URL}/tributes`)
      .then((response) => response.json())
      .then((data) => {
        setRecentTributes(data.slice(0, 3));
      })
      .catch((error) => console.error("Error fetching tributes:", error));

    fetch(`${API_BASE_URL}/information-events`)
      .then((response) => response.json())
      .then((data) => {
        setInfoEvents(data.slice(0, 2));
      })
      .catch((error) => console.error("Error fetching events:", error));

    fetch(`${API_BASE_URL}/site-settings`)
      .then((response) => response.json())
      .then((data) => {
        setSiteSettings(data);
        // Update document title
        document.title = `${data.deceased_name} - Memorial Site`;
      })
      .catch((error) => console.error("Error fetching site settings:", error));

    fetch(`${API_BASE_URL}/eulogy`)
      .then((response) => response.json())
      .then((data) => {
        // Parse HTML to get preview - skip headings, only first paragraph
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data.content || "";

        // Find the first paragraph (skip headings)
        let previewText = "";
        const children = tempDiv.children;

        for (let i = 0; i < children.length; i++) {
          const element = children[i] as HTMLElement;
          const text = (element.textContent || "").trim();

          // Skip headings, only get first paragraph
          if (element.tagName === "P" && text.length > 0) {
            if (text.length > 300) {
              previewText = text.substring(0, 300) + "...";
            } else {
              previewText = text;
            }
            break; // Stop after first paragraph
          }
        }

        // If no paragraph found, try to get any text content
        if (!previewText) {
          const textContent = tempDiv.textContent || tempDiv.innerText || "";
          const cleaned = textContent.trim();
          previewText =
            cleaned.substring(0, 300) + (cleaned.length > 300 ? "..." : "");
        }

        setEulogyPreview(previewText);
      })
      .catch((error) => console.error("Error fetching eulogy:", error));
  }, []);

  const truncateHTML = (html: string, maxLength: number) => {
    const strippedString = html.replace(/<[^>]+>/g, "");
    if (strippedString.length <= maxLength) return strippedString;
    return strippedString.substring(0, maxLength) + "...";
  };

  const handleEditProfile = () => {
    setEditFormData(siteSettings);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editFormData) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      setSiteSettings(editFormData);
      setIsEditProfileOpen(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    photoType: "profile" | "background"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const setUploading =
      photoType === "profile" ? setUploadingProfile : setUploadingBackground;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("photoType", photoType);

      const response = await fetch(
        `${API_BASE_URL}/site-settings/upload-photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload photo");

      const data = await response.json();
      const settingKey =
        photoType === "profile" ? "profile_photo_url" : "background_photo_url";

      setEditFormData((prev) =>
        prev
          ? {
              ...prev,
              [settingKey]: data.url,
            }
          : null
      );

      toast.success(
        `${photoType === "profile" ? "Profile" : "Background"} photo uploaded!`
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background with the uploaded image */}
      {<BackgroundImage />}

      <Navigation />

      <div className="relative z-10">
        {/* Hero Section - Main Image Display */}
        <section className="relative isolate overflow-hidden">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80"></div>

          {/* Content wrapper — extra top-padding on md+ so it clears the fixed navbar */}
          <div className="relative z-20 mx-auto max-w-6xl px-4 flex flex-col items-center justify-center pt-12 pb-12 md:pt-36 md:pb-24 lg:pt-40">
            {/* Years & portrait */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-16 mb-8">
              {/* Birth Year */}
              <div
                className="text-center md:text-right animate-fade-in order-1"
                style={{ animationDelay: "0.2s" }}
              >
                <div
                  className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-gold subtle-glow"
                  style={{ fontFamily: '"Cinzel Decorative", cursive' }}
                >
                  {siteSettings?.birth_year || "1950"}
                </div>
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl text-gray-300 uppercase tracking-wider">
                  Born
                </div>
              </div>

              {/* Portrait */}
              <div
                className="relative animate-scale-in order-2"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-gold shadow-2xl shadow-gold/30">
                  <img
                    src={
                      siteSettings?.profile_photo_url ||
                      "/lovable-uploads/placeholder-profile.png"
                    }
                    alt={siteSettings?.deceased_name || "Memorial Photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center border border-gold/40 shadow-lg animate-pulse">
                  <div className="text-black text-sm md:text-xl">🕊️</div>
                </div>
              </div>

              {/* Death Year */}
              <div
                className="text-center md:text-left animate-fade-in order-3"
                style={{ animationDelay: "0.6s" }}
              >
                <div
                  className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-gold subtle-glow"
                  style={{ fontFamily: '"Cinzel Decorative", cursive' }}
                >
                  {siteSettings?.death_year || "2024"}
                </div>
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl text-gray-300 uppercase tracking-wider">
                  Rest
                </div>
              </div>
            </div>

            {/* Name & title */}
            <div
              className="animate-fade-in-up text-center"
              style={{ animationDelay: "0.8s" }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gold mb-2 tracking-wide subtle-glow">
                IN LOVING MEMORY
              </h1>
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-4"></div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4">
                {siteSettings?.deceased_name?.toUpperCase() || "JOHN DOE"}
              </h2>
              {siteSettings?.deceased_nickname && (
                <p className="text-lg sm:text-xl md:text-2xl text-gold italic font-medium mb-6">
                  "{siteSettings.deceased_nickname}"
                </p>
              )}
              <p className="text-base sm:text-lg md:text-xl text-gray-200 font-semibold uppercase tracking-wider">
                {siteSettings?.roles_titles ||
                  "Father • Leader • Mentor • Friend"}
              </p>
              {isAdmin && (
                <Button
                  onClick={handleEditProfile}
                  className="mt-6 bg-gold hover:bg-gold/80 text-black font-semibold"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Life Story Preview Section with fade overlay */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 fade-overlay"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl text-gold mb-6 subtle-glow">
              LIFE STORY
            </h2>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"></div>
            <p className="text-gray-200 leading-relaxed text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              {eulogyPreview ||
                siteSettings?.life_summary ||
                "It is with deep sorrow and heavy hearts that we remember the life of our beloved."}
            </p>
            <Link
              to="/eulogy"
              className="btn-primary inline-flex items-center space-x-2 font-tt-chocolates"
            >
              <span>Read Full Life Story</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* Cherished Memories Section */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl text-gold mb-6 text-center subtle-glow">
              CHERISHED MEMORIES
            </h2>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-12"></div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {previewImages.map((image, index) => (
                <div
                  key={image.id}
                  className="relative overflow-hidden rounded-lg bg-purple-dark/30 border border-gold/20 hover:border-gold/60 transition-all duration-300 cursor-pointer group hover:scale-105 aspect-square animate-fade-in-up"
                  onClick={() => setSelectedImage(index)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/gallery"
                className="btn-secondary inline-flex items-center space-x-2 font-tt-chocolates"
              >
                <span>View All Photos</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Tributes Section */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 bg-black/80"></div>
          <div className="relative z-10 max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl text-center text-gold mb-6 subtle-glow">
              WORDS OF REMEMBRANCE
            </h2>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-12"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {recentTributes.map((tribute, index) => (
                <Link
                  to={`/tributes#tribute-${tribute.id}`}
                  key={tribute.id}
                  className="bg-purple-dark/50 p-6 rounded-xl border border-gold/20 hover:border-gold/60 transition-all duration-300 hover:scale-105 h-full flex flex-col animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="text-4xl text-gold/50 mb-3">"</div>
                  <div
                    className="text-gray-200 mb-5 italic flex-grow"
                    dangerouslySetInnerHTML={{
                      __html: truncateHTML(tribute.message, 200),
                    }}
                  />
                  <div className="text-right mt-auto">
                    <p className="text-gold text-md">{tribute.name}</p>
                    <p className="text-sm text-gray-400">
                      {tribute.relationship}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/tributes"
                className="btn-primary inline-flex items-center space-x-2 font-tt-chocolates"
              >
                <span>Read More Tributes</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Memorial Information Section */}
        <section className="relative py-16 md:py-24">
          <div className="absolute inset-0 bg-black/90"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl text-gold mb-6 subtle-glow">
                MEMORIAL INFORMATION
              </h2>
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"></div>

              <p className="text-gray-200 leading-relaxed text-lg md:text-xl mb-8">
                Find details for the upcoming memorial service, viewing times,
                and other related events to celebrate the life of{" "}
                {siteSettings?.deceased_name || "our loved one"}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {infoEvents.length >= 2 ? (
                  <>
                    <EventCard
                      icon="church"
                      title={infoEvents[0].title.toUpperCase()}
                      date={infoEvents[0].date}
                      location={infoEvents[0].venue}
                    />
                    <EventCard
                      icon="cross"
                      title={infoEvents[1].title.toUpperCase()}
                      date={infoEvents[1].date}
                      location={infoEvents[1].venue}
                    />
                  </>
                ) : (
                  <>
                    <EventCard
                      icon="church"
                      title={
                        siteSettings?.memorial_event_1_title?.toUpperCase() ||
                        "MEMORIAL SERVICE"
                      }
                      date={siteSettings?.memorial_event_1_date || "Date TBD"}
                      location={
                        siteSettings?.memorial_event_1_location ||
                        "Location TBD"
                      }
                    />
                    <EventCard
                      icon="cross"
                      title={
                        siteSettings?.memorial_event_2_title?.toUpperCase() ||
                        "FUNERAL SERVICE"
                      }
                      date={siteSettings?.memorial_event_2_date || "Date TBD"}
                      location={
                        siteSettings?.memorial_event_2_location ||
                        "Location TBD"
                      }
                    />
                  </>
                )}
              </div>

              <Link
                to="/information"
                className="btn-primary inline-flex items-center space-x-2 font-tt-chocolates"
              >
                <span>View Full Details</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

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
                src={previewImages[selectedImage].src}
                alt={previewImages[selectedImage].alt}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                }}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="bg-purple-dark/95 backdrop-blur-sm border border-gold/30 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold text-2xl">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the memorial profile information
            </DialogDescription>
          </DialogHeader>

          {editFormData && (
            <div className="space-y-6 mt-4">
              {/* Photos Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gold">Photos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Profile Photo</Label>
                    {editFormData.profile_photo_url && (
                      <div className="mt-2 mb-2">
                        <img
                          src={editFormData.profile_photo_url}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gold/30"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, "profile")}
                        disabled={uploadingProfile}
                        className="bg-black/30 border-gold/30 text-white text-sm"
                      />
                      {uploadingProfile && (
                        <Loader2 className="w-5 h-5 animate-spin text-gold" />
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Background Photo</Label>
                    {editFormData.background_photo_url && (
                      <div className="mt-2 mb-2">
                        <img
                          src={editFormData.background_photo_url}
                          alt="Background"
                          className="w-full h-20 object-cover rounded border-2 border-gold/30"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, "background")}
                        disabled={uploadingBackground}
                        className="bg-black/30 border-gold/30 text-white text-sm"
                      />
                      {uploadingBackground && (
                        <Loader2 className="w-5 h-5 animate-spin text-gold" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gold">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={editFormData.deceased_name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          deceased_name: e.target.value,
                        })
                      }
                      className="bg-black/30 border-gold/30 text-white"
                    />
                  </div>

                  <div>
                    <Label>Nickname (Optional)</Label>
                    <Input
                      value={editFormData.deceased_nickname}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          deceased_nickname: e.target.value,
                        })
                      }
                      placeholder='e.g., "BK"'
                      className="bg-black/30 border-gold/30 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Birth Year *</Label>
                    <Input
                      value={editFormData.birth_year}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          birth_year: e.target.value,
                        })
                      }
                      placeholder="1950"
                      className="bg-black/30 border-gold/30 text-white"
                    />
                  </div>

                  <div>
                    <Label>Death Year *</Label>
                    <Input
                      value={editFormData.death_year}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          death_year: e.target.value,
                        })
                      }
                      placeholder="2024"
                      className="bg-black/30 border-gold/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label>Roles/Titles (separated by •)</Label>
                  <Input
                    value={editFormData.roles_titles}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        roles_titles: e.target.value,
                      })
                    }
                    placeholder="Father • Leader • Mentor • Friend"
                    className="bg-black/30 border-gold/30 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setIsEditProfileOpen(false)}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gold hover:bg-gold/80 text-black font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
