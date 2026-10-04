import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan.css";

const laporanData = [
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
    icon: "⌁",
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
    icon: "◉",
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
    icon: "≈",
  },
  {
    id: 4,
    title: "Fasilitas Taman Rusak",
    category: "Fasilitas Umum",
    location: "Purwokerto Timur",
    date: "28 September 2026",
    status: "Menunggu",
    statusClass: "waiting",
    description:
      "Beberapa fasilitas yang terdapat di taman umum mengalami kerusakan dan perlu diperbaiki.",
    icon: "✦",
  },
  {
    id: 5,
    title: "Sampah Menumpuk di Area Publik",
    category: "Lingkungan",
    location: "Purwokerto Barat",
    date: "27 September 2026",
    status: "Dalam Proses",
    statusClass: "process",
    description:
      "Terdapat tumpukan sampah di area publik yang belum tertangani dengan baik.",
    icon: "⌁",
  },
  {
    id: 6,
    title: "Rambu Lalu Lintas Rusak",
    category: "Infrastruktur",
    location: "Banyumas",
    date: "26 September 2026",
    status: "Diverifikasi",
    statusClass: "verified",
    description:
      "Salah satu rambu lalu lintas mengalami kerusakan sehingga informasi bagi pengguna jalan menjadi kurang jelas.",
    icon: "!",
  },
];

const categoryFilters = [
  {
    value: "Semua",
    label: "Semua",
  },
  {
    value: "Infrastruktur",
    label: "Infrastruktur",
  },
  {
    value: "Fasilitas Umum",
    label: "Fasilitas Umum",
  },
  {
    value: "Lingkungan",
    label: "Lingkungan",
  },
  {
    value: "Penerangan jalan",
    label: "Penerangan",
  },
  {
    value: "Drainase dan saluran air",
    label: "Drainase",
  },
  {
    value: "Lainnya",
    label: "Lainnya",
  },
];

const statusFilters = [
  {
    value: "Semua",
    label: "Semua status",
  },
  {
    value: "Menunggu",
    label: "Menunggu",
  },
  {
    value: "Diverifikasi",
    label: "Diverifikasi",
  },
  {
    value: "Dalam Proses",
    label: "Dalam Proses",
  },
  {
    value: "Selesai",
    label: "Selesai",
  },
];

function getStoredReports() {
  try {
    const rawReports = localStorage.getItem("laporanSaya");

    if (!rawReports) {
      return [];
    }

    const parsedReports = JSON.parse(rawReports);

    return Array.isArray(parsedReports) ? parsedReports : [];
  } catch {
    return [];
  }
}

