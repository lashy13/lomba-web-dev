import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/navbar.css";
import logoLaporkita from "../assets/logo-laporkita.png";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// =====================================
// MENGAMBIL DATA PENGGUNA
// =====================================

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) return null;

    const user = JSON.parse(rawUser);

    if (!user || typeof user !== "object") return null;

    const savedImage = user.profileImage || user.profile_image || "";

    let profileImage = "";

    if (savedImage) {
      if (
        /^https?:\/\//i.test(savedImage) ||
        savedImage.startsWith("data:") ||
        savedImage.startsWith("blob:")
      ) {
        profileImage = savedImage;
      } else {
        profileImage = `${API_URL}${
          savedImage.startsWith("/") ? "" : "/"
        }${savedImage}`;
      }
    }

    return {
      ...user,
      profileImage,
      profile_image: savedImage || null,
    };
  } catch (error) {
    console.error("Gagal membaca data pengguna:", error);
    return null;
  }
}

// =====================================
// STATUS LOGIN
// =====================================

function checkLoggedIn() {
  return (
    localStorage.getItem("isLoggedIn") === "true" &&
    Boolean(localStorage.getItem("token"))
  );
}

// =====================================
// NORMALISASI STATUS NOTIFIKASI
// =====================================

function isNotificationUnread(notification) {
  const value =
    notification.is_read ??
    notification.isRead ??
    notification.read ??
    0;

  // Mendukung nilai MySQL 0/1, string "0"/"1",
  // dan boolean true/false.
  if (value === true) return false;
  if (value === false) return true;

  return Number(value) !== 1;
}

// =====================================
// AVATAR DEFAULT
// =====================================

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />

      <path
        d="M5.5 19.2C5.5 15.8 8.4 13.5 12 13.5C15.6 13.5 18.5 15.8 18.5 19.2"
        fill="currentColor"
      />
    </svg>
  );
}

// =====================================
// AVATAR PENGGUNA
// =====================================

function Avatar({ user, size = "normal" }) {
  const image = user?.profileImage || "";
  const [failedImage, setFailedImage] = useState("");

  const shouldUseFallback = !image || failedImage === image;

  return (
    <div className={`avatar-circle ${size}`}>
      {!shouldUseFallback ? (
        <img
          key={image}
          src={image}
          alt="Foto profil"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <DefaultAvatar />
      )}
    </div>
  );
}

// =====================================
// IKON NOTIFIKASI
// =====================================

