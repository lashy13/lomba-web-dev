
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

import "../styles/home.css";
import "../styles/home-sections.css";

import logoLaporkita from "../assets/logo-laporkita.png";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

/* =========================
   USER & DATA HELPERS
========================= */

function getStoredUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Tanggal tidak tersedia";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function getStatusClass(status) {
  const value = normalizeStatus(status);

  if (value === "selesai") return "done";
  if (value === "dalam proses") return "process";
  if (value === "diverifikasi") return "verified";

  return "review";
}

function getStatusLabel(status) {
  const value = normalizeStatus(status);

  if (value === "selesai") return "Selesai";
  if (value === "dalam proses") return "Dalam Proses";
  if (value === "diverifikasi") return "Diverifikasi";

  return "Menunggu";
}

function getCategoryName(report) {
  return (
    report?.category_name ||
    report?.categoryName ||
    report?.category?.name ||
    report?.category ||
    "Lainnya"
  );
}

function getLocation(report) {
  const location =
    report?.regency_name ||
    report?.regencyName ||
    report?.district_name ||
    report?.districtName ||
    report?.address ||
    report?.location ||
    report?.lokasi;

  return typeof location === "string" && location.trim()
    ? location.trim()
    : "Lokasi belum tersedia";
}

function getDescription(report) {
  const description =
    typeof report?.description === "string"
      ? report.description.trim()
      : typeof report?.deskripsi === "string"
        ? report.deskripsi.trim()
        : "";

  if (!description) return "Tidak ada deskripsi laporan.";

  return description.length > 120
    ? `${description.slice(0, 120).trimEnd()}...`
    : description;
}

function getReporterName(report) {
  const reporter =
    report?.reporter_name ||
    report?.reporterName ||
    report?.username ||
    report?.full_name ||
    report?.fullName ||
    report?.user?.username ||
    report?.user?.name ||
    report?.user?.full_name ||
    report?.pelapor?.nama ||
    report?.pelapor?.name;

  if (typeof reporter === "string" && reporter.trim()) {
    return reporter.trim();
  }

  return "Pelapor LaporKita";
}

function getReporterInitial(name) {
  const cleanName = String(name || "").trim();

  return cleanName ? cleanName.charAt(0).toUpperCase() : "P";
}

function calculateStats(reports) {
  return {
    total: reports.length,

    diproses: reports.filter((report) =>
      ["diverifikasi", "dalam proses"].includes(
        normalizeStatus(report.status),
      ),
    ).length,

    selesai: reports.filter(
      (report) => normalizeStatus(report.status) === "selesai",
    ).length,
  };
}

/* =========================
   ICON COMPONENT
========================= */

function Icon({ name, size = 22, strokeWidth = 1.8 }) {
  const paths = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),

    arrowUp: (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),

    map: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),

    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8M8 17h8" />
      </>
    ),

    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,

    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h2M14 7h2M9 11h2M14 11h2M9 15h2M14 15h2M10 21v-4h4v4" />
      </>
    ),

    road: (
      <>
        <path d="M8 3 4 21M16 3l4 18M12 3v4M12 11v4M12 19v2" />
      </>
    ),

    leaf: (
      <>
        <path d="M20 4c-10 0-16 5-16 12a5 5 0 0 0 5 5c7 0 12-6 11-17Z" />
        <path d="M4 21c3-6 7-10 13-13" />
      </>
    ),

    light: (
      <>
        <path d="M9 18h6M10 22h4" />
        <path d="M9 14c-.5-2-3-3-3-7a6 6 0 0 1 12 0c0 4-2.5 5-3 7Z" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" />
      </>
    ),

    sparkle: (
      <>
        <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
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
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.document}
    </svg>
  );
}

/* =========================
   SCROLL REVEAL
========================= */

function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("reveal-visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -35px 0px",
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}

/* =========================
   STAT CARD
========================= */

function StatCard({ icon, value, title, description, type }) {
  return (
    <article className={`home-stat-card reveal ${type}`}>
      <div className="home-stat-top">
        <div className="home-stat-icon">
          <Icon name={icon} size={25} />
        </div>

        <span className="home-stat-decoration">
          <Icon name="arrowUp" size={18} />
        </span>
      </div>

      <div className="home-stat-value">{value.toLocaleString("id-ID")}</div>

      <h3>{title}</h3>

      <p>{description}</p>

      <div className="home-stat-line" />
    </article>
  );
}

/* =========================
   REPORT CARD
========================= */

