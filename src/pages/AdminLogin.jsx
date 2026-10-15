
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
    setError("");

    if (!email.trim() || !password) {
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
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Login gagal (HTTP ${response.status}).`,
        );
      }

      if (data.success === false) {
        throw new Error(data.message || "Login gagal.");
      }

      if (!data.token || !data.user) {
        throw new Error(
          data.message ||
            "Respons backend tidak memuat token atau data pengguna.",
        );
      }

      if (data.user.role !== "admin") {
        throw new Error(
          "Akun ini tidak memiliki akses administrator.",
        );
      }

      // Simpan token dan data administrator.
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("adminUpdated"));

      const destination = location.state?.from || "/admin";

      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          `Tidak dapat terhubung ke server di ${API_URL}. Pastikan backend berjalan dan alamat API benar.`,
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
            </div>

            <span className="admin-login-badge">
              ADMINISTRATOR
            </span>

            <h1>Login Admin</h1>

            <p>
              Selamat datang di panel administrator LaporKita.
              Kelola laporan masyarakat dan pantau perkembangan
              penanganan fasilitas publik melalui satu tempat.
            </p>
          </header>

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                Email Administrator
              </label>

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

            <div className="admin-form-group">
              <label htmlFor="admin-password">Password</label>

              <div className="admin-password-wrapper">
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
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 5 9 7-.2 1-1.1 2.5-2.6 3.8" />
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
              <div className="admin-login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </button>
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
              <h2 id="admin-demo-title">Akses Demo untuk Juri</h2>

              <p>
                Halaman ini disediakan untuk demonstrasi fitur
                administrator LaporKita dalam proses penilaian lomba.
              </p>

              <div className="admin-demo-note">
                Informasi akun demo akan tersedia setelah website
                dipublikasikan.
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
              ← Kembali ke Beranda
            </button>

            <p>LaporKita · Panel Administrator</p>
          </footer>
        </div>
      </div>
    </main>
  );
}

export default AdminLogin;
