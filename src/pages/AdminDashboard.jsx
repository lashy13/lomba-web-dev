import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  LogOut,
  Eye,
  MapPin,
  AlertCircle,
} from "lucide-react";

import "../styles/admin-dashboard.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const STATUS_OPTIONS = ["Menunggu", "Diverifikasi", "Dalam Proses", "Selesai"];

function getToken() {
  return (
    localStorage.getItem("adminToken") || localStorage.getItem("token") || ""
  );
}

function getStatusClass(status) {
  const normalized = String(status || "Menunggu")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

  if (normalized === "selesai") return "selesai";

  if (normalized === "dalam proses" || normalized === "diproses") {
    return "diproses";
  }

  if (normalized === "diverifikasi") {
    return "diverifikasi";
  }

  return "menunggu";
}

function formatTanggal(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `Permintaan gagal dengan status ${response.status}.`,
    );
  }

  return result;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState("");

  const fetchLaporan = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin-login", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/api/reports/admin/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await parseResponse(response);

      // Mendukung respons berupa array langsung atau { data: [...] }.
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : null;

      if (!data) {
        throw new Error("Format data laporan dari server tidak sesuai.");
      }

      setLaporan(data);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengambil data laporan.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLaporan();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchLaporan]);

  const statistik = useMemo(() => {
    return {
      total: laporan.length,

      menunggu: laporan.filter(
        (item) => getStatusClass(item.status) === "menunggu",
      ).length,

      diproses: laporan.filter((item) =>
        ["diverifikasi", "diproses"].includes(getStatusClass(item.status)),
      ).length,

      selesai: laporan.filter(
        (item) => getStatusClass(item.status) === "selesai",
      ).length,
    };
  }, [laporan]);

  const laporanTersaring = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return laporan.filter((item) => {
      const kolomPencarian = [
        item.title,
        item.category_name,
        item.village_name,
        item.district_name,
        item.regency_name,
        item.address,
      ];

      const cocokPencarian =
        keyword === "" ||
        kolomPencarian
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const cocokStatus =
        filterStatus === "Semua" ||
        getStatusClass(item.status) === getStatusClass(filterStatus);

      return cocokPencarian && cocokStatus;
    });
  }, [laporan, search, filterStatus]);

  async function ubahStatus(item, statusBaru) {
    if (statusBaru === item.status || updatingId !== null) {
      return;
    }

    const catatan = window.prompt(
      `Tambahkan catatan untuk status "${statusBaru}" (opsional):`,
      item.admin_note || "",
    );

    if (catatan === null) return;

    setUpdatingId(item.id);
    setError("");
    setNotification("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/admin-login", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/api/reports/${item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusBaru,
          admin_note: catatan,
        }),
      });

      await parseResponse(response);

      setLaporan((current) =>
        current.map((report) =>
          report.id === item.id
            ? {
                ...report,
                status: statusBaru,
                admin_note: catatan,
              }
            : report,
        ),
      );

      setNotification(
        `Status laporan "${item.title || `#${item.id}`}" berhasil diperbarui.`,
      );
    } catch (err) {
      setError(err.message || "Gagal memperbarui status laporan.");
    } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    const yakin = window.confirm("Yakin ingin keluar dari dashboard admin?");

    if (!yakin) return;

    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUser");

    navigate("/admin-login", { replace: true });
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <LayoutDashboard size={24} />
          </div>

          <div>
            <h2>LaporKita</h2>
            <span>Panel Admin</span>
          </div>
        </div>

        <div className="admin-sidebar-label">MENU UTAMA</div>

        <button
          type="button"
          className="admin-menu-item active"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <LayoutDashboard size={19} />
          Dashboard
        </button>

        <button
          type="button"
          className="admin-menu-item"
          onClick={() => {
            setFilterStatus("Semua");

            document.getElementById("admin-daftar-laporan")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <FileText size={19} />
          Semua Laporan
        </button>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              <img src="/logo-laporkita.png" alt="Logo LaporKita" />
            </div>

            <div>
              <strong>Administrator</strong>
              <span>Pengelola Laporan</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">PUSAT KENDALI</p>

            <h1>Dashboard Admin</h1>

            <p className="admin-topbar-description">
              Pantau dan kelola laporan fasilitas publik.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={fetchLaporan}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "admin-spinning" : ""} />

            <span>Perbarui Data</span>
          </button>
        </header>

        {error && (
          <div className="admin-alert error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {notification && (
          <div className="admin-alert success" role="status">
            <CheckCircle size={19} />
            <span>{notification}</span>
          </div>
        )}

        <section className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue">
              <FileText size={22} />
            </div>

            <div>
              <span>Total Laporan</span>
              <strong>{loading ? "—" : statistik.total}</strong>
              <small>Seluruh laporan masuk</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon orange">
              <Clock size={22} />
            </div>

            <div>
              <span>Menunggu</span>
              <strong>{loading ? "—" : statistik.menunggu}</strong>
              <small>Belum ditindaklanjuti</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon purple">
              <RefreshCw size={22} />
            </div>

            <div>
              <span>Diproses</span>
              <strong>{loading ? "—" : statistik.diproses}</strong>
              <small>Verifikasi dan penanganan</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon green">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Selesai</span>
              <strong>{loading ? "—" : statistik.selesai}</strong>
              <small>Penanganan diselesaikan</small>
            </div>
          </div>
        </section>

        <section className="admin-report-section" id="admin-daftar-laporan">
          <div className="admin-section-heading">
            <div>
              <h2>Daftar Laporan</h2>
              <p>Tinjau laporan masyarakat dan perbarui statusnya.</p>
            </div>

            <span className="admin-total-badge">
              {laporanTersaring.length} laporan
            </span>
          </div>

          <div className="admin-report-toolbar">
            <label className="admin-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Cari judul, kategori, atau lokasi..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="admin-status-filter"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status laporan"
            >
              <option value="Semua">Semua Status</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <RefreshCw size={28} className="admin-spinning" />

              <h3>Memuat laporan...</h3>
              <p>Mohon tunggu sebentar.</p>
            </div>
          ) : laporanTersaring.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={36} />

              <h3>Belum ada laporan yang cocok</h3>
              <p>Coba ubah kata kunci atau pilih status lainnya.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-report-table">
                <thead>
                  <tr>
                    <th>Laporan</th>
                    <th>Kategori</th>
                    <th>Lokasi</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Kelola Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {laporanTersaring.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="admin-report-title">
                          <strong>{item.title || "Tanpa Judul"}</strong>

                          <span>ID laporan #{item.id}</span>
                        </div>
                      </td>

                      <td>{item.category_name || "-"}</td>

                      <td>
                        <div className="admin-location-cell">
                          <MapPin size={15} />

                          <span>
                            {[
                              item.village_name,
                              item.district_name,
                              item.regency_name,
                            ]
                              .filter(Boolean)
                              .join(", ") ||
                              item.address ||
                              "Lokasi tidak tersedia"}
                          </span>
                        </div>
                      </td>

                      <td>{formatTanggal(item.created_at)}</td>

                      <td>
                        <span
                          className={`admin-status-badge ${getStatusClass(
                            item.status,
                          )}`}
                        >
                          {item.status || "Menunggu"}
                        </span>
                      </td>

                      <td>
                        <select
                          className="admin-row-status-select"
                          value={item.status || "Menunggu"}
                          onChange={(event) =>
                            ubahStatus(item, event.target.value)
                          }
                          disabled={updatingId !== null}
                          aria-label={`Ubah status laporan ${
                            item.title || item.id
                          }`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {updatingId === item.id && (
                          <small className="admin-updating-text">
                            Menyimpan...
                          </small>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-detail-button"
                          onClick={() => navigate(`/laporan/${item.id}`)}
                          title="Lihat detail laporan"
                          aria-label={`Lihat detail ${item.title || item.id}`}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-footer">
          LaporKita · Panel Pengelolaan Laporan Publik
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