function ReportCard({ report }) {
  const title = report.title?.trim() || "Laporan tanpa judul";
  const reporterName = getReporterName(report);
  const reporterInitial = getReporterInitial(reporterName);
  const reportId = report.id;

  return (
    <article className="home-report-card">
      {/* Header kartu */}
      <div className="home-report-top">
        <span className="home-report-category">
          <Icon name="document" size={15} />
          {getCategoryName(report)}
        </span>

        <span
          className={`home-report-status ${getStatusClass(report.status)}`}
        >
          <span className="status-dot" />
          {getStatusLabel(report.status)}
        </span>
      </div>

      {/* Judul dan deskripsi */}
      <div className="home-report-content">
        <h3 title={title}>{title}</h3>
        <p>{getDescription(report)}</p>
      </div>

      {/* Lokasi dan tanggal */}
      <div className="home-report-bottom">
        <div className="home-report-location">
          <span className="home-report-icon">
            <Icon name="map" size={17} />
          </span>

          <div className="home-report-meta">
            <span className="home-report-meta-label">
              Lokasi kejadian
            </span>

            <span className="home-report-meta-value">
              {getLocation(report)}
            </span>
          </div>
        </div>

        <div className="home-report-date">
          <span className="home-report-meta-label">
            Tanggal laporan
          </span>

          <span className="home-report-meta-value">
            {formatDate(report.created_at || report.createdAt)}
          </span>
        </div>
      </div>

      {/* Informasi pelapor dan ID */}
      <div className="home-report-reporter">
        <div className="home-reporter-avatar" aria-hidden="true">
          {reporterInitial}
        </div>

        <div className="home-reporter-info">
          <span className="home-reporter-label">
            Dilaporkan oleh
          </span>

          <strong title={reporterName}>
            {reporterName}
          </strong>
        </div>

        <div className="home-report-number">
          <span>ID Laporan</span>
          <strong title={`#${reportId}`}>#{reportId}</strong>
        </div>
      </div>

      {/* Tombol detail laporan */}
      <Link
        to={`/detail-laporan/${encodeURIComponent(reportId)}`}
        className="home-report-link"
        aria-label={`Lihat detail laporan ${title}`}
      >
        <span>Lihat Detail Laporan</span>
        <Icon name="arrow" size={18} />
      </Link>
    </article>
  );
}


