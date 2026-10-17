
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const categoryFilters = [
  { value: "Semua", label: "Semua" },
  { value: "Jalan Rusak", label: "Jalan Rusak" },
  { value: "Fasilitas Umum", label: "Fasilitas Umum" },
  { value: "Kebersihan", label: "Kebersihan" },
  { value: "Penerangan Jalan", label: "Penerangan" },
  { value: "Lingkungan", label: "Lingkungan" },
  { value: "Transportasi", label: "Transportasi" },
  { value: "Keamanan", label: "Keamanan" },
  { value: "Lainnya", label: "Lainnya" },
];

const statusFilters = [
  { value: "Semua", label: "Semua status" },
  { value: "Menunggu", label: "Menunggu" },
  { value: "Diverifikasi", label: "Diverifikasi" },
  { value: "Dalam Proses", label: "Dalam Proses" },
  { value: "Selesai", label: "Selesai" },
];

// ========================================
// STATUS
// ========================================

function getStatusClass(status) {
  switch (status) {
    case "Selesai":
      return "done";
    case "Dalam Proses":
      return "process";
    case "Diverifikasi":
      return "verified";
    default:
      return "waiting";
  }
}

// ========================================
// IKON KATEGORI
// ========================================

function getCategoryIcon(category) {
  const value = String(category || "").toLowerCase();

  if (value.includes("jalan")) return "⌁";
  if (value.includes("fasilitas")) return "✦";
  if (value.includes("penerangan")) return "◉";

  if (value.includes("lingkungan") || value.includes("kebersihan")) {
    return "≈";
  }

  if (value.includes("drainase") || value.includes("saluran")) {
    return "⌁";
  }

  return "!";
}

// ========================================
// FORMAT TANGGAL
// ========================================

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ========================================
// NORMALISASI LAPORAN
// ========================================

function normalizeReport(report) {
  const category =
    report.category_name || report.category || report.kategori || "Lainnya";

  const locationParts = [
    report.village_name,
    report.district_name,
    report.regency_name,
    report.province_name,
  ].filter(Boolean);

  const uniqueLocationParts = locationParts.filter(
    (value, index, array) =>
      array.findIndex(
        (item) => String(item).toLowerCase() === String(value).toLowerCase(),
      ) === index,
  );

  const status = report.status || "Menunggu";

  // Mendukung foto berbentuk data URL atau URL gambar biasa.
  const photo =
    report.photo ||
    report.image ||
    report.image_url ||
    report.photo_url ||
    null;

  return {
    ...report,
    id: report.id,
    title: report.title || report.judul || "Laporan tanpa judul",
    category,
    location:
      uniqueLocationParts.join(", ") ||
      report.location ||
      report.address ||
      report.location_detail ||
      "Lokasi belum tersedia",
    date: formatDate(report.created_at || report.createdAt),
    status,
    statusClass: getStatusClass(status),
    description:
      report.description ||
      report.deskripsi ||
      "Tidak ada deskripsi laporan.",
    photo,
    photo_name: report.photo_name || null,
    icon: getCategoryIcon(category),
  };
}

// ========================================
// FILTER KATEGORI
// ========================================

function matchesCategory(report, selectedCategory) {
  if (selectedCategory === "Semua") {
    return true;
  }

  const category = String(report.category || "").toLowerCase();
  const target = selectedCategory.toLowerCase();

  if (category === target) {
    return true;
  }

  const aliases = {
    "jalan rusak": ["jalan", "infrastruktur"],
    "fasilitas umum": ["fasilitas"],
    kebersihan: ["sampah", "kebersihan"],
    "penerangan jalan": ["penerangan"],
    lingkungan: ["lingkungan"],
    transportasi: ["transportasi", "lalu lintas"],
    keamanan: ["keamanan"],
    lainnya: ["lainnya"],
  };

  return (aliases[target] || []).some((alias) => category.includes(alias));
}

// ========================================
// IKON PENCARIAN
// ========================================

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ========================================
// IKON LOKASI
// ========================================

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

// ========================================
// IKON KALENDER
// ========================================

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7.5 3v4M16.5 3v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ========================================
// VISUAL KARTU LAPORAN DENGAN FOTO
// ========================================

