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
import { useState } from "react";
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
  const { isAdmin, logout } = useAuth();

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
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-end h-14 md:h-16">
          {/* Mobile Dropdown Menu */}
          {isMobile ? (
            <DraggableButton>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm text-gold border border-gold/30 hover:bg-black/90 transition-all duration-200 font-tt-chocolates"
                >
                  <span className="text-sm">Menu</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-md border border-gold/30 rounded-lg shadow-2xl shadow-gold/20 overflow-hidden z-50">
                    {navItems.map(
                      ({ path, label, icon: Icon, description, onClick }) =>
                        onClick ? (
                          <button
                            key={path}
                            onClick={() => {
                              onClick();
                              setIsMenuOpen(false);
                            }}
                            className={`flex items-start space-x-3 px-4 py-3 transition-all duration-200 border-b border-gold/10 last:border-b-0 text-gray-300 hover:text-gold hover:bg-gold/10 w-full`}
                          >
                            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{label}</div>
                              <div className="text-xs text-gray-400">
                                {description}
                              </div>
                            </div>
                          </button>
                        ) : (
                          <Link
                            key={path}
                            to={path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-start space-x-3 px-4 py-3 transition-all duration-200 border-b border-gold/10 last:border-b-0 ${
                              location.pathname === path
                                ? "bg-gold/20 text-gold"
                                : "text-gray-300 hover:text-gold hover:bg-gold/10"
                            }`}
                          >
                            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{label}</div>
                              <div className="text-xs text-gray-400">
                                {description}
                              </div>
                            </div>
                          </Link>
                        ),
                    )}
                  </div>
                )}
              </div>
            </DraggableButton>
          ) : (
            /* Desktop Navigation */
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
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
