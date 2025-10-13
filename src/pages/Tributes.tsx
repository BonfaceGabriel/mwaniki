import { useState, useEffect } from "react";
import BackgroundImage from "@/components/BackgroundImage";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./Tributes.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import useAuth from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface Tribute {
  id: number;
  name: string;
  relationship: string;
  message: string;
  timestamp: string;
  type: string;
}

const Tributes = () => {
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    message: "",
    type: "tribute",
  });
  const { isAdmin } = useAuth();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTributes, setSelectedTributes] = useState<number[]>([]);

  useEffect(() => {
    fetchTributes().then(() => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          element.classList.add("ring-4", "ring-blue-500", "ring-offset-2", "ring-offset-black");
          setTimeout(() => {
            element.classList.remove("ring-4", "ring-blue-500", "ring-offset-2", "ring-offset-black");
          }, 3000);
        }
      }
    });
  }, []);

  const fetchTributes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tributes`);
      const data = await response.json();
      setTributes(data);
    } catch (error) {
      console.error("Error fetching tributes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTribute = (tributeId: number) => {
    setSelectedTributes((prevSelected) =>
      prevSelected.includes(tributeId)
        ? prevSelected.filter((id) => id !== tributeId)
        : [...prevSelected, tributeId],
    );
  };

  const handleDeleteSelectedTributes = async (tributeIds: number[]) => {
    if (tributeIds.length === 0) return;

    try {
      const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        return;
      }

      await Promise.all(
        tributeIds.map((tributeId) =>
          fetch(`${API_BASE_URL}/tributes/${tributeId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ),
      );
      fetchTributes(); // Refresh the list after deletion
      setSelectedTributes([]);
      setIsSelectionMode(false);
      toast.success("Selected tribute(s) deleted successfully!");
    } catch (error) {
      console.error("Error deleting tributes:", error);
      toast.error("Failed to delete selected tribute(s).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message || formData.message === "<p><br></p>") {
      toast.error("Please enter a message for your tribute.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/tributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: "",
          relationship: "",
          message: "",
          type: "tribute",
        });
        fetchTributes();
        toast.success("Thank you for sharing your tribute!");
      } else {
        throw new Error("Failed to submit tribute");
      }
    } catch (error) {
      console.error("Error submitting tribute:", error);
      toast.error("Failed to submit tribute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <BackgroundImage opacity={0.3} />
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase gold-shimmer">
              WORDS OF REMEMBRANCE
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              SHARE YOUR MEMORIES AND THOUGHTS ABOUT BERNARD "BK" KASEMA
            </p>
          </div>
          <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-6 md:p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-tt-chocolates-demibold text-gold mb-6 uppercase flex items-center">
              SHARE YOUR TRIBUTE
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full bg-black/50" />
                <Skeleton className="h-10 w-full bg-black/50" />
              </div>
              <Skeleton className="h-24 w-full bg-black/50" />
              <Skeleton className="h-12 w-full bg-purple-medium" />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gold uppercase flex items-center">
              TRIBUTES (loading...)
            </h2>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-purple-dark/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6"
              >
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex justify-between items-end">
                  <div>
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-1/4" />
                </div>
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
        <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase gold-shimmer">
              WORDS OF REMEMBRANCE
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              SHARE YOUR MEMORIES AND THOUGHTS ABOUT BERNARD "BK" KASEMA
            </p>
            {isAdmin && (
              <div className="mt-4 flex justify-center space-x-4">
                <Button
                  className="btn-secondary"
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                >
                  {isSelectionMode ? "Cancel Selection" : "Select Tributes"}
                </Button>
                {isSelectionMode && selectedTributes.length > 0 && (
                  <Button
                    className="btn-danger"
                    onClick={() =>
                      handleDeleteSelectedTributes(selectedTributes)
                    }
                  >
                    Delete Selected ({selectedTributes.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tribute Form */}
          <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-6 md:p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-tt-chocolates-demibold text-gold mb-6 uppercase flex items-center">
              SHARE YOUR TRIBUTE
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Your Name (Optional)"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-black/50 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold"
                />
                <Input
                  placeholder="Your Relationship (e.g., Friend, Colleague) *"
                  value={formData.relationship}
                  onChange={(e) =>
                    setFormData({ ...formData, relationship: e.target.value })
                  }
                  required
                  className="bg-black/50 border-gold/30 text-white placeholder:text-gray-400 focus:border-gold"
                />
              </div>
              <ReactQuill
                theme="snow"
                value={formData.message}
                onChange={(content) =>
                  setFormData({ ...formData, message: content })
                }
                placeholder="Share your memories, thoughts, or a message for BK..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ["bold", "italic", "underline", "strike", "blockquote"],
                    [
                      { list: "ordered" },
                      { list: "bullet" },
                      { indent: "-1" },
                      { indent: "+1" },
                    ],
                    ["link"],
                    ["clean"],
                  ],
                }}
                className="bg-black/50 text-white"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-medium hover:bg-primary transition-all duration-300 text-white font-semibold py-3"
              >
                {isSubmitting ? "Submitting..." : "SHARE TRIBUTE"}
              </Button>
            </form>
          </div>

          {/* Tributes List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-tt-chocolates-demibold text-gold uppercase flex items-center">
              TRIBUTES ({tributes.length})
            </h2>

            {tributes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  No tributes yet. Be the first to share your memories.
                </p>
              </div>
            ) : (
              tributes.map((tribute, index) => (
                <div
                  id={`tribute-${tribute.id}`}
                  key={tribute.id}
                  className={`relative bg-purple-dark/50 backdrop-blur-sm border border-gold/20 rounded-lg p-6 transition-all duration-300 shadow-lg ${isSelectionMode ? "hover:border-blue-400" : "hover:border-gold/40"} ${selectedTributes.includes(tribute.id) ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-black" : ""}`}
                  onClick={() =>
                    isSelectionMode && handleSelectTribute(tribute.id)
                  }
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isAdmin && isSelectionMode && (
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedTributes.includes(tribute.id)}
                        onChange={() => handleSelectTribute(tribute.id)}
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
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ARE YOU SURE?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the tribute.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteSelectedTributes([tribute.id])
                            }
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="text-4xl text-gold/50 font-serif mb-3">"</div>
                  <div
                    className="text-gray-200 mb-4 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: tribute.message }}
                  />
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="font-bold text-gold text-lg">
                        {tribute.name || tribute.relationship}
                      </p>
                      {tribute.name && (
                        <p className="text-sm text-gray-400">
                          {tribute.relationship}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(tribute.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Tributes;