function ReportVisual({ report }) {
  const [imageError, setImageError] = useState(false);

  const photo =
    typeof report.photo === "string" &&
    report.photo.trim() !== "" &&
    !imageError
      ? report.photo.trim()
      : null;

  return (
    <div className="laporan-card-visual">
      {photo ? (
        <img
          className="laporan-card-photo"
          src={photo}
          alt={`Foto laporan ${report.title}`}
          loading="lazy"
          onError={() => {
            console.error(
              "Foto laporan gagal ditampilkan:",
              report.id,
              report.photo_name || report.photo,
            );
            setImageError(true);
          }}
        />
      ) : (
        <div className="dummy-report-image">
          <div className="dummy-image-orb dummy-image-orb-one" />
          <div className="dummy-image-orb dummy-image-orb-two" />
          <div className="dummy-image-icon">{report.icon}</div>
          <span>{report.category}</span>
        </div>
      )}

      <span className="laporan-image-overlay" />
    </div>
  );
}

// ========================================
// HALAMAN LAPORAN
// ========================================

function Laporan() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const categoryFromUrl = searchParams.get("category");

  const selectedCategory = categoryFilters.some(
    (category) => category.value === categoryFromUrl,
  )
    ? categoryFromUrl || "Semua"
    : "Semua";

  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true" &&
    Boolean(localStorage.getItem("token"));

  const reportPath = isLoggedIn ? "/buat-laporan" : "/login";

  // ========================================
  // AMBIL DATA LAPORAN DARI API
  // ========================================

  const loadReports = useCallback(async (signal) => {
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data laporan.");
      }

      const apiReports = Array.isArray(result.data) ? result.data : [];

      const normalizedReports = apiReports.map(normalizeReport);

      setReports(normalizedReports);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("LOAD REPORTS ERROR:", err);

      setError(
        "Data laporan belum dapat dimuat. Periksa koneksi backend, lalu coba lagi.",
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // ========================================
  // LOAD PERTAMA DAN REFRESH
  // ========================================

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void loadReports(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadReports, refreshKey]);

  // ========================================
  // DENGARKAN EVENT LAPORAN DIPERBARUI
  // ========================================

  useEffect(() => {
    const handleReportUpdated = () => {
      setRefreshKey((value) => value + 1);
    };

    window.addEventListener("laporanUpdated", handleReportUpdated);
    window.addEventListener("storage", handleReportUpdated);

    return () => {
      window.removeEventListener("laporanUpdated", handleReportUpdated);
      window.removeEventListener("storage", handleReportUpdated);
    };
  }, []);

  // ========================================
  // UBAH KATEGORI
  // ========================================

  const handleCategoryChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);

    if (category === "Semua") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
    }

    setSearchParams(nextParams);
  };

  // ========================================
  // FILTER LAPORAN
  // ========================================

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const searchableValues = [
        report.title,
        report.description,
        report.location,
        report.category,
      ];

      const matchesSearch =
        !keyword ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(keyword),
        );

      const matchesSelectedCategory = matchesCategory(
        report,
        selectedCategory,
      );

      const matchesSelectedStatus =
        selectedStatus === "Semua" || report.status === selectedStatus;

      return (
        matchesSearch && matchesSelectedCategory && matchesSelectedStatus
      );
    });
  }, [reports, search, selectedCategory, selectedStatus]);

  // ========================================
  // STATISTIK
  // ========================================

  const totalLaporan = reports.length;

  const dalamProses = reports.filter(
    (report) =>
      report.status === "Dalam Proses" ||
      report.status === "Diverifikasi",
  ).length;

  const selesai = reports.filter(
    (report) => report.status === "Selesai",
  ).length;

  // ========================================
  // RESET FILTER
  // ========================================

  const resetFilter = () => {
    setSearch("");
    setSelectedStatus("Semua");
    setSearchParams({});
  };

  // ========================================
  // COBA MUAT ULANG
  // ========================================

  const retryLoadReports = () => {
    setError("");
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="laporan-page">
      <Navbar />

      <div className="laporan-background" aria-hidden="true">
        <div className="laporan-orb laporan-orb-one" />
        <div className="laporan-orb laporan-orb-two" />
        <div className="laporan-orb laporan-orb-three" />
        <div className="laporan-grid" />
      </div>

      <section className="laporan-main">
        <div className="laporan-container">
          <Link to="/" className="laporan-back-button">
            <span className="laporan-back-icon">←</span>
            <span>Kembali ke beranda</span>
          </Link>

          {/* HERO */}

          <div className="laporan-intro">
            <div className="laporan-label">
              <span className="laporan-label-dot" />
              <span>TRANSPARANSI UNTUK SEMUA</span>
            </div>

            <h1>
              Suara masyarakat,
              <br />
              <span>perubahan nyata.</span>
            </h1>

            <p>
              Temukan laporan dari masyarakat dan pantau perkembangannya.
              Bersama, kita bisa menciptakan lingkungan yang lebih baik.
            </p>

            <div className="laporan-intro-actions">
              <Link to={reportPath} className="create-report-button">
                <span className="create-report-plus">+</span>
                Buat Laporan
                <span className="create-report-arrow">↗</span>
              </Link>

              <div className="laporan-intro-note">
                <span className="laporan-note-check">✓</span>
                Mudah, terbuka, dan praktis
              </div>
            </div>
          </div>

          {/* STATISTIK */}

          <div className="laporan-summary">
            <div className="summary-card summary-card-blue">
              <div className="summary-card-icon">▤</div>

              <div className="summary-card-text">
                <span>Total laporan</span>
                <strong>{loading ? "—" : totalLaporan}</strong>
                <small>Seluruh laporan masyarakat</small>
              </div>

              <span className="summary-card-decoration">01</span>
            </div>

            <div className="summary-card summary-card-purple">
              <div className="summary-card-icon">◷</div>

              <div className="summary-card-text">
                <span>Sedang ditangani</span>
                <strong>{loading ? "—" : dalamProses}</strong>
                <small>Dalam proses dan verifikasi</small>
              </div>

              <span className="summary-card-decoration">02</span>
            </div>

            <div className="summary-card summary-card-cyan">
              <div className="summary-card-icon">✓</div>

              <div className="summary-card-text">
                <span>Laporan selesai</span>
                <strong>{loading ? "—" : selesai}</strong>
                <small>Telah berstatus selesai</small>
              </div>

              <span className="summary-card-decoration">03</span>
            </div>
          </div>

          {/* DAFTAR LAPORAN */}

          <section className="laporan-explorer">
            <div className="laporan-section-heading">
              <div>
                <span className="section-eyebrow">JELAJAHI LINGKUNGANMU</span>
                <h2>Daftar laporan</h2>
                <p>Cari permasalahan dan lihat status penanganannya.</p>
              </div>

              <div className="laporan-total-pill">
                <span />
                {loading
                  ? "Memuat data"
                  : `${filteredReports.length} laporan ditemukan`}
              </div>
            </div>

            {/* SEARCH DAN FILTER */}

            <div className="laporan-controls">
              <div className="laporan-search">
                <span className="search-icon">
                  <SearchIcon />
                </span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul, kategori, atau lokasi..."
                  aria-label="Cari laporan"
                />

                {search && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Hapus pencarian"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`filter-button ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((value) => !value)}
                aria-expanded={showFilters}
              >
                <span className="filter-button-icon">☷</span>
                Filter
                <span
                  className={`filter-chevron ${showFilters ? "rotated" : ""}`}
                >
                  ⌄
                </span>
              </button>
            </div>

            {showFilters && (
              <div className="laporan-filter-panel">
                <div className="laporan-filter-panel-group">
                  <label htmlFor="status-filter">Status laporan</label>

                  <select
                    id="status-filter"
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value)
                    }
                  >
                    {statusFilters.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="laporan-reset-filter"
                  onClick={resetFilter}
                >
                  Reset semua filter
                </button>
              </div>
            )}

            {/* FILTER KATEGORI */}

            <div className="laporan-filter-heading">
              <span>Kategori</span>
              <span className="category-hint">Pilih kategori laporan</span>
            </div>

            <div className="laporan-filter-row">
              {categoryFilters.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`filter-chip ${
                    selectedCategory === category.value ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category.value)}
                  aria-pressed={selectedCategory === category.value}
                >
                  {selectedCategory === category.value && (
                    <span className="filter-chip-check">✓</span>
                  )}

                  {category.label}
                </button>
              ))}
            </div>

            {/* HASIL */}

            <div className="laporan-results-heading">
              <div>
                <h3>
                  {search ||
                  selectedCategory !== "Semua" ||
                  selectedStatus !== "Semua"
                    ? "Hasil pencarian"
                    : "Laporan terbaru"}
                </h3>

                <p>Informasi laporan yang tersedia untuk masyarakat.</p>
              </div>

              {(search ||
                selectedCategory !== "Semua" ||
                selectedStatus !== "Semua") && (
                <button
                  type="button"
                  className="text-reset-button"
                  onClick={resetFilter}
                >
                  Hapus filter ×
                </button>
              )}
            </div>

            {/* LOADING */}

            {loading && (
              <div className="laporan-loading-grid">
                {[1, 2, 3].map((item) => (
                  <div className="laporan-skeleton" key={item}>
                    <div className="skeleton-image" />

                    <div className="skeleton-content">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="laporan-empty laporan-error">
                <div className="laporan-empty-icon">!</div>
                <h2>Belum bisa memuat laporan</h2>
                <p>{error}</p>

                <button type="button" onClick={retryLoadReports}>
                  ↻ Coba lagi
                </button>
              </div>
            )}

            {/* KARTU LAPORAN */}

            {!loading &&
              !error &&
              (filteredReports.length > 0 ? (
                <div className="laporan-list">
                  {filteredReports.map((laporan, index) => (
                    <Link
                      to={`/laporan/${laporan.id}`}
                      className="laporan-card"
                      key={laporan.id}
                      style={{
                        "--card-index": Math.min(index, 8),
                      }}
                    >
                      <ReportVisual report={laporan} />

                      <div className="laporan-card-content">
                        <div className="laporan-card-top">
                          <span className="laporan-category">
                            <span className="category-indicator" />
                            {laporan.category}
                          </span>

                          <span
                            className={`laporan-status ${laporan.statusClass}`}
                          >
                            <i />
                            {laporan.status}
                          </span>
                        </div>

                        <h2>{laporan.title}</h2>

                        <p className="laporan-card-description">
                          {laporan.description}
                        </p>

                        <div className="laporan-card-divider" />

                        <div className="laporan-card-meta">
                          <span className="laporan-location">
                            <PinIcon />
                            <span>{laporan.location}</span>
                          </span>

                          <span className="laporan-date">
                            <CalendarIcon />
                            <span>{laporan.date}</span>
                          </span>
                        </div>

                        <div className="laporan-card-detail">
                          Lihat detail
                          <span>↗</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="laporan-empty">
                  <div className="laporan-empty-illustration">
                    <SearchIcon />
                    <span>?</span>
                  </div>

                  <h2>
                    {reports.length === 0
                      ? "Belum ada laporan"
                      : "Laporan tidak ditemukan"}
                  </h2>

                  <p>
                    {reports.length === 0
                      ? "Belum ada laporan yang tersedia. Jadilah bagian dari perubahan dengan menyampaikan laporan pertama."
                      : "Coba kata kunci lain atau ubah kategori dan status yang kamu pilih."}
                  </p>

                  <button type="button" onClick={resetFilter}>
                    Tampilkan semua laporan
                  </button>
                </div>
              ))}
          </section>

          {/* CTA */}

          <section className="laporan-bottom-cta">
            <div className="cta-light-orb" />
            <div className="laporan-cta-icon">✦</div>

            <div className="laporan-cta-copy">
              <span>JADI BAGIAN DARI PERUBAHAN</span>

              <h2>
                Melihat masalah adalah awal.
                <br />
                <span>Melaporkannya adalah langkah nyata.</span>
              </h2>

              <p>
                Bantu lingkunganmu menjadi lebih baik dengan menyampaikan
                laporan secara bertanggung jawab.
              </p>
            </div>

            <Link to={reportPath} className="laporan-cta-button">
              Mulai Melapor
              <span>→</span>
            </Link>
          </section>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="laporan-footer">
        <div className="laporan-footer-inner">
          <Link to="/" className="laporan-footer-brand">
            Lapor<span>Kita</span>
          </Link>

          <p>
            Bersama menyampaikan informasi untuk lingkungan yang lebih baik.
          </p>

          <Link to="/" className="laporan-footer-home">
            Kembali ke beranda ↑
          </Link>
        </div>

        <div className="laporan-footer-bottom">
          <span>© {new Date().getFullYear()} LaporKita</span>
          <span>Dari masyarakat, untuk lingkungan yang lebih baik.</span>
        </div>
      </footer>
    </main>
  );
}

export default Laporan;