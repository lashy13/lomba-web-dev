import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/admin-login.css";

import logoLaporkita from "../assets/logo-laporkita.png";

function EyeIcon({ closed = false }) {
  if (closed) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M9.9 5.2C10.6 5 11.3 4.9 12 4.9C16.8 4.9 20.3 8.1 21.5 12C21 13.7 20 15.2 18.7 16.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M6.1 6.1C4.6 7.3 3.5 9.1 2.5 12C3.7 15.9 7.2 19.1 12 19.1C13.5 19.1 14.9 18.7 16.1 18.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12C3.7 8.1 7.2 4.9 12 4.9C16.8 4.9 20.3 8.1 21.5 12C20.3 15.9 16.8 19.1 12 19.1C7.2 19.1 3.7 15.9 2.5 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    const ADMIN_EMAIL =
      "admin@laporkita.id";

    const ADMIN_PASSWORD =
      "admin123";

    if (
      email.trim().toLowerCase() !==
        ADMIN_EMAIL ||
      password !== ADMIN_PASSWORD
    ) {
      setError(
        "Email atau password admin salah."
      );

      return;
    }

    localStorage.setItem(
      "adminLoggedIn",
      "true"
    );

    localStorage.setItem(
      "adminUser",
      JSON.stringify({
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
      })
    );

    window.dispatchEvent(
      new Event("adminUpdated")
    );

    const destination =
      location.state?.from || "/admin";

    navigate(destination, {
      replace: true,
    });
  };

  return (
    <main className="admin-login-page">

      <div className="admin-login-background">
        <div className="admin-login-orb orb-one"></div>
        <div className="admin-login-orb orb-two"></div>
      </div>


      <div className="admin-login-card">

        {/* ========================================
            BRAND
        ======================================== */}

        <div className="admin-login-brand">

          <div className="admin-login-logo">

            <img
              src={logoLaporkita}
              alt="LaporKita"
            />

          </div>


          <div>

            <h1>
              Lapor<span>Kita</span>
            </h1>

            <p>
              Administrator Portal
            </p>

          </div>

        </div>


        {/* ========================================
            HEADING
        ======================================== */}

        <div className="admin-login-heading">

          <span>
            ADMIN ACCESS
          </span>

          <h2>
            Selamat datang kembali
          </h2>

          <p>
            Masuk untuk mengelola laporan masyarakat.
          </p>

        </div>


        {/* ========================================
            FORM
        ======================================== */}

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >

          {/* EMAIL */}

          <div className="admin-input-group">

            <label htmlFor="admin-email">
              Email Admin
            </label>

            <input
              id="admin-email"
              type="email"
              placeholder="admin@laporkita.id"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="username"
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="admin-input-group">

            <label htmlFor="admin-password">
              Password
            </label>

            <div className="admin-password-wrapper">

              <input
                id="admin-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Masukkan password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                required
              />


              <button
                type="button"
                className="admin-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                aria-label={
                  showPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >

                <EyeIcon
                  closed={!showPassword}
                />

              </button>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}


          {/* LOGIN */}

          <button
            type="submit"
            className="admin-login-button"
          >

            Masuk ke Dashboard

            <span>
              →
            </span>

          </button>

        </form>


        {/* ========================================
            BACK
        ======================================== */}

        <button
          type="button"
          className="admin-back-button"
          onClick={() => navigate("/")}
        >
          ← Kembali ke LaporKita
        </button>


        {/* ========================================
            DEMO
        ======================================== */}

        <div className="admin-login-demo">

          <span>
            Demo Admin
          </span>

          <small>
            admin@laporkita.id
          </small>

          <small>
            Password: admin123
          </small>

        </div>

      </div>

    </main>
  );
}

export default AdminLogin;