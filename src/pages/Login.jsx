import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    const form = e.target;

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (!email || !password) {
      alert("Silakan lengkapi email dan password terlebih dahulu.");
      return;
    }

    let users;

    try {
      users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      users = [];
    }

    if (!Array.isArray(users)) {
      users = [];
    }

    const account = users.find(
      (user) => user.email?.toLowerCase() === email
    );

    if (!account) {
      alert("Email atau password salah.");
      return;
    }

    if (account.password !== password) {
      alert("Email atau password salah.");
      return;
    }

    let existingUser;

    try {
      existingUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      existingUser = null;
    }

    const updatedUser = {
      ...account,

      username:
        existingUser?.email === account.email &&
        existingUser?.username
          ? existingUser.username
          : account.username,

      profileImage:
        existingUser?.email === account.email
          ? existingUser?.profileImage ||
            account.profileImage ||
            ""
          : account.profileImage || "",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    localStorage.setItem("isLoggedIn", "true");

    window.dispatchEvent(new Event("userUpdated"));

    alert(
      `Login berhasil! Selamat datang, ${updatedUser.username}.`
    );

    window.location.href = "/";
  };

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb-one"></div>
        <div className="login-orb login-orb-two"></div>
        <div className="login-grid"></div>
      </div>

      <div className="login-container">
        <section className="login-intro">
          <div className="login-label">
            <span className="login-label-dot"></span>
            AKSES LAPORKITA
          </div>

          <h1>
            Siap menyampaikan laporan?
            <span> Mari lanjutkan bersama Laporkita.</span>
          </h1>

          <p>
            Silakan masuk ke akun Laporkita untuk melanjutkan
            proses pelaporan. Dengan akun yang terdaftar, laporan
            dapat terhubung dengan data pelapor sehingga
            perkembangannya dapat dipantau dengan lebih baik.
          </p>

          <div className="login-info">
            <div className="login-info-item">
              <div className="login-info-icon">✓</div>

              <div>
                <strong>Data pelapor tercatat</strong>

                <span>
                  Informasi akun terhubung dengan laporan yang
                  disampaikan.
                </span>
              </div>
            </div>

            <div className="login-info-item">
              <div className="login-info-icon">◉</div>

              <div>
                <strong>Pantau laporan</strong>

                <span>
                  Lihat perkembangan laporan yang telah kamu
                  sampaikan.
                </span>
              </div>
            </div>

            <div className="login-info-item">
              <div className="login-info-icon">↗</div>

              <div>
                <strong>Pelaporan lebih terarah</strong>

                <span>
                  Setiap laporan memiliki informasi dan riwayat
                  yang jelas.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <div className="login-logo">LK</div>

            <div>
              <h2>Selamat datang kembali</h2>

              <p>
                Silakan masuk untuk melanjutkan ke Laporkita.
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>

              <div className="input-wrapper">
                <span className="input-icon">@</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Masukkan alamat email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => {
                    alert(
                      "Fitur lupa password akan tersedia nanti."
                    );
                  }}
                >
                  Lupa password?
                </button>
              </div>

              <div className="input-wrapper password-input-wrapper">
                <span className="input-icon">•</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
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

            <button type="submit" className="login-button">
              <span>Lanjutkan</span>
              <span className="login-arrow">→</span>
            </button>
          </form>

          <div className="login-divider">
            <span>atau</span>
          </div>

          <div className="register-text">
            <span>Belum memiliki akun?</span>

            <a
              href="/register"
              className="register-link"
            >
              Buat akun sekarang
            </a>
          </div>

          {/* ================================
              ADMIN ACCESS
          ================================= */}

          <div className="admin-access">
            <button
              type="button"
              className="admin-access-button"
              onClick={() => navigate("/admin-login")}
            >
              <span className="admin-access-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3L19 6V11C19 15.5 16.1 19.5 12 21C7.9 19.5 5 15.5 5 11V6L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9.5 12L11.2 13.7L14.8 10.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span>Akses Administrator</span>

              <span className="admin-access-arrow">
                →
              </span>
            </button>
          </div>
        </section>
      </div>

      <div className="login-footer">
        Laporkita · Bersama menyampaikan informasi untuk
        lingkungan yang lebih baik.
      </div>
    </main>
  );
}

export default Login;