import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundImage from "@/components/BackgroundImage";
import useAuth from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./Eulogy.css";
import { Loader2, Edit, Save, X } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const Eulogy = () => {
  const { isAdmin, token } = useAuth();
  const [content, setContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEulogy();
  }, []);

  const fetchEulogy = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/eulogy`);
      if (!response.ok) throw new Error("Failed to fetch eulogy");
      const data = await response.json();
      setContent(data.content || "");
      setEditContent(data.content || "");
    } catch (error) {
      console.error("Error fetching eulogy:", error);
      toast.error("Failed to load eulogy content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/eulogy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error("Failed to save eulogy");

      setContent(editContent);
      setIsEditing(false);
      toast.success("Eulogy saved successfully!");
    } catch (error) {
      console.error("Error saving eulogy:", error);
      toast.error("Failed to save eulogy");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  // Custom styling for headings in rendered HTML
  const renderContent = (html: string) => {
    return (
      <div
        className="eulogy-content prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
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

  return (
    <div className="min-h-screen bg-black text-white relative">
      <BackgroundImage opacity={0.3} />

      <Navigation />

      <div className="relative z-10">
        <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4 uppercase subtle-glow">
              LIFE STORY
            </h1>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"></div>
            <p className="text-lg text-gray-300">
              A CELEBRATION OF A LIFE WELL LIVED
            </p>
          </div>

          {isAdmin && !isEditing && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gold hover:bg-gold/80 text-black font-semibold"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Life Story
              </Button>
            </div>
          )}

          {isEditing ? (
            <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-gold font-semibold mb-2">
                  Life Story Content
                </label>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    <span>💡</span> Formatting Tips
                  </h4>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li><strong>Title:</strong> Use the first dropdown (select "Heading 1") for the main title</li>
                    <li><strong>Sections:</strong> Use "Heading 2" for section titles like "Early Life", "Career", etc.</li>
                    <li><strong>Subsections:</strong> Use "Heading 3" for smaller subsections</li>
                    <li><strong>Regular Text:</strong> Use "Normal" for paragraphs and stories</li>
                    <li><strong>Bold/Italic:</strong> Use the <strong>B</strong> and <em>I</em> buttons for emphasis</li>
                  </ul>
                </div>
                <ReactQuill
                  theme="snow"
                  value={editContent}
                  onChange={setEditContent}
                  className="bg-white/5 rounded eulogy-editor"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["blockquote"],
                      [{ align: [] }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                  formats={[
                    "header",
                    "bold",
                    "italic",
                    "underline",
                    "list",
                    "bullet",
                    "blockquote",
                    "align",
                    "link",
                  ]}
                  placeholder="Start writing the life story here... Select 'Heading 1' from the dropdown for the title, 'Heading 2' for sections like 'Early Life', and 'Normal' for regular paragraphs."
                  style={{ minHeight: "500px" }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
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
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-purple-dark/50 backdrop-blur-sm border border-gold/30 rounded-lg p-8">
              {content ? (
                renderContent(content)
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <p>No life story has been written yet.</p>
                  {isAdmin && (
                    <p className="mt-2">Click "Edit Life Story" to add content.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Eulogy;
