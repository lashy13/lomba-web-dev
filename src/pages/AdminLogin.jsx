import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/admin-login.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Login gagal (HTTP ${response.status}).`
        );
      }

      if (data.success === false) {
        throw new Error(data.message || "Login gagal.");
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Respons login tidak lengkap. Silakan coba lagi."
        );
      }

      if (data.user.role !== "admin") {
        throw new Error(
          "Akun ini tidak memiliki akses administrator."
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("adminUpdated"));
      window.dispatchEvent(new Event("userUpdated"));

      const requestedPath = location.state?.from;
      const requestedPathname =
        typeof requestedPath === "string"
          ? requestedPath
          : requestedPath?.pathname;

      const destination =
        typeof requestedPathname === "string" &&
        requestedPathname.startsWith("/admin") &&
        !requestedPathname.startsWith("//")
          ? requestedPathname
          : "/admin";

      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet kamu."
        );
      } else {
        setError(err.message || "Terjadi kesalahan saat login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-background">
        <div className="admin-login-grid" />
        <div className="admin-login-orb admin-login-orb-one" />
        <div className="admin-login-orb admin-login-orb-two" />
        <div className="admin-login-orb admin-login-orb-three" />
      </div>

      <div className="admin-login-container">
        <div className="admin-login-card">
          <header className="admin-login-header">
            <div className="admin-login-logo">
              <img
                src="/logo-laporkita.png"
                alt="Logo LaporKita"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <span className="admin-logo-fallback">L</span>
            </div>

            <span className="admin-login-badge">
              <span className="admin-badge-dot" />
              ADMINISTRATOR
            </span>

            <h1>
              Welcome <span>Back.</span>
            </h1>

            <p>
              Selamat datang di panel administrator LaporKita.
              Kelola laporan masyarakat dan pantau perkembangan
              penanganan fasilitas publik dalam satu tempat.
            </p>
          </header>

          <div className="admin-login-section-title">
            <div>
              <span className="admin-section-eyebrow">
                ADMIN ACCESS
              </span>

              <h2>Masuk ke Dashboard</h2>
            </div>

            <div className="admin-shield-icon">
              <svg
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                Email Administrator
              </label>

              <div className="admin-input-wrapper">
                <svg
                  className="admin-input-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="admin-email"
                  type="email"
                  placeholder="Masukkan email admin"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">
                Password
              </label>

              <div className="admin-input-wrapper">
                <svg
                  className="admin-input-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="admin-toggle-password"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 5 9 7-.2 1-1.1 2.5-2.6 3.8" />
                      <path d="M6.2 6.2C3.9 7.7 2.4 10 2 12c.5 2 4 7 10 7 1.1 0 2.1-.2 3-.5" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="admin-login-error"
                role="alert"
              >
                <span className="admin-error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Memverifikasi..."
                  : "Masuk ke Dashboard"}
              </span>

              {!loading && (
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>

            <p className="admin-form-security">
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              Akses khusus administrator
            </p>
          </form>

          <section
            className="admin-demo-info"
            aria-labelledby="admin-demo-title"
          >
            <div className="admin-demo-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 11v5" />
                <path d="M12 7h.01" />
              </svg>
            </div>

            <div className="admin-demo-content">
              <span className="admin-demo-label">
                AKUN DEMO
              </span>

              <h2 id="admin-demo-title">
                Informasi Login Admin
              </h2>

              <p>
                Gunakan akun berikut untuk masuk ke panel
                administrator LaporKita.
              </p>

              <div className="admin-demo-credential">
                <div className="admin-credential-row">
                  <span>Email Admin</span>
                  <strong>admin@laporkita.local</strong>
                </div>

                <div className="admin-credential-row">
                  <span>Password Admin</span>
                  <strong>AdminLaporKita123</strong>
                </div>
              </div>

              <div className="admin-demo-note">
                <span aria-hidden="true">🔐</span>

                <span>
                  Pastikan informasi akun digunakan dengan
                  bijak dan tidak dibagikan kepada pihak lain.
                </span>
              </div>
            </div>
          </section>

          <footer className="admin-login-footer">
            <button
              type="button"
              className="admin-back-button"
              onClick={() => navigate("/")}
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
                <path d="M9 12h12" />
              </svg>

              Kembali ke Beranda
            </button>

            <p>
              © {new Date().getFullYear()} LaporKita
              <span className="admin-footer-dot">·</span>
              Panel Administrator
            </p>
          </footer>
        </div>

        <div className="admin-login-bottom-note">
          <span className="admin-bottom-dot" />
          LaporKita — Bersama Membangun Pelayanan Publik
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;