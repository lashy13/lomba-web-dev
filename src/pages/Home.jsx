
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/home.css";
import "../styles/home-sections.css";
import "../styles/about.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const INITIAL_STATS = {
  total: 0,
  diproses: 0,
  selesai: 0,
};

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "Tanggal tidak tersedia";

  const date = new Date(dateValue);

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
  if (value === "diverifikasi") return "review";

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
    report?.category ||
    "Kategori lainnya"
  );
}

function getLocation(report) {
  const location =
    report?.regency_name ||
    report?.regencyName ||
    report?.district_name ||
    report?.districtName ||
    report?.address;

  return typeof location === "string" && location.trim()
    ? location.trim()
    : "Lokasi belum dicantumkan";
}

function getReportImage(report) {
  const image =
    report?.image_url ||
    report?.imageUrl ||
    report?.photo_url ||
    report?.photoUrl ||
    report?.image ||
    report?.photo;

  return typeof image === "string" && image.trim()
    ? image.trim()
    : null;
}

function getDetailPath(report) {
  return `/detail-laporan?id=${encodeURIComponent(report.id)}`;
}

function getReportTitle(report) {
  return typeof report?.title === "string" && report.title.trim()
    ? report.title.trim()
    : "Laporan tanpa judul";
}

function getReportDescription(report, maxLength = 130) {
  const description =
    typeof report?.description === "string"
      ? report.description.trim()
      : "";

  if (!description) return "Tidak ada deskripsi laporan.";

  return description.length > maxLength
    ? `${description.slice(0, maxLength).trimEnd()}...`
    : description;
}

function calculateStats(reports) {
  const normalizedReports = reports.map((report) => ({
    ...report,
    normalizedStatus: normalizeStatus(report.status),
  }));

  return {
    total: normalizedReports.length,

    diproses: normalizedReports.filter((report) =>
      ["diverifikasi", "dalam proses"].includes(
        report.normalizedStatus
      )
    ).length,

    selesai: normalizedReports.filter(
      (report) => report.normalizedStatus === "selesai"
    ).length,
  };
}

function StatCard({ icon, value, title, description }) {
  return (
    <article className="stat-card">
      <div className="stat-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="stat-value">
        {value.toLocaleString("id-ID")}
      </div>

      <div className="stat-title">{title}</div>

      <div className="stat-description">{description}</div>
    </article>
  );
}

