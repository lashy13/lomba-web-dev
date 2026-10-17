
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/notifikasi.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

function getCurrentUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getNotifications() {
  try {
    const raw = localStorage.getItem("notifikasi");
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getNotificationIcon(type) {
  switch (String(type || "").toLowerCase()) {
    case "success":
    case "verified":
      return "✓";
    case "process":
      return "↻";
    case "warning":
      return "!";
    default:
      return "i";
  }
}

function getNotificationType(type) {
  switch (String(type || "").toLowerCase()) {
    case "success":
    case "verified":
      return "success";
    case "process":
      return "process";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeNotification(notification) {
  const rawRead =
    notification.is_read ?? notification.isRead ?? notification.read ?? 0;

  return {
    ...notification,
    id: notification.id,
    reportId: notification.reportId ?? notification.report_id ?? null,
    userEmail: notification.userEmail ?? notification.user_email ?? null,
    createdAt: notification.createdAt ?? notification.created_at ?? null,
    read: rawRead === true || Number(rawRead) === 1,
    type: getNotificationType(notification.type),
    title: notification.title || "Pembaruan laporan",
    message:
      notification.message ||
      notification.note ||
      "Ada pembaruan pada laporan kamu.",
    note: notification.note || null,
  };
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyState({ loggedIn }) {
  return (
    <div className="notification-empty">
      <div className="notification-empty-visual">
        <span className="notification-empty-orbit notification-empty-orbit-one" />
        <span className="notification-empty-orbit notification-empty-orbit-two" />
        <div className="notification-empty-icon">
          {loggedIn ? <BellIcon /> : "🔐"}
        </div>
      </div>

      <span className="notification-empty-label">
        {loggedIn ? "SEMUA TERKENDALI" : "AKSES AKUN"}
      </span>

      <h2>
        {loggedIn
          ? "Belum ada notifikasi"
          : "Masuk untuk melihat notifikasi"}
      </h2>

      <p>
        {loggedIn
          ? "Belum ada pembaruan untuk saat ini. Jika ada perkembangan laporan, informasinya akan muncul di sini."
          : "Masuk ke akun LaporKita untuk memantau perkembangan laporan yang kamu kirim."}
      </p>

      <Link
        to={loggedIn ? "/laporan-saya" : "/login"}
        className="notification-primary-button"
      >
        <span>{loggedIn ? "Lihat Laporan Saya" : "Masuk ke LaporKita"}</span>
        <ArrowIcon />
      </Link>
    </div>
  );
}

function NotificationCard({ notification, index, onMarkAsRead }) {
  const type = getNotificationType(notification.type);

  return (
    <article
      className={`notification-card ${
        notification.read ? "is-read" : "is-unread"
      }`}
      style={{ "--notification-index": Math.min(index, 8) }}
    >
      {!notification.read && (
        <span
          className="notification-unread-dot"
          aria-label="Belum dibaca"
          title="Belum dibaca"
        />
      )}

      <div className={`notification-icon notification-icon-${type}`}>
        <span>{getNotificationIcon(type)}</span>
      </div>

      <div className="notification-content">
        <div className="notification-card-top">
          <div className="notification-title-group">
            <h3>{notification.title}</h3>

            {!notification.read && (
              <span className="notification-new-badge">BARU</span>
            )}
          </div>

          <time
            className="notification-date"
            dateTime={notification.createdAt || undefined}
            title={formatDate(notification.createdAt)}
          >
            {formatDate(notification.createdAt)}
          </time>
        </div>

        <p className="notification-message">{notification.message}</p>

        {notification.note && (
          <div className="notification-note">
            <span className="notification-note-icon">i</span>
            <div>
              <strong>Catatan petugas</strong>
              <p>{notification.note}</p>
            </div>
          </div>
        )}

        <div className="notification-card-footer">
          {notification.reportId ? (
            <Link
              to={`/laporan/${encodeURIComponent(notification.reportId)}`}
              className="notification-report-link"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <span>Lihat laporan</span>
              <ArrowIcon />
            </Link>
          ) : (
            <span className="notification-footer-caption">
              <span className="notification-footer-dot" />
              Informasi LaporKita
            </span>
          )}

          {notification.read ? (
            <span className="notification-read-label">
              <span>✓</span> Sudah dibaca
            </span>
          ) : (
            <button
              type="button"
              className="notification-read-button"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Tandai dibaca
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Notifikasi() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getCurrentUser);
  const [notifications, setNotifications] = useState(() =>
    getNotifications().map(normalizeNotification),
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    const currentUser = getCurrentUser();
    const currentToken = localStorage.getItem("token");

    setUser(currentUser);

    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (!currentToken) {
        setNotifications(getNotifications().map(normalizeNotification));
        return;
      }

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Gagal mengambil notifikasi dari server (${response.status}).`,
        );
      }

      const result = await response.json();
      const apiNotifications = Array.isArray(result.data) ? result.data : [];
      const normalized = apiNotifications.map(normalizeNotification);

      setNotifications(normalized);
      localStorage.setItem("notifikasi", JSON.stringify(normalized));
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);

      setNotifications(getNotifications().map(normalizeNotification));
      setErrorMessage(
        "Notifikasi server belum dapat dimuat. Data lokal ditampilkan jika tersedia.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const refreshNotifications = () => {
      if (!active) return;

      void loadNotifications();
    };

    refreshNotifications();

    const syncData = () => {
      setUser(getCurrentUser());
      refreshNotifications();
    };

    window.addEventListener("notificationUpdated", syncData);
    window.addEventListener("userUpdated", syncData);
    window.addEventListener("storage", syncData);
    window.addEventListener("focus", syncData);

    return () => {
      active = false;
      window.removeEventListener("notificationUpdated", syncData);
      window.removeEventListener("userUpdated", syncData);
      window.removeEventListener("storage", syncData);
      window.removeEventListener("focus", syncData);
    };
  }, [loadNotifications]);

  const userNotifications = useMemo(() => {
    if (!user) return [];

    return notifications
      .filter((notification) => {
        if (notification.userEmail) {
          return (
            String(notification.userEmail).toLowerCase() ===
            String(user.email || "").toLowerCase()
          );
        }

        // Data API diasumsikan sudah difilter oleh backend untuk pengguna login.
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [notifications, user]);

  const unreadCount = userNotifications.filter(
    (notification) => !notification.read,
  ).length;

  const markAsRead = async (notificationId) => {
    const selectedNotification = userNotifications.find(
      (notification) => String(notification.id) === String(notificationId),
    );

    if (!selectedNotification || selectedNotification.read) return;

    setNotifications((previous) =>
      previous.map((notification) =>
        String(notification.id) === String(notificationId)
          ? { ...notification, read: true, is_read: 1 }
          : notification,
      ),
    );

    const localNotifications = getNotifications().map((notification) => {
      const belongsToUser =
        !notification.userEmail ||
        String(notification.userEmail).toLowerCase() ===
          String(user?.email || "").toLowerCase();

      return belongsToUser &&
        String(notification.id) === String(notificationId)
        ? { ...notification, read: true, is_read: 1 }
        : notification;
    });

    localStorage.setItem("notifikasi", JSON.stringify(localNotifications));
    window.dispatchEvent(new Event("notificationUpdated"));

    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${encodeURIComponent(
          notificationId,
        )}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Status baca belum tersimpan di server:", error);
      setErrorMessage(
        "Status dibaca belum tersimpan di server. Silakan coba lagi.",
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setErrorMessage("");

    const currentToken = localStorage.getItem("token");

    try {
      if (currentToken) {
        const response = await fetch(`${API_URL}/api/notifications/read-all`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      }

      const updatedNotifications = notifications.map((notification) => {
        const belongsToUser =
          !notification.userEmail ||
          String(notification.userEmail).toLowerCase() ===
            String(user.email || "").toLowerCase();

        return belongsToUser
          ? { ...notification, read: true, is_read: 1 }
          : notification;
      });

      setNotifications(updatedNotifications);

      const localNotifications = getNotifications().map((notification) => {
        const belongsToUser =
          !notification.userEmail ||
          String(notification.userEmail).toLowerCase() ===
            String(user.email || "").toLowerCase();

        return belongsToUser
          ? { ...notification, read: true, is_read: 1 }
          : notification;
      });

      localStorage.setItem("notifikasi", JSON.stringify(localNotifications));
      window.dispatchEvent(new Event("notificationUpdated"));
    } catch (error) {
      console.error("Gagal menandai semua notifikasi:", error);
      setErrorMessage(
        "Semua notifikasi belum berhasil ditandai dibaca. Silakan coba lagi.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="notification-page">
        <div className="notification-background" aria-hidden="true">
          <div className="notification-bg-orb notification-orb-one" />
          <div className="notification-bg-orb notification-orb-two" />
          <div className="notification-bg-orb notification-orb-three" />
          <div className="notification-grid-pattern" />
        </div>

        <section className="notification-container">
          <button
            type="button"
            className="notification-back-button"
            onClick={() => navigate(-1)}
          >
            <BackIcon />
            <span>Kembali</span>
          </button>

          <header className="notification-header">
            <div className="notification-heading">
              <div className="notification-eyebrow">
                <span className="notification-eyebrow-dot" />
                PUSAT INFORMASI LAPORKITA
              </div>

              <h1>
                Tetap <span>Terhubung.</span>
              </h1>

              <p>
                Pantau setiap perkembangan laporanmu dan dapatkan informasi
                terbaru langsung di sini.
              </p>
            </div>

            {user && unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                <span className="mark-all-icon">✓</span>
                <span>
                  {markingAll ? "Menyimpan..." : "Tandai semua dibaca"}
                </span>
              </button>
            )}
          </header>

          <section className="notification-summary" aria-live="polite">
            <div className="notification-summary-icon">
              <BellIcon />
              {unreadCount > 0 && (
                <span className="notification-summary-pulse" />
              )}
            </div>

            <div className="notification-summary-copy">
              <span className="notification-summary-caption">
                RINGKASAN NOTIFIKASI
              </span>
              <strong>
                {unreadCount === 0
                  ? "Kamu sudah mengetahui semuanya"
                  : `${unreadCount} notifikasi belum dibaca`}
              </strong>
              <span className="notification-summary-total">
                Dari total {userNotifications.length} notifikasi
              </span>
            </div>

            <div className="notification-summary-counter">
              <strong>{String(unreadCount).padStart(2, "0")}</strong>
              <span>Belum dibaca</span>
            </div>
          </section>

          <section className="notification-list-section">
            <div className="notification-list-heading">
              <div>
                <span className="notification-section-eyebrow">
                  UPDATE TERBARU
                </span>
                <h2>Aktivitas Notifikasi</h2>
              </div>

              {user && (
                <span className="notification-total-badge">
                  {userNotifications.length} pesan
                </span>
              )}
            </div>

            {errorMessage && (
              <div role="status" className="notification-error">
                <span className="notification-error-icon">!</span>
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="notification-list">
              {!user ? (
                <EmptyState loggedIn={false} />
              ) : loading && userNotifications.length === 0 ? (
                <div className="notification-loading" role="status">
                  <span className="notification-loading-spinner" />
                  <h2>Menyiapkan notifikasi</h2>
                  <p>Sebentar, kami sedang mengambil pembaruan untukmu.</p>
                </div>
              ) : userNotifications.length === 0 ? (
                <EmptyState loggedIn />
              ) : (
                userNotifications.map((notification, index) => (
                  <NotificationCard
                    key={notification.id ?? `${notification.createdAt}-${index}`}
                    notification={notification}
                    index={index}
                    onMarkAsRead={markAsRead}
                  />
                ))
              )}
            </div>

            {userNotifications.length > 0 && (
              <div className="notification-bottom-note">
                <span className="notification-bottom-check">✓</span>
                <p>
                  Kamu sudah berada di tempat yang tepat untuk memantau
                  perkembangan laporan bersama LaporKita.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}

export default Notifikasi;