/* =========================
   MAIN HOME
========================= */

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true",
  );

  const [user, setUser] = useState(getStoredUser);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useScrollReveal();

  /* AUTH */

  const updateAuth = useCallback(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    window.addEventListener("userUpdated", updateAuth);
    window.addEventListener("storage", updateAuth);
    window.addEventListener("focus", updateAuth);

    return () => {
      window.removeEventListener("userUpdated", updateAuth);
      window.removeEventListener("storage", updateAuth);
      window.removeEventListener("focus", updateAuth);
    };
  }, [updateAuth]);

  /* FETCH REPORTS */

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReports() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/reports`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Format data API tidak valid");
        }

        const validReports = result.data
          .filter(
            (report) =>
              report &&
              report.id !== undefined &&
              report.id !== null,
          )
          .sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt).getTime() || 0;
            const dateB = new Date(b.created_at || b.createdAt).getTime() || 0;

            return dateB - dateA;
          });

        if (!controller.signal.aborted) {
          setReports(validReports);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Gagal mengambil laporan:", err);

        setError("Data laporan belum dapat dimuat. Silakan coba kembali.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchReports();

    const handleUpdate = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("laporanUpdated", handleUpdate);

    return () => {
      controller.abort();
      window.removeEventListener("laporanUpdated", handleUpdate);
    };
  }, [refreshKey]);

  const stats = useMemo(() => calculateStats(reports), [reports]);

  const latestReports = useMemo(() => reports.slice(0, 3), [reports]);

  const username = user?.username || user?.name || "Pengguna";

  const reportPath = isLoggedIn ? "/buat-laporan" : "/login";

  const categories = [
    {
      id: "infrastruktur",
      icon: "road",
      title: "Infrastruktur",
      description: "Jalan rusak, jembatan, trotoar, dan fasilitas jalan.",
      color: "blue",
    },
    {
      id: "fasilitas",
      icon: "building",
      title: "Fasilitas Umum",
      description: "Taman, halte, bangunan publik, dan fasilitas masyarakat.",
      color: "purple",
    },
    {
      id: "lingkungan",
      icon: "leaf",
      title: "Lingkungan",
      description: "Sampah, pencemaran, banjir, dan kebersihan.",
      color: "green",
    },
    {
      id: "penerangan",
      icon: "light",
      title: "Penerangan",
      description: "Lampu jalan rusak dan penerangan lingkungan.",
      color: "orange",
    },
    {
      id: "keamanan",
      icon: "shield",
      title: "Keamanan",
      description: "Gangguan keamanan dan potensi bahaya publik.",
      color: "cyan",
    },
    {
      id: "lainnya",
      icon: "document",
      title: "Lainnya",
      description: "Aspirasi dan pengaduan masyarakat lainnya.",
      color: "pink",
    },
  ];

  return (
    <main className="laporkita-home">
      <Navbar />

      {/* BACKGROUND */}

      <div className="home-bg" aria-hidden="true">
        <div className="home-bg-grid" />
        <div className="home-orb home-orb-one" />
        <div className="home-orb home-orb-two" />
        <div className="home-orb home-orb-three" />
      </div>

      {/* HERO */}

      <section className="home-hero">
        <div className="home-hero-container">
          <div className="home-hero-content">
            {isLoggedIn && (
              <div className="home-welcome">
                <span className="home-online-dot" />
                Selamat datang kembali,
                <strong>{username}</strong>
              </div>
            )}

            <div className="home-hero-badge">
              <Icon name="sparkle" size={17} />
              <span>PLATFORM ASPIRASI MASYARAKAT</span>
            </div>

            <h1>
              Lihat Masalahnya.
              <br />
              <span className="home-gradient-text">Suarakan Perubahan.</span>
            </h1>

            <p className="home-hero-description">
              Bersama <strong>LaporKita</strong>, setiap permasalahan di
              lingkunganmu dapat disampaikan dengan lebih mudah, transparan, dan
              terarah. Satu laporan kecil bisa menjadi awal perubahan besar.
            </p>

            <div className="home-hero-actions">
              <Link to={reportPath} className="home-btn-primary">
                Buat Laporan Sekarang
                <Icon name="arrow" size={19} />
              </Link>

              <a href="#cara-kerja" className="home-btn-secondary">
                Pelajari Cara Kerja
              </a>
            </div>

            <div className="home-hero-features">
              <div className="home-hero-feature">
                <span>
                  <Icon name="bolt" size={19} />
                </span>

                <div>
                  <strong>Mudah & Cepat</strong>
                  <small>Pelaporan digital</small>
                </div>
              </div>

              <div className="home-feature-divider" />

              <div className="home-hero-feature">
                <span>
                  <Icon name="shield" size={19} />
                </span>

                <div>
                  <strong>Transparan</strong>
                  <small>Status terpantau</small>
                </div>
              </div>

              <div className="home-feature-divider" />

              <div className="home-hero-feature">
                <span>
                  <Icon name="users" size={19} />
                </span>

                <div>
                  <strong>Untuk Semua</strong>
                  <small>Aspirasi masyarakat</small>
                </div>
              </div>
            </div>
          </div>

          {/* HERO DASHBOARD */}

          <div className="home-hero-visual">
            <div className="home-visual-glow" />

            <div className="home-dashboard">
              <div className="home-dashboard-header">
                <div className="home-dashboard-brand">
                  <div className="home-dashboard-logo">
                    <img src={logoLaporkita} alt="Logo LaporKita" />
                  </div>

                  <div>
                    <strong>LaporKita</strong>
                    <span>Dashboard Monitoring</span>
                  </div>
                </div>

                <span className="home-dashboard-live">
                  <span />
                  PLATFORM AKTIF
                </span>
              </div>

              <div className="home-dashboard-divider" />

              <div className="home-dashboard-overview">
                <div className="home-overview-heading">
                  <span>Ringkasan Laporan</span>

                  <span className="home-overview-icon">
                    <Icon name="document" size={18} />
                  </span>
                </div>

                <strong>{stats.total.toLocaleString("id-ID")}</strong>

                <p>Total laporan masyarakat tercatat</p>
              </div>

              <div className="home-dashboard-metrics">
                <div className="home-metric-card">
                  <div className="home-metric-icon blue">
                    <Icon name="clock" size={19} />
                  </div>

                  <span>Diproses</span>
                  <strong>{stats.diproses}</strong>
                </div>

                <div className="home-metric-card">
                  <div className="home-metric-icon green">
                    <Icon name="check" size={19} />
                  </div>

                  <span>Selesai</span>
                  <strong>{stats.selesai}</strong>
                </div>
              </div>

              <div className="home-dashboard-progress">
                <div className="home-progress-header">
                  <span>Persentase Penyelesaian</span>

                  <strong>
                    {stats.total
                      ? Math.round((stats.selesai / stats.total) * 100)
                      : 0}
                    %
                  </strong>
                </div>

                <div className="home-progress-track">
                  <div
                    className="home-progress-fill"
                    style={{
                      width: `${
                        stats.total ? (stats.selesai / stats.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="home-dashboard-bottom">
                <span className="home-dashboard-indicator">
                  <span />
                  Data dari sistem laporan
                </span>

                <Icon name="arrowUp" size={17} />
              </div>
            </div>

            <div className="home-floating-card home-floating-one">
              <div className="home-floating-icon">
                <Icon name="shield" size={22} />
              </div>

              <div>
                <strong>Transparansi Digital</strong>
                <span>Pantau perkembangan laporan</span>
              </div>
            </div>

            <div className="home-floating-card home-floating-two">
              <div className="home-floating-icon blue">
                <Icon name="document" size={21} />
              </div>

              <div>
                <strong>Pelaporan Online</strong>
                <span>Akses lebih praktis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="home-hero-bottom-gradient" />
      </section>

      {/* STATISTIK */}

      <section className="home-stats-section">
        <div className="home-container">
          <div className="home-section-heading center reveal">
            <span className="home-section-badge">STATISTIK PLATFORM</span>

            <h2>
              Setiap Laporan
              <span> Memiliki Arti.</span>
            </h2>

            <p>
              Pantau jumlah laporan masyarakat dan perkembangan penanganannya
              melalui data yang tersedia.
            </p>
          </div>

          <div className="home-stats-grid">
            <StatCard
              icon="document"
              value={stats.total}
              title="Total Laporan"
              description="Laporan yang masuk ke platform"
              type="blue"
            />

            <StatCard
              icon="clock"
              value={stats.diproses}
              title="Sedang Diproses"
              description="Laporan diverifikasi atau diproses"
              type="purple"
            />

            <StatCard
              icon="check"
              value={stats.selesai}
              title="Laporan Selesai"
              description="Laporan berstatus selesai"
              type="green"
            />
          </div>
        </div>
      </section>

      {/* CARA KERJA */}

      <section className="home-how-section" id="cara-kerja">
        <div className="home-container">
          <div className="home-section-heading center reveal">
            <span className="home-section-badge">CARA KERJA</span>

            <h2>
              Melapor Jadi
              <span> Lebih Mudah.</span>
            </h2>

            <p>
              Hanya dengan beberapa langkah sederhana, kamu bisa menyampaikan
              permasalahan publik melalui LaporKita.
            </p>
          </div>

          <div className="home-how-grid">
            <article className="home-how-card reveal">
              <div className="home-how-number">01</div>

              <div className="home-how-icon">
                <Icon name="map" size={30} />
              </div>

              <h3>Tentukan Lokasi</h3>

              <p>
                Pilih lokasi terjadinya masalah agar laporan memiliki informasi
                wilayah yang jelas.
              </p>

              <span className="home-how-step">LANGKAH PERTAMA</span>
            </article>

            <article className="home-how-card reveal">
              <div className="home-how-number">02</div>

              <div className="home-how-icon">
                <Icon name="document" size={30} />
              </div>

              <h3>Buat Laporan</h3>

              <p>
                Jelaskan permasalahan, pilih kategori, dan sertakan bukti foto
                jika tersedia.
              </p>

              <span className="home-how-step">LANGKAH KEDUA</span>
            </article>

            <article className="home-how-card reveal">
              <div className="home-how-number">03</div>

              <div className="home-how-icon">
                <Icon name="shield" size={30} />
              </div>

              <h3>Pantau Perkembangan</h3>

              <p>
                Lihat status laporan dan ikuti perkembangan penanganannya
                melalui platform.
              </p>

              <span className="home-how-step">LANGKAH KETIGA</span>
            </article>
          </div>
        </div>
      </section>

      {/* KATEGORI */}

      <section className="home-category-section">
        <div className="home-container">
          <div className="home-section-heading split reveal">
            <div>
              <span className="home-section-badge">KATEGORI LAPORAN</span>

              <h2>
                Apa yang Ingin
                <span> Kamu Laporkan?</span>
              </h2>

              <p>
                Pilih kategori permasalahan yang sesuai dengan kondisi di
                lingkunganmu.
              </p>
            </div>

            <Link to="/laporan" className="home-text-link">
              Lihat Semua Laporan
              <Icon name="arrow" size={19} />
            </Link>
          </div>

          <div className="home-category-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/laporan?category=${encodeURIComponent(category.id)}`}
                className={`home-category-card reveal ${category.color}`}
              >
                <div className="home-category-top">
                  <div className="home-category-icon">
                    <Icon name={category.icon} size={27} />
                  </div>

                  <span className="home-category-arrow">
                    <Icon name="arrowUp" size={20} />
                  </span>
                </div>

                <h3>{category.title}</h3>

                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LAPORAN TERBARU */}

      <section className="home-latest-section">
        <div className="home-container">
          <div className="home-section-heading split reveal">
            <div>
              <span className="home-section-badge">LAPORAN MASYARAKAT</span>

              <h2>
                Laporan
                <span> Terbaru.</span>
              </h2>

              <p>
                Lihat laporan terkini yang telah disampaikan melalui LaporKita.
              </p>
            </div>

            <Link to="/laporan" className="home-text-link">
              Jelajahi Semua
              <Icon name="arrow" size={19} />
            </Link>
          </div>

          {loading ? (
            <div className="home-report-message" role="status">
              <div className="home-loading-spinner" />
              <p>Memuat laporan terbaru...</p>
            </div>
          ) : error ? (
            <div className="home-report-message" role="alert">
              <Icon name="document" size={34} />

              <p>{error}</p>

              <button
                type="button"
                className="home-btn-primary"
                onClick={() => setRefreshKey((prev) => prev + 1)}
              >
                Coba Lagi
              </button>
            </div>
          ) : latestReports.length === 0 ? (
            <div className="home-report-message">
              <Icon name="document" size={36} />

              <h3>Belum Ada Laporan</h3>

              <p>
                Jadilah yang pertama menyampaikan laporan melalui LaporKita.
              </p>

              <Link to={reportPath} className="home-btn-primary">
                Buat Laporan
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          ) : (
            <div className="home-reports-grid">
              {latestReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FINAL CTA */}

      <section className="home-cta-section">
        <div className="home-container">
          <div className="home-cta-card reveal">
            <div className="home-cta-orb one" />
            <div className="home-cta-orb two" />

            <div className="home-cta-content">
              <span className="home-cta-badge">
                <Icon name="sparkle" size={17} />
                BERSAMA MEMBANGUN PERUBAHAN
              </span>

              <h2>
                Perubahan Dimulai
                <br />
                dari <span>Suaramu.</span>
              </h2>

              <p>
                Jangan biarkan masalah di lingkunganmu terabaikan. Sampaikan
                laporan dan ikut berkontribusi membangun pelayanan publik yang
                lebih baik.
              </p>

              <Link to={reportPath} className="home-cta-button">
                Buat Laporan Sekarang
                <Icon name="arrow" size={20} />
              </Link>
            </div>

            <div className="home-cta-decoration">
              <div className="home-cta-circle">
                <Icon name="users" size={80} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-grid">
            <div className="home-footer-brand">
              <Link to="/" className="home-footer-logo">
                <img src={logoLaporkita} alt="Logo LaporKita" />
                <span>LaporKita</span>
              </Link>

              <p>
                Platform pengaduan masyarakat berbasis digital untuk membantu
                menyampaikan aspirasi dan permasalahan fasilitas publik secara
                lebih mudah dan transparan.
              </p>

              <div className="home-footer-tags">
                <span>#LaporKita</span>
                <span>#KotaCerdas</span>
                <span>#PelayananPublik</span>
              </div>
            </div>

            <div className="home-footer-links">
              <div>
                <h4>Platform</h4>

                <Link to="/">Beranda</Link>
                <Link to="/laporan">Semua Laporan</Link>
                <Link to={reportPath}>Buat Laporan</Link>
                <a href="#cara-kerja">Cara Kerja</a>
              </div>

              <div>
                <h4>Akun</h4>

                {isLoggedIn ? (
                  <>
                    <Link to="/profil">Profil Saya</Link>
                    <Link to="/laporan-saya">Laporan Saya</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login">Masuk</Link>
                    <Link to="/register">Daftar</Link>
                  </>
                )}
              </div>

              <div>
                <h4>Informasi</h4>

                <p>
                  Sistem pengaduan dan aspirasi masyarakat berbasis website.
                </p>

                <span className="home-footer-status">
                  <span />
                  Platform Digital
                </span>
              </div>
            </div>
          </div>

          <div className="home-footer-bottom">
            <p>
              © {new Date().getFullYear()} LaporKita. All Rights Reserved.
            </p>

            <span>Dibuat untuk pelayanan publik yang lebih baik.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
