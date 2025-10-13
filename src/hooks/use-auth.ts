import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface AuthState {
  token: string | null;
  user: { id: string; role: string } | null;
  isAdmin: boolean;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: { id: string; role: string; exp: number } =
          jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Check if token is not expired
          setAuthState({
            token,
            user: { id: decoded.id, role: decoded.role },
            isAdmin: decoded.role === "admin",
          });
        } else {
          localStorage.removeItem("token"); // Token expired, remove it
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    try {
      const decoded: { id: string; role: string; exp: number } =
        jwtDecode(token);
      setAuthState({
        token,
        user: { id: decoded.id, role: decoded.role },
        isAdmin: decoded.role === "admin",
      });
    } catch (error) {
      console.error("Failed to decode token on login:", error);
      setAuthState({ token: null, user: null, isAdmin: false });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({ token: null, user: null, isAdmin: false });
  };

  return { ...authState, login, logout };
};

export default useAuth;
