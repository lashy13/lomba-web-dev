import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/notifikasi.css";

function getCurrentUser() {
  const rawUser = localStorage.getItem("user");

  try {
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getNotifications() {
  const raw = localStorage.getItem("notifikasi");

  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

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

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "✓";

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

function Notifikasi() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    getCurrentUser(),
  );

  const [notifications, setNotifications] =
    useState(() => getNotifications());

  const syncNotifications = () => {
    setNotifications(getNotifications());
    setUser(getCurrentUser());
  };

  useEffect(() => {
    window.addEventListener(
      "notificationUpdated",
      syncNotifications,
    );

    window.addEventListener(
      "userUpdated",
      syncNotifications,
    );

    window.addEventListener(
      "storage",
      syncNotifications,
    );

    return () => {
      window.removeEventListener(
        "notificationUpdated",
        syncNotifications,
      );

      window.removeEventListener(
        "userUpdated",
        syncNotifications,
      );

      window.removeEventListener(
        "storage",
        syncNotifications,
      );
    };
  }, []);

  const userNotifications = useMemo(() => {
    if (!user?.email) {
      return [];
    }

    return notifications
      .filter(
        (notification) =>
          notification.userEmail === user.email,
      )
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || 0,
        ).getTime();

        const dateB = new Date(
          b.createdAt || 0,
        ).getTime();

        return dateB - dateA;
      });
  }, [notifications, user]);

  const unreadCount = userNotifications.filter(
    (notification) => !notification.read,
  ).length;

  const markAsRead = (notificationId) => {
    const allNotifications =
      getNotifications();

    const updatedNotifications =
      allNotifications.map(
        (notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification,
      );

    localStorage.setItem(
      "notifikasi",
      JSON.stringify(
        updatedNotifications,
      ),
    );

    setNotifications(
      updatedNotifications,
    );

    window.dispatchEvent(
      new Event("notificationUpdated"),
    );
  };

  const markAllAsRead = () => {
    if (!user?.email) {
      return;
    }

    const allNotifications =
      getNotifications();

    const updatedNotifications =
      allNotifications.map(
        (notification) =>
          notification.userEmail === user.email
            ? {
                ...notification,
                read: true,
              }
            : notification,
      );

    localStorage.setItem(
      "notifikasi",
      JSON.stringify(
        updatedNotifications,
      ),
    );

    setNotifications(
      updatedNotifications,
    );

    window.dispatchEvent(
      new Event("notificationUpdated"),
    );
  };

  return (
    <>
      <Navbar />

      <main className="notification-page">
        <div className="notification-bg-orb notification-orb-one" />

        <div className="notification-bg-orb notification-orb-two" />

        <section className="notification-container">

          {/* ========================================
              BACK BUTTON
          ======================================== */}

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


          {/* ========================================
              HEADER
          ======================================== */}

          <div className="notification-header">
            <div>
              <span className="notification-eyebrow">
                LAPORKITA
              </span>

              <h1>Notifikasi</h1>

              <p>
                Pantau perkembangan laporan kamu
                langsung dari sini.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                Tandai semua dibaca
              </button>
            )}
          </div>


          {/* ========================================
              SUMMARY
          ======================================== */}

          <div className="notification-summary">
            <div className="notification-summary-icon">
              🔔
            </div>

            <div>
              <strong>
                {unreadCount} notifikasi belum
                dibaca
              </strong>

              <span>
                Total {userNotifications.length}{" "}
                notifikasi
              </span>
            </div>
          </div>


          {/* ========================================
              NOTIFICATION LIST
          ======================================== */}

          <div className="notification-list">

            {!user ? (

              <div className="notification-empty">

                <div className="notification-empty-icon">
                  🔐
                </div>

                <h2>
                  Silakan masuk terlebih dahulu
                </h2>

                <p>
                  Login untuk melihat notifikasi
                  perkembangan laporan kamu.
                </p>

                <Link
                  to="/login"
                  className="notification-empty-button"
                >
                  Masuk ke LaporKita
                </Link>

              </div>

            ) : userNotifications.length === 0 ? (

              <div className="notification-empty">

                <div className="notification-empty-icon">
                  🔔
                </div>

                <h2>
                  Belum ada notifikasi
                </h2>

                <p>
                  Notifikasi perkembangan laporan
                  kamu akan muncul di sini.
                </p>

                <Link
                  to="/laporan-saya"
                  className="notification-empty-button"
                >
                  Lihat Laporan Saya
                </Link>

              </div>

            ) : (

              userNotifications.map(
                (notification) => (

                  <div
                    key={notification.id}
                    className={`notification-card ${
                      notification.read
                        ? "is-read"
                        : "is-unread"
                    }`}
                    onClick={() =>
                      markAsRead(
                        notification.id,
                      )
                    }
                  >

                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}


                    <div
                      className={`notification-icon notification-icon-${notification.type}`}
                    >
                      {getNotificationIcon(
                        notification.type,
                      )}
                    </div>


                    <div className="notification-content">

                      <div className="notification-card-top">

                        <h3>
                          {notification.title}
                        </h3>

                        <span>
                          {formatDate(
                            notification.createdAt,
                          )}
                        </span>

                      </div>


                      <p>
                        {notification.message}
                      </p>


                      {notification.note && (
                        <div className="notification-note">

                          <strong>
                            Catatan petugas
                          </strong>

                          <span>
                            {notification.note}
                          </span>

                        </div>
                      )}


                      {notification.reportId && (
                        <Link
                          to={`/laporan/${notification.reportId}`}
                          className="notification-report-link"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          Lihat laporan →
                        </Link>
                      )}

                    </div>

                  </div>

                ),
              )

            )}

          </div>

        </section>

      </main>
    </>
  );
}

export default Notifikasi;