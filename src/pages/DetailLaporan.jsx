
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
    className: "waiting",
    description: "Laporan tidak dapat diproses lebih lanjut.",
  },
};

function getStatusInfo(status) {
  const normalizedStatus = String(status || "menunggu")
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

  const key = aliases[normalizedStatus] || normalizedStatus;

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
  if (!laporan) {
    return {
      address: "Alamat tidak tersedia",
      village: "-",
      district: "-",
      regency: "-",
      province: "-",
    };
  }

  return {
    address:
      laporan.address ||
      laporan.location_detail ||
      laporan.alamat ||
      "-",

    village:
      laporan.village ||
      laporan.village_name ||
      laporan.kelurahan ||
      laporan.desa ||
      "-",

    district:
      laporan.district ||
      laporan.district_name ||
      laporan.kecamatan ||
      "-",

    regency:
      laporan.regency ||
      laporan.regency_name ||
      laporan.kabupaten ||
      laporan.kota ||
      "-",

    province:
      laporan.province ||
      laporan.province_name ||
      laporan.provinsi ||
      "-",
  };
}

function getTimelineItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.timeline)) return data.timeline;

  return [];
}

export default function DetailLaporan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDetail() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setError("");

        const response = await fetch(
          `${API_URL}/api/reports/${id}/private`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        if (response.status === 403) {
          throw new Error(
            "Kamu tidak memiliki akses untuk melihat laporan ini."
          );
        }

        if (response.status === 404) {
          throw new Error("Laporan tidak ditemukan.");
        }

        if (!response.ok) {
          throw new Error("Gagal mengambil detail laporan.");
        }

        const responseData = await response.json();

        const detail =
          responseData.data ??
          responseData.report ??
          responseData;

        if (
          !detail ||
          typeof detail !== "object" ||
          Array.isArray(detail)
        ) {
          throw new Error("Data laporan tidak valid.");
        }

        setLaporan(detail);

        const timelineResponse = await fetch(
          `${API_URL}/api/reports/${id}/timeline`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (timelineResponse.ok) {
          const timelineData = await timelineResponse.json();
          setTimeline(getTimelineItems(timelineData));
        } else {
          setTimeline([]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
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

    return () => {
      controller.abort();
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="detail-page">
          <div className="detail-container">
            <div className="detail-loading">
              <div className="loading-spinner" />
              <p>Memuat detail laporan...</p>
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
            <div className="detail-error">
              <div className="error-icon">!</div>

              <h2>Laporan Tidak Dapat Ditampilkan</h2>

              <p>{error || "Data laporan tidak ditemukan."}</p>

              <Link to="/laporan-saya" className="btn-back">
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

  const photo = laporan.photo || laporan.photo_url || "";

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

  return (
    <>
      <Navbar />

      <main className="detail-page">
        <div className="detail-container">
          <div className="detail-breadcrumb">
            <Link to="/">Beranda</Link>
            <span>/</span>
            <Link to="/laporan-saya">Laporan Saya</Link>
            <span>/</span>
            <span>Detail Laporan</span>
          </div>

          <div className="detail-header">
            <div className="detail-header-content">
              <span className="detail-category">
                {laporan.category ||
                  laporan.kategori ||
                  "Fasilitas Umum"}
              </span>

              <h1>
                {laporan.title ||
                  laporan.judul ||
                  "Laporan Tanpa Judul"}
              </h1>

              <div className="detail-meta">
                <span>ID Laporan: #{laporan.id || id}</span>

                <span>
                  {formatDate(
                    laporan.created_at ||
                      laporan.createdAt ||
                      laporan.tanggal
                  )}
                </span>
              </div>
            </div>

            <span className={`status-badge ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="detail-grid">
            <section className="detail-main">
              <article className="detail-card">
                <h2>Foto Laporan</h2>

                {photo ? (
                  <img
                    src={photo}
                    alt={`Foto laporan ${
                      laporan.title || laporan.judul || ""
                    }`}
                    className="detail-photo"
                  />
                ) : (
                  <div className="detail-photo-placeholder">
                    <span className="placeholder-icon">▧</span>
                    <p>Foto laporan belum tersedia.</p>
                  </div>
                )}
              </article>

              <article className="detail-card">
                <h2>Deskripsi Laporan</h2>

                <p className="detail-description">
                  {laporan.description ||
                    laporan.deskripsi ||
                    "Tidak ada deskripsi yang tersedia."}
                </p>
              </article>

              <article className="detail-card">
                <h2>Lokasi Kejadian</h2>

                <div className="detail-location-section">
                  <div className="detail-location">
                    <span className="location-icon">⌖</span>

                    <div>
                      <h3>Alamat Lokasi</h3>
                      <p>{lokasi.address}</p>
                    </div>
                  </div>

                  <div className="detail-address-list">
                    <div className="detail-address-item">
                      <span>Kelurahan / Desa</span>
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
                      <p>
                        <strong>Latitude:</strong> {latitude}
                      </p>

                      <p>
                        <strong>Longitude:</strong> {longitude}
                      </p>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-link"
                      >
                        Lihat Lokasi di Google Maps ↗
                      </a>
                    </div>
                  ) : (
                    <p className="detail-location-notice">
                      Koordinat belum tersedia untuk laporan ini.
                    </p>
                  )}
                </div>
              </article>

              <article className="detail-card">
                <h2>Riwayat Status</h2>

                {timeline.length > 0 ? (
                  <div className="timeline">
                    {timeline.map((item, index) => {
                      const itemStatus = getStatusInfo(item.status);

                      return (
                        <div
                          className="timeline-item"
                          key={item.id || index}
                        >
                          <div className="timeline-marker" />

                          <div className="timeline-content">
                            <span
                              className={`status-badge ${itemStatus.className}`}
                            >
                              {itemStatus.label}
                            </span>

                            <p className="timeline-description">
                              {item.note ||
                                item.description ||
                                itemStatus.description}
                            </p>

                            <span className="timeline-date">
                              {formatDate(
                                item.created_at || item.createdAt
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="timeline-empty">
                    <p>Riwayat status belum tersedia.</p>
                  </div>
                )}
              </article>
            </section>

            <aside className="detail-sidebar">
              <article className="detail-card status-card">
                <h2>Status Laporan</h2>

                <span className={`status-badge ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>

                <p className="status-description">
                  {statusInfo.description}
                </p>

                {laporan.admin_note && (
                  <div className="admin-note">
                    <h3>Catatan Petugas</h3>
                    <p>{laporan.admin_note}</p>
                  </div>
                )}
              </article>

              <article className="detail-card">
                <h2>Informasi Laporan</h2>

                <div className="detail-info-row">
                  <span>Nomor Laporan</span>
                  <strong>#{laporan.id || id}</strong>
                </div>

                <div className="detail-info-row">
                  <span>Kategori</span>
                  <strong>
                    {laporan.category ||
                      laporan.kategori ||
                      "Fasilitas Umum"}
                  </strong>
                </div>

                <div className="detail-info-row">
                  <span>Dibuat pada</span>
                  <strong>
                    {formatDate(
                      laporan.created_at ||
                        laporan.createdAt ||
                        laporan.tanggal
                    )}
                  </strong>
                </div>

                <div className="detail-info-row">
                  <span>Pembaruan terakhir</span>
                  <strong>
                    {formatDate(
                      laporan.updated_at || laporan.updatedAt
                    )}
                  </strong>
                </div>
              </article>

              <div className="detail-actions">
                <Link to="/laporan-saya" className="btn-back">
                  ← Kembali ke Laporan Saya
                </Link>

                <Link to="/buat-laporan" className="btn-create-report">
                  + Buat Laporan Baru
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
