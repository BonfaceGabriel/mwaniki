import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Image,
  HeartHandshake,
  BookOpen,
  Calendar,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DraggableButton from "./DraggableButton";
import useAuth from "@/hooks/use-auth";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  onClick?: () => void;
}

const Navigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isAdmin, logout } = useAuth();

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    {
      path: "/",
      label: "Home",
      icon: Home,
      description: "Return to main page",
    },
    {
      path: "/eulogy",
      label: "Life Story",
      icon: BookOpen,
      description: "Read life story",
    },
    {
      path: "/tributes",
      label: "Tributes",
      icon: HeartHandshake,
      description: "Share your memories",
    },
    {
      path: "/gallery",
      label: "Gallery",
      icon: Image,
      description: "View photo memories",
    },
    {
      path: "/information",
      label: "Memorial Info",
      icon: Calendar,
      description: "Memorial details",
    },
  ];

  // Add admin-specific menu items
  if (isAdmin) {
    navItems.push({
      path: "/site-settings",
      label: "Site Settings",
      icon: Settings,
      description: "Customize site content",
    });
  }

  const adminAuthItem: NavItem = isAdmin
    ? {
        path: "/",
        label: "Logout",
        icon: LogOut,
        description: "Log out from admin panel",
        onClick: logout,
      }
    : {
        path: "/login",
        label: "Admin",
        icon: Settings,
        description: "Admin panel",
      };

  navItems.push(adminAuthItem);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Mobile Horizontal Scrollable Navigation */}
      {isMobile ? (
        <div className="bg-black/40 backdrop-blur-sm">
          {/* Progress Bar */}
          <div className="h-0.5 bg-transparent">
            <div
              className="h-full bg-gradient-to-r from-gold via-yellow-500 to-gold transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          {/* Scrollable Navigation Bar */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex px-3 py-1.5 space-x-1 min-w-max">
              {navItems.map(({ path, label, onClick }) =>
                onClick ? (
                  <button
                    key={path}
                    onClick={onClick}
                    className="px-3 py-1 text-xs transition-all duration-200 text-gray-400 hover:text-gold font-tt-chocolates whitespace-nowrap"
                  >
                    {label}
                  </button>
                ) : (
                  <Link
                    key={path}
                    to={path}
                    className={`px-3 py-1 text-xs transition-all duration-200 font-tt-chocolates whitespace-nowrap ${
                      location.pathname === path
                        ? "text-gold"
                        : "text-gray-400 hover:text-gold"
                    }`}
                  >
                    {label}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Navigation */
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-end h-14 md:h-16">
            <div className="flex space-x-2">
              {navItems.map(({ path, label, icon: Icon, onClick }) =>
                onClick ? (
                  <button
                    key={path}
                    onClick={onClick}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:text-gold hover:bg-gold/10 font-tt-chocolates`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ) : (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-tt-chocolates ${
                      location.pathname === path
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "text-gray-300 hover:text-gold hover:bg-gold/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