function NotificationIcon({ count, onClick }) {
  return (
    <button
      type="button"
      className="navbar-notification-button"
      onClick={onClick}
      aria-label={
        count > 0
          ? `${count} notifikasi belum dibaca`
          : "Notifikasi"
      }
      title={
        count > 0
          ? `${count} notifikasi belum dibaca`
          : "Notifikasi"
      }
    >
      <svg
        className="navbar-notification-icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
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
        <span className="navbar-notification-badge" aria-hidden="true">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// =====================================
// NAVBAR UTAMA
// =====================================

function Navbar() {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const requestIdRef = useRef(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser);
  const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // =====================================
  // MENGAMBIL JUMLAH NOTIFIKASI DARI DB
  // =====================================

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    const loggedIn = checkLoggedIn();

    const requestId = ++requestIdRef.current;

    if (!token || !loggedIn) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Gagal mengambil notifikasi (${response.status})`,
        );
      }

      const result = await response.json();

      if (!Array.isArray(result.data)) {
        throw new Error("Format data notifikasi tidak valid.");
      }

      const unreadCount = result.data.filter(
        isNotificationUnread,
      ).length;

      // Pastikan respons masih milik sesi login yang sama.
      const sessionIsCurrent =
        requestId === requestIdRef.current &&
        token === localStorage.getItem("token") &&
        checkLoggedIn();

      if (sessionIsCurrent) {
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      // Pertahankan angka terakhir jika permintaan gagal.
      console.error(
        "Gagal mengambil jumlah notifikasi:",
        error.message,
      );
    }
  }, []);

  // =====================================
  // SINKRONISASI DATA PENGGUNA DAN LOGIN
  // =====================================

  useEffect(() => {
    const updateAuth = () => {
      const storedUser = getStoredUser();
      const loggedIn = checkLoggedIn();

      setUser(storedUser);
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        // Membatalkan respons permintaan lama.
        requestIdRef.current += 1;
        setUnreadNotifications(0);
        setProfileOpen(false);
        return;
      }

      void fetchNotifications();
    };

    const updateNotifications = () => {
      void fetchNotifications();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateAuth();
      }
    };

    // Sinkronisasi awal.
    updateAuth();

    window.addEventListener("userUpdated", updateAuth);
    window.addEventListener(
      "notificationUpdated",
      updateNotifications,
    );
    window.addEventListener("storage", updateAuth);
    window.addEventListener("focus", updateAuth);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    // Periksa notifikasi setiap 15 detik selama halaman terlihat.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    }, 15000);

    return () => {
      // Batalkan hasil permintaan yang masih berjalan.
      requestIdRef.current += 1;

      window.removeEventListener("userUpdated", updateAuth);
      window.removeEventListener(
        "notificationUpdated",
        updateNotifications,
      );
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("focus", updateAuth);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  // =====================================
  // MENUTUP DROPDOWN SAAT KLIK DI LUAR
  // =====================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  // =====================================
  // DATA PENGGUNA
  // =====================================

  const username = user?.username || user?.name || "Pengguna";
  const email = user?.email || "Belum ada email";
  const isAdmin = user?.role === "admin";

  // =====================================
  // BUKA HALAMAN NOTIFIKASI
  // =====================================

  const handleNotificationClick = () => {
    setProfileOpen(false);
    navigate("/notifikasi");
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    // Batalkan respons fetch dari sesi sebelumnya.
    requestIdRef.current += 1;

    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    setUser(null);
    setIsLoggedIn(false);
    setUnreadNotifications(0);
    setProfileOpen(false);

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/");
  };

  // =====================================
  // TAMPILAN NAVBAR
  // =====================================

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* LOGO */}

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

            <span className="navbar-brand-tagline">
              Suara untuk perubahan
            </span>
          </div>
        </Link>

        {/* MENU NAVIGASI */}

        <nav className="navbar-menu" aria-label="Navigasi utama">
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

        {/* BAGIAN KANAN */}

        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              {/* NOTIFIKASI */}

              <NotificationIcon
                count={unreadNotifications}
                onClick={handleNotificationClick}
              />

              {/* PROFIL */}

              <div className="profile-wrapper" ref={profileRef}>
                <button
                  type="button"
                  className="avatar-button"
                  onClick={() =>
                    setProfileOpen((previous) => !previous)
                  }
                  aria-label="Menu profil"
                  aria-expanded={profileOpen}
                >
                  <Avatar user={user} />

                  <span
                    className={`avatar-arrow ${
                      profileOpen ? "open" : ""
                    }`}
                  >
                    ⌄
                  </span>
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    {/* INFORMASI PENGGUNA */}

                    <div className="profile-dropdown-user">
                      <Avatar user={user} size="large" />

                      <div className="profile-user-text">
                        <strong>{username}</strong>
                        <span>{email}</span>
                      </div>
                    </div>

                    <div className="dropdown-line" />

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

                        <small>
                          {unreadNotifications > 0
                            ? `${unreadNotifications} belum dibaca`
                            : "Perkembangan laporan kamu"}
                        </small>
                      </div>
                    </Link>

                    {/* MENU ADMIN */}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="profile-menu-item"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="menu-item-icon">🛡️</span>

                        <div>
                          <strong>Dashboard Admin</strong>
                          <small>Kelola laporan masyarakat</small>
                        </div>
                      </Link>
                    )}

                    <div className="dropdown-line" />

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