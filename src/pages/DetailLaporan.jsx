
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/detail-laporan.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const STATUS_INFO = {
  menunggu: {
    label: "Menunggu",
    className: "waiting",
    description: "Laporan telah diterima dan sedang menunggu verifikasi.",
  },
  diverifikasi: {
    label: "Diverifikasi",
    className: "verified",
    description: "Laporan telah diverifikasi oleh petugas.",
  },
  diproses: {
    label: "Sedang Diproses",
    className: "process",
    description: "Laporan sedang ditangani oleh petugas terkait.",
  },
  selesai: {
    label: "Selesai",
    className: "done",
    description: "Laporan telah selesai ditangani.",
  },
  ditolak: {
    label: "Ditolak",
    className: "rejected",
    description: "Laporan tidak dapat diproses lebih lanjut.",
  },
};

function getStatusInfo(status) {
  const normalized = String(status || "menunggu")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  const aliases = {
    pending: "menunggu",
    menunggu_verifikasi: "menunggu",
    verified: "diverifikasi",
    in_progress: "diproses",
    processing: "diproses",
    completed: "selesai",
    complete: "selesai",
    rejected: "ditolak",
  };

  const key = aliases[normalized] || normalized;

  return (
    STATUS_INFO[key] || {
      label: status || "Menunggu",
      className: "waiting",
      description: "Status laporan sedang diperbarui.",
    }
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocationDetails(laporan) {
  return {
    address:
      laporan?.address ||
      laporan?.location_detail ||
      laporan?.alamat ||
      "-",

    village:
      laporan?.village ||
      laporan?.village_name ||
      laporan?.kelurahan ||
      laporan?.desa ||
      "-",

    district:
      laporan?.district ||
      laporan?.district_name ||
      laporan?.kecamatan ||
      "-",

    regency:
      laporan?.regency ||
      laporan?.regency_name ||
      laporan?.kabupaten ||
      laporan?.kota ||
      "-",

    province:
      laporan?.province ||
      laporan?.province_name ||
      laporan?.provinsi ||
      "-",
  };
}

function unwrapReport(data) {
  if (!data || typeof data !== "object") return null;

  const report =
    data.data?.report ||
    data.data?.data ||
    data.data ||
    data.report ||
    data;

  if (
    !report ||
    typeof report !== "object" ||
    Array.isArray(report)
  ) {
    return null;
  }

  return report;
}

function getTimelineItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.timeline)) return data.timeline;

  return [];
}

function getReportPhoto(laporan) {
  if (!laporan) return "";

  const candidates = [
    laporan.photo,
    laporan.photo_url,
    laporan.image,
    laporan.image_url,
    laporan.foto,
    laporan.foto_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;

    const value = candidate.trim();

    if (!value) continue;

    // Foto berupa Base64 Data URL.
    if (/^data:image\//i.test(value)) {
      return value;
    }

    // Foto berupa URL lengkap.
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    // Foto berupa path relatif di server.
    if (value.startsWith("/")) {
      return `${API_URL}${value}`;
    }
  }

  return "";
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);

  return { response, result };
}

