import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/profil.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getImageUrl(image) {
  if (!image) return "";

  if (
    image.startsWith("data:") ||
    image.startsWith("blob:") ||
    /^https?:\/\//i.test(image)
  ) {
    return image;
  }

  return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

function Profil() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ========================================
  // REQUEST API
  // ========================================

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const token = localStorage.getItem("token");

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      // Jangan memasang Content-Type JSON untuk FormData.
      // Browser akan mengatur multipart boundary secara otomatis.
      if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"]
      ) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        window.dispatchEvent(new Event("userUpdated"));

        navigate("/login", {
          replace: true,
          state: { from: "/profil" },
        });

        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Permintaan ke server gagal.");
      }

      return data;
    },
    [navigate],
  );

  // ========================================
  // LOAD USER DAN LAPORAN
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", {
            replace: true,
            state: { from: "/profil" },
          });
          return;
        }

        const [profileData, reportsData] = await Promise.all([
          apiRequest("/api/auth/me"),
          apiRequest("/api/reports/my-reports"),
        ]);

        if (cancelled) return;

        const currentUser = profileData.user;

        if (!currentUser || currentUser.role !== "user") {
          navigate(currentUser?.role === "admin" ? "/admin" : "/login", {
            replace: true,
          });
          return;
        }

        const savedUser = {
          ...currentUser,
          profileImage: getImageUrl(
            currentUser.profile_image || currentUser.profileImage || "",
          ),
        };

        setUser(savedUser);
        setUsername(savedUser.username || "");
        setEmail(savedUser.email || "");
        setProfileImage(savedUser.profileImage);

        localStorage.setItem("user", JSON.stringify(savedUser));
        localStorage.setItem("isLoggedIn", "true");

        const reportList = Array.isArray(reportsData.reports)
          ? reportsData.reports
          : Array.isArray(reportsData.data)
            ? reportsData.data
            : [];

        setReports(reportList);
      } catch (error) {
        if (cancelled) return;

        console.error("Gagal memuat profil:", error);

        if (localStorage.getItem("token")) {
          alert(
            error.message || "Profil gagal dimuat. Periksa koneksi backend.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [apiRequest, navigate]);

  // ========================================
  // STATISTIK LAPORAN
  // ========================================

  const statistics = useMemo(() => {
    const total = reports.length;

    const waiting = reports.filter(
      (report) => report.status === "Menunggu",
    ).length;

    const verified = reports.filter(
      (report) => report.status === "Diverifikasi",
    ).length;

    const process = reports.filter(
      (report) => report.status === "Dalam Proses",
    ).length;

    const completed = reports.filter(
      (report) => report.status === "Selesai",
    ).length;

    return {
      total,
      waiting,
      verified,
      process,
      completed,
    };
  }, [reports]);

  // ========================================
  // POIN WARGA
  // ========================================

  const points = useMemo(() => {
    return reports.reduce((total, report) => {
      let reportPoints = 10;

      if (report.status === "Diverifikasi") {
        reportPoints += 10;
      }

      if (report.status === "Dalam Proses") {
        reportPoints += 15;
      }

      if (report.status === "Selesai") {
        reportPoints += 30;
      }

      return total + reportPoints;
    }, 0);
  }, [reports]);

  // ========================================
  // LEVEL WARGA
  // ========================================

  const level = useMemo(() => {
    if (points >= 500) return 5;
    if (points >= 300) return 4;
    if (points >= 150) return 3;
    if (points >= 50) return 2;

    return 1;
  }, [points]);

  const levelName = useMemo(() => {
    switch (level) {
      case 5:
        return "Penggerak Kota";
      case 4:
        return "Kontributor Aktif";
      case 3:
        return "Warga Peduli";
      case 2:
        return "Warga Aktif";
      default:
        return "Warga Baru";
    }
  }, [level]);

  const nextLevelPoints = useMemo(() => {
    if (level === 1) return 50;
    if (level === 2) return 150;
    if (level === 3) return 300;
    if (level === 4) return 500;

    return 500;
  }, [level]);

  const previousLevelPoints = useMemo(() => {
    if (level === 1) return 0;
    if (level === 2) return 50;
    if (level === 3) return 150;
    if (level === 4) return 300;

    return 500;
  }, [level]);

  const progress =
    level >= 5
      ? 100
      : Math.min(
          100,
          ((points - previousLevelPoints) /
            (nextLevelPoints - previousLevelPoints)) *
            100,
        );

  // ========================================
  // BADGES
  // ========================================

  const badges = useMemo(
    () => [
      {
        id: "first-report",
        icon: "◆",
        name: "Pelapor Pertama",
        description: "Membuat laporan pertama",
        unlocked: statistics.total >= 1,
      },
      {
        id: "active",
        icon: "★",
        name: "Warga Aktif",
        description: "Membuat 5 laporan",
        unlocked: statistics.total >= 5,
      },
      {
        id: "completed",
        icon: "✓",
        name: "Kontributor",
        description: "Laporan berhasil diselesaikan",
        unlocked: statistics.completed >= 1,
      },
      {
        id: "guardian",
        icon: "◆",
        name: "Pengawas Kota",
        description: "Memiliki 10 laporan",
        unlocked: statistics.total >= 10,
      },
    ],
    [statistics],
  );

  // ========================================
  // PILIH DAN UPLOAD FOTO PROFIL
  // ========================================

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    // Mengizinkan pengguna memilih ulang file yang sama.
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Gunakan gambar berformat JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Ukuran foto maksimal 2 MB.");
      return;
    }

    if (!user?.id) {
      alert("Data akun tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (saving) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Silakan login kembali.");
      navigate("/login");
      return;
    }

    const previousImage = profileImage;
    const previewUrl = URL.createObjectURL(file);

    setSaving(true);
    setShowPhotoMenu(false);
    setProfileImage(previewUrl);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`${API_URL}/api/auth/profile/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");

        window.dispatchEvent(new Event("userUpdated"));

        navigate("/login", {
          replace: true,
          state: { from: "/profil" },
        });

        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Foto gagal diunggah.");
      }

      const savedImagePath =
        data.profileImage ||
        data.user?.profile_image ||
        data.user?.profileImage;

      if (!savedImagePath) {
        throw new Error(
          "Server tidak mengembalikan lokasi foto yang tersimpan.",
        );
      }

      const savedImageUrl = getImageUrl(savedImagePath);

      const updatedUser = {
        ...user,
        ...(data.user || {}),
        profileImage: savedImageUrl,
      };

      setUser(updatedUser);
      setProfileImage(savedImageUrl);

      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new Event("userUpdated"));

      alert("Foto profil berhasil disimpan.");
    } catch (error) {
      console.error("Gagal mengunggah foto profil:", error);

      setProfileImage(previousImage);

      alert(error.message || "Foto gagal diunggah. Periksa koneksi backend.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setSaving(false);
    }
  };

  // ========================================
  // BUKA PEMILIH FOTO
  // ========================================

  const handleChangePhoto = () => {
    if (saving) return;

    setShowPhotoMenu(false);

    window.setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  // ========================================
  // HAPUS FOTO PROFIL DARI SERVER
  // ========================================

  const handleRemoveImage = async () => {
    if (!profileImage || saving) return;

    const confirmed = window.confirm("Yakin ingin menghapus foto profil?");

    if (!confirmed) return;

    setSaving(true);
    setShowPhotoMenu(false);

    try {
      const data = await apiRequest("/api/auth/profile/photo", {
        method: "DELETE",
      });

      const updatedUser = {
        ...user,
        ...(data.user || {}),
        profile_image: null,
        profileImage: "",
      };

      setUser(updatedUser);
      setProfileImage("");

      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      window.dispatchEvent(new Event("userUpdated"));

      alert("Foto profil berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus foto profil:", error);

      alert(error.message || "Foto gagal dihapus. Silakan coba kembali.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // SIMPAN PERUBAHAN NAMA
  // ========================================

  const handleSave = async (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2) {
      alert("Nama minimal 2 karakter.");
      return;
    }

    if (trimmedUsername.length > 100) {
      alert("Nama maksimal 100 karakter.");
      return;
    }

    if (!user?.id) {
      alert("Data akun tidak ditemukan. Silakan login kembali.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: trimmedUsername,
        }),
      });

      const returnedUser = data.user || {};

      const returnedImage =
        returnedUser.profile_image ||
        returnedUser.profileImage ||
        user.profile_image ||
        user.profileImage ||
        "";

      const updatedUser = {
        ...user,
        ...returnedUser,
        username: returnedUser.username || trimmedUsername,
        email: returnedUser.email || user.email,
        profileImage: getImageUrl(returnedImage),
      };

      setUser(updatedUser);
      setUsername(updatedUser.username);
      setEmail(updatedUser.email || "");
      setProfileImage(updatedUser.profileImage);

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      setShowPhotoMenu(false);

      window.dispatchEvent(new Event("userUpdated"));

      alert("Profil berhasil diperbarui.");
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);

      alert(error.message || "Profil gagal disimpan. Silakan coba kembali.");
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // BATAL EDIT
  // ========================================

  const handleCancel = () => {
    setUsername(user?.username || "");
    setProfileImage(
      getImageUrl(user?.profile_image || user?.profileImage || ""),
    );

    setIsEditing(false);
    setShowPhotoMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    setShowLogoutModal(false);

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/", { replace: true });
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="profil-page">
        <div className="profil-container">
          <p>Memuat profil...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ========================================
  // TAMPILAN UTAMA
  // ========================================

  return (
    <main className="profil-page">
      <div className="profil-background">
        <div className="profil-grid"></div>
        <div className="profil-orb profil-orb-one"></div>
        <div className="profil-orb profil-orb-two"></div>
      </div>

      <div className="profil-container">
        <Link to="/" className="profil-back">
          ← Kembali ke Beranda
        </Link>

        <div className="profil-heading">
          <span className="profil-label">AKUN LAPORKITA</span>
          <h1>Profil Saya</h1>
          <p>
            Kelola akun, lihat aktivitas, dan pantau kontribusimu di LaporKita.
          </p>
        </div>

        <section className="profil-card">
          <div className="profil-card-top">
            <div className="profil-avatar-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Foto profil"
                  className="profil-avatar-image"
                  onError={(event) => {
                    console.error(
                      "Foto profil gagal dimuat:",
                      event.currentTarget.src,
                    );
                  }}
                />
              ) : (
                <div className="profil-avatar">
                  {(username || "P").charAt(0).toUpperCase()}
                </div>
              )}

              <input
                ref={fileInputRef}
                id="profileImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="profil-hidden-file"
                disabled={saving}
              />

              {isEditing && (
                <div className="profil-photo-control">
                  <button
                    type="button"
                    className="profil-camera"
                    onClick={() => setShowPhotoMenu((value) => !value)}
                    aria-label="Kelola foto profil"
                    aria-expanded={showPhotoMenu}
                    disabled={saving}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 8.5C4 7.67 4.67 7 5.5 7H8L9.4 5H14.6L16 7H18.5C19.33 7 20 7.67 20 8.5V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V8.5Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </button>

                  {showPhotoMenu && (
                    <div className="profil-photo-menu">
                      <button
                        type="button"
                        className="profil-photo-menu-item"
                        onClick={handleChangePhoto}
                      >
                        <span className="profil-photo-menu-icon">+</span>
                        <span>
                          {profileImage ? "Ganti foto" : "Tambah foto"}
                        </span>
                      </button>

                      {profileImage && (
                        <>
                          <div className="profil-photo-menu-divider"></div>

                          <button
                            type="button"
                            className="profil-photo-menu-item profil-photo-delete"
                            onClick={handleRemoveImage}
                          >
                            <span className="profil-photo-menu-icon">×</span>
                            <span>Hapus foto</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="profil-user-info">
              <h2>{username || "Pengguna"}</h2>
              <p>{email}</p>

              <span className="profil-status">
                <span className="profil-status-dot"></span>
                Akun aktif
              </span>
            </div>
          </div>

          <div className="profil-divider"></div>

          <div className="profil-stats">
            <div className="profil-stat-card">
              <span className="profil-stat-icon">◎</span>
              <div>
                <strong>{statistics.total}</strong>
                <span>Total laporan</span>
              </div>
            </div>

            <div className="profil-stat-card">
              <span className="profil-stat-icon">◷</span>
              <div>
                <strong>{statistics.process}</strong>
                <span>Diproses</span>
              </div>
            </div>

            <div className="profil-stat-card">
              <span className="profil-stat-icon">✓</span>
              <div>
                <strong>{statistics.completed}</strong>
                <span>Selesai</span>
              </div>
            </div>
          </div>

          <div className="profil-level-card">
            <div className="profil-level-header">
              <div>
                <span className="profil-level-label">LEVEL WARGA</span>
                <h3>
                  Level {level} — {levelName}
                </h3>
              </div>

              <div className="profil-points">
                <strong>{points}</strong>
                <span>poin</span>
              </div>
            </div>

            <div
              className="profil-progress"
              role="progressbar"
              aria-label="Progres level warga"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="profil-progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="profil-level-footer">
              {level >= 5 ? (
                <span>Level maksimum tercapai 🎉</span>
              ) : (
                <span>
                  {Math.max(0, nextLevelPoints - points)} poin lagi menuju level
                  berikutnya
                </span>
              )}

              <span>
                {points} / {nextLevelPoints}
              </span>
            </div>
          </div>

          <div className="profil-badges-section">
            <div className="profil-section-heading">
              <div>
                <h3>Pencapaian</h3>
                <p>Kumpulkan kontribusi dan dapatkan badge warga.</p>
              </div>
            </div>

            <div className="profil-badges">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`profil-badge ${
                    badge.unlocked ? "unlocked" : "locked"
                  }`}
                >
                  <div className="profil-badge-icon">{badge.icon}</div>

                  <div>
                    <strong>{badge.name}</strong>
                    <span>
                      {badge.unlocked ? badge.description : "Belum terbuka"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="profil-divider"></div>

          <form className="profil-form" onSubmit={handleSave}>
            <div className="profil-section-title">
              <div>
                <h3>Informasi akun</h3>
                <p>Informasi dasar yang digunakan pada akun LaporKita.</p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="profil-edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profil
                </button>
              )}
            </div>

            <div className="profil-field">
              <label htmlFor="username">Nama pengguna</label>

              <div className="profil-input-wrapper">
                <span className="profil-input-icon">◉</span>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={!isEditing || saving}
                  placeholder="Masukkan nama"
                  maxLength={100}
                  minLength={2}
                  required
                />
              </div>
            </div>

            <div className="profil-field">
              <label htmlFor="email">Email</label>

              <div className="profil-input-wrapper">
                <span className="profil-input-icon">@</span>

                <input id="email" type="email" value={email} disabled />
              </div>

              <small>
                Email digunakan sebagai identitas akun dan tidak dapat diubah.
              </small>
            </div>

            {isEditing && (
              <div className="profil-actions">
                <button
                  type="button"
                  className="profil-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="profil-save-button"
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="profil-quick-actions">
          <Link to="/laporan-saya" className="profil-quick-card">
            <span className="profil-quick-icon">◎</span>

            <span>
              <strong>Laporan Saya</strong>
              <small>Lihat dan pantau semua laporanmu</small>
            </span>

            <b>→</b>
          </Link>

          <Link to="/notifikasi" className="profil-quick-card">
            <span className="profil-quick-icon">♢</span>

            <span>
              <strong>Notifikasi</strong>
              <small>Lihat perkembangan laporan terbaru</small>
            </span>

            <b>→</b>
          </Link>
        </section>

        <section className="profil-danger-card">
          <div>
            <h3>Keluar dari akun</h3>
            <p>
              Kamu dapat masuk kembali menggunakan email dan password yang sudah
              terdaftar.
            </p>
          </div>

          <button
            type="button"
            className="profil-logout-button"
            onClick={() => setShowLogoutModal(true)}
          >
            Keluar
          </button>
        </section>
      </div>

      {showLogoutModal && (
        <div
          className="profil-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="profil-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profil-logout-title"
          >
            <div className="profil-modal-icon">↗</div>

            <h3 id="profil-logout-title">Keluar dari akun?</h3>

            <p>
              Kamu harus masuk kembali untuk mengakses fitur akun LaporKita.
            </p>

            <div className="profil-modal-actions">
              <button
                type="button"
                className="profil-modal-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Batal
              </button>

              <button
                type="button"
                className="profil-modal-logout"
                onClick={handleLogout}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Profil;
