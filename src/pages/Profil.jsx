
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/profil.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getStoredImage(userData) {
  if (!userData) return "";

  return (
    userData.profileImage ||
    userData.profile_image ||
    userData.profile_image_url ||
    ""
  );
}

function isCloudinaryUrl(value) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /^\/[^/]+\/image\/upload\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function getImageUrl(image) {
  if (typeof image !== "string") return "";

  const imagePath = image.trim();

  if (!imagePath) return "";

  // URL Cloudinary merupakan format foto profil yang diharapkan.
  if (isCloudinaryUrl(imagePath)) return imagePath;

  // Mendukung preview lokal sebelum unggahan selesai.
  if (imagePath.startsWith("blob:")) return imagePath;

  // Mendukung URL HTTPS lain jika backend memang menggunakannya.
  try {
    const url = new URL(imagePath);

    if (url.protocol === "https:") return imagePath;
  } catch {
    // URL tidak valid.
  }

  return "";
}

function mergeUserData(returnedUser = {}) {
  const image = getStoredImage(returnedUser);

  return {
    ...returnedUser,
    profile_image: image || null,
    profileImage: getImageUrl(image),
  };
}

function Profil() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  useEffect(() => {
    return () => clearPreview();
  }, [clearPreview]);

  const apiRequest = useCallback(
    async (path, options = {}) => {
      const token = localStorage.getItem("token");

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

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

      const data = await response.json().catch(() => ({}));

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

  // Memuat profil dan laporan pengguna.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", {
            replace: true,
            state: { from: "/profil" },
          });
          return;
        }

        const [profileResult, reportsResult] = await Promise.allSettled([
          apiRequest("/api/auth/profile"),
          apiRequest("/api/reports/my-reports"),
        ]);

        if (cancelled) return;

        if (profileResult.status === "rejected") {
          throw profileResult.reason;
        }

        const profileData = profileResult.value;
        const currentUser = profileData.user;

        if (!currentUser) {
          throw new Error("Data profil tidak ditemukan dari server.");
        }

        if (currentUser.role !== "user") {
          navigate(currentUser.role === "admin" ? "/admin" : "/login", {
            replace: true,
          });
          return;
        }

        const savedUser = mergeUserData(currentUser);

        setUser(savedUser);
        setUsername(savedUser.username || "");
        setEmail(savedUser.email || "");
        setProfileImage(savedUser.profileImage || "");

        localStorage.setItem("user", JSON.stringify(savedUser));
        localStorage.setItem("isLoggedIn", "true");

        if (reportsResult.status === "fulfilled") {
          const reportsData = reportsResult.value;

          const reportList = Array.isArray(reportsData.reports)
            ? reportsData.reports
            : Array.isArray(reportsData.data)
              ? reportsData.data
              : [];

          setReports(reportList);
        } else {
          setReports([]);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Gagal memuat profil:", error);
        setErrorMessage(error.message || "Gagal memuat data profil.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [apiRequest, navigate]);

  // Statistik laporan.
  const statistics = useMemo(() => {
    const total = reports.length;

    const process = reports.filter(
      (report) =>
        report.status === "Dalam Proses" ||
        report.status === "Diverifikasi",
    ).length;

    const completed = reports.filter(
      (report) => report.status === "Selesai",
    ).length;

    return { total, process, completed };
  }, [reports]);

  // Poin kontribusi.
  const points = useMemo(
    () =>
      reports.reduce((total, report) => {
        let point = 10;

        if (report.status === "Diverifikasi") point += 10;
        if (report.status === "Dalam Proses") point += 15;
        if (report.status === "Selesai") point += 30;

        return total + point;
      }, 0),
    [reports],
  );

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

  // Badge pencapaian.
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
        icon: "🛡",
        name: "Pengawas Kota",
        description: "Memiliki 10 laporan",
        unlocked: statistics.total >= 10,
      },
    ],
    [statistics],
  );

  // Menyelaraskan state profil dengan data terbaru.
  const updateUserState = useCallback((updatedUser) => {
    const normalizedUser = mergeUserData(updatedUser);

    setUser(normalizedUser);
    setUsername(normalizedUser.username || "");
    setEmail(normalizedUser.email || "");
    setProfileImage(normalizedUser.profileImage || "");

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    window.dispatchEvent(new Event("userUpdated"));
  }, []);

  // Memilih dan mengunggah foto profil.
  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    // Mengizinkan pengguna memilih file yang sama lagi.
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Gunakan format gambar JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage("Ukuran foto maksimal 2 MB.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const previousImage = profileImage;
    const previewUrl = URL.createObjectURL(file);

    clearPreview();
    previewUrlRef.current = previewUrl;

    setSaving(true);
    setErrorMessage("");
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

      const data = await response.json().catch(() => ({}));

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

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Foto gagal diunggah.");
      }

      const savedImagePath =
        data.profileImage ||
        data.profile_image ||
        data.user?.profile_image ||
        data.user?.profileImage ||
        data.user?.profile_image_url;

      if (!isCloudinaryUrl(savedImagePath)) {
        throw new Error(
          "Server belum mengembalikan URL foto Cloudinary yang valid.",
        );
      }

      const updatedUser = {
        ...user,
        ...(data.user || {}),
        profile_image: savedImagePath,
        profileImage: savedImagePath,
      };

      updateUserState(updatedUser);
      setErrorMessage("");
    } catch (error) {
      console.error("Gagal mengunggah foto:", error);
      setProfileImage(previousImage);
      setErrorMessage(error.message || "Gagal mengunggah foto profil.");
    } finally {
      if (previewUrlRef.current === previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrlRef.current = "";
      }

      setSaving(false);
    }
  };

  // Menghapus foto setelah pengguna mengonfirmasi.
  const handleRemoveImage = async () => {
    if (!profileImage || saving) return;

    setSaving(true);
    setErrorMessage("");

    try {
      const data = await apiRequest("/api/auth/profile/photo", {
        method: "DELETE",
      });

      const updatedUser = {
        ...user,
        ...(data.user || {}),
        profile_image: null,
        profileImage: "",
        profile_image_url: null,
      };

      updateUserState(updatedUser);

      setProfileImage("");
      setShowPhotoMenu(false);
      setShowDeletePhotoModal(false);
    } catch (error) {
      console.error("Gagal menghapus foto:", error);
      setErrorMessage(error.message || "Gagal menghapus foto profil.");
    } finally {
      setSaving(false);
    }
  };

  // Menyimpan perubahan nama pengguna.
  const handleSave = async (event) => {
    event.preventDefault();

    const trimmed = username.trim();

    if (trimmed.length < 2 || trimmed.length > 100) {
      setErrorMessage(
        "Nama pengguna harus antara 2 hingga 100 karakter.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const data = await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: trimmed }),
      });

      const returnedUser = data.user || {};
      const image = getStoredImage(returnedUser) || getStoredImage(user);

      const updatedUser = {
        ...user,
        ...returnedUser,
        username: returnedUser.username || trimmed,
        profile_image: image || null,
        profileImage: getImageUrl(image),
      };

      updateUserState(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      setErrorMessage(error.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setProfileImage(getImageUrl(getStoredImage(user)));

    setIsEditing(false);
    setShowPhotoMenu(false);
    setErrorMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/", { replace: true });
  };

  // Tampilan loading.
  if (loading) {
    return (
      <main className="profil-page">
        <div className="profil-container loading-container">
          <div className="profil-spinner"></div>
          <p>Memuat profil kamu...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profil-page">
        <div className="profil-container">
          <div className="profil-error">
            <p>{errorMessage || "Data profil belum bisa ditampilkan."}</p>
            <button type="button" onClick={() => navigate("/login")}>
              Kembali ke Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profil-page">
      <div className="profil-background" aria-hidden="true">
        <div className="profil-grid"></div>
        <div className="profil-orb profil-orb-one"></div>
        <div className="profil-orb profil-orb-two"></div>
      </div>

      <div className="profil-container">
        <Link to="/" className="profil-back">
          <span>←</span> Kembali ke Beranda
        </Link>

        <div className="profil-heading">
          <span className="profil-label">PUSAT AKUN DIGITAL</span>
          <h1>Profil Saya</h1>
          <p>
            Kelola identitas, pantau statistik laporan, dan raih badge
            pencapaianmu.
          </p>
        </div>

        {errorMessage && (
          <div className="profil-error" role="alert">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              aria-label="Tutup pesan"
            >
              ×
            </button>
          </div>
        )}

        <section className="profil-card glass-glow-border">
          <div className="profil-card-top">
            <div className="profil-avatar-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Foto profil"
                  className="profil-avatar-image"
                  onError={() => {
                    // Jika URL gambar gagal dimuat, tampilkan avatar inisial.
                    setProfileImage("");
                  }}
                />
              ) : (
                <div className="profil-avatar">
                  {(username || "P").charAt(0).toUpperCase()}
                </div>
              )}

              <input
                ref={fileInputRef}
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
                    onClick={() => setShowPhotoMenu((previous) => !previous)}
                    aria-label="Atur foto profil"
                    aria-expanded={showPhotoMenu}
                    disabled={saving}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                    <div className="profil-photo-menu glass-glow-border">
                      <button
                        type="button"
                        className="profil-photo-menu-item"
                        onClick={() => {
                          setShowPhotoMenu(false);
                          fileInputRef.current?.click();
                        }}
                        disabled={saving}
                      >
                        <span>📁</span>
                        <span>
                          {profileImage ? "Ganti Foto" : "Unggah Foto"}
                        </span>
                      </button>

                      {profileImage && (
                        <>
                          <div className="profil-photo-menu-divider"></div>

                          <button
                            type="button"
                            className="profil-photo-menu-item profil-photo-delete"
                            onClick={() => {
                              setShowPhotoMenu(false);
                              setShowDeletePhotoModal(true);
                            }}
                            disabled={saving}
                          >
                            <span>🗑️</span>
                            <span>Hapus Foto</span>
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
                Akun Terverifikasi Aktif
              </span>
            </div>
          </div>

          <div className="profil-divider"></div>

          <div className="profil-stats">
            <div className="profil-stat-card glass-glow-border">
              <span className="profil-stat-icon">📊</span>
              <div>
                <strong>{statistics.total}</strong>
                <span>Total Laporan</span>
              </div>
            </div>

            <div className="profil-stat-card glass-glow-border">
              <span className="profil-stat-icon">⚡</span>
              <div>
                <strong>{statistics.process}</strong>
                <span>Dalam Proses</span>
              </div>
            </div>

            <div className="profil-stat-card glass-glow-border">
              <span className="profil-stat-icon">✨</span>
              <div>
                <strong>{statistics.completed}</strong>
                <span>Selesai Ditangani</span>
              </div>
            </div>
          </div>

          <div className="profil-level-card glass-glow-border">
            <div className="profil-level-header">
              <div>
                <span className="profil-level-label">
                  LEVEL KONTRIBUSI WARGA
                </span>
                <h3>
                  Level {level} — {levelName}
                </h3>
              </div>

              <div className="profil-points">
                <strong>{points}</strong>
                <span>Poin</span>
              </div>
            </div>

            <div
              className="profil-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Kemajuan level kontribusi"
            >
              <div
                className="profil-progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="profil-level-footer">
              <span>
                {level >= 5
                  ? "Level Maksimum Tercapai 🎉"
                  : `${Math.max(0, nextLevelPoints - points)} poin lagi ke level berikutnya`}
              </span>
              <span>
                {points} / {nextLevelPoints} Poin
              </span>
            </div>
          </div>

          <div className="profil-badges-section">
            <div className="profil-section-heading">
              <h3>Badge Pencapaian Warga</h3>
              <p>Kumpulkan poin dan buka lencana kontribusi publik.</p>
            </div>

            <div className="profil-badges">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`profil-badge glass-glow-border ${
                    badge.unlocked ? "unlocked" : "locked"
                  }`}
                >
                  <div className="profil-badge-icon">{badge.icon}</div>
                  <div>
                    <strong>{badge.name}</strong>
                    <span>
                      {badge.unlocked
                        ? badge.description
                        : "Belum terbuka"}
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
                <h3>Informasi Akun Utama</h3>
                <p>Ubah nama panggilan publik atau tinjau email kamu.</p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="profil-edit-button"
                  onClick={() => {
                    setIsEditing(true);
                    setErrorMessage("");
                  }}
                >
                  Edit Profil
                </button>
              )}
            </div>

            <div className="profil-field">
              <label htmlFor="username">Nama Pengguna</label>

              <div className="profil-input-wrapper">
                <span className="profil-input-icon">👤</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={!isEditing || saving}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="profil-field">
              <label htmlFor="email">Email Terdaftar</label>

              <div className="profil-input-wrapper">
                <span className="profil-input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
              </div>

              <small>
                Email terikat secara permanen pada sistem keamanan akun.
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
          <Link
            to="/laporan-saya"
            className="profil-quick-card glass-glow-border"
          >
            <span className="profil-quick-icon">📋</span>
            <span>
              <strong>Laporan Saya</strong>
              <small>Pantau status laporan yang pernah kamu buat</small>
            </span>
            <b>→</b>
          </Link>

          <Link
            to="/notifikasi"
            className="profil-quick-card glass-glow-border"
          >
            <span className="profil-quick-icon">🔔</span>
            <span>
              <strong>Pusat Notifikasi</strong>
              <small>Cek pembaruan aduan secara real-time</small>
            </span>
            <b>→</b>
          </Link>
        </section>

        <section className="profil-danger-card glass-glow-border">
          <div>
            <h3>Sesi Akun Aktif</h3>
            <p>
              Keluar dari perangkat ini jika kamu menggunakan komputer umum.
            </p>
          </div>

          <button
            type="button"
            className="profil-logout-button"
            onClick={() => setShowLogoutModal(true)}
          >
            Keluar Akun
          </button>
        </section>
      </div>

      {/* Modal konfirmasi hapus foto */}
      {showDeletePhotoModal && (
        <div
          className="profil-modal-overlay"
          onClick={() => {
            if (!saving) setShowDeletePhotoModal(false);
          }}
        >
          <div
            className="profil-modal glass-glow-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-photo-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profil-modal-icon">🗑️</div>

            <h3 id="delete-photo-title">Hapus Foto Profil?</h3>

            <p>
              Foto profil kamu akan dihapus dan diganti dengan avatar inisial.
              Kamu bisa mengunggah foto baru kapan saja.
            </p>

            <div className="profil-modal-actions">
              <button
                type="button"
                className="profil-modal-cancel"
                onClick={() => setShowDeletePhotoModal(false)}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="button"
                className="profil-modal-logout"
                onClick={handleRemoveImage}
                disabled={saving}
              >
                {saving ? "Menghapus..." : "Ya, Hapus Foto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfirmasi logout */}
      {showLogoutModal && (
        <div
          className="profil-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="profil-modal glass-glow-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profil-modal-icon">⚠️</div>

            <h3 id="logout-title">Keluar dari Akun?</h3>

            <p>
              Kamu harus masuk kembali menggunakan akun LaporKita untuk
              mengakses fitur interaktif.
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
