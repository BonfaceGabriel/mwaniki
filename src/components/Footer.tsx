import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SiteSettings {
  deceased_name: string;
}

const Footer = () => {
  const [deceasedName, setDeceasedName] = useState<string>("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/site-settings`)
      .then((response) => response.json())
      .then((data: SiteSettings) => {
        setDeceasedName(data.deceased_name || "");
      })
      .catch((error) => console.error("Error fetching site settings:", error));
  }, []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/eulogy", label: "Life Story" },
    { path: "/tributes", label: "Tributes" },
    { path: "/gallery", label: "Gallery" },
    { path: "/information", label: "Memorial Info" },
  ];

  return (
    <footer className="bg-black/80 backdrop-blur-md border-t border-gold/30 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-gray-300 hover:text-gold hover:bg-gold/10 px-3 py-1 rounded-lg transition-all duration-200 text-sm md:text-base font-tt-chocolates"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-4"></div>
        <p className="text-gray-400 text-xs md:text-sm font-tt-chocolates">
          &copy; {new Date().getFullYear()} In Memory of {deceasedName || "Our Loved One"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
