import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

import logoLaporkita from "../assets/logo-laporkita.png";

function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  try {
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getUnreadNotificationCount(user) {
  if (!user?.email) {
    return 0;
  }

  const rawNotifications = localStorage.getItem("notifikasi");

  try {
    const notifications = rawNotifications ? JSON.parse(rawNotifications) : [];

    if (!Array.isArray(notifications)) {
      return 0;
    }

    return notifications.filter(
      (notification) =>
        notification.userEmail === user.email && !notification.read,
    ).length;
  } catch {
    return 0;
  }
}

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />

      <path
        d="M5.5 19.2C5.5 15.8 8.4 13.5 12 13.5C15.6 13.5 18.5 15.8 18.5 19.2"
        fill="currentColor"
      />
    </svg>
  );
}

function Avatar({ user, size = "normal" }) {
  return (
    <div className={`avatar-circle ${size}`}>
      {user?.profileImage ? (
        <img src={user.profileImage} alt="Foto profil" />
      ) : (
        <DefaultAvatar />
      )}
    </div>
  );
}

function NotificationIcon({ count, onClick }) {
  return (
    <button
      type="button"
      className="navbar-notification-button"
      onClick={() => {
        window.dispatchEvent(new Event("notificationOpened"));
        onClick?.();
      }}
      aria-label={count > 0 ? `${count} notifikasi belum dibaca` : "Notifikasi"}
    >
      <svg
        className="navbar-notification-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 9.5C18 6.19 15.76 4 12 4C8.24 4 6 6.19 6 9.5V13.2C6 14.2 5.7 15.1 5.15 15.95L4 17.7H20L18.85 15.95C18.3 15.1 18 14.2 18 13.2V9.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M9.7 20C10.25 20.65 11.05 21 12 21C12.95 21 13.75 20.65 14.3 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {count > 0 && (
        <span className="navbar-notification-badge">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);

  const [user, setUser] = useState(getStoredUser);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true",
  );

  const [unreadNotifications, setUnreadNotifications] = useState(() =>
    getUnreadNotificationCount(getStoredUser()),
  );

  useEffect(() => {
    const updateAuth = () => {
      const storedUser = getStoredUser();

      setUser(storedUser);

      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");

      setUnreadNotifications(getUnreadNotificationCount(storedUser));
    };

    const updateNotifications = () => {
      const storedUser = getStoredUser();

      setUnreadNotifications(getUnreadNotificationCount(storedUser));
    };

    window.addEventListener("userUpdated", updateAuth);

    window.addEventListener("notificationUpdated", updateNotifications);

    window.addEventListener("storage", updateAuth);

    return () => {
      window.removeEventListener("userUpdated", updateAuth);

      window.removeEventListener("notificationUpdated", updateNotifications);

      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const username = user?.username || user?.name || "Pengguna";

  const email = user?.email || "Belum ada email";

  const handleNotificationClick = () => {
    navigate("/notifikasi");
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");

    setUser(null);
    setIsLoggedIn(false);
    setUnreadNotifications(0);
    setProfileOpen(false);

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* =================================
            BRAND / LOGO
        ================================= */}

        <Link to="/" className="navbar-brand" aria-label="LaporKita">
          <img
            src={logoLaporkita}
            alt="LaporKita"
            className="navbar-logo-image"
          />

          <div className="navbar-brand-text">
            <span className="navbar-brand-title">
              Lapor<span>Kita</span>
            </span>

            <span className="navbar-brand-tagline">Suara untuk perubahan</span>
          </div>
        </Link>

        {/* =================================
            MENU
        ================================= */}

        <nav className="navbar-menu">
          <Link to="/" className="navbar-link">
            Beranda
          </Link>

          <Link to="/laporan" className="navbar-link">
            Laporan
          </Link>

          <a href="/#tentang-laporkita" className="navbar-link">
            Tentang
          </a>
        </nav>

        {/* =================================
            RIGHT
        ================================= */}

        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              {/* =================================
                  NOTIFICATION
              ================================= */}

              <NotificationIcon
                count={unreadNotifications}
                onClick={handleNotificationClick}
              />

              {/* =================================
                  PROFILE
              ================================= */}

              <div className="profile-wrapper" ref={profileRef}>
                <button
                  type="button"
                  className="avatar-button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-label="Menu profil"
                >
                  <Avatar user={user} />

                  <span className={`avatar-arrow ${profileOpen ? "open" : ""}`}>
                    ⌄
                  </span>
                </button>

                {/* =================================
                    DROPDOWN
                ================================= */}

                {profileOpen && (
                  <div className="profile-dropdown">
                    {/* USER */}

                    <div className="profile-dropdown-user">
                      <Avatar user={user} size="large" />

                      <div className="profile-user-text">
                        <strong>{username}</strong>

                        <span>{email}</span>
                      </div>
                    </div>

                    <div className="dropdown-line"></div>

                    {/* PROFIL */}

                    <Link
                      to="/profil"
                      className="profile-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="menu-item-icon">👤</span>

                      <div>
                        <strong>Profil</strong>

                        <small>Kelola profil kamu</small>
                      </div>
                    </Link>

                    {/* LAPORAN SAYA */}

                    <Link
                      to="/laporan-saya"
                      className="profile-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="menu-item-icon">📋</span>

                      <div>
                        <strong>Laporan Saya</strong>

                        <small>Lihat laporan yang kamu buat</small>
                      </div>
                    </Link>

                    {/* NOTIFIKASI */}

                    <Link
                      to="/notifikasi"
                      className="profile-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="menu-item-icon">🔔</span>

                      <div>
                        <strong>Notifikasi</strong>

                        <small>Perkembangan laporan kamu</small>
                      </div>
                    </Link>

                    <div className="dropdown-line"></div>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      className="logout-button"
                      onClick={handleLogout}
                    >
                      <span>↪</span>
                      Keluar dari akun
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* =================================
               BELUM LOGIN
            ================================= */

            <div className="navbar-auth">
              <Link to="/login" className="navbar-login">
                Masuk
              </Link>

              <Link to="/register" className="navbar-register">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