function LatestReportCard({ report }) {
  const [imageFailed, setImageFailed] = useState(false);

  const image = getReportImage(report);
  const title = getReportTitle(report);

  return (
    <Link
      to={getDetailPath(report)}
      className="latest-card"
      aria-label={`Lihat detail laporan: ${title}`}
    >
      <div className="latest-card-image">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={`Bukti laporan ${title}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="latest-placeholder">
            {getCategoryName(report)}
          </div>
        )}

        <span
          className={`latest-status ${getStatusClass(report.status)}`}
        >
          {getStatusLabel(report.status)}
        </span>
      </div>

      <div className="latest-card-content">
        <div className="latest-category">
          {getCategoryName(report)}
        </div>

        <h3>{title}</h3>

        <p>{getReportDescription(report)}</p>

        <div className="latest-meta">
          <span title={getLocation(report)}>
            <span aria-hidden="true">◉ </span>
            {getLocation(report)}
          </span>

          <span>{formatDate(report.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );

  const [user, setUser] = useState(getStoredUser);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [stats, setStats] = useState(INITIAL_STATS);

  const updateAuth = useCallback(() => {
    setIsLoggedIn(
      localStorage.getItem("isLoggedIn") === "true"
    );

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

  useEffect(() => {
    let active = true;
    let requestId = 0;
    let currentController = null;

    async function fetchReports() {
      const thisRequestId = ++requestId;

      if (currentController) {
        currentController.abort();
      }

      const controller = new AbortController();
      currentController = controller;

      setReportsLoading(true);
      setReportsError("");

      try {
        const response = await fetch(`${API_URL}/api/reports`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil laporan (HTTP ${response.status}).`
          );
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Format data laporan tidak sesuai.");
        }

        if (!active || thisRequestId !== requestId) return;

        const fetchedReports = result.data.filter(
          (report) =>
            report &&
            report.id !== undefined &&
            report.id !== null
        );

        setReports(fetchedReports.slice(0, 3));
        setStats(calculateStats(fetchedReports));
      } catch (error) {
        if (
          error.name === "AbortError" ||
          !active ||
          thisRequestId !== requestId
        ) {
          return;
        }

        console.error("Gagal mengambil laporan:", error);

        setReportsError(
          "Laporan terbaru belum dapat dimuat. Silakan coba lagi."
        );
      } finally {
        if (active && thisRequestId === requestId) {
          setReportsLoading(false);
        }
      }
    }

    const refreshReports = () => {
      fetchReports();
    };

    fetchReports();

    window.addEventListener("laporanUpdated", refreshReports);

    return () => {
      active = false;
      requestId += 1;

      if (currentController) {
        currentController.abort();
      }

      window.removeEventListener("laporanUpdated", refreshReports);
    };
  }, []);

  const username =
    user?.username ||
    user?.name ||
    "Pengguna";

  const reportPath = isLoggedIn
    ? "/buat-laporan"
    : "/login";

  const categories = [
    {
      category: "infrastruktur",
      icon: "⌂",
      title: "Infrastruktur",
      description:
        "Jalan rusak, jembatan, trotoar, dan drainase.",
    },
    {
      category: "fasilitas",
      icon: "▣",
      title: "Fasilitas Umum",
      description:
        "Taman, halte, dan fasilitas masyarakat.",
    },
    {
      category: "lingkungan",
      icon: "♧",
      title: "Lingkungan",
      description:
        "Sampah, kebersihan, banjir, dan lingkungan.",
    },
    {
      category: "penerangan",
      icon: "✦",
      title: "Penerangan",
      description:
        "Lampu jalan mati dan masalah penerangan.",
    },
    {
      category: "keamanan",
      icon: "◈",
      title: "Keamanan",
      description:
        "Masalah keamanan fasilitas atau lingkungan.",
    },
    {
      category: "lainnya",
      icon: "⋯",
      title: "Lainnya",
      description:
        "Permasalahan publik lainnya.",
    },
  ];

  return (
    <main className="home">
      <Navbar />

      {/* BACKGROUND */}
      <div className="home-background" aria-hidden="true">
        <div className="background-orb background-orb-one" />
        <div className="background-orb background-orb-two" />
        <div className="background-grid" />
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            {isLoggedIn && (
              <div className="hero-user-greeting">
                <span className="hero-user-dot" />
                <span>
                  Halo, <strong>{username}</strong>
                </span>
              </div>
            )}

            <div className="hero-badge">
              <span className="badge-icon" aria-hidden="true">
                ✦
              </span>
              <span>PLATFORM PELAPORAN PUBLIK</span>
            </div>

            <h1>
              Lihat masalahnya.
              <br />
              <span>Laporkan.</span>
              <br />
              Bersama, kita peduli.
            </h1>

            <p className="hero-description">
              Setiap lingkungan memiliki masalah yang perlu
              diperhatikan. Mulai dari jalan rusak, fasilitas
              umum yang tidak layak, hingga lampu jalan yang mati.
            </p>

            <p className="hero-description second">
              <strong>LaporKita</strong> membantu masyarakat
              menyampaikan permasalahan dengan cara yang lebih
              mudah, terarah, dan dapat dipantau.
            </p>

            <div className="hero-actions">
              <Link to={reportPath} className="hero-primary">
                <span>Buat Laporan</span>
                <span className="button-arrow" aria-hidden="true">
                  →
                </span>
              </Link>

              <a
                href="#tentang-laporkita"
                className="hero-secondary"
              >
                Kenali LaporKita
              </a>
            </div>

            <div className="hero-bottom-info">
              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  ✓
                </div>
                <div>
                  <strong>Mudah</strong>
                  <span>untuk digunakan</span>
                </div>
              </div>

              <div className="info-divider" />

              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  ↗
                </div>
                <div>
                  <strong>Terarah</strong>
                  <span>dalam menyampaikan</span>
                </div>
              </div>

              <div className="info-divider" />

              <div className="info-item">
                <div className="info-icon" aria-hidden="true">
                  ◉
                </div>
                <div>
                  <strong>Terpantau</strong>
                  <span>perkembangannya</span>
                </div>
              </div>
            </div>
          </div>

          {/* ILUSTRASI */}
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="visual-circle circle-one" />
            <div className="visual-circle circle-two" />
            <div className="visual-circle circle-three" />

            <div className="civic-illustration">
              <div className="city">
                <div className="building building-a">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="building building-b">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="building building-c">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="ground">
                <div className="road-line road-line-a" />
                <div className="road-line road-line-b" />

                <div className="tree tree-one">
                  <div className="tree-top" />
                  <div className="tree-trunk" />
                </div>

                <div className="tree tree-two">
                  <div className="tree-top" />
                  <div className="tree-trunk" />
                </div>
              </div>

              <div className="device">
                <div className="device-glow" />

                <div className="device-frame">
                  <div className="device-top">
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="device-screen">
                    <div className="screen-header">
                      <div className="screen-logo">L</div>
                      <div className="screen-title">LaporKita</div>
                    </div>

                    <div className="screen-content">
                      <div className="screen-line line-long" />
                      <div className="screen-line line-medium" />

                      <div className="screen-card">
                        <div className="screen-card-icon">+</div>
                        <div>
                          <span>Laporkan</span>
                          <small>Masalah di sekitarmu</small>
                        </div>
                      </div>

                      <div className="screen-card small">
                        <div className="screen-card-icon">✓</div>
                        <div>
                          <span>Pantau</span>
                          <small>Perkembangan laporan</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="visual-card visual-card-top">
                <div className="visual-card-icon">!</div>
                <div>
                  <strong>Temukan masalah</strong>
                  <span>di lingkunganmu</span>
                </div>
              </div>

              <div className="visual-card visual-card-bottom">
                <div className="visual-card-icon blue">✓</div>
                <div>
                  <strong>Sampaikan laporan</strong>
                  <span>untuk perubahan</span>
                </div>
              </div>

              <div className="connection connection-one" />
              <div className="connection connection-two" />
              <div className="connection connection-three" />
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIK */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-header">
            <span className="section-label">
              LAPORKITA DALAM ANGKA
            </span>

            <h2>
              Setiap laporan
              <span> punya arti.</span>
            </h2>

            <p>
              Setiap laporan menjadi bagian dari upaya bersama
              untuk membuat lingkungan menjadi lebih baik.
            </p>
          </div>

          <div className="stats-grid">
            <StatCard
              icon="◉"
              value={stats.total}
              title="Laporan Masuk"
              description="Total laporan yang tercatat di sistem"
            />

            <StatCard
              icon="↗"
              value={stats.diproses}
              title="Ditindaklanjuti"
              description="Laporan yang diverifikasi atau diproses"
            />

            <StatCard
              icon="✓"
              value={stats.selesai}
              title="Selesai"
              description="Laporan dengan status selesai"
            />

            <article className="stat-card">
              <div className="stat-icon" aria-hidden="true">
                ★
              </div>
              <div className="stat-value">—</div>
              <div className="stat-title">Kepuasan</div>
              <div className="stat-description">
                Data kepuasan belum tersedia
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section className="how-section">
        <div className="how-container">
          <div className="how-header">
            <span className="section-label">CARA KERJA</span>

            <h2>
              Melaporkan masalah
              <span> jadi lebih mudah.</span>
            </h2>

            <p>
              LaporKita membantu menghubungkan laporan masyarakat
              dengan proses yang lebih terarah.
            </p>
          </div>

          <div className="how-grid">
            <article className="how-card">
              <div className="how-number">01</div>
              <div className="how-icon">+</div>
              <h3>Temukan Masalah</h3>
              <p>
                Temukan permasalahan publik di sekitar yang
                membutuhkan perhatian.
              </p>
            </article>

            <div className="how-connector" aria-hidden="true">
              →
            </div>

            <article className="how-card">
              <div className="how-number">02</div>
              <div className="how-icon">↑</div>
              <h3>Buat Laporan</h3>
              <p>
                Sampaikan laporan dengan informasi, lokasi,
                deskripsi, dan bukti pendukung.
              </p>
            </article>

            <div className="how-connector" aria-hidden="true">
              →
            </div>

            <article className="how-card">
              <div className="how-number">03</div>
              <div className="how-icon">◉</div>
              <h3>Pantau Proses</h3>
              <p>
                Pantau perkembangan laporan dari diterima
                hingga selesai ditangani.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="category-section">
        <div className="category-container">
          <div className="category-header">
            <div>
              <span className="section-label">KATEGORI LAPORAN</span>
              <h2>
                Laporkan berbagai
                <span> masalah publik.</span>
              </h2>
            </div>

            <p>
              Pilih kategori yang sesuai agar laporan lebih
              mudah dipahami dan ditindaklanjuti.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((item) => (
              <Link
                key={item.category}
                to={`/laporan?category=${encodeURIComponent(item.category)}`}
                className="category-card"
              >
                <div className="category-icon" aria-hidden="true">
                  {item.icon}
                </div>

                <div className="category-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <span className="category-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>

          <div className="category-footer">
            <Link to="/laporan" className="category-all-button">
              Lihat Semua Laporan <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LAPORAN TERBARU */}
      <section className="latest-section">
        <div className="latest-container">
          <div className="latest-header">
            <div>
              <span className="section-label">LAPORAN TERBARU</span>
              <h2>
                Lihat laporan
                <span> di sekitar kita.</span>
              </h2>
            </div>

            <Link to="/laporan" className="latest-see-all">
              Lihat semua <span>→</span>
            </Link>
          </div>

          {reportsLoading ? (
            <p className="latest-empty" role="status">
              Memuat laporan terbaru...
            </p>
          ) : reportsError ? (
            <div className="latest-empty" role="alert">
              <p>{reportsError}</p>
              <button
                type="button"
                className="category-all-button"
                onClick={() =>
                  window.dispatchEvent(new Event("laporanUpdated"))
                }
              >
                Coba lagi <span>↻</span>
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="latest-empty">
              <p>Belum ada laporan yang tersedia.</p>

              <Link to={reportPath} className="hero-primary">
                Jadilah yang pertama melapor →
              </Link>
            </div>
          ) : (
            <div className="latest-grid">
              {reports.map((report) => (
                <LatestReportCard
                  key={report.id}
                  report={report}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TENTANG LAPORKITA */}
      <section id="tentang-laporkita" className="about-laporkita">
        <div className="about-container">
          <div className="about-header">
            <span className="about-label">TENTANG LAPORKITA</span>

            <h2>
              Satu laporan,
              <br />
              <span>satu langkah menuju perubahan.</span>
            </h2>

            <p>
              LaporKita hadir untuk menghubungkan masyarakat
              dengan proses pelayanan publik yang lebih terbuka,
              terarah, dan mudah dipantau.
            </p>
          </div>

          <div className="about-grid">
            <article className="about-card">
              <div className="about-card-number">01</div>
              <div className="about-card-content">
                <span className="about-card-label">MASALAH</span>
                <h3>Masalah di sekitar sering tidak terdengar.</h3>
                <p>
                  Kerusakan jalan, fasilitas umum, dan berbagai
                  persoalan publik membutuhkan tempat pelaporan
                  yang mudah diakses.
                </p>
              </div>
            </article>

            <article className="about-card about-card-highlight">
              <div className="about-card-number">02</div>
              <div className="about-card-content">
                <span className="about-card-label">SOLUSI</span>
                <h3>LaporKita membuat pelaporan lebih sederhana.</h3>
                <p>
                  Masyarakat dapat menyampaikan laporan secara
                  digital lengkap dengan informasi, lokasi,
                  dan bukti pendukung.
                </p>
              </div>
            </article>

            <article className="about-card">
              <div className="about-card-number">03</div>
              <div className="about-card-content">
                <span className="about-card-label">DAMPAK</span>
                <h3>Laporan tidak berhenti setelah dikirim.</h3>
                <p>
                  Masyarakat dapat memantau perkembangan laporan
                  dan mengetahui status penanganannya.
                </p>
              </div>
            </article>
          </div>

          <div className="about-bottom">
            <div className="about-bottom-icon">LK</div>

            <div className="about-bottom-text">
              <strong>
                Dari masyarakat, untuk perubahan yang nyata.
              </strong>
              <span>
                Bersama membangun pelayanan publik yang
                lebih responsif dan transparan.
              </span>
            </div>

            <Link to={reportPath} className="about-button">
              <span>Buat Laporan</span>
              <span className="about-button-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="final-cta-glow" aria-hidden="true" />

        <div className="final-cta-content">
          <span className="section-label">SUARAKAN PERUBAHAN</span>

          <h2>
            Ada masalah di sekitarmu?
            <br />
            <span>Jangan hanya diam.</span>
          </h2>

          <p>
            Sampaikan laporan melalui LaporKita dan ikut menjadi
            bagian dari perubahan pelayanan publik yang lebih baik.
          </p>

          <Link to={reportPath} className="final-cta-button">
            <span>Buat Laporan Sekarang</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">L</div>

            <div>
              <strong>LaporKita</strong>
              <span>Pelayanan Publik Digital</span>
            </div>
          </div>

          <nav className="footer-links" aria-label="Navigasi footer">
            <Link to="/">Beranda</Link>
            <Link to="/laporan">Laporan</Link>
            <Link to={reportPath}>Buat Laporan</Link>

            {!isLoggedIn && <Link to="/login">Masuk</Link>}
          </nav>

          <div className="footer-copy">
            © {new Date().getFullYear()} LaporKita
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
