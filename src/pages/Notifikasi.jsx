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
  switch (type) {
    case "success":
    case "verified":
      return "✓";
    case "process":
      return "↻";
    case "warning":
      return "!";
    default:
      return "!";
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
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
    type: notification.type || "warning",
    title: notification.title || "Pembaruan laporan",
    message:
      notification.message ||
      notification.note ||
      "Ada pembaruan pada laporan kamu.",
    note: notification.note || null,
  };
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

      // Cache lokal untuk membantu tampilan saat server tidak tersedia.
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
    const refreshNotifications = () => {
      window.setTimeout(() => {
        void loadNotifications();
      }, 0);
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
            notification.userEmail.toLowerCase() ===
            String(user.email || "").toLowerCase()
          );
        }

        // Data dari API sudah difilter berdasarkan pengguna oleh backend.
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

    if (!selectedNotification || selectedNotification.read) {
      return;
    }

    // Perbarui tampilan terlebih dahulu agar terasa responsif.
    setNotifications((previous) =>
      previous.map((notification) =>
        String(notification.id) === String(notificationId)
          ? { ...notification, read: true, is_read: 1 }
          : notification,
      ),
    );

    const localNotifications = getNotifications().map((notification) =>
      String(notification.id) === String(notificationId)
        ? { ...notification, read: true, is_read: 1 }
        : notification,
    );

    localStorage.setItem("notifikasi", JSON.stringify(localNotifications));

    window.dispatchEvent(new Event("notificationUpdated"));

    const currentToken = localStorage.getItem("token");

    if (!currentToken) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
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
        "Status dibaca belum tersimpan di server. Coba muat ulang halaman.",
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setErrorMessage("");

    const currentToken = localStorage.getItem("token");

    try {
      // Simpan ke database terlebih dahulu jika token tersedia.
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

      // Setelah server berhasil, perbarui tampilan dan cache lokal.
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
          is_read: 1,
        })),
      );

      const localNotifications = getNotifications().map((notification) => {
        const belongsToUser =
          !notification.userEmail ||
          notification.userEmail.toLowerCase() ===
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
        <div className="notification-bg-orb notification-orb-one" />
        <div className="notification-bg-orb notification-orb-two" />

        <section className="notification-container">
          <button
            type="button"
            className="notification-back-button"
            onClick={() => navigate(-1)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Kembali</span>
          </button>

          <div className="notification-header">
            <div>
              <span className="notification-eyebrow">LAPORKITA</span>
              <h1>Notifikasi</h1>
              <p>Pantau perkembangan laporan kamu langsung dari sini.</p>
            </div>

            {user && unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                {markingAll ? "Menyimpan..." : "Tandai semua dibaca"}
              </button>
            )}
          </div>

          <div className="notification-summary">
            <div className="notification-summary-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8A6 6 0 0 0 6 8C6 15 3 15 3 17H21C21 15 18 15 18 8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 21H14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <strong>{unreadCount} notifikasi belum dibaca</strong>
              <span>Total {userNotifications.length} notifikasi</span>
            </div>
          </div>

          <div className="notification-list">
            {!user ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔐</div>
                <h2>Silakan masuk terlebih dahulu</h2>
                <p>Login untuk melihat notifikasi perkembangan laporan kamu.</p>
                <Link to="/login" className="notification-empty-button">
                  Masuk ke LaporKita
                </Link>
              </div>
            ) : loading ? (
              <div className="notification-empty">
                <h2>Memuat notifikasi...</h2>
                <p>Tunggu sebentar, ya.</p>
              </div>
            ) : userNotifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">🔔</div>
                <h2>Belum ada notifikasi</h2>
                <p>Notifikasi perkembangan laporan kamu akan muncul di sini.</p>
                <Link to="/laporan-saya" className="notification-empty-button">
                  Lihat Laporan Saya
                </Link>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <p role="status" className="notification-error">
                    {errorMessage}
                  </p>
                )}

                {userNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`notification-card ${
                      notification.read ? "is-read" : "is-unread"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}

                    <div
                      className={`notification-icon notification-icon-${notification.type}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="notification-content">
                      <div className="notification-card-top">
                        <h3>{notification.title}</h3>
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>

                      <p>{notification.message}</p>

                      {notification.note && (
                        <div className="notification-note">
                          <strong>Catatan petugas</strong>
                          <span>{notification.note}</span>
                        </div>
                      )}

                      {notification.reportId && (
                        <Link
                          to={`/laporan/${notification.reportId}`}
                          className="notification-report-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            void markAsRead(notification.id);
                          }}
                        >
                          Lihat laporan →
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default Notifikasi;
