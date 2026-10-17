
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan-saya.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

// ========================================
// STATUS
// ========================================

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

// ========================================
// FORMAT TANGGAL
// ========================================

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

// ========================================
// LOKASI
// ========================================

function getLocation(item) {
  const locationParts = [
    item.village_name,
    item.district_name,
    item.regency_name,
    item.province_name,
  ].filter(Boolean);

  const uniqueLocationParts = locationParts.filter(
    (value, index, array) =>
      array.findIndex(
        (other) =>
          String(other).toLowerCase() === String(value).toLowerCase(),
      ) === index,
  );

  return (
    item.location_detail ||
    item.address ||
    item.location ||
    uniqueLocationParts.join(", ") ||
    "Lokasi belum tersedia"
  );
}

// ========================================
// FOTO LAPORAN
// ========================================

function getReportPhoto(item) {
  const photo =
    item.photo ||
    item.image ||
    item.image_url ||
    item.photo_url ||
    null;

  if (typeof photo !== "string" || !photo.trim()) {
    return null;
  }

  const value = photo.trim();

  // Foto Base64 yang disimpan sebagai data URL.
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(value)) {
    return value;
  }

  // URL gambar dari server.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Path gambar relatif dari API.
  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return null;
}

// ========================================
// KOMPONEN FOTO LAPORAN
// ========================================

function ReportPhoto({ item }) {
  const [imageError, setImageError] = useState(false);

  const photo = getReportPhoto(item);

  if (!photo || imageError) {
    return null;
  }

  return (
    <div className="laporan-saya-card-image">
      <img
        src={photo}
        alt={`Foto laporan ${item.title || "fasilitas umum"}`}
        loading="lazy"
        onError={() => {
          console.error(
            "Foto laporan gagal ditampilkan:",
            item.id,
            item.photo_name || photo,
          );

          setImageError(true);
        }}
      />

      <div className="laporan-saya-card-image-overlay" />
    </div>
  );
}

// ========================================
// HALAMAN LAPORAN SAYA
// ========================================

