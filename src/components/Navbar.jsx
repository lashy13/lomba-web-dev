import { useEffect, useRef, useState, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";

import "../styles/navbar.css";
import logoLaporkita from "../assets/logo-laporkita.png";
import ConfirmModal from "./ConfirmModal";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

/* =====================================
   HELPER
===================================== */

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");

    if (!raw) return null;

    const user = JSON.parse(raw);

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
    };
  } catch {
    return null;
  }
}

function checkLoggedIn() {
  return (
    localStorage.getItem("isLoggedIn") === "true" &&
    Boolean(localStorage.getItem("token"))
  );
}

function isNotificationUnread(notification) {
  const value =
    notification.is_read ?? notification.isRead ?? notification.read ?? 0;

  if (value === true) return false;
  if (value === false) return true;

  return Number(value) !== 1;
}

/* =====================================
   ICON
===================================== */

function Icon({ name, size = 20 }) {
  const icons = {
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),

    close: (
      <>
        <path d="M5 5l14 14M19 5 5 19" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),

    chevron: <path d="m6 9 6 6 6-6" />,

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),

    document: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),

    clipboard: (
      <>
        <rect x="5" y="5" width="14" height="16" rx="2" />
        <path d="M9 5V3h6v2M9 11h6M9 15h6" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
        <path d="M10 21h4" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </>
    ),

    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
        <path d="M9 21v-7h6v7" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.user}
    </svg>
  );
}

/* =====================================
   AVATAR
===================================== */

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="currentColor" />
      <path
        d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"
        fill="currentColor"
      />
    </svg>
  );
}

