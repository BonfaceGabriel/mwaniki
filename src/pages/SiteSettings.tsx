import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useAuth from "@/hooks/use-auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Loader2, Upload, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BackgroundImage from "@/components/BackgroundImage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  paybill_number: string;
  paybill_account_name: string;
  mpesa_phone_number: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  family_name: string;
}

const SiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    deceased_name: "",
    deceased_nickname: "",
    birth_year: "",
    death_year: "",
    profile_photo_url: "",
    background_photo_url: "",
    roles_titles: "",
    life_summary: "",
    memorial_event_1_title: "",
    memorial_event_1_date: "",
    memorial_event_1_location: "",
    memorial_event_2_title: "",
    memorial_event_2_date: "",
    memorial_event_2_location: "",
    paybill_number: "",
    paybill_account_name: "",
    mpesa_phone_number: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    family_name: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const { isAdmin, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Give a moment for auth to initialize
    const timer = setTimeout(() => {
      if (!isAdmin && !token) {
        console.log("Not authenticated, redirecting to login");
        navigate("/login");
        return;
      }
      if (isAdmin) {
        fetchSettings();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAdmin, token, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`);
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
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

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();
      const settingKey =
        photoType === "profile" ? "profile_photo_url" : "background_photo_url";

      setSettings((prev) => ({
        ...prev,
        [settingKey]: data.url,
      }));

      toast.success(`${photoType === "profile" ? "Profile" : "Background"} photo uploaded successfully!`);
    } catch (err) {
      console.error("Error uploading photo:", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    field: keyof SiteSettings,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundImage />
      <Navigation />

      <div className="relative z-10">
        <main className="max-w-5xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase subtle-glow">
              SITE SETTINGS
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              CUSTOMIZE YOUR MEMORIAL SITE
            </p>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-purple-dark/50 backdrop-blur-sm border-gold/30">
              <CardHeader>
                <CardTitle className="text-gold">Basic Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Update the deceased person's information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deceased_name">Full Name *</Label>
                    <Input
                      id="deceased_name"
                      value={settings.deceased_name}
                      onChange={(e) =>
                        handleChange("deceased_name", e.target.value)
                      }
                      className="bg-black/50 border-gold/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deceased_nickname">
                      Nickname (Optional)
                    </Label>
                    <Input
                      id="deceased_nickname"
                      value={settings.deceased_nickname}
                      onChange={(e) =>
                        handleChange("deceased_nickname", e.target.value)
                      }
                      placeholder='e.g., "BK"'
                      className="bg-black/50 border-gold/30 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birth_year">Birth Year *</Label>
                    <Input
                      id="birth_year"
                      value={settings.birth_year}
                      onChange={(e) =>
                        handleChange("birth_year", e.target.value)
                      }
                      placeholder="1950"
                      className="bg-black/50 border-gold/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="death_year">Death Year *</Label>
                    <Input
                      id="death_year"
                      value={settings.death_year}
                      onChange={(e) =>
                        handleChange("death_year", e.target.value)
                      }
                      placeholder="2024"
                      className="bg-black/50 border-gold/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="roles_titles">
                    Roles/Titles (separated by •)
                  </Label>
                  <Input
                    id="roles_titles"
                    value={settings.roles_titles}
                    onChange={(e) => handleChange("roles_titles", e.target.value)}
                    placeholder="Father • Leader • Mentor • Friend"
                    className="bg-black/50 border-gold/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="life_summary">Life Summary</Label>
                  <Textarea
                    id="life_summary"
                    value={settings.life_summary}
                    onChange={(e) => handleChange("life_summary", e.target.value)}
                    rows={4}
                    className="bg-black/50 border-gold/30 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-purple-dark/50 backdrop-blur-sm border-gold/30">
              <CardHeader>
                <CardTitle className="text-gold">Photos</CardTitle>
                <CardDescription className="text-gray-300">
                  Upload profile and background photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Profile Photo</Label>
                  {settings.profile_photo_url && (
                    <div className="mt-2 mb-4">
                      <img
                        src={settings.profile_photo_url}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-2 border-gold/30"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "profile")}
                      disabled={uploadingProfile}
                      className="bg-black/50 border-gold/30 text-white"
                    />
                    {uploadingProfile && (
                      <Loader2 className="w-5 h-5 animate-spin text-gold" />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Background Photo</Label>
                  {settings.background_photo_url && (
                    <div className="mt-2 mb-4">
                      <img
                        src={settings.background_photo_url}
                        alt="Background"
                        className="w-full h-32 object-cover rounded border-2 border-gold/30"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, "background")}
                      disabled={uploadingBackground}
                      className="bg-black/50 border-gold/30 text-white"
                    />
                    {uploadingBackground && (
                      <Loader2 className="w-5 h-5 animate-spin text-gold" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memorial Events */}
            <Card className="bg-purple-dark/50 backdrop-blur-sm border-gold/30">
              <CardHeader>
                <CardTitle className="text-gold">Memorial Events</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure memorial service details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gold">Event 1</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="memorial_event_1_title">Event Title</Label>
                      <Input
                        id="memorial_event_1_title"
                        value={settings.memorial_event_1_title}
                        onChange={(e) =>
                          handleChange("memorial_event_1_title", e.target.value)
                        }
                        placeholder="Memorial Service"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memorial_event_1_date">Date</Label>
                      <Input
                        id="memorial_event_1_date"
                        value={settings.memorial_event_1_date}
                        onChange={(e) =>
                          handleChange("memorial_event_1_date", e.target.value)
                        }
                        placeholder="Tuesday, 15th July 2025"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memorial_event_1_location">Location</Label>
                      <Input
                        id="memorial_event_1_location"
                        value={settings.memorial_event_1_location}
                        onChange={(e) =>
                          handleChange("memorial_event_1_location", e.target.value)
                        }
                        placeholder="Location Name, City"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gold/20 pt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gold">Event 2</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="memorial_event_2_title">Event Title</Label>
                      <Input
                        id="memorial_event_2_title"
                        value={settings.memorial_event_2_title}
                        onChange={(e) =>
                          handleChange("memorial_event_2_title", e.target.value)
                        }
                        placeholder="Funeral Service"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memorial_event_2_date">Date</Label>
                      <Input
                        id="memorial_event_2_date"
                        value={settings.memorial_event_2_date}
                        onChange={(e) =>
                          handleChange("memorial_event_2_date", e.target.value)
                        }
                        placeholder="Wednesday, 16th July 2025"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="memorial_event_2_location">Location</Label>
                      <Input
                        id="memorial_event_2_location"
                        value={settings.memorial_event_2_location}
                        onChange={(e) =>
                          handleChange("memorial_event_2_location", e.target.value)
                        }
                        placeholder="Location Name, City"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family & Support Information */}
            <Card className="bg-purple-dark/50 backdrop-blur-sm border-gold/30">
              <CardHeader>
                <CardTitle className="text-gold">Family & Support Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure family name and payment/support details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="family_name">Family Name *</Label>
                  <Input
                    id="family_name"
                    value={settings.family_name}
                    onChange={(e) => handleChange("family_name", e.target.value)}
                    placeholder="The Smith Family"
                    className="bg-black/50 border-gold/30 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Displayed at the bottom of the Information page
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gold/80">Paybill (M-Pesa)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paybill_number">Paybill Number</Label>
                      <Input
                        id="paybill_number"
                        value={settings.paybill_number}
                        onChange={(e) =>
                          handleChange("paybill_number", e.target.value)
                        }
                        placeholder="e.g., 4161461"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paybill_account_name">Account Name</Label>
                      <Input
                        id="paybill_account_name"
                        value={settings.paybill_account_name}
                        onChange={(e) =>
                          handleChange("paybill_account_name", e.target.value)
                        }
                        placeholder="e.g., Memorial Fund"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-semibold text-gold/80 pt-4">M-Pesa Direct (Send Money)</h4>
                  <div>
                    <Label htmlFor="mpesa_phone_number">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesa_phone_number"
                      value={settings.mpesa_phone_number}
                      onChange={(e) =>
                        handleChange("mpesa_phone_number", e.target.value)
                      }
                      placeholder="e.g., +254 712 345 678"
                      className="bg-black/50 border-gold/30 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Phone number for direct M-Pesa transfers
                    </p>
                  </div>

                  <h4 className="text-md font-semibold text-gold/80 pt-4">Bank Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={settings.bank_name}
                        onChange={(e) =>
                          handleChange("bank_name", e.target.value)
                        }
                        placeholder="e.g., Equity Bank"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_account_number">Account Number</Label>
                      <Input
                        id="bank_account_number"
                        value={settings.bank_account_number}
                        onChange={(e) =>
                          handleChange("bank_account_number", e.target.value)
                        }
                        placeholder="e.g., 1234567890"
                        className="bg-black/50 border-gold/30 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bank_account_name">Account Name</Label>
                    <Input
                      id="bank_account_name"
                      value={settings.bank_account_name}
                      onChange={(e) =>
                        handleChange("bank_account_name", e.target.value)
                      }
                      placeholder="e.g., John Doe Memorial Fund"
                      className="bg-black/50 border-gold/30 text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Leave fields empty to hide that payment method
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
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
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SiteSettings;
