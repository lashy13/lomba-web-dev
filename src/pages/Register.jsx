import { useState } from "react";
import "../styles/register.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();

    const form = e.target;

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const terms = form.terms.checked;

    // ========================================
    // VALIDASI DATA
    // ========================================

    if (!name || !email || !password || !confirmPassword) {
      alert("Silakan lengkapi semua data terlebih dahulu.");
      return;
    }

    // ========================================
    // VALIDASI PASSWORD
    // ========================================

    if (password.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Konfirmasi password tidak sesuai.");
      return;
    }

    // ========================================
    // VALIDASI PERSETUJUAN
    // ========================================

    if (!terms) {
      alert("Silakan setujui penggunaan data terlebih dahulu.");
      return;
    }

    // ========================================
    // AMBIL SEMUA AKUN
    // ========================================

    let users;

    try {
      users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      users = [];
    }

    if (!Array.isArray(users)) {
      users = [];
    }

    // ========================================
    // CEK EMAIL SUDAH TERDAFTAR
    // ========================================

    const existingAccount = users.find(
      (user) => user.email?.toLowerCase() === email,
    );

    if (existingAccount) {
      alert(
        "Email tersebut sudah terdaftar. Silakan gunakan email lain atau masuk ke akun.",
      );
      return;
    }

    // ========================================
    // BUAT AKUN BARU
    // ========================================

    const newUser = {
      id: Date.now(),
      username: name,
      email: email,
      password: password,
      profileImage: "",
    };

    // ========================================
    // SIMPAN KE DAFTAR AKUN
    // ========================================

    users.push(newUser);

    localStorage.setItem("users", JSON.stringify(users));

    // ========================================
    // JANGAN LANGSUNG LOGIN
    // ========================================
    // Setelah daftar, pengguna diarahkan
    // ke halaman login agar login menggunakan
    // email dan password yang baru dibuat.

    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem("user");

    // ========================================
    // BERHASIL
    // ========================================

    alert(
      "Pendaftaran berhasil! Silakan masuk menggunakan email dan password yang kamu daftarkan.",
    );

    // ========================================
    // MASUK KE LOGIN
    // ========================================

    window.location.href = "/login";
  };

  return (
    <main className="register-page">
      {/* ========================================
          BACKGROUND
      ======================================== */}

      <div className="register-background">
        <div className="register-grid"></div>

        <div className="register-orb register-orb-one"></div>

        <div className="register-orb register-orb-two"></div>
      </div>

      {/* ========================================
          MAIN CONTAINER
      ======================================== */}

      <div className="register-container">
        {/* ====================================
            LEFT INTRO
        ==================================== */}

        <section className="register-intro">
          <div className="register-label">
            <span className="register-label-dot"></span>
            DAFTAR DI LAPORKITA
          </div>

          <h1>
            Sampaikan kepedulianmu,
            <span> mulai dari sekarang.</span>
            <br />
            Bersama Laporkita.
          </h1>

          <p>
            Buat akun untuk memiliki akses ke berbagai fitur Laporkita. Dengan
            akun yang terdaftar, kamu dapat menyampaikan laporan, melihat
            riwayat laporan, dan memantau perkembangannya.
          </p>

          <div className="register-info">
            {/* INFO 1 */}

            <div className="register-info-item">
              <div className="register-info-icon">✓</div>

              <div>
                <strong>Identitas lebih terarah</strong>

                <span>Data akun terhubung dengan laporan yang kamu buat.</span>
              </div>
            </div>

            {/* INFO 2 */}

            <div className="register-info-item">
              <div className="register-info-icon">◉</div>

              <div>
                <strong>Riwayat tersimpan</strong>

                <span>Temukan kembali laporan yang pernah kamu kirim.</span>
              </div>
            </div>

            {/* INFO 3 */}

            <div className="register-info-item">
              <div className="register-info-icon">↗</div>

              <div>
                <strong>Mudah untuk melapor</strong>

                <span>
                  Setelah terdaftar, kamu bisa langsung menyampaikan laporan.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================
            REGISTER CARD
        ==================================== */}

        <section className="register-card">
          <div className="register-card-header">
            <div className="register-logo">LK</div>

            <div>
              <h2>Daftar akun</h2>

              <p>Lengkapi data berikut untuk membuat akun Laporkita.</p>
            </div>
          </div>

          {/* ====================================
              FORM
          ==================================== */}

          <form className="register-form" onSubmit={handleRegister}>
            {/* NAMA */}

            <div className="register-form-group">
              <label htmlFor="name">Nama lengkap</label>

              <div className="register-input-wrapper">
                <span className="register-input-icon">◉</span>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="register-form-group">
              <label htmlFor="email">Email</label>

              <div className="register-input-wrapper">
                <span className="register-input-icon">@</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Masukkan email yang aktif"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="register-form-group">
              <label htmlFor="password">Password</label>

              <div className="register-input-wrapper register-password-wrapper">
                <span className="register-input-icon">•</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Buat password akun"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 12C2.5 12 6 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 18 18.5 12 18.5C6 18.5 2.5 12 2.5 12Z"
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                  )}
                </button>
              </div>
            </div>

            {/* KONFIRMASI PASSWORD */}

            <div className="register-form-group">
              <label htmlFor="confirmPassword">Konfirmasi password</label>

              <div className="register-input-wrapper register-password-wrapper">
                <span className="register-input-icon">•</span>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Masukkan kembali password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 12C2.5 12 6 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 18 18.5 18 12C18 18.5 12 18.5 12 18.5C6 18.5 2.5 12 2.5 12Z"
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
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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
                  )}
                </button>
              </div>
            </div>

            {/* TERMS */}

            <label className="register-terms">
              <input type="checkbox" name="terms" />

              <span>
                Saya menyetujui penggunaan data untuk keperluan layanan
                Laporkita.
              </span>
            </label>

            {/* BUTTON */}

            <button type="submit" className="register-button">
              <span>Buat akun</span>

              <span className="register-arrow">→</span>
            </button>
          </form>

          {/* DIVIDER */}

          <div className="register-divider">
            <span>atau</span>
          </div>

          {/* LOGIN */}

          <div className="login-text">
            <span>Sudah terdaftar?</span>

            <a href="/login" className="login-link">
              Masuk ke akun
            </a>
          </div>
        </section>
      </div>

      {/* FOOTER */}

      <div className="register-footer">
        Laporkita · Bersama menyampaikan informasi untuk lingkungan yang lebih
        baik.
      </div>
    </main>
  );
}

export default Register;
