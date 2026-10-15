import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud";

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

function getStatusClass(status) {
  switch (status) {
    case "Selesai":
      return "done";
    case "Dalam Proses":
      return "process";
    case "Diverifikasi":
      return "verified";
    case "Menunggu":
    default:
      return "waiting";
  }
}

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

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizeReport(report) {
  const category = report.category_name || "Lainnya";

  const locationParts = [
    report.village_name,
    report.district_name,
    report.regency_name,
    report.province_name,
  ].filter(Boolean);

  const uniqueLocationParts = locationParts.filter(
    (value, index, array) =>
      array.findIndex(
        (item) =>
          String(item).toLowerCase() === String(value).toLowerCase(),
      ) === index,
  );

  return {
    ...report,
    id: report.id,
    title: report.title || "Laporan tanpa judul",
    category,
    location: uniqueLocationParts.join(", ") || "Lokasi belum tersedia",
    date: formatDate(report.created_at),
    status: report.status || "Menunggu",
    statusClass: getStatusClass(report.status),
    description: report.description || "Tidak ada deskripsi laporan.",
    icon: getCategoryIcon(category),
  };
}

function matchesCategory(report, selectedCategory) {
  if (selectedCategory === "Semua") return true;

  const category = String(report.category || "").toLowerCase();
  const target = selectedCategory.toLowerCase();

  if (category === target) return true;

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

  return (aliases[target] || []).some((alias) =>
    category.includes(alias),
  );
}

