import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logoLaporKita from "../assets/logo-laporkita.png";
import "../styles/register.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud";

// ========================================
// ICON
// ========================================

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 5.8C11 5.6 11.5 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 20.2 14.4 18 16.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7.2C3.7 9.1 2.5 12 2.5 12C2.5 12 6 18.5 12 18.5C13.4 18.5 14.7 18.2 15.8 17.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 20C5.8 16.6 8.1 14.5 12 14.5C15.9 14.5 18.2 16.6 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20C8.5 20 5.5 17.7 4.4 14.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M4 6V11H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 8V12L15 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4V16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 11L12 16L17 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ========================================
// HALAMAN REGISTER
// ========================================

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // KIRIM PENDAFTARAN KE BACKEND
  // ========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const form = e.currentTarget;

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const confirmPassword = form.elements.confirmPassword.value;
    const terms = form.elements.terms.checked;

    // VALIDASI DATA

    if (!name || !email || !password || !confirmPassword) {
      setError("Silakan lengkapi semua data terlebih dahulu.");
      return;
    }

    if (name.length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }

    if (name.length > 100) {
      setError("Nama lengkap maksimal 100 karakter.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email) || email.length > 150) {
      setError("Silakan masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    if (!terms) {
      setError("Silakan setujui penggunaan data terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Pendaftaran gagal. Silakan coba lagi.");
        return;
      }

      setSuccess(
        "Pendaftaran berhasil! Kamu akan diarahkan ke halaman login."
      );

      // Bersihkan data sesi lama agar akun baru tidak dianggap
      // sebagai akun yang sedang login.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");

      window.dispatchEvent(new Event("userUpdated"));

      // Beri waktu agar pesan berhasil terlihat.
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

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
    <main className="register-page">
      {/* BACKGROUND */}

      <div className="register-background">
        <div className="register-grid" />
        <div className="register-glow register-glow-one" />
        <div className="register-glow register-glow-two" />
        <div className="register-orb register-orb-one" />
        <div className="register-orb register-orb-two" />
      </div>

      {/* BACK BUTTON */}

      <Link to="/" className="register-back">
        <span>←</span>
        Kembali ke Beranda
      </Link>

      {/* MAIN CONTAINER */}

      <div className="register-container">
        {/* LEFT INTRO */}

        <section className="register-intro">
          <div className="register-label">
            <span className="register-label-dot" />
            DAFTAR DI LAPORKITA
          </div>

          <h1>
            Sampaikan kepedulianmu,
            <span> mulai dari sekarang.</span>
          </h1>

          <p>
            Buat akun untuk memiliki akses ke berbagai fitur LaporKita.
            Dengan akun yang terdaftar, kamu dapat menyampaikan laporan,
            melihat riwayat laporan, dan memantau perkembangannya.
          </p>

          <div className="register-info">
            <div className="register-info-item">
              <div className="register-info-icon">
                <CheckIcon />
              </div>
              <div>
                <strong>Identitas lebih terarah</strong>
                <span>
                  Data akun terhubung dengan laporan yang kamu buat.
                </span>
              </div>
            </div>

            <div className="register-info-item">
              <div className="register-info-icon">
                <HistoryIcon />
              </div>
              <div>
                <strong>Riwayat tersimpan</strong>
                <span>
                  Temukan kembali laporan yang pernah kamu kirim.
                </span>
              </div>
            </div>

            <div className="register-info-item">
              <div className="register-info-icon">
                <ReportIcon />
              </div>
              <div>
                <strong>Mudah untuk melapor</strong>
                <span>
                  Setelah terdaftar, kamu bisa langsung menyampaikan laporan.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* REGISTER CARD */}

        <section className="register-card">
          <div className="register-card-header">
            <div className="register-logo">
              <img src={logoLaporKita} alt="LaporKita" />
            </div>

            <div>
              <h2>Daftar akun</h2>
              <p>
                Lengkapi data berikut untuk membuat akun LaporKita.
              </p>
            </div>
          </div>

          {/* PESAN ERROR */}

          {error && (
            <div className="register-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          {/* PESAN BERHASIL */}

          {success && (
            <div className="register-success" role="status">
              <span>✓</span>
              {success}
            </div>
          )}

          {/* FORM */}

          <form className="register-form" onSubmit={handleRegister}>
            {/* NAMA */}

            <div className="register-form-group">
              <label htmlFor="name">Nama lengkap</label>

              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <UserIcon />
                </span>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="register-form-group">
              <label htmlFor="email">Email</label>

              <div className="register-input-wrapper">
                <span className="register-input-icon">
                  <MailIcon />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Masukkan email yang aktif"
                  autoComplete="email"
                  maxLength={150}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="register-form-group">
              <label htmlFor="password">Password</label>

              <div className="register-input-wrapper register-password-wrapper">
                <span className="register-input-icon">
                  <LockIcon />
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password akun"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  disabled={loading}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {/* KONFIRMASI PASSWORD */}

            <div className="register-form-group">
              <label htmlFor="confirmPassword">
                Konfirmasi password
              </label>

              <div className="register-input-wrapper register-password-wrapper">
                <span className="register-input-icon">
                  <LockIcon />
                </span>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Masukkan kembali password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  disabled={loading}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>

            {/* PERSETUJUAN */}

            <label className="register-terms">
              <input
                type="checkbox"
                name="terms"
                required
                disabled={loading}
              />

              <span>
                Saya menyetujui penggunaan data untuk keperluan layanan
                LaporKita.
              </span>
            </label>

            {/* BUTTON */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              <span>
                {loading ? "Sedang mendaftarkan..." : "Buat akun"}
              </span>

              <span className="register-arrow">
                <ArrowIcon />
              </span>
            </button>
          </form>

          {/* DIVIDER */}

          <div className="register-divider">
            <span>atau</span>
          </div>

          {/* LOGIN */}

          <div className="login-text">
            <span>Sudah terdaftar?</span>

            <Link to="/login" className="login-link">
              Masuk ke akun
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}

      <div className="register-footer">
        LaporKita · Bersama menyampaikan informasi untuk lingkungan yang
        lebih baik.
      </div>
    </main>
  );
}

export default Register;