function Avatar({ user, size = "normal" }) {
  const image = user?.profileImage || "";
  const [failedImage, setFailedImage] = useState("");

  const showFallback = !image || failedImage === image;

  return (
    <div className={`lk-nav-avatar ${size}`}>
      {!showFallback ? (
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

/* =====================================
   NAVBAR
===================================== */

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navbarRef = useRef(null);
  const profileRef = useRef(null);
  const lastScrollRef = useRef(0);
  const requestIdRef = useRef(0);

  const [isLoggedIn, setIsLoggedIn] = useState(checkLoggedIn);
  const [user, setUser] = useState(getStoredUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [showNavbar, setShowNavbar] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // STATE BARU UNTUK MODAL LOGOUT
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === "admin";

  const username = user?.username || user?.name || "Pengguna";
  const email = user?.email || "Belum ada email";

  /* =====================================
     CLOSE MENU WHEN ROUTE CHANGES
  ===================================== */

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setProfileOpen(false);
      setShowNavbar(true);
      setShowLogoutModal(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.search, location.hash]);

  /* =====================================
     SCROLL EFFECT
  ===================================== */

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = Math.max(window.scrollY, 0);
        const lastY = lastScrollRef.current;

        setScrolled(currentY > 20);

        if (currentY < 80 || mobileOpen || profileOpen || showLogoutModal) {
          setShowNavbar(true);
        } else if (currentY > lastY + 5) {
          setShowNavbar(false);
        } else if (currentY < lastY - 5) {
          setShowNavbar(true);
        }

        lastScrollRef.current = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mobileOpen, profileOpen, showLogoutModal]);

  /* =====================================
     FETCH NOTIFICATIONS
  ===================================== */

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    const requestId = ++requestIdRef.current;

    if (!token || !checkLoggedIn()) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil notifikasi.");
      }

      const result = await response.json();

      if (!Array.isArray(result.data)) return;

      const count = result.data.filter(isNotificationUnread).length;

      if (
        requestId === requestIdRef.current &&
        token === localStorage.getItem("token") &&
        checkLoggedIn()
      ) {
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  }, []);

  /* =====================================
     AUTH UPDATE
  ===================================== */

  useEffect(() => {
    const updateAuth = () => {
      const loggedIn = checkLoggedIn();

      setIsLoggedIn(loggedIn);
      setUser(getStoredUser());

      if (!loggedIn) {
        requestIdRef.current += 1;
        setUnreadNotifications(0);
        setProfileOpen(false);
        setShowLogoutModal(false);
      } else {
        void fetchNotifications();
      }
    };

    updateAuth();

    window.addEventListener("userUpdated", updateAuth);
    window.addEventListener("notificationUpdated", fetchNotifications);
    window.addEventListener("storage", updateAuth);
    window.addEventListener("focus", updateAuth);

    return () => {
      requestIdRef.current += 1;

      window.removeEventListener("userUpdated", updateAuth);
      window.removeEventListener("notificationUpdated", fetchNotifications);
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("focus", updateAuth);
    };
  }, [fetchNotifications]);

  /* =====================================
     CLICK OUTSIDE & ESCAPE
  ===================================== */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showLogoutModal) return;

      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMobileOpen(false);
        setProfileOpen(false);
      } else if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);

        if (showLogoutModal) {
          setShowLogoutModal(false);
        }
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutModal]);

  /* =====================================
     BODY SCROLL LOCK
  ===================================== */

  useEffect(() => {
    if (!mobileOpen && !showLogoutModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, showLogoutModal]);

  /* =====================================
     LOGOUT
  ===================================== */

  // Membuka modal, bukan langsung logout.
  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    setShowLogoutModal(true);
  };

  // Hanya dipanggil jika pengguna menekan tombol konfirmasi.
  const confirmLogout = () => {
    requestIdRef.current += 1;

    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    setUser(null);
    setIsLoggedIn(false);
    setUnreadNotifications(0);
    setProfileOpen(false);
    setMobileOpen(false);
    setShowLogoutModal(false);

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/");
  };

  const handleNotificationClick = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    navigate("/notifikasi");
  };

  /* =====================================
     NAVIGATION LINKS
  ===================================== */

  const navLinks = [
    {
      to: "/",
      label: "Beranda",
      icon: "home",
      end: true,
    },
    {
      to: "/laporan",
      label: "Jelajahi Laporan",
      icon: "document",
    },
    ...(isLoggedIn
      ? [
          {
            to: "/laporan-saya",
            label: "Laporan Saya",
            icon: "clipboard",
          },
        ]
      : []),
    ...(isLoggedIn && isAdmin
      ? [
          {
            to: "/admin",
            label: "Dashboard Admin",
            icon: "shield",
          },
        ]
      : []),
  ];

  /* =====================================
     RENDER
  ===================================== */

  return (
    <>
      <header
        ref={navbarRef}
        className={[
          "lk-navbar",
          showNavbar ? "visible" : "hidden",
          scrolled ? "scrolled" : "",
          mobileOpen ? "mobile-active" : "",
        ].join(" ")}
      >
        <div className="lk-navbar-container">
          <div className="lk-navbar-inner">
            {/* BRAND */}

            <Link
              to="/"
              className="lk-navbar-brand"
              onClick={() => {
                setMobileOpen(false);
                setProfileOpen(false);
              }}
            >
              <div className="lk-navbar-logo">
                <img src={logoLaporkita} alt="Logo LaporKita" />
              </div>

              <div className="lk-navbar-brand-text">
                <strong>
                  Lapor<span>Kita</span>
                </strong>
                <small>Suara untuk perubahan</small>
              </div>
            </Link>

            {/* DESKTOP MENU */}

            <nav className="lk-navbar-menu" aria-label="Navigasi utama">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `lk-navbar-link ${isActive ? "active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* RIGHT ACTIONS */}

            <div className="lk-navbar-right">
              {isLoggedIn ? (
                <>
                  {/* CREATE REPORT */}

                  <Link
                    to="/buat-laporan"
                    className="lk-navbar-create-report"
                    onClick={() => {
                      setMobileOpen(false);
                      setProfileOpen(false);
                    }}
                  >
                    <Icon name="plus" size={18} />
                    <span>Buat Laporan</span>
                  </Link>

                  {/* NOTIFICATION */}

                  <button
                    type="button"
                    className="lk-navbar-notification"
                    onClick={handleNotificationClick}
                    aria-label={
                      unreadNotifications > 0
                        ? `${unreadNotifications} notifikasi belum dibaca`
                        : "Notifikasi"
                    }
                  >
                    <Icon name="bell" size={21} />

                    {unreadNotifications > 0 && (
                      <span className="lk-notification-badge">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* PROFILE */}

                  <div className="lk-navbar-profile" ref={profileRef}>
                    <button
                      type="button"
                      className={`lk-profile-trigger ${
                        profileOpen ? "active" : ""
                      }`}
                      onClick={() => {
                        setProfileOpen((prev) => !prev);
                        setMobileOpen(false);
                      }}
                      aria-label="Menu profil"
                      aria-expanded={profileOpen}
                      aria-haspopup="menu"
                    >
                      <Avatar user={user} />

                      <span className="lk-profile-name">{username}</span>

                      <span
                        className={`lk-profile-chevron ${
                          profileOpen ? "open" : ""
                        }`}
                      >
                        <Icon name="chevron" size={15} />
                      </span>
                    </button>

                    {profileOpen && (
                      <div className="lk-profile-dropdown" role="menu">
                        <div className="lk-dropdown-user">
                          <Avatar user={user} size="large" />

                          <div>
                            <strong>{username}</strong>
                            <span>{email}</span>
                          </div>
                        </div>

                        <div className="lk-dropdown-divider" />

                        <Link
                          to="/profil"
                          className="lk-dropdown-item"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                        >
                          <span className="lk-dropdown-icon">
                            <Icon name="user" />
                          </span>

                          <div>
                            <strong>Profil Saya</strong>
                            <small>Kelola informasi akun</small>
                          </div>
                        </Link>

                        <Link
                          to="/buat-laporan"
                          className="lk-dropdown-item"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                        >
                          <span className="lk-dropdown-icon">
                            <Icon name="plus" />
                          </span>

                          <div>
                            <strong>Buat Laporan</strong>
                            <small>Laporkan fasilitas bermasalah</small>
                          </div>
                        </Link>

                        <Link
                          to="/laporan-saya"
                          className="lk-dropdown-item"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                        >
                          <span className="lk-dropdown-icon">
                            <Icon name="clipboard" />
                          </span>

                          <div>
                            <strong>Laporan Saya</strong>
                            <small>Lihat riwayat laporan</small>
                          </div>
                        </Link>

                        <Link
                          to="/notifikasi"
                          className="lk-dropdown-item"
                          role="menuitem"
                          onClick={() => setProfileOpen(false)}
                        >
                          <span className="lk-dropdown-icon">
                            <Icon name="bell" />
                          </span>

                          <div>
                            <strong>Notifikasi</strong>
                            <small>
                              {unreadNotifications > 0
                                ? `${unreadNotifications} belum dibaca`
                                : "Lihat perkembangan laporan"}
                            </small>
                          </div>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="lk-dropdown-item"
                            role="menuitem"
                            onClick={() => setProfileOpen(false)}
                          >
                            <span className="lk-dropdown-icon">
                              <Icon name="shield" />
                            </span>

                            <div>
                              <strong>Dashboard Admin</strong>
                              <small>Kelola laporan masyarakat</small>
                            </div>
                          </Link>
                        )}

                        <div className="lk-dropdown-divider" />

                        <button
                          type="button"
                          className="lk-dropdown-logout"
                          onClick={handleLogout}
                        >
                          <Icon name="logout" />
                          Keluar dari Akun
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="lk-navbar-auth">
                  <Link to="/login" className="lk-navbar-login">
                    Masuk
                  </Link>

                  <Link to="/register" className="lk-navbar-register">
                    Daftar
                    <Icon name="arrow" size={17} />
                  </Link>
                </div>
              )}

              {/* MOBILE TOGGLE */}

              <button
                type="button"
                className={`lk-navbar-toggle ${mobileOpen ? "active" : ""}`}
                onClick={() => {
                  setMobileOpen((prev) => !prev);
                  setProfileOpen(false);
                }}
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={mobileOpen}
                aria-controls="lk-mobile-navigation"
              >
                <span className="lk-toggle-line" />
                <span className="lk-toggle-line" />
                <span className="lk-toggle-line" />
              </button>
            </div>
          </div>

          {/* MOBILE MENU */}

          <div
            id="lk-mobile-navigation"
            className={`lk-mobile-menu ${mobileOpen ? "open" : ""}`}
            aria-hidden={!mobileOpen}
            inert={!mobileOpen}
          >
            <nav className="lk-mobile-links" aria-label="Navigasi mobile">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `lk-mobile-link ${isActive ? "active" : ""}`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="lk-mobile-link-icon">
                    <Icon name={item.icon} />
                  </span>

                  <span>{item.label}</span>

                  <Icon name="arrow" size={17} />
                </NavLink>
              ))}
            </nav>

            <div className="lk-mobile-divider" />

            {isLoggedIn ? (
              <div className="lk-mobile-account">
                <div className="lk-mobile-user">
                  <Avatar user={user} />

                  <div>
                    <strong>{username}</strong>
                    <span>{email}</span>
                  </div>
                </div>

                <Link
                  to="/buat-laporan"
                  className="lk-mobile-cta"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name="plus" size={18} />
                  Buat Laporan
                  <Icon name="arrow" size={18} />
                </Link>

                <Link
                  to="/profil"
                  className="lk-mobile-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name="user" size={18} />
                  Profil Saya
                </Link>

                <Link
                  to="/notifikasi"
                  className="lk-mobile-secondary"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name="bell" size={18} />
                  Notifikasi

                  {unreadNotifications > 0 && (
                    <span className="lk-notification-badge">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  className="lk-mobile-logout"
                  onClick={handleLogout}
                >
                  <Icon name="logout" size={18} />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="lk-mobile-auth">
                <Link
                  to="/login"
                  className="lk-mobile-login"
                  onClick={() => setMobileOpen(false)}
                >
                  Masuk
                </Link>

                <Link
                  to="/register"
                  className="lk-mobile-register"
                  onClick={() => setMobileOpen(false)}
                >
                  Daftar Sekarang
                  <Icon name="arrow" size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Yakin ingin keluar?"
        message="Kamu yakin ingin keluar dari akun LaporKita? Kamu perlu login kembali untuk mengakses akunmu."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default Navbar;