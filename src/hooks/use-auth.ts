import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
  role: string;
}

const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setIsAdmin(decoded.role === "admin");
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      setToken(newToken);
      setIsAdmin(decoded.role === "admin");
    } catch (error) {
      console.error("Invalid token on login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsAdmin(false);
  };

  return { token, isAdmin, login, logout };
};

export default useAuth;