function normalizeUserReport(report) {
  return {
    ...report,

    category: report.categoryLabel || report.category || "Lainnya",

    categoryOriginal: report.category || "",

    location:
      report.location ||
      report.lokasi?.alamat ||
      [
        report.lokasi?.desa,
        report.lokasi?.kecamatan,
        report.lokasi?.kabupaten,
        report.lokasi?.provinsi,
      ]
        .filter(Boolean)
        .join(", ") ||
      "Lokasi belum tersedia",

    date:
      report.date ||
      (report.createdAt
        ? new Date(report.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-"),

    status: report.status || "Menunggu",

    statusClass: report.statusClass || getStatusClass(report.status),

    description: report.description || "Tidak ada deskripsi laporan.",

    icon: getCategoryIcon(report.category),
  };
}

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
  switch (category) {
    case "jalan":
      return "⌁";

    case "fasilitas":
      return "✦";

    case "penerangan":
      return "◉";

    case "lingkungan":
      return "≈";

    case "drainase":
      return "⌁";

    default:
      return "!";
  }
}

function matchesCategory(report, selectedCategory) {
  if (selectedCategory === "Semua") {
    return true;
  }

  const category = String(report.category || "").toLowerCase();

  const originalCategory = String(report.categoryOriginal || "").toLowerCase();

  const target = selectedCategory.toLowerCase();

  if (category === target) {
    return true;
  }

  if (originalCategory === target) {
    return true;
  }

  const categoryMap = {
    infrastruktur: ["jalan", "jalan dan transportasi", "infrastruktur"],

    "fasilitas umum": ["fasilitas", "fasilitas umum"],

    "penerangan jalan": ["penerangan", "penerangan jalan"],

    lingkungan: ["lingkungan", "sampah"],

    "drainase dan saluran air": ["drainase", "drainase dan saluran air"],

    lainnya: ["lainnya"],
  };

  const aliases = categoryMap[target] || [];

  return aliases.some(
    (alias) => category.includes(alias) || originalCategory.includes(alias),
  );
}

function Laporan() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);

  const [search, setSearch] = useState("");

  const selectedCategory = searchParams.get("category") || "Semua";

  const [selectedStatus, setSelectedStatus] = useState("Semua");

  const [showFilters, setShowFilters] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const reportPath = isLoggedIn ? "/buat-laporan" : "/login";

  useEffect(() => {
    const loadReports = () => {
      const storedReports = getStoredReports();

      const normalizedReports = storedReports.map(normalizeUserReport);

      setReports([...laporanData, ...normalizedReports]);
    };

    loadReports();

    window.addEventListener("laporanUpdated", loadReports);

    window.addEventListener("storage", loadReports);

    return () => {
      window.removeEventListener("laporanUpdated", loadReports);

      window.removeEventListener("storage", loadReports);
    };
  }, []);

  const handleCategoryChange = (category) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (category === "Semua") {
      nextSearchParams.delete("category");
    } else {
      nextSearchParams.set("category", category);
    }

    setSearchParams(nextSearchParams);
  };

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !keyword ||
        [report.title, report.description, report.location, report.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesSelectedCategory = matchesCategory(report, selectedCategory);

      const matchesSelectedStatus =
        selectedStatus === "Semua" || report.status === selectedStatus;

      return matchesSearch && matchesSelectedCategory && matchesSelectedStatus;
    });
  }, [reports, search, selectedCategory, selectedStatus]);

  const totalLaporan = reports.length;

  const dalamProses = reports.filter(
    (item) => item.status === "Dalam Proses" || item.status === "Diverifikasi",
  ).length;

  const selesai = reports.filter((item) => item.status === "Selesai").length;

  const resetFilter = () => {
    setSearch("");
    setSelectedStatus("Semua");

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("category");
    setSearchParams(nextSearchParams);
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

      {/* MAIN */}

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
              mengenai permasalahan di lingkungan sekitar. Setiap laporan dapat
              dipantau berdasarkan status penanganannya.
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
                <label>Status laporan</label>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
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

          {(search ||
            selectedCategory !== "Semua" ||
            selectedStatus !== "Semua") && (
            <div className="laporan-result-info">
              Menampilkan <strong>{filteredReports.length}</strong> dari{" "}
              <strong>{reports.length}</strong> laporan
            </div>
          )}

          {/* REPORT LIST */}

          {filteredReports.length > 0 ? (
            <div className="laporan-list">
              {filteredReports.map((laporan) => (
                <Link
                  to={`/laporan/${laporan.id}`}
                  className="laporan-card"
                  key={`${laporan.userEmail || "public"}-${laporan.id}`}
                >
                  {/* VISUAL */}

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

                        <div className="dummy-image-icon">{laporan.icon}</div>

                        <span>Foto laporan</span>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}

                  <div className="laporan-card-content">
                    <div className="laporan-card-top">
                      <span className="laporan-category">
                        {laporan.category}
                      </span>

                      <span
                        className={`laporan-status ${
                          laporan.statusClass || getStatusClass(laporan.status)
                        }`}
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

                  {/* ARROW */}

                  <div className="laporan-card-arrow">→</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="laporan-empty">
              <div className="laporan-empty-icon">⌕</div>

              <h2>Laporan tidak ditemukan</h2>

              <p>
                Tidak ada laporan yang sesuai dengan pencarian atau filter yang
                kamu pilih.
              </p>

              <button type="button" onClick={resetFilter}>
                Reset pencarian
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}

      <footer className="laporan-footer">
        Laporkita · Bersama menyampaikan informasi untuk lingkungan yang lebih
        baik.
      </footer>
    </main>
  );
}

export default Laporan;
