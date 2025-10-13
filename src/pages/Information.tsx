import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundImage from "@/components/BackgroundImage";
import { Calendar, Clock, MapPin, Users, Heart, Edit, Trash2, Plus, Loader2, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import EventCard from "@/components/EventCard";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface Update {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  content: string;
  type: "event" | "announcement" | "service";
  display_order?: number;
}

interface SiteSettings {
  deceased_name?: string;
  paybill_number?: string;
  paybill_account_name?: string;
  mpesa_phone_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  family_name?: string;
}

const Information = () => {
  const { isAdmin, token } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Update | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Update | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for event dialog
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    venue: "",
    content: "",
    type: "event" as "event" | "announcement" | "service",
    display_order: 0,
  });

  useEffect(() => {
    fetchEvents();
    fetchSiteSettings();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/information-events`);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setUpdates(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`);
      if (!response.ok) throw new Error("Failed to fetch site settings");
      const data = await response.json();
      setSiteSettings(data);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    // Use the next available order number
    const nextOrder = updates.length > 0
      ? Math.max(...updates.map(u => u.display_order || 0)) + 1
      : 1;
    setFormData({
      title: "",
      date: "",
      time: "",
      venue: "",
      content: "",
      type: "event",
      display_order: nextOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditEvent = (event: Update) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      content: event.content,
      type: event.type,
      display_order: event.display_order || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.date) {
      toast.error("Please fill in at least title and date");
      return;
    }

    setSaving(true);
    try {
      const url = editingEvent
        ? `${API_BASE_URL}/information-events/${editingEvent.id}`
        : `${API_BASE_URL}/information-events`;

      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save event");

      toast.success(editingEvent ? "Event updated successfully!" : "Event created successfully!");
      setIsEditDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/information-events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete event");

      toast.success("Event deleted successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "border-gold/30 bg-gold/10";
      case "event":
        return "border-purple-medium/30 bg-purple-medium/10";
      case "service":
        return "border-gold/30 bg-gold/10";
      default:
        return "border-gold/30 bg-gold/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <BackgroundImage opacity={0.3} />
        <Navigation />
        <div className="relative z-10 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
        <Footer />
      </div>
    );
  }

  // Get first two events for the cards
  const firstTwoEvents = updates.slice(0, 2);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background with seamless scroll */}
      <BackgroundImage opacity={0.3} />

      <Navigation />

      <div className="relative z-10">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase gold-shimmer">
              IMPORTANT DATES & DETAILS
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              A SCHEDULE OF EVENTS TO HONOR AND CELEBRATE THE LIFE OF {siteSettings?.deceased_name?.toUpperCase() || "OUR LOVED ONE"}.
            </p>
          </div>

          {firstTwoEvents.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <EventCard
                icon="church"
                title={firstTwoEvents[0].title.toUpperCase()}
                date={firstTwoEvents[0].date}
                location={firstTwoEvents[0].venue}
              />
              <EventCard
                icon="cross"
                title={firstTwoEvents[1].title.toUpperCase()}
                date={firstTwoEvents[1].date}
                location={firstTwoEvents[1].venue}
              />
            </div>
          )}

          {isAdmin && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={handleAddEvent}
                className="bg-gold hover:bg-gold/80 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          )}

          <div className="space-y-8">
            {updates.map((update) => (
              <article
                key={update.id}
                className={`border rounded-lg p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] hover:border-gold/60 shadow-lg ${getTypeColor(update.type)} relative`}
              >
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(update);
                      }}
                      className="border-gold/30 text-gold hover:bg-gold/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(update.id);
                      }}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div
                  className="cursor-pointer"
                  onClick={() => setSelectedAnnouncement(update)}
                >
                  <header className="mb-4">
                    <h3 className="text-xl font-bold text-gold mb-3 uppercase pr-24">
                      {update.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{update.date}</span>
                      </div>
                      {update.time && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{update.time}</span>
                        </div>
                      )}
                      {update.venue && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{update.venue}</span>
                        </div>
                      )}
                    </div>
                  </header>
                  <div className="prose prose-gray prose-invert max-w-none mt-4 font-tt-chocolates">
                    <p className="text-gray-300 leading-relaxed">
                      {update.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {selectedAnnouncement && (
            <div
              className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedAnnouncement(null)}
            >
              <div
                className="relative bg-black/95 backdrop-blur-md border border-gold/30 rounded-lg shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors text-lg"
                >
                  ✕
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-gold mb-4 uppercase">
                  {selectedAnnouncement.title}
                </h2>
                <div className="space-y-3 text-gray-300 mb-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gold" />
                    <span>{selectedAnnouncement.date}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gold" />
                    <span>{selectedAnnouncement.time}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gold" />
                    <span>{selectedAnnouncement.venue}</span>
                  </div>
                </div>
                <div className="prose prose-lg prose-invert max-w-none text-gray-300 leading-relaxed">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-8 text-center shadow-lg">
            <div className="flex justify-center items-center mb-4">
              <Heart className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-gold mb-4 uppercase">
              A NOTE OF GRATITUDE & SUPPORT
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              For those who wish to offer their support to the family during
              this time, your generosity is deeply appreciated. For the love,
              warmth, and kindness you have shown us, we extend our sincerest
              thanks.
            </p>

            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Paybill */}
              {siteSettings?.paybill_number && (
                <div className="bg-black/50 border border-gold/20 rounded-lg p-4">
                  <h4 className="text-gold font-semibold mb-2">M-Pesa Paybill</h4>
                  <p className="text-white">
                    <span className="text-gray-400">Paybill Number:</span> <span className="text-gold font-mono">{siteSettings.paybill_number}</span>
                  </p>
                  {siteSettings.paybill_account_name && (
                    <p className="text-white">
                      <span className="text-gray-400">Account:</span> {siteSettings.paybill_account_name}
                    </p>
                  )}
                  <p className="text-gray-400 text-sm mt-1">
                    Account Number: Your Name
                  </p>
                </div>
              )}

              {/* M-Pesa Direct */}
              {siteSettings?.mpesa_phone_number && (
                <div className="bg-black/50 border border-gold/20 rounded-lg p-4">
                  <h4 className="text-gold font-semibold mb-2">M-Pesa Send Money</h4>
                  <p className="text-white">
                    <span className="text-gray-400">Phone Number:</span> <span className="text-gold font-mono">{siteSettings.mpesa_phone_number}</span>
                  </p>
                </div>
              )}

              {/* Bank Account */}
              {siteSettings?.bank_account_number && (
                <div className="bg-black/50 border border-gold/20 rounded-lg p-4">
                  <h4 className="text-gold font-semibold mb-2">Bank Transfer</h4>
                  {siteSettings.bank_name && (
                    <p className="text-white">
                      <span className="text-gray-400">Bank:</span> {siteSettings.bank_name}
                    </p>
                  )}
                  <p className="text-white">
                    <span className="text-gray-400">Account Number:</span> <span className="text-gold font-mono">{siteSettings.bank_account_number}</span>
                  </p>
                  {siteSettings.bank_account_name && (
                    <p className="text-white">
                      <span className="text-gray-400">Account Name:</span> {siteSettings.bank_account_name}
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gold mt-8 uppercase">
              {siteSettings?.family_name || "THE FAMILY"}
            </p>
          </div>
        </main>
        <Footer />
      </div>

      {/* Event Edit/Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-purple-dark/95 backdrop-blur-sm border border-gold/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gold text-2xl">
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingEvent
                ? "Update the event details below"
                : "Create a new memorial event or announcement"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-gold font-semibold mb-2">
                Event Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Memorial Service"
                className="bg-black/30 border-gold/30 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gold font-semibold mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="bg-black/30 border-gold/30 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Select date from calendar picker
                </p>
              </div>

              <div>
                <label className="block text-gold font-semibold mb-2">
                  Time
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="bg-black/30 border-gold/30 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Select time or leave blank
                </p>
              </div>
            </div>

            <div>
              <label className="block text-gold font-semibold mb-2">
                Venue
              </label>
              <Input
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
                placeholder="e.g., Location Name, Address"
                className="bg-black/30 border-gold/30 text-white"
              />
            </div>

            <div>
              <label className="block text-gold font-semibold mb-2">
                Event Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: "event" | "announcement" | "service") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="bg-black/30 border-gold/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-purple-dark border-gold/30">
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Events are automatically ordered by creation date
              </p>
            </div>

            <div>
              <label className="block text-gold font-semibold mb-2">
                Content / Description
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Event details and description..."
                rows={5}
                className="bg-black/30 border-gold/30 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setIsEditDialogOpen(false)}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEvent}
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
                  {editingEvent ? "Update Event" : "Create Event"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Information;