export default function DetailLaporan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDetail() {
      setLoading(true);
      setError("");
      setLaporan(null);
      setTimeline([]);
      setPhotoError(false);

      try {
        if (!id) {
          throw new Error("ID laporan tidak ditemukan.");
        }

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Mengambil detail laporan.
        const detailResult = await fetchJSON(
          `${API_URL}/api/reports/${encodeURIComponent(id)}/private`,
          {
            method: "GET",
            headers,
            signal: controller.signal,
          }
        );

        if (detailResult.response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isLoggedIn");

          navigate("/login", { replace: true });
          return;
        }

        if (detailResult.response.status === 403) {
          throw new Error(
            "Kamu tidak memiliki akses untuk melihat laporan ini."
          );
        }

        if (detailResult.response.status === 404) {
          throw new Error("Laporan tidak ditemukan.");
        }

        if (!detailResult.response.ok) {
          throw new Error(
            detailResult.result?.message ||
              "Gagal mengambil detail laporan."
          );
        }

        const detail = unwrapReport(detailResult.result);

        if (!detail) {
          throw new Error("Data laporan tidak valid.");
        }

        setLaporan(detail);

        // Mengambil riwayat status.
        const timelineResult = await fetchJSON(
          `${API_URL}/api/reports/${encodeURIComponent(id)}/timeline`,
          {
            method: "GET",
            headers,
            signal: controller.signal,
          }
        );

        if (timelineResult.response.ok) {
          setTimeline(
            getTimelineItems(timelineResult.result)
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Detail laporan error:", err);

          setError(
            err.message ||
              "Terjadi kesalahan saat mengambil data laporan."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => controller.abort();
  }, [id, navigate]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="detail-page">
          <div className="detail-container">
            <div className="detail-loading">
              <span className="loading-spinner" />
              <h2>Memuat detail laporan</h2>
              <p>Mohon tunggu sebentar...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !laporan) {
    return (
      <>
        <Navbar />

        <main className="detail-page">
          <div className="detail-container">
            <button
              type="button"
              className="detail-back-button"
              onClick={() => navigate(-1)}
            >
              <span>←</span>
              Kembali
            </button>

            <div className="detail-error">
              <div className="detail-error-icon">!</div>

              <h2>Laporan Tidak Dapat Ditampilkan</h2>

              <p>{error || "Data laporan tidak ditemukan."}</p>

              <Link to="/laporan-saya" className="detail-primary-button">
                Kembali ke Laporan Saya
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const statusInfo = getStatusInfo(laporan.status);
  const lokasi = getLocationDetails(laporan);

  const title =
    laporan.title ||
    laporan.judul ||
    "Laporan Tanpa Judul";

  const category =
    laporan.category ||
    laporan.category_name ||
    laporan.kategori ||
    "Fasilitas Umum";

  const description =
    laporan.description ||
    laporan.deskripsi ||
    "Tidak ada deskripsi yang tersedia.";

  const photo = getReportPhoto(laporan);

  const latitude =
    laporan.latitude ??
    laporan.lat ??
    laporan.coordinates?.latitude;

  const longitude =
    laporan.longitude ??
    laporan.lng ??
    laporan.coordinates?.longitude;

  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    latitude !== "" &&
    longitude !== "";

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${latitude},${longitude}`
      )}`
    : null;

  const createdAt =
    laporan.created_at ||
    laporan.createdAt ||
    laporan.tanggal;

  const updatedAt =
    laporan.updated_at ||
    laporan.updatedAt;

  return (
    <>
      <Navbar />

      <main className="detail-page">
        <div className="detail-container">
          {/* Navigasi atas */}
          <div className="detail-top-navigation">
            <button
              type="button"
              className="detail-back-button"
              onClick={() => navigate(-1)}
            >
              <span>←</span>
              Kembali
            </button>

            <div className="detail-breadcrumb">
              <Link to="/">Beranda</Link>
              <span>/</span>
              <Link to="/laporan-saya">Laporan Saya</Link>
              <span>/</span>
              <span>Detail Laporan</span>
            </div>
          </div>

          {/* Header laporan */}
          <header className="detail-header">
            <div className="detail-header-content">
              <span className="detail-category">
                {category}
              </span>

              <h1>{title}</h1>

              <div className="detail-meta">
                <span>
                  <span className="meta-label">ID Laporan</span>
                  #{laporan.id || id}
                </span>

                <span>
                  <span className="meta-label">Dibuat</span>
                  {formatDate(createdAt)}
                </span>
              </div>
            </div>

            <span
              className={`status-badge ${statusInfo.className}`}
            >
              <span className="status-dot" />
              {statusInfo.label}
            </span>
          </header>

          <div className="detail-grid">
            {/* Konten utama */}
            <section className="detail-main">
              {/* Foto */}
              <article className="detail-card detail-photo-card">
                <div className="detail-section-heading">
                  <div>
                    <span className="detail-eyebrow">
                      BUKTI LAPORAN
                    </span>

                    <h2>Foto Laporan</h2>
                  </div>

                  <span className="detail-heading-icon">▧</span>
                </div>

                {photo && !photoError ? (
                  <div className="detail-photo-wrapper">
                    <img
                      src={photo}
                      alt={`Foto laporan ${title}`}
                      className="detail-photo"
                      onError={() => setPhotoError(true)}
                    />

                    <span className="detail-photo-caption">
                      Dokumentasi kondisi di lokasi
                    </span>
                  </div>
                ) : (
                  <div className="detail-photo-placeholder">
                    <div className="placeholder-icon">▧</div>

                    <h3>
                      {photo
                        ? "Foto gagal dimuat"
                        : "Foto belum tersedia"}
                    </h3>

                    <p>
                      {photo
                        ? "Periksa alamat foto atau koneksi ke server."
                        : "Belum ada foto yang dapat ditampilkan untuk laporan ini."}
                    </p>
                  </div>
                )}
              </article>

              {/* Deskripsi */}
              <article className="detail-card">
                <div className="detail-section-heading">
                  <div>
                    <span className="detail-eyebrow">
                      INFORMASI
                    </span>

                    <h2>Deskripsi Laporan</h2>
                  </div>

                  <span className="detail-heading-icon">≡</span>
                </div>

                <p className="detail-description">
                  {description}
                </p>
              </article>

              {/* Lokasi */}
              <article className="detail-card">
                <div className="detail-section-heading">
                  <div>
                    <span className="detail-eyebrow">
                      TITIK KEJADIAN
                    </span>

                    <h2>Lokasi Laporan</h2>
                  </div>

                  <span className="detail-heading-icon">⌖</span>
                </div>

                <div className="detail-location">
                  <div className="location-icon">⌖</div>

                  <div>
                    <h3>Alamat Lengkap</h3>
                    <p>{lokasi.address}</p>
                  </div>
                </div>

                <div className="detail-address-list">
                  <div className="detail-address-item">
                    <span>Desa / Kelurahan</span>
                    <strong>{lokasi.village}</strong>
                  </div>

                  <div className="detail-address-item">
                    <span>Kecamatan</span>
                    <strong>{lokasi.district}</strong>
                  </div>

                  <div className="detail-address-item">
                    <span>Kabupaten / Kota</span>
                    <strong>{lokasi.regency}</strong>
                  </div>

                  <div className="detail-address-item">
                    <span>Provinsi</span>
                    <strong>{lokasi.province}</strong>
                  </div>
                </div>

                {hasCoordinates ? (
                  <div className="detail-coordinates">
                    <div>
                      <span>Latitude</span>
                      <strong>{latitude}</strong>
                    </div>

                    <div>
                      <span>Longitude</span>
                      <strong>{longitude}</strong>
                    </div>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-map-button"
                    >
                      Lihat Lokasi di Google Maps ↗
                    </a>
                  </div>
                ) : (
                  <p className="detail-location-notice">
                    Koordinat lokasi belum tersedia.
                  </p>
                )}
              </article>

              {/* Timeline */}
              <article className="detail-card">
                <div className="detail-section-heading">
                  <div>
                    <span className="detail-eyebrow">
                      PERKEMBANGAN
                    </span>

                    <h2>Riwayat Status</h2>
                  </div>

                  <span className="detail-heading-icon">◷</span>
                </div>

                {timeline.length > 0 ? (
                  <div className="timeline">
                    {timeline.map((item, index) => {
                      const itemStatus = getStatusInfo(
                        item.status
                      );

                      return (
                        <div
                          className="timeline-item"
                          key={item.id || index}
                        >
                          <div className="timeline-marker" />

                          <div className="timeline-content">
                            <div className="timeline-heading">
                              <span
                                className={`status-badge ${itemStatus.className}`}
                              >
                                {itemStatus.label}
                              </span>

                              <span className="timeline-date">
                                {formatDate(
                                  item.created_at ||
                                    item.createdAt
                                )}
                              </span>
                            </div>

                            <p>
                              {item.note ||
                                item.description ||
                                itemStatus.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="timeline-empty">
                    <span>◷</span>
                    <p>Riwayat status belum tersedia.</p>
                  </div>
                )}
              </article>
            </section>

            {/* Sidebar */}
            <aside className="detail-sidebar">
              <article className="detail-card detail-status-card">
                <span className="detail-eyebrow">
                  STATUS TERKINI
                </span>

                <h2>Status Laporan</h2>

                <div
                  className={`detail-status-display ${statusInfo.className}`}
                >
                  <span className="status-dot" />

                  <div>
                    <strong>{statusInfo.label}</strong>
                    <p>{statusInfo.description}</p>
                  </div>
                </div>

                {laporan.admin_note && (
                  <div className="admin-note">
                    <h3>Catatan Petugas</h3>
                    <p>{laporan.admin_note}</p>
                  </div>
                )}
              </article>

              <article className="detail-card">
                <span className="detail-eyebrow">
                  RINGKASAN
                </span>

                <h2>Informasi Laporan</h2>

                <div className="detail-info-row">
                  <span>Nomor Laporan</span>
                  <strong>#{laporan.id || id}</strong>
                </div>

                <div className="detail-info-row">
                  <span>Kategori</span>
                  <strong>{category}</strong>
                </div>

                <div className="detail-info-row">
                  <span>Tanggal Dibuat</span>
                  <strong>{formatDate(createdAt)}</strong>
                </div>

                <div className="detail-info-row">
                  <span>Pembaruan Terakhir</span>
                  <strong>{formatDate(updatedAt)}</strong>
                </div>
              </article>

              <div className="detail-actions">
                <Link
                  to="/laporan-saya"
                  className="detail-secondary-button"
                >
                  ← Laporan Saya
                </Link>

                <Link
                  to="/buat-laporan"
                  className="detail-primary-button"
                >
                  + Buat Laporan Baru
                </Link>
              </div>

              <div className="detail-help-card">
                <div className="detail-help-icon">i</div>

                <div>
                  <h3>Informasi</h3>

                  <p>
                    Pantau perkembangan laporan melalui status dan
                    riwayat penanganan yang tersedia.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
