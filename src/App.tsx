import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Tributes from "./pages/Tributes";
import Information from "./pages/Information";
import NotFound from "./pages/NotFound";
import FlyingDoves from "./components/FlyingDoves";
import Eulogy from "./pages/Eulogy";
import AdminPage from "./pages/AdminPage";
import Login from "./pages/Login";
import SiteSettings from "./pages/SiteSettings";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="relative min-h-screen overflow-hidden">
        {/* Top-left flower */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-10 z-0 pointer-events-none">
          <img
            src="/flower-placeholder.svg"
            alt="flower"
            className="w-full h-full object-contain transform -translate-x-1/4 -translate-y-1/4"
          />
        </div>
        {/* Top-right flower */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 z-0 pointer-events-none">
          <img
            src="/flower-placeholder.svg"
            alt="flower"
            className="w-full h-full object-contain transform translate-x-1/4 -translate-y-1/4 rotate-90"
          />
        </div>
        {/* Bottom-left flower */}
        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10 z-0 pointer-events-none">
          <img
            src="/flower-placeholder.svg"
            alt="flower"
            className="w-full h-full object-contain transform -translate-x-1/4 translate-y-1/4 -rotate-90"
          />
        </div>
        {/* Bottom-right flower */}
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 z-0 pointer-events-none">
          <img
            src="/flower-placeholder.svg"
            alt="flower"
            className="w-full h-full object-contain transform translate-x-1/4 translate-y-1/4 rotate-180"
          />
        </div>

        <FlyingDoves />

        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/tributes" element={<Tributes />} />
            <Route path="/information" element={<Information />} />
            <Route path="/eulogy" element={<Eulogy />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/site-settings" element={<SiteSettings />} />
            <Route path="/login" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