function Laporan() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategory = searchParams.get("category") || "Semua";

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const reportPath = isLoggedIn ? "/buat-laporan" : "/login";

  // Mengambil laporan dari backend.
  // Fungsi ini hanya mengubah state ketika permintaan API selesai.
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
        throw new Error(
          result.message || "Gagal mengambil data laporan.",
        );
      }

      const apiReports = Array.isArray(result.data) ? result.data : [];

      setReports(apiReports.map(normalizeReport));
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("LOAD REPORTS ERROR:", err);
      setError(
        "Data laporan belum dapat dimuat. Periksa koneksi backend, lalu coba lagi.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Effect digunakan untuk menyinkronkan halaman dengan API dan event browser.
  useEffect(() => {
    const controller = new AbortController();

    // Jalankan permintaan awal setelah effect dijadwalkan.
    const timerId = window.setTimeout(() => {
      loadReports(controller.signal);
    }, 0);

    // Muat ulang ketika ada komponen lain yang mengirim event ini.
    const handleReportUpdated = () => {
      loadReports();
    };

    window.addEventListener("laporanUpdated", handleReportUpdated);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();

      window.removeEventListener(
        "laporanUpdated",
        handleReportUpdated,
      );
    };
  }, [loadReports]);

  const handleCategoryChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);

    if (category === "Semua") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", category);
    }

    setSearchParams(nextParams);
  };

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
        selectedStatus === "Semua" ||
        report.status === selectedStatus;

      return (
        matchesSearch &&
        matchesSelectedCategory &&
        matchesSelectedStatus
      );
    });
  }, [reports, search, selectedCategory, selectedStatus]);

  const totalLaporan = reports.length;

  const dalamProses = reports.filter(
    (report) =>
      report.status === "Dalam Proses" ||
      report.status === "Diverifikasi",
  ).length;

  const selesai = reports.filter(
    (report) => report.status === "Selesai",
  ).length;

  const resetFilter = () => {
    setSearch("");
    setSelectedStatus("Semua");

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");

    setSearchParams(nextParams);
  };

  const retryLoadReports = () => {
    setLoading(true);
    setError("");
    loadReports();
  };

  return (
    <main className="laporan-page">
      <Navbar />

      {/* BACKGROUND */}
      <div className="laporan-background">
        <div className="laporan-orb laporan-orb-one"></div>
        <div className="laporan-orb laporan-orb-two"></div>
        <div className="laporan-grid"></div>
      </div>

      <section className="laporan-main">
        <div className="laporan-container">
          {/* BACK */}
          <Link to="/" className="laporan-back-button">
            <span className="laporan-back-icon">←</span>
            <span>Kembali</span>
          </Link>

          {/* INTRO */}
          <div className="laporan-intro">
            <div className="laporan-label">
              <span></span>
              LAPORAN MASYARAKAT
            </div>

            <h1>
              Lihat berbagai
              <span> laporan di sekitar.</span>
            </h1>

            <p>
              Temukan berbagai laporan yang telah disampaikan masyarakat
              mengenai permasalahan di lingkungan sekitar. Setiap laporan
              dapat dipantau berdasarkan status penanganannya.
            </p>
          </div>

          {/* CONTROLS */}
          <div className="laporan-controls">
            <div className="laporan-search">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari laporan atau lokasi..."
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
            >
              <span>☷</span>
              Filter
            </button>

            <Link to={reportPath} className="create-report-button">
              <span>+</span>
              Buat Laporan
            </Link>
          </div>

          {/* FILTER PANEL */}
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
                Reset filter
              </button>
            </div>
          )}

          {/* CATEGORY */}
          <div className="laporan-filter-row">
            {categoryFilters.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`filter-chip ${
                  selectedCategory === category.value ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* SUMMARY */}
          <div className="laporan-summary">
            <div>
              <strong>{totalLaporan}</strong>
              <span>Total laporan</span>
            </div>

            <div>
              <strong>{dalamProses}</strong>
              <span>Dalam proses</span>
            </div>

            <div>
              <strong>{selesai}</strong>
              <span>Selesai</span>
            </div>
          </div>

          {/* RESULT INFO */}
          {!loading &&
            !error &&
            (search ||
              selectedCategory !== "Semua" ||
              selectedStatus !== "Semua") && (
              <div className="laporan-result-info">
                Menampilkan <strong>{filteredReports.length}</strong> dari{" "}
                <strong>{reports.length}</strong> laporan
              </div>
            )}

          {/* LOADING */}
          {loading && (
            <div className="laporan-empty">
              <h2>Memuat laporan...</h2>
              <p>Sedang mengambil data laporan dari server.</p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="laporan-empty">
              <h2>Gagal memuat laporan</h2>
              <p>{error}</p>

              <button type="button" onClick={retryLoadReports}>
                Coba lagi
              </button>
            </div>
          )}

          {/* REPORT LIST */}
          {!loading &&
            !error &&
            (filteredReports.length > 0 ? (
              <div className="laporan-list">
                {filteredReports.map((laporan) => (
                  <Link
                    to={`/laporan/${laporan.id}`}
                    className="laporan-card"
                    key={laporan.id}
                  >
                    <div className="laporan-card-visual">
                      {laporan.photo ? (
                        <img
                          src={laporan.photo}
                          alt={laporan.title}
                          className="laporan-card-image"
                        />
                      ) : (
                        <div className="dummy-report-image">
                          <div className="dummy-image-glow"></div>

                          <div className="dummy-image-icon">
                            {laporan.icon}
                          </div>

                          <span>Foto laporan</span>
                        </div>
                      )}
                    </div>

                    <div className="laporan-card-content">
                      <div className="laporan-card-top">
                        <span className="laporan-category">
                          {laporan.category}
                        </span>

                        <span
                          className={`laporan-status ${laporan.statusClass}`}
                        >
                          <i></i>
                          {laporan.status}
                        </span>
                      </div>

                      <h2>{laporan.title}</h2>
                      <p>{laporan.description}</p>

                      <div className="laporan-card-meta">
                        <span>
                          <b>⌖</b>
                          {laporan.location}
                        </span>

                        <span>
                          <b>◷</b>
                          {laporan.date}
                        </span>
                      </div>
                    </div>

                    <div className="laporan-card-arrow">→</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="laporan-empty">
                <div className="laporan-empty-icon">⌕</div>

                <h2>Laporan tidak ditemukan</h2>

                <p>
                  {reports.length === 0
                    ? "Belum ada laporan yang tersimpan di database."
                    : "Tidak ada laporan yang sesuai dengan pencarian atau filter yang kamu pilih."}
                </p>

                <button type="button" onClick={resetFilter}>
                  Reset pencarian
                </button>
              </div>
            ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="laporan-footer">
        Laporkita · Bersama menyampaikan informasi untuk lingkungan yang
        lebih baik.
      </footer>
    </main>
  );
}

export default Laporan;