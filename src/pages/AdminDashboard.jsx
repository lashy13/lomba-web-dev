import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/admin-dashboard.css";

const demoReports = [
  {
    id: 1,
    title: "Jalan Rusak di Karangsoka",
    category: "Infrastruktur",
    location: "Karangsoka, Purwokerto",
    date: "1 Oktober 2026",
    status: "Dalam Proses",
    statusClass: "process",
    description:
      "Terdapat beberapa bagian jalan yang mengalami kerusakan dan cukup mengganggu pengguna jalan.",
  },
  {
    id: 2,
    title: "Lampu Penerangan Jalan Mati",
    category: "Penerangan jalan",
    location: "Purwokerto Selatan",
    date: "30 September 2026",
    status: "Diverifikasi",
    statusClass: "verified",
    description:
      "Lampu penerangan jalan tidak menyala pada malam hari sehingga kondisi jalan menjadi kurang terang.",
  },
  {
    id: 3,
    title: "Saluran Air Tersumbat",
    category: "Lingkungan",
    location: "Banyumas, Jawa Tengah",
    date: "29 September 2026",
    status: "Selesai",
    statusClass: "done",
    description:
      "Saluran air di sekitar permukiman mengalami penyumbatan dan menyebabkan aliran air tidak lancar.",
  },
];

const statusOptions = [
  "Menunggu",
  "Diverifikasi",
  "Dalam Proses",
  "Selesai",
];

function getStatusClass(status) {
  switch (status) {
    case "Diverifikasi":
      return "verified";

    case "Dalam Proses":
      return "process";

    case "Selesai":
      return "done";

    case "Menunggu":
    default:
      return "waiting";
  }
}

