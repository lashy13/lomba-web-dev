import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan-saya.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

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

function getStatusLabel(status) {
  switch (status) {
    case "Diverifikasi":
      return "Diverifikasi";

    case "Dalam Proses":
      return "Dalam Proses";

    case "Selesai":
      return "Selesai";

    case "Menunggu":
    default:
      return "Menunggu";
  }
}

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getLocation(item) {
  return (
    item.location_detail ||
    item.address ||
    [
      item.village_name,
      item.district_name,
      item.regency_name,
      item.province_name,
    ]
      .filter(Boolean)
      .join(", ") ||
    "Lokasi belum tersedia"
  );
}

function LaporanSaya() {
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadReports = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLaporan([]);
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/api/reports/my-reports`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        setLaporan([]);
        navigate("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data laporan.");
      }

      setLaporan(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("GAGAL MEMUAT LAPORAN:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil laporan.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchReports = async () => {
      await loadReports();
    };

    fetchReports();

    const handleReportsUpdated = () => {
      void loadReports();
    };

    window.addEventListener("laporanUpdated", handleReportsUpdated);

    return () => {
      window.removeEventListener("laporanUpdated", handleReportsUpdated);
    };
  }, [loadReports]);

  const totalLaporan = laporan.length;

  const dalamProses = laporan.filter((item) =>
    ["Menunggu", "Diverifikasi", "Dalam Proses"].includes(item.status),
  ).length;

  const selesai = laporan.filter((item) => item.status === "Selesai").length;

  const canDelete = (item) => {
    return (
      !item.status || item.status === "Menunggu" || item.status === "Selesai"
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    /*
      Penghapusan belum dihubungkan ke backend.
      Jangan menghapus data hanya dari localStorage karena
      laporan sekarang tersimpan di database.
    */
    alert("Fitur hapus laporan perlu dihubungkan ke backend terlebih dahulu.");

    setDeleteTarget(null);
    setOpenMenu(null);
  };

  return (
    <main className="laporan-saya-page">
      <Navbar />

      <div className="laporan-saya-background">
        <div className="laporan-saya-grid"></div>

        <div className="laporan-saya-orb laporan-saya-orb-one"></div>

        <div className="laporan-saya-orb laporan-saya-orb-two"></div>
      </div>

      <section className="laporan-saya-main">
        <div className="laporan-saya-container">
          <Link to="/" className="laporan-saya-back">
            <span>←</span>
            Kembali
          </Link>

          <div className="laporan-saya-heading">
            <div>
              <span className="laporan-saya-label">AKUN SAYA</span>

              <h1>Laporan Saya</h1>

              <p>
                Pantau semua laporan yang pernah kamu kirim melalui LaporKita.
              </p>
            </div>

            <Link to="/buat-laporan" className="laporan-saya-create">
              <span>+</span>
              Buat Laporan
            </Link>
          </div>

          {/* RINGKASAN LAPORAN */}

          <div className="laporan-saya-summary">
            <div className="laporan-saya-summary-card">
              <span>Total Laporan</span>
              <strong>{totalLaporan}</strong>
            </div>

            <div className="laporan-saya-summary-card">
              <span>Dalam Proses</span>
              <strong>{dalamProses}</strong>
            </div>

            <div className="laporan-saya-summary-card">
              <span>Selesai</span>
              <strong>{selesai}</strong>
            </div>
          </div>

          {/* STATUS MEMUAT */}

          {loading ? (
            <div className="laporan-saya-empty">
              <h2>Memuat laporan...</h2>
              <p>Sedang mengambil data laporan dari server.</p>
            </div>
          ) : error ? (
            <div className="laporan-saya-empty">
              <h2>Gagal memuat laporan</h2>
              <p>{error}</p>

              <button
                type="button"
                className="laporan-saya-empty-button"
                onClick={loadReports}
              >
                Coba Lagi
              </button>
            </div>
          ) : laporan.length === 0 ? (
            <div className="laporan-saya-empty">
              <div className="laporan-saya-empty-icon">📋</div>

              <h2>Belum ada laporan</h2>

              <p>
                Kamu belum pernah membuat laporan. Yuk ikut berkontribusi untuk
                lingkungan sekitar.
              </p>

              <Link to="/buat-laporan" className="laporan-saya-empty-button">
                Buat Laporan
              </Link>
            </div>
          ) : (
            <div className="laporan-saya-list">
              {laporan.map((item) => {
                const statusClass = getStatusClass(item.status);
                const statusLabel = getStatusLabel(item.status);

                return (
                  <div key={item.id} className="laporan-saya-card-wrapper">
                    <Link
                      to={`/laporan/${item.id}`}
                      className="laporan-saya-card"
                      onClick={() => setOpenMenu(null)}
                    >
                      <div className="laporan-saya-card-top">
                        <span className="laporan-saya-category">
                          {item.category_name ||
                            item.categoryLabel ||
                            item.category ||
                            "Umum"}
                        </span>

                        <span className={`laporan-saya-status ${statusClass}`}>
                          <span className="laporan-saya-status-dot"></span>
                          {statusLabel}
                        </span>
                      </div>

                      <h2>{item.title || "Laporan tanpa judul"}</h2>

                      <div className="laporan-saya-meta">
                        <span>📍 {getLocation(item)}</span>

                        <span>
                          📅 {formatDate(item.created_at || item.date)}
                        </span>
                      </div>

                      <div className="laporan-saya-card-bottom">
                        <span>Lihat detail laporan</span>
                        <span className="laporan-saya-arrow">→</span>
                      </div>
                    </Link>

                    {/* MENU LAPORAN */}

                    <div className="laporan-saya-menu">
                      <button
                        type="button"
                        className="laporan-saya-menu-button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          setOpenMenu(openMenu === item.id ? null : item.id);
                        }}
                        aria-label="Menu laporan"
                      >
                        <span></span>
                        <span></span>
                        <span></span>
                      </button>

                      {openMenu === item.id && (
                        <div className="laporan-saya-dropdown">
                          <Link
                            to={`/laporan/${item.id}`}
                            className="laporan-saya-dropdown-item"
                            onClick={() => setOpenMenu(null)}
                          >
                            <span>↗</span>
                            Lihat Detail
                          </Link>

                          {canDelete(item) ? (
                            <button
                              type="button"
                              className="laporan-saya-dropdown-item delete"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                setDeleteTarget(item);
                                setOpenMenu(null);
                              }}
                            >
                              <span>⌫</span>
                              Hapus Laporan
                            </button>
                          ) : (
                            <div className="laporan-saya-delete-disabled">
                              <span>🔒</span>
                              Tidak dapat dihapus
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* KONFIRMASI HAPUS */}

      {deleteTarget && (
        <div
          className="laporan-saya-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="laporan-saya-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="laporan-saya-modal-icon">!</div>

            <h2>Hapus laporan?</h2>

            <p>
              Laporan <strong>"{deleteTarget.title}"</strong> akan dihapus dan
              tidak dapat dikembalikan.
            </p>

            <div className="laporan-saya-modal-actions">
              <button
                type="button"
                className="laporan-saya-modal-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>

              <button
                type="button"
                className="laporan-saya-modal-delete"
                onClick={handleDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default LaporanSaya;
