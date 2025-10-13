import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface BackgroundImageProps {
  opacity?: number;
}

const BackgroundImage = ({ opacity = 0.15 }: BackgroundImageProps) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/site-settings`)
      .then((response) => response.json())
      .then((data) => {
        setBackgroundUrl(
          data.background_photo_url || "/lovable-uploads/placeholder-background.jpg"
        );
      })
      .catch((error) => {
        console.error("Error fetching background:", error);
        setBackgroundUrl("/lovable-uploads/placeholder-background.jpg");
      });
  }, []);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        opacity: opacity,
      }}
    >
      {/* Mobile optimization - use scroll instead of fixed on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .fixed.inset-0 {
            background-attachment: scroll !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BackgroundImage;
