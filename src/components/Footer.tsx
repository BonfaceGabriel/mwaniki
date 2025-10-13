import { Link } from "react-router-dom";

const Footer = () => {
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/gallery", label: "Gallery" },
    { path: "/tributes", label: "Tributes" },
    { path: "/information", label: "Info" },
    { path: "/eulogy", label: "BK's Story" },
  ];

  return (
    <footer className="bg-slate-900/95 backdrop-blur-md border-t border-yellow-400/20 py-8 mt-12 shadow-inner shadow-yellow-400/10">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-gray-300 hover:text-white hover:bg-yellow-400/10 px-3 py-1 rounded-md transition-all duration-200 text-sm md:text-base font-tt-chocolates"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <p className="text-gray-500 text-xs md:text-sm font-tt-chocolates">
          &copy; {new Date().getFullYear()} In Memory of BK. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