function getToday() {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getStoredReports() {
  try {
    const raw = localStorage.getItem("laporanSaya");

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem("notifikasi");

    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCombinedReports() {
  const storedReports = getStoredReports();

  const normalizedReports = storedReports.map((report) => ({
    ...report,

    category:
      report.categoryLabel ||
      report.category ||
      "Lainnya",

    location:
      report.location ||
      report.lokasi?.alamat ||
      "Lokasi belum tersedia",

    date:
      report.date ||
      (report.createdAt
        ? new Date(report.createdAt).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
          )
        : "-"),

    status: report.status || "Menunggu",

    statusClass:
      report.statusClass ||
      getStatusClass(report.status),
  }));

  const combined = [
    ...normalizedReports,
    ...demoReports,
  ];

  const uniqueReports = [];

  const usedIds = new Set();

  combined.forEach((report) => {
    const id = String(report.id);

    if (!usedIds.has(id)) {
      usedIds.add(id);
      uniqueReports.push(report);
    }
  });

  return uniqueReports;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [reports, setReports] = useState(() =>
    getCombinedReports(),
  );

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("Semua");

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [newStatus, setNewStatus] = useState("");

  const [adminNote, setAdminNote] = useState("");

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  useEffect(() => {
    const syncReports = () => {
      setReports(getCombinedReports());
    };

    window.addEventListener(
      "laporanUpdated",
      syncReports,
    );

    window.addEventListener(
      "notificationUpdated",
      syncReports,
    );

    window.addEventListener(
      "storage",
      syncReports,
    );

    return () => {
      window.removeEventListener(
        "laporanUpdated",
        syncReports,
      );

      window.removeEventListener(
        "notificationUpdated",
        syncReports,
      );

      window.removeEventListener(
        "storage",
        syncReports,
      );
    };
  }, []);

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !keyword ||
        [
          report.title,
          report.category,
          report.location,
          report.description,
          report.username,
          report.userEmail,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword),
          );

      const matchesStatus =
        statusFilter === "Semua" ||
        report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const totalReports = reports.length;

  const waitingReports = reports.filter(
    (report) => report.status === "Menunggu",
  ).length;

  const verifiedReports = reports.filter(
    (report) => report.status === "Diverifikasi",
  ).length;

  const processReports = reports.filter(
    (report) => report.status === "Dalam Proses",
  ).length;

  const completedReports = reports.filter(
    (report) => report.status === "Selesai",
  ).length;

  const openReportModal = (report) => {
    setSelectedReport(report);

    setNewStatus(
      report.status || "Menunggu",
    );

    setAdminNote(
      report.adminNote || "",
    );
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setNewStatus("");
    setAdminNote("");
  };

  const createNotification = (
    currentReport,
    status,
    note,
  ) => {
    if (!currentReport.userEmail) {
      return;
    }

    const notificationMessages = {
      Menunggu: {
        title: "Laporan sedang menunggu",
        message: `Laporan "${currentReport.title}" sedang menunggu proses verifikasi.`,
        type: "process",
      },

      Diverifikasi: {
        title: "Laporan berhasil diverifikasi",
        message: `Laporan "${currentReport.title}" telah diverifikasi oleh administrator.`,
        type: "verified",
      },

      "Dalam Proses": {
        title: "Laporan sedang diproses",
        message: `Laporan "${currentReport.title}" sedang dalam proses penanganan.`,
        type: "process",
      },

      Selesai: {
        title: "Laporan telah selesai",
        message: `Laporan "${currentReport.title}" telah selesai ditangani.`,
        type: "success",
      },
    };

    const notificationData =
      notificationMessages[status] || {
        title: "Status laporan diperbarui",
        message: `Status laporan "${currentReport.title}" telah diperbarui menjadi ${status}.`,
        type: "process",
      };

    const existingNotifications =
      getStoredNotifications();

    const notification = {
      id: `notif-${Date.now()}-${currentReport.id}`,

      userEmail:
        currentReport.userEmail,

      reportId: currentReport.id,

      title:
        notificationData.title,

      message:
        notificationData.message,

      type:
        notificationData.type,

      note:
        note?.trim() || "",

      read: false,

      createdAt:
        new Date().toISOString(),
    };

    const updatedNotifications = [
      notification,
      ...existingNotifications,
    ];

    localStorage.setItem(
      "notifikasi",
      JSON.stringify(
        updatedNotifications,
      ),
    );

    localStorage.setItem(
      "notificationUpdatedAt",
      new Date().toISOString(),
    );

    window.dispatchEvent(
      new Event("notificationUpdated"),
    );
  };

  const updateReportStatus = () => {
    if (!selectedReport) {
      return;
    }

    try {
      const allReports = getStoredReports();

      const reportIndex =
        allReports.findIndex(
          (report) =>
            String(report.id) ===
            String(selectedReport.id),
        );

      if (reportIndex === -1) {
        alert(
          "Laporan demo tidak dapat diubah. Buat laporan dari akun pengguna untuk mencoba fitur ini.",
        );

        return;
      }

      const currentReport =
        allReports[reportIndex];

      const previousStatus =
        currentReport.status ||
        "Menunggu";

      const today = getToday();

      const updatedTimeline =
        Array.isArray(
          currentReport.timeline,
        )
          ? currentReport.timeline.map(
              (item) => ({
                ...item,
              }),
            )
          : [];

      const statusIndex =
        statusOptions.indexOf(
          newStatus,
        );

      const defaultTimeline = [
        {
          title: "Laporan dikirim",
          description:
            "Laporan berhasil dikirim dan sedang menunggu pemeriksaan.",
          completed:
            statusIndex >= 0,
          date:
            currentReport.date ||
            today,
        },
        {
          title:
            "Laporan diverifikasi",
          description:
            "Laporan telah diperiksa oleh petugas.",
          completed:
            statusIndex >= 1,
        },
        {
          title: "Dalam proses",
          description:
            "Laporan sedang ditindaklanjuti oleh pihak terkait.",
          completed:
            statusIndex >= 2,
        },
        {
          title: "Selesai",
          description:
            "Permasalahan telah selesai ditangani.",
          completed:
            statusIndex >= 3,
        },
      ];

      let timeline =
        updatedTimeline.length >= 4
          ? updatedTimeline
          : defaultTimeline;

      timeline = timeline.map(
        (item, index) => ({
          ...item,

          completed:
            index <= statusIndex,

          date:
            index <= statusIndex
              ? item.date || today
              : item.date,
        }),
      );

      const updatedReport = {
        ...currentReport,

        status: newStatus,

        statusClass:
          getStatusClass(newStatus),

        adminNote:
          adminNote.trim(),

        updatedAt:
          new Date().toISOString(),

        timeline,
      };

      allReports[reportIndex] =
        updatedReport;

      localStorage.setItem(
        "laporanSaya",
        JSON.stringify(allReports),
      );

      /*
       * ========================================
       * BUAT NOTIFIKASI UNTUK USER
       * ========================================
       *
       * Notifikasi hanya dibuat jika status
       * memang berubah.
       */

      if (previousStatus !== newStatus) {
        createNotification(
          currentReport,
          newStatus,
          adminNote,
        );
      }

      localStorage.setItem(
        "notificationUpdatedAt",
        new Date().toISOString(),
      );

      window.dispatchEvent(
        new Event("laporanUpdated"),
      );

      window.dispatchEvent(
        new Event("notificationUpdated"),
      );

      setReports(
        getCombinedReports(),
      );

      closeReportModal();

      alert(
        "Status laporan berhasil diperbarui.",
      );
    } catch (error) {
      console.error(
        "Gagal memperbarui laporan:",
        error,
      );

      alert(
        "Terjadi kesalahan saat memperbarui laporan.",
      );
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(
      "adminLoggedIn",
    );

    localStorage.removeItem(
      "adminUser",
    );

    setShowLogoutModal(false);

    navigate("/login");
  };

  return (
    <main className="admin-dashboard-page">
      <Navbar />

      <div className="admin-dashboard-background">
        <div className="admin-dashboard-grid"></div>

        <div className="admin-dashboard-orb admin-dashboard-orb-one"></div>

        <div className="admin-dashboard-orb admin-dashboard-orb-two"></div>
      </div>

      <section className="admin-dashboard-main">
        <div className="admin-dashboard-container">
          {/* HEADER */}

          <div className="admin-dashboard-header">
            <div>
              <span className="admin-dashboard-label">
                ADMINISTRATOR
              </span>

              <h1>Dashboard</h1>

              <p>
                Kelola dan pantau laporan
                masyarakat melalui satu pusat
                kendali.
              </p>
            </div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={() =>
                setShowLogoutModal(true)
              }
            >
              Keluar
            </button>
          </div>

          {/* STATISTICS */}

          <div className="admin-stat-grid">
            <div className="admin-stat-card total">
              <span className="admin-stat-icon">
                #
              </span>

              <div>
                <span>Total Laporan</span>

                <strong>
                  {totalReports}
                </strong>
              </div>
            </div>

            <div className="admin-stat-card waiting">
              <span className="admin-stat-icon">
                !
              </span>

              <div>
                <span>Menunggu</span>

                <strong>
                  {waitingReports}
                </strong>
              </div>
            </div>

            <div className="admin-stat-card verified">
              <span className="admin-stat-icon">
                ✓
              </span>

              <div>
                <span>Diverifikasi</span>

                <strong>
                  {verifiedReports}
                </strong>
              </div>
            </div>

            <div className="admin-stat-card process">
              <span className="admin-stat-icon">
                ↻
              </span>

              <div>
                <span>Dalam Proses</span>

                <strong>
                  {processReports}
                </strong>
              </div>
            </div>

            <div className="admin-stat-card done">
              <span className="admin-stat-icon">
                ✓
              </span>

              <div>
                <span>Selesai</span>

                <strong>
                  {completedReports}
                </strong>
              </div>
            </div>
          </div>

          {/* REPORT MANAGEMENT */}

          <div className="admin-reports-section">
            <div className="admin-section-header">
              <div>
                <span>DATA LAPORAN</span>

                <h2>Kelola Laporan</h2>
              </div>

              <Link
                to="/laporan"
                className="admin-view-public"
              >
                Lihat halaman publik
                <span>→</span>
              </Link>
            </div>

            {/* CONTROLS */}

            <div className="admin-controls">
              <div className="admin-search">
                <span>⌕</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Cari laporan, lokasi, atau pelapor..."
                />
              </div>

              <select
                className="admin-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                <option value="Semua">
                  Semua Status
                </option>

                {statusOptions.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* REPORT TABLE */}

            {filteredReports.length > 0 ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>LAPORAN</th>

                      <th>PELAPOR</th>

                      <th>LOKASI</th>

                      <th>STATUS</th>

                      <th>TANGGAL</th>

                      <th>AKSI</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map(
                      (report) => (
                        <tr
                          key={`${report.userEmail || "demo"}-${report.id}`}
                        >
                          <td>
                            <div className="admin-report-title">
                              <div className="admin-report-mini-icon">
                                {report.photo ? (
                                  <img
                                    src={
                                      report.photo
                                    }
                                    alt=""
                                  />
                                ) : (
                                  "⌁"
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    report.title
                                  }
                                </strong>

                                <span>
                                  {
                                    report.category
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="admin-user-cell">
                              <strong>
                                {
                                  report.username ||
                                  "Pengguna"
                                }
                              </strong>

                              <span>
                                {
                                  report.userEmail ||
                                  "Data publik"
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="admin-location">
                              {
                                report.location
                              }
                            </span>
                          </td>

                          <td>
                            <span
                              className={`admin-status-badge ${
                                report.statusClass ||
                                getStatusClass(
                                  report.status,
                                )
                              }`}
                            >
                              <i></i>

                              {
                                report.status
                              }
                            </span>
                          </td>

                          <td>
                            <span className="admin-date">
                              {report.date}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-manage-button"
                              onClick={() =>
                                openReportModal(
                                  report,
                                )
                              }
                            >
                              Kelola
                              <span>→</span>
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty">
                <div>⌕</div>

                <h3>
                  Laporan tidak ditemukan
                </h3>

                <p>
                  Coba gunakan kata kunci atau
                  filter status yang berbeda.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* REPORT MODAL */}

      {selectedReport && (
        <div
          className="admin-modal-overlay"
          onClick={closeReportModal}
        >
          <div
            className="admin-report-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-modal-header">
              <div>
                <span>
                  KELOLA LAPORAN
                </span>

                <h2>
                  {selectedReport.title}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeReportModal}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-content">
              <div className="admin-detail-row">
                <span>Kategori</span>

                <strong>
                  {selectedReport.category}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>Lokasi</span>

                <strong>
                  {selectedReport.location}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>Pelapor</span>

                <strong>
                  {selectedReport.username ||
                    "Pengguna"}
                </strong>
              </div>

              <div className="admin-detail-row">
                <span>Deskripsi</span>

                <p>
                  {selectedReport.description ||
                    "Tidak ada deskripsi."}
                </p>
              </div>

              <div className="admin-form-group">
                <label>
                  Ubah status laporan
                </label>

                <select
                  value={newStatus}
                  onChange={(event) =>
                    setNewStatus(
                      event.target.value,
                    )
                  }
                >
                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="admin-form-group">
                <label>
                  Catatan petugas
                </label>

                <textarea
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(
                      event.target.value,
                    )
                  }
                  placeholder="Tambahkan informasi atau tanggapan untuk laporan ini..."
                  rows="4"
                />
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-button"
                onClick={closeReportModal}
              >
                Batal
              </button>

              <button
                type="button"
                className="admin-save-button"
                onClick={updateReportStatus}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}

      {showLogoutModal && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setShowLogoutModal(false)
          }
        >
          <div
            className="admin-logout-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-logout-icon">
              !
            </div>

            <h2>
              Keluar dari admin?
            </h2>

            <p>
              Kamu akan kembali ke halaman login.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-button"
                onClick={() =>
                  setShowLogoutModal(false)
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="admin-save-button"
                onClick={handleAdminLogout}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AdminDashboard;