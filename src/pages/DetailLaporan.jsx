import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import "../styles/detail-laporan.css";

const kategoriLabel = {
  jalan: "Jalan dan transportasi",
  fasilitas: "Fasilitas umum",
  penerangan: "Penerangan jalan",
  lingkungan: "Lingkungan",
  drainase: "Drainase dan saluran air",
  lainnya: "Lainnya",
};

const laporanDummy = [
  {
    id: 1,
    title: "Jalan Rusak di Karangsoka",
    category: "Infrastruktur",
    description:
      "Terdapat beberapa bagian jalan yang mengalami kerusakan dan berlubang.",
    location: "Karangsoka, Purwokerto",
    status: "Dalam Proses",
    statusClass: "process",
    date: "1 Oktober 2026",
  },
  {
    id: 2,
    title: "Lampu Penerangan Jalan Mati",
    category: "Fasilitas Umum",
    description:
      "Lampu penerangan jalan tidak menyala pada malam hari.",
    location: "Purwokerto Selatan",
    status: "Diverifikasi",
    statusClass: "verified",
    date: "30 September 2026",
  },
  {
    id: 3,
    title: "Saluran Air Tersumbat",
    category: "Lingkungan",
    description:
      "Saluran air tersumbat oleh sampah dan menyebabkan aliran air tidak lancar.",
    location: "Banyumas, Jawa Tengah",
    status: "Selesai",
    statusClass: "completed",
    date: "29 September 2026",
  },
  {
    id: 4,
    title: "Fasilitas Taman Rusak",
    category: "Fasilitas Umum",
    description:
      "Beberapa fasilitas yang terdapat di taman mengalami kerusakan.",
    location: "Purwokerto Timur",
    status: "Menunggu",
    statusClass: "waiting",
    date: "28 September 2026",
  },
  {
    id: 5,
    title: "Sampah Menumpuk di Area Publik",
    category: "Lingkungan",
    description:
      "Terdapat tumpukan sampah di area publik yang belum ditangani.",
    location: "Purwokerto Barat",
    status: "Dalam Proses",
    statusClass: "process",
    date: "27 September 2026",
  },
  {
    id: 6,
    title: "Rambu Lalu Lintas Rusak",
    category: "Infrastruktur",
    description:
      "Rambu lalu lintas mengalami kerusakan dan perlu diperbaiki.",
    location: "Banyumas",
    status: "Diverifikasi",
    statusClass: "verified",
    date: "26 September 2026",
  },
];

function getStoredReports() {
  try {
    const reports = JSON.parse(
      localStorage.getItem("laporanSaya") || "[]"
    );

    return Array.isArray(reports)
      ? reports
      : [];
  } catch {
    return [];
  }
}

