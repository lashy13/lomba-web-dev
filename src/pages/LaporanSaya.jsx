import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import "../styles/laporan-saya.css";

function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  try {
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getMyReports() {
  const user = getStoredUser();

  if (!user?.email) {
    return [];
  }

  try {
    const allReports = JSON.parse(
      localStorage.getItem("laporanSaya") || "[]"
    );

    if (!Array.isArray(allReports)) {
      return [];
    }

    return allReports.filter(
      (report) => report.userEmail === user.email
    );
  } catch {
    return [];
  }
}

function LaporanSaya() {
  const [laporan, setLaporan] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const loadReports = () => {
      setLaporan(getMyReports());
    };

    loadReports();

    window.addEventListener(
      "laporanUpdated",
      loadReports
    );

    window.addEventListener(
      "storage",
      loadReports
    );

    return () => {
      window.removeEventListener(
        "laporanUpdated",
        loadReports
      );

      window.removeEventListener(
        "storage",
        loadReports
      );
    };
  }, []);

  const totalLaporan = laporan.length;

  const dalamProses = laporan.filter(
    (item) =>
      item.status === "Dalam Proses" ||
      item.status === "Diverifikasi"
  ).length;

  const selesai = laporan.filter(
    (item) => item.status === "Selesai"
  ).length;

  const canDelete = (item) => {
    return !item.status || item.status === "Menunggu";
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    try {
      const allReports = JSON.parse(
        localStorage.getItem("laporanSaya") || "[]"
      );

      const updatedReports = allReports.filter(
        (item) =>
          String(item.id) !==
          String(deleteTarget.id)
      );

      localStorage.setItem(
        "laporanSaya",
        JSON.stringify(updatedReports)
      );

      setLaporan(
        updatedReports.filter(
          (item) =>
            item.userEmail ===
            getStoredUser()?.email
        )
      );

      setDeleteTarget(null);
      setOpenMenu(null);

      window.dispatchEvent(
        new Event("laporanUpdated")
      );
    } catch (error) {
      console.error(
        "Gagal menghapus laporan:",
        error
      );
    }
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

          <Link
            to="/"
            className="laporan-saya-back"
          >
            <span>←</span>
            Kembali
          </Link>

          <div className="laporan-saya-heading">
            <div>
              <span className="laporan-saya-label">
                AKUN SAYA
              </span>

              <h1>
                Laporan Saya
              </h1>

              <p>
                Pantau semua laporan yang
                pernah kamu kirim melalui
                Laporkita.
              </p>
            </div>

            <Link
              to="/buat-laporan"
              className="laporan-saya-create"
            >
              <span>+</span>
              Buat Laporan
            </Link>
          </div>

          {/* SUMMARY */}

          <div className="laporan-saya-summary">

            <div className="laporan-saya-summary-card">
              <span>
                Total Laporan
              </span>

              <strong>
                {totalLaporan}
              </strong>
            </div>

            <div className="laporan-saya-summary-card">
              <span>
                Dalam Proses
              </span>

              <strong>
                {dalamProses}
              </strong>
            </div>

            <div className="laporan-saya-summary-card">
              <span>
                Selesai
              </span>

              <strong>
                {selesai}
              </strong>
            </div>

          </div>

          {/* EMPTY */}

          {laporan.length === 0 ? (

            <div className="laporan-saya-empty">

              <div className="laporan-saya-empty-icon">
                📋
              </div>

              <h2>
                Belum ada laporan
              </h2>

              <p>
                Kamu belum pernah membuat
                laporan. Yuk ikut
                berkontribusi untuk
                lingkungan sekitar.
              </p>

              <Link
                to="/buat-laporan"
                className="laporan-saya-empty-button"
              >
                Buat Laporan
              </Link>

            </div>

          ) : (

            /* LIST */

            <div className="laporan-saya-list">

              {laporan.map((item) => (

                <div
                  key={item.id}
                  className="laporan-saya-card-wrapper"
                >

                  <Link
                    to={`/laporan/${item.id}`}
                    className="laporan-saya-card"
                    onClick={() =>
                      setOpenMenu(null)
                    }
                  >

                    <div className="laporan-saya-card-top">

                      <span className="laporan-saya-category">
                        {item.categoryLabel ||
                          item.category ||
                          "Umum"}
                      </span>

                      <span
                        className={`laporan-saya-status ${
                          item.statusClass ||
                          "waiting"
                        }`}
                      >
                        <span className="laporan-saya-status-dot"></span>

                       
                      </span>

                    </div>

                    <h2>
                      {item.title ||
                        "Laporan tanpa judul"}
                    </h2>

                    <div className="laporan-saya-meta">

                      <span>
                        📍{" "}
                        {item.lokasi?.detail ||
                          item.location ||
                          "Lokasi belum tersedia"}
                      </span>

                      <span>
                        📅{" "}
                        {item.date ||
                          "-"}
                      </span>

                    </div>

                    <div className="laporan-saya-card-bottom">

                      <span>
                        Lihat detail laporan
                      </span>

                      <span className="laporan-saya-arrow">
                        →
                      </span>

                    </div>

                  </Link>

                  {/* MENU */}

                  <div className="laporan-saya-menu">

                    <button
                      type="button"
                      className="laporan-saya-menu-button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        setOpenMenu(
                          openMenu === item.id
                            ? null
                            : item.id
                        );
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
                          onClick={() =>
                            setOpenMenu(null)
                          }
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

              ))}

            </div>

          )}

        </div>
      </section>

      {/* DELETE MODAL */}

      {deleteTarget && (

        <div
          className="laporan-saya-modal-overlay"
          onClick={() =>
            setDeleteTarget(null)
          }
        >

          <div
            className="laporan-saya-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="laporan-saya-modal-icon">
              !
            </div>

            <h2>
              Hapus laporan?
            </h2>

            <p>
              Laporan{" "}
              <strong>
                "{deleteTarget.title}"
              </strong>{" "}
              akan dihapus dan tidak dapat
              dikembalikan.
            </p>

            <div className="laporan-saya-modal-actions">

              <button
                type="button"
                className="laporan-saya-modal-cancel"
                onClick={() =>
                  setDeleteTarget(null)
                }
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