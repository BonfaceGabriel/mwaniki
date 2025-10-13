import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4 uppercase">
            OOPS! PAGE NOT FOUND
          </p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            RETURN TO HOME
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
