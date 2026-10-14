import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function ProtectedRoute() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      setLoading(true);
      setAuthorized(false);
      setRole(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          return;
        }

        setRole(data.user.role);

        if (data.user.role === "user") {
          setAuthorized(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("AUTH CHECK ERROR:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <p>Memeriksa sesi login...</p>
      </div>
    );
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (!authorized) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;