function DetailLaporan() {
  const { id } = useParams();

  const [laporan, setLaporan] =
    useState(null);

  useEffect(() => {
    const findReport = () => {
      const storedReports =
        getStoredReports();

      /*
       * Cari laporan buatan user
       */
      const storedReport =
        storedReports.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      if (storedReport) {
        setLaporan(storedReport);
        return;
      }

      /*
       * Kalau bukan laporan user,
       * cari dari data dummy.
       */
      const dummyReport =
        laporanDummy.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      setLaporan(
        dummyReport || null
      );
    };

    findReport();

    window.addEventListener(
      "laporanUpdated",
      findReport
    );

    window.addEventListener(
      "storage",
      findReport
    );

    return () => {
      window.removeEventListener(
        "laporanUpdated",
        findReport
      );

      window.removeEventListener(
        "storage",
        findReport
      );
    };
  }, [id]);

  /*
   * Laporan tidak ditemukan
   */
  if (!laporan) {
    return (
      <main className="detail-page">
        <Navbar />

        <div className="detail-background">
          <div className="detail-grid"></div>

          <div className="detail-orb detail-orb-one"></div>

          <div className="detail-orb detail-orb-two"></div>
        </div>

        <section className="detail-main">
          <div className="detail-container">

            <Link
              to="/laporan"
              className="detail-back"
            >
              <span>←</span>
              Kembali ke laporan
            </Link>

            <div className="detail-not-found">
              <div className="detail-not-found-icon">
                ?
              </div>

              <h1>
                Laporan tidak ditemukan
              </h1>

              <p>
                Laporan yang kamu cari
                tidak tersedia atau sudah
                tidak ada.
              </p>

              <Link
                to="/laporan"
                className="detail-not-found-button"
              >
                Lihat Semua Laporan
              </Link>
            </div>

          </div>
        </section>
      </main>
    );
  }

  const isUserReport =
    laporan.userEmail;

  const category =
    laporan.categoryLabel ||
    kategoriLabel[
      laporan.category
    ] ||
    laporan.category ||
    "Umum";

  const description =
    laporan.description ||
    "Tidak ada deskripsi laporan.";

  const location =
    laporan.location ||
    laporan.lokasi?.alamat ||
    `${laporan.lokasi?.desa || ""}, ${
      laporan.lokasi?.kecamatan || ""
    }, ${
      laporan.lokasi?.kabupaten || ""
    }, ${
      laporan.lokasi?.provinsi || ""
    }`;

  const detailLocation =
    laporan.lokasi?.detail || "";

  const status =
    laporan.status ||
    "Menunggu";

  const statusClass =
    laporan.statusClass ||
    "waiting";

  const photo =
    laporan.photo || "";

  /*
   * Timeline laporan user
   */
  const timeline =
    laporan.timeline || [
      {
        title: "Laporan dikirim",
        description:
          "Laporan berhasil dikirim.",
        date:
          laporan.date || "",
        completed: true,
      },
      {
        title: "Laporan diverifikasi",
        description:
          "Laporan akan diperiksa oleh petugas.",
        completed:
          status === "Diverifikasi" ||
          status === "Dalam Proses" ||
          status === "Selesai",
      },
      {
        title: "Dalam proses",
        description:
          "Laporan sedang ditindaklanjuti.",
        completed:
          status === "Dalam Proses" ||
          status === "Selesai",
      },
      {
        title: "Selesai",
        description:
          "Permasalahan telah selesai ditangani.",
        completed:
          status === "Selesai",
      },
    ];

  return (
    <main className="detail-page">
      <Navbar />

      <div className="detail-background">
        <div className="detail-grid"></div>

        <div className="detail-orb detail-orb-one"></div>

        <div className="detail-orb detail-orb-two"></div>
      </div>

      <section className="detail-main">
        <div className="detail-container">

          {/* =========================
              BACK
          ========================= */}

          <Link
            to={
              isUserReport
                ? "/laporan-saya"
                : "/laporan"
            }
            className="detail-back"
          >
            <span>←</span>

            {isUserReport
              ? "Kembali ke Laporan Saya"
              : "Kembali ke laporan"}
          </Link>

          {/* =========================
              HEADER
          ========================= */}

          <div className="detail-header">

            <div className="detail-header-content">

              <div className="detail-category-row">

                <span className="detail-category">
                  {category}
                </span>

                <span
                  className={`detail-status ${statusClass}`}
                >
                  <span className="detail-status-dot"></span>

                  {status}
                </span>

              </div>

              <h1>
                {laporan.title ||
                  "Laporan tanpa judul"}
              </h1>

              <div className="detail-meta">

                <span>
                  📅{" "}
                  {laporan.date ||
                    "-"}
                </span>

                {isUserReport && (
                  <span>
                    ID #{laporan.id}
                  </span>
                )}

              </div>

            </div>

          </div>

          {/* =========================
              CONTENT
          ========================= */}

          <div className="detail-layout">

            {/* =========================
                LEFT
            ========================= */}

            <div className="detail-content">

              {/* FOTO */}

              <div className="detail-image-card">

                {photo ? (
                  <img
                    src={photo}
                    alt={
                      laporan.title ||
                      "Foto laporan"
                    }
                    className="detail-report-image"
                  />
                ) : (
                  <div className="detail-image-placeholder">
                    <div>
                      <span>⌖</span>
                      <p>
                        Foto laporan
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* TENTANG LAPORAN */}

              <div className="detail-section">

                <div className="detail-section-label">
                  TENTANG LAPORAN
                </div>

                <h2>
                  Deskripsi masalah
                </h2>

                <p className="detail-description">
                  {description}
                </p>

              </div>

              {/* LOKASI */}

              <div className="detail-section">

                <div className="detail-section-label">
                  LOKASI
                </div>

                <div className="detail-location-card">

                  <div className="detail-location-icon">
                    ⌖
                  </div>

                  <div className="detail-location-content">

                    <h3>
                      {location}
                    </h3>

                    {detailLocation && (
                      <p>
                        {detailLocation}
                      </p>
                    )}

                    {laporan.lokasi
                      ?.latitude &&
                      laporan.lokasi
                        ?.longitude && (
                        <span>
                          Koordinat:{" "}
                          {
                            laporan.lokasi
                              .latitude
                          }
                          ,{" "}
                          {
                            laporan.lokasi
                              .longitude
                          }
                        </span>
                      )}

                  </div>

                </div>

              </div>

            </div>

            {/* =========================
                RIGHT
            ========================= */}

            <aside className="detail-sidebar">

              {/* STATUS */}

              <div className="detail-status-card">

                <div className="detail-section-label">
                  STATUS LAPORAN
                </div>

                <div
                  className={`detail-current-status ${statusClass}`}
                >
                  <span className="detail-current-status-dot"></span>

                  <div>
                    <strong>
                      {status}
                    </strong>

                    <p>
                      {status ===
                      "Menunggu"
                        ? "Laporan sedang menunggu pemeriksaan."
                        : status ===
                            "Diverifikasi"
                          ? "Laporan telah diverifikasi."
                          : status ===
                              "Dalam Proses"
                            ? "Laporan sedang ditindaklanjuti."
                            : status ===
                                "Selesai"
                              ? "Laporan telah selesai ditangani."
                              : "Status laporan sedang diperbarui."}
                    </p>
                  </div>
                </div>

              </div>

              {/* TIMELINE */}

              <div className="detail-timeline-card">

                <div className="detail-section-label">
                  PERJALANAN LAPORAN
                </div>

                <div className="detail-timeline">

                  {timeline.map(
                    (
                      step,
                      index
                    ) => (
                      <div
                        key={index}
                        className={`detail-timeline-item ${
                          step.completed
                            ? "completed"
                            : ""
                        }`}
                      >

                        <div className="detail-timeline-line">
                          <div className="detail-timeline-dot">
                            {step.completed
                              ? "✓"
                              : ""}
                          </div>

                          {index <
                            timeline.length -
                              1 && (
                            <div className="detail-timeline-connector"></div>
                          )}
                        </div>

                        <div className="detail-timeline-content">

                          <h3>
                            {
                              step.title
                            }
                          </h3>

                          <p>
                            {
                              step.description
                            }
                          </p>

                          {step.date && (
                            <span>
                              {
                                step.date
                              }
                            </span>
                          )}

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

            </aside>

          </div>

          {/* =========================
              ACTION
          ========================= */}

          <div className="detail-actions">

            <Link
              to="/laporan"
              className="detail-action-secondary"
            >
              Lihat semua laporan
            </Link>

            <Link
              to="/buat-laporan"
              className="detail-action-primary"
            >
              Buat laporan baru
              <span>→</span>
            </Link>

          </div>

        </div>
      </section>
    </main>
  );
}

export default DetailLaporan;