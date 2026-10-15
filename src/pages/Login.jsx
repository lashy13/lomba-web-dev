
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/login.css";
import logoLaporKita from "../assets/logo-laporkita.png";

// ========================================
// KONFIGURASI API
// ========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

// ========================================
// ICON
// ========================================

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 12C4.2 7.8 7.7 5.5 12 5.5C16.3 5.5 19.8 7.8 21.5 12C19.8 16.2 16.3 18.5 12 18.5C7.7 18.5 4.2 16.2 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 5.7C11.05 5.57 11.52 5.5 12 5.5C16.3 5.5 19.8 7.8 21.5 12C20.85 13.6 19.9 14.95 18.7 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.1 6.1C4.5 7.3 3.3 9.05 2.5 12C4.2 16.2 7.7 18.5 12 18.5C13.1 18.5 14.15 18.3 15.1 17.95"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 7L12 13L19.5 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10V7.5C8 5.29 9.79 3.5 12 3.5C14.21 3.5 16 5.29 16 7.5V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L19 6V11.5C19 16 16.15 19.25 12 21C7.85 19.25 5 16 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ========================================
// HALAMAN LOGIN
// ========================================

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // FORM
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ========================================
  // HANDLE LOGIN
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Email atau password salah.");
        return;
      }

      if (!data.token || !data.user) {
        setError("Respons dari server tidak lengkap.");
        return;
      }

      // Login ini khusus pengguna biasa.
      if (data.user.role !== "user") {
        setError(
          "Akun administrator harus masuk melalui halaman administrator."
        );
        return;
      }

      // ========================================
      // SIMPAN DATA LOGIN
      // ========================================

      const userData = data.user;

      // Mendukung dua format nama properti foto.
      const profileImage =
        userData.profile_image ||
        userData.profileImage ||
        null;

      const activeUser = {
        ...userData,
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,

        // Pertahankan kedua nama properti agar
        // kompatibel dengan komponen frontend.
        profile_image: profileImage,
        profileImage: profileImage,
      };

      // Hapus sesi lama setelah login berhasil.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");

      // Simpan sesi baru.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(activeUser));
      localStorage.setItem("isLoggedIn", "true");

      // Beri tahu Navbar dan komponen lain.
      window.dispatchEvent(new Event("userUpdated"));

      // ========================================
      // AMBIL DATA PENGGUNA TERBARU
      // ========================================

      // Backend /api/auth/me harus mengembalikan
      // profile_image dari database.
      try {
        const profileResponse = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          if (profileData.success && profileData.user) {
            const latestUser = profileData.user;

            const latestProfileImage =
              latestUser.profile_image ||
              latestUser.profileImage ||
              profileImage;

            const updatedUser = {
              ...activeUser,
              ...latestUser,
              profile_image: latestProfileImage,
              profileImage: latestProfileImage,
            };

            localStorage.setItem(
              "user",
              JSON.stringify(updatedUser)
            );

            window.dispatchEvent(new Event("userUpdated"));
          }
        }
      } catch (profileError) {
        // Login tetap berhasil meskipun permintaan
        // tambahan untuk mengambil profil gagal.
        console.error(
          "GAGAL MEMPERBARUI DATA PROFIL:",
          profileError
        );
      }

      // ========================================
      // NAVIGASI
      // ========================================

      const from = location.state?.from;

      const destination =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//")
          ? from
          : "/";

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setError(
        "Gagal terhubung ke server. Pastikan backend LaporKita berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TAMPILAN
  // ========================================

  return (
    <main className="login-page">
      {/* BACKGROUND */}
      <div className="login-background">
        <div className="login-grid" />

        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />

        <div className="login-orb login-orb-one" />
        <div className="login-orb login-orb-two" />
      </div>

      {/* BACK BUTTON */}
      <Link to="/" className="login-back">
        <span>←</span>
        Kembali ke Beranda
      </Link>

      {/* MAIN CONTAINER */}
      <div className="login-container">
        {/* LEFT INTRO */}
        <section className="login-intro">
          <div className="login-label">
            <span className="login-label-dot" />
            AKSES LAPORKITA
          </div>

          <h1>
            Selamat datang
            <span>kembali.</span>
          </h1>

          <p>
            Masuk ke akun kamu untuk memantau laporan, melihat perkembangan,
            dan ikut berkontribusi menciptakan pelayanan publik yang lebih
            baik.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <ShieldIcon />
              </div>

              <div>
                <strong>Akun terlindungi</strong>
                <span>
                  Data akun dikelola melalui sistem autentikasi.
                </span>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <LockIcon />
              </div>

              <div>
                <strong>Pelaporan lebih mudah</strong>
                <span>Pantau laporan kamu kapan saja.</span>
              </div>
            </div>
          </div>
        </section>

        {/* LOGIN CARD */}
        <section className="login-card">
          <div className="login-card-top">
            <div className="login-logo">
              <img src={logoLaporKita} alt="LaporKita" />
            </div>

            <div>
              <h2>Masuk ke akun</h2>
              <p>Gunakan akun LaporKita kamu.</p>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="login-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          {/* FORM */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="email">Email</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <MailIcon />
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="password">Password</label>

                <Link to="/lupa-password" className="forgot-password">
                  Lupa password?
                </Link>
              </div>

              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <LockIcon />
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              <span>
                {loading ? "Sedang masuk..." : "Masuk ke Akun"}
              </span>

              <span className="login-submit-arrow">
                <ArrowIcon />
              </span>
            </button>
          </form>

          {/* REGISTER */}
          <div className="login-register">
            <span>Belum punya akun?</span>
            <Link to="/register">Daftar sekarang</Link>
          </div>

          {/* ADMIN LOGIN */}
          <div className="login-admin">
            <div className="login-admin-line" />

            <button
              type="button"
              onClick={() => navigate("/admin-login")}
            >
              <span className="login-admin-icon">
                <ShieldIcon />
              </span>

              <span>Akses Administrator</span>

              <span className="login-admin-arrow">→</span>
            </button>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="login-footer">
        © 2026 LaporKita · Pelayanan Publik Digital
      </footer>
    </main>
  );
}

export default Login;
