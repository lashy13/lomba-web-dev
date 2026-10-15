import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud";

function AdminRoute() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const checkAdmin = async () => {
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

        if (data.user.role === "admin") {
          setAuthorized(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("ADMIN AUTH ERROR:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <p>Memeriksa akses administrator...</p>
      </div>
    );
  }

  if (role === "user") {
    return <Navigate to="/" replace />;
  }

  if (!authorized) {
    return (
      <Navigate
        to="/admin-login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  return <Outlet />;
}

export default AdminRoute;