function LaporanSaya() {
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ========================================
  // AMBIL LAPORAN PENGGUNA
  // ========================================

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
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");

        setLaporan([]);
        setLoading(false);
        navigate("/login");

        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data laporan.");
      }

      const reports = Array.isArray(result.data) ? result.data : [];

      setLaporan(reports);
      setError("");
    } catch (err) {
      console.error("GAGAL MEMUAT LAPORAN:", err);

      setError(err.message || "Terjadi kesalahan saat mengambil laporan.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ========================================
  // LOAD PERTAMA DAN REFRESH
  // ========================================

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadReports();
    }, 0);

    const handleReportsUpdated = () => {
      void loadReports();
    };

    window.addEventListener("laporanUpdated", handleReportsUpdated);

    return () => {
      window.clearTimeout(initialLoad);

      window.removeEventListener(
        "laporanUpdated",
        handleReportsUpdated,
      );
    };
  }, [loadReports]);

  // ========================================
  // TUTUP MENU JIKA KLIK DI LUAR
  // ========================================

  useEffect(() => {
    const closeMenu = (event) => {
      if (!event.target.closest(".laporan-saya-menu")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("click", closeMenu);

    return () => {
      document.removeEventListener("click", closeMenu);
    };
  }, []);

  // ========================================
  // STATISTIK
  // ========================================

  const totalLaporan = laporan.length;

  const dalamProses = laporan.filter((item) =>
    ["Menunggu", "Diverifikasi", "Dalam Proses"].includes(item.status),
  ).length;

  const selesai = laporan.filter(
    (item) => item.status === "Selesai",
  ).length;

  // ========================================
  // HAK HAPUS LAPORAN
  // ========================================

  const canDelete = (item) => item.status === "Menunggu";

  // ========================================
  // HAPUS LAPORAN
  // ========================================

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setDeleteTarget(null);
      navigate("/login");
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/reports/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("isLoggedIn");

        setLaporan([]);
        setDeleteTarget(null);

        navigate("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus laporan.");
      }

      const deletedId = deleteTarget.id;

      setLaporan((previous) =>
        previous.filter((item) => item.id !== deletedId),
      );

      setDeleteTarget(null);
      setOpenMenu(null);

      // Beri tahu halaman lain bahwa laporan berubah.
      window.dispatchEvent(new Event("laporanUpdated"));
    } catch (err) {
      console.error("GAGAL MENGHAPUS LAPORAN:", err);

      setError(err.message || "Terjadi kesalahan saat menghapus laporan.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="laporan-saya-page">
      <Navbar />

      <div className="laporan-saya-background" aria-hidden="true">
        <div className="laporan-saya-grid"></div>
        <div className="laporan-saya-orb laporan-saya-orb-one"></div>
        <div className="laporan-saya-orb laporan-saya-orb-two"></div>
        <div className="laporan-saya-orb laporan-saya-orb-three"></div>
      </div>

      <section className="laporan-saya-main">
        <div className="laporan-saya-container">
          <Link to="/" className="laporan-saya-back">
            <span>←</span>
            Kembali ke Beranda
          </Link>

          {/* HEADER */}

          <div className="laporan-saya-heading">
            <div className="laporan-saya-heading-content">
              <span className="laporan-saya-label">
                <span className="laporan-saya-label-dot"></span>
                RUANG KONTRIBUSIMU
              </span>

              <h1>
                Laporan <span>Saya.</span>
              </h1>

              <p>
                Pantau perkembangan laporanmu dan ikut berkontribusi untuk
                lingkungan yang lebih baik.
              </p>
            </div>

            <Link to="/buat-laporan" className="laporan-saya-create">
              <span className="laporan-saya-create-icon">+</span>
              <span>Buat Laporan</span>
              <span className="laporan-saya-create-arrow">↗</span>
            </Link>
          </div>

          {/* STATISTIK */}

          <div className="laporan-saya-summary">
            <div className="laporan-saya-summary-card summary-total">
              <div className="laporan-saya-summary-top">
                <span className="laporan-saya-summary-icon">▤</span>
                <span className="laporan-saya-summary-caption">
                  Keseluruhan
                </span>
              </div>

              <strong>{loading ? "—" : totalLaporan}</strong>

              <span className="laporan-saya-summary-description">
                Total laporan yang kamu kirim
              </span>

              <div className="laporan-saya-summary-decoration"></div>
            </div>

            <div className="laporan-saya-summary-card summary-process">
              <div className="laporan-saya-summary-top">
                <span className="laporan-saya-summary-icon">◷</span>
                <span className="laporan-saya-summary-caption">Berjalan</span>
              </div>

              <strong>{loading ? "—" : dalamProses}</strong>

              <span className="laporan-saya-summary-description">
                Menunggu atau sedang ditangani
              </span>

              <div className="laporan-saya-summary-decoration"></div>
            </div>

            <div className="laporan-saya-summary-card summary-done">
              <div className="laporan-saya-summary-top">
                <span className="laporan-saya-summary-icon">✓</span>
                <span className="laporan-saya-summary-caption">Tuntas</span>
              </div>

              <strong>{loading ? "—" : selesai}</strong>

              <span className="laporan-saya-summary-description">
                Laporan selesai ditangani
              </span>

              <div className="laporan-saya-summary-decoration"></div>
            </div>
          </div>

          {/* DAFTAR LAPORAN */}

          <div className="laporan-saya-section-heading">
            <div>
              <span className="laporan-saya-section-eyebrow">
                RIWAYAT KONTRIBUSI
              </span>

              <h2>Daftar Laporan</h2>
            </div>

            {!loading && laporan.length > 0 && (
              <span className="laporan-saya-count">
                {laporan.length} laporan
              </span>
            )}
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="laporan-saya-list laporan-saya-skeleton-list">
              {[1, 2, 3].map((item) => (
                <div className="laporan-saya-skeleton" key={item}>
                  <div className="laporan-saya-skeleton-line skeleton-short"></div>
                  <div className="laporan-saya-skeleton-line skeleton-title"></div>
                  <div className="laporan-saya-skeleton-line skeleton-medium"></div>
                  <div className="laporan-saya-skeleton-line skeleton-bottom"></div>
                </div>
              ))}
            </div>
          ) : error && laporan.length === 0 ? (
            <div className="laporan-saya-empty laporan-saya-state">
              <div className="laporan-saya-empty-icon">!</div>

              <span className="laporan-saya-state-label">
                TERJADI KENDALA
              </span>

              <h2>Belum bisa memuat laporan</h2>

              <p>{error}</p>

              <button
                type="button"
                className="laporan-saya-empty-button"
                onClick={() => {
                  setLoading(true);
                  void loadReports();
                }}
              >
                Coba Lagi <span>↻</span>
              </button>
            </div>
          ) : laporan.length === 0 ? (
            <div className="laporan-saya-empty laporan-saya-state">
              <div className="laporan-saya-empty-icon">▤</div>

              <span className="laporan-saya-state-label">
                MULAI BERKONTRIBUSI
              </span>

              <h2>Belum ada laporan</h2>

              <p>
                Setiap perubahan dimulai dari kepedulian. Laporkan masalah
                fasilitas umum di sekitarmu dan bantu membuat lingkungan lebih
                baik.
              </p>

              <Link to="/buat-laporan" className="laporan-saya-empty-button">
                <span>+</span> Buat Laporan Pertama
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="laporan-saya-error" role="alert">
                  <span>!</span> {error}
                </div>
              )}

              <div className="laporan-saya-list">
                {laporan.map((item, index) => {
                  const statusClass = getStatusClass(item.status);
                  const statusLabel = getStatusLabel(item.status);

                  return (
                    <div
                      key={item.id}
                      className="laporan-saya-card-wrapper"
                      style={{
                        "--card-index": Math.min(index, 8),
                      }}
                    >
                      <Link
                        to={`/laporan/${item.id}`}
                        className="laporan-saya-card"
                        onClick={() => setOpenMenu(null)}
                      >
                        <div className="laporan-saya-card-accent"></div>

                        {/* FOTO LAPORAN */}

                        <ReportPhoto item={item} />

                        {/* KATEGORI DAN STATUS */}

                        <div className="laporan-saya-card-top">
                          <span className="laporan-saya-category">
                            <span className="laporan-saya-category-dot"></span>

                            {item.category_name ||
                              item.categoryLabel ||
                              item.category ||
                              "Umum"}
                          </span>

                          <span
                            className={`laporan-saya-status ${statusClass}`}
                          >
                            <span className="laporan-saya-status-dot"></span>
                            {statusLabel}
                          </span>
                        </div>

                        {/* JUDUL DAN DESKRIPSI */}

                        <h3>{item.title || "Laporan tanpa judul"}</h3>

                        <p className="laporan-saya-description">
                          {item.description ||
                            "Tidak ada deskripsi tambahan."}
                        </p>

                        {/* LOKASI DAN TANGGAL */}

                        <div className="laporan-saya-meta">
                          <span className="laporan-saya-meta-location">
                            <span className="laporan-saya-meta-icon">⌖</span>
                            <span>{getLocation(item)}</span>
                          </span>

                          <span className="laporan-saya-meta-date">
                            <span className="laporan-saya-meta-icon">◷</span>

                            {formatDate(item.created_at || item.date)}
                          </span>
                        </div>

                        <div className="laporan-saya-card-bottom">
                          <span>Lihat detail laporan</span>
                          <span className="laporan-saya-arrow">↗</span>
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

                            setOpenMenu(
                              openMenu === item.id ? null : item.id,
                            );
                          }}
                          aria-label={`Menu laporan ${item.title || item.id}`}
                          aria-expanded={openMenu === item.id}
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

              <div className="laporan-saya-footer-note">
                <span className="laporan-saya-footer-icon">✦</span>

                <p>
                  Terima kasih sudah peduli. Setiap laporan adalah langkah
                  kecil menuju lingkungan yang lebih baik.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* MODAL KONFIRMASI HAPUS */}

      {deleteTarget && (
        <div
          className="laporan-saya-modal-overlay"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="laporan-saya-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hapus-laporan-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="laporan-saya-modal-icon">!</div>

            <span className="laporan-saya-modal-eyebrow">
              KONFIRMASI TINDAKAN
            </span>

            <h2 id="hapus-laporan-title">Hapus laporan?</h2>

            <p>
              Laporan{" "}
              <strong>
                "{deleteTarget.title || "Laporan tanpa judul"}"
              </strong>{" "}
              akan dihapus secara permanen dan tidak dapat dikembalikan.
            </p>

            <div className="laporan-saya-modal-actions">
              <button
                type="button"
                className="laporan-saya-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>

              <button
                type="button"
                className="laporan-saya-modal-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="laporan-saya-spinner"></span>
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default LaporanSaya;
