import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/profil.css";

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

  // ========================================
  // LOAD USER
  // ========================================

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "null");

        if (!savedUser) {
          navigate("/login");
          return;
        }

        setUser(savedUser);
        setUsername(savedUser.username || "");
        setEmail(savedUser.email || "");
        setProfileImage(savedUser.profileImage || "");
      } catch {
        navigate("/login");
      }
    };

    loadUser();
  }, [navigate]);

  // ========================================
  // GANTI FOTO
  // ========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Silakan pilih file gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfileImage(reader.result);
      setShowPhotoMenu(false);
    };

    reader.readAsDataURL(file);
  };

  // ========================================
  // BUKA FILE PICKER
  // ========================================

  const handleChangePhoto = () => {
    setShowPhotoMenu(false);

    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  // ========================================
  // HAPUS FOTO
  // ========================================

  const handleRemoveImage = () => {
    setProfileImage("");
    setShowPhotoMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // SIMPAN PROFIL
  // ========================================

  const handleSave = (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      alert("Nama tidak boleh kosong.");
      return;
    }

    if (!user?.email) {
      alert("Data akun tidak ditemukan.");
      return;
    }

    const updatedUser = {
      ...user,
      username: trimmedUsername,
      email: user.email,
      profileImage: profileImage || "",
    };

    // ========================================
    // UPDATE USER AKTIF
    // ========================================

    localStorage.setItem("user", JSON.stringify(updatedUser));

    // ========================================
    // UPDATE USERS
    // ========================================

    let users;

    try {
      const savedUsers = JSON.parse(localStorage.getItem("users") || "[]");

      users = Array.isArray(savedUsers) ? savedUsers : [];
    } catch {
      users = [];
    }

    const updatedUsers = users.map((account) => {
      if (account.email?.toLowerCase() === user.email?.toLowerCase()) {
        return {
          ...account,
          username: trimmedUsername,
          profileImage: profileImage || "",
        };
      }

      return account;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // ========================================
    // UPDATE STATE
    // ========================================

    setUser(updatedUser);
    setUsername(trimmedUsername);
    setIsEditing(false);
    setShowPhotoMenu(false);

    window.dispatchEvent(new Event("userUpdated"));

    alert("Profil berhasil diperbarui.");
  };

  // ========================================
  // BATAL
  // ========================================

  const handleCancel = () => {
    setUsername(user?.username || "");
    setProfileImage(user?.profileImage || "");

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
    localStorage.removeItem("isLoggedIn");

    window.dispatchEvent(new Event("userUpdated"));

    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <main className="profil-page">
      {/* ========================================
          BACKGROUND
      ======================================== */}

      <div className="profil-background">
        <div className="profil-grid"></div>

        <div className="profil-orb profil-orb-one"></div>

        <div className="profil-orb profil-orb-two"></div>
      </div>

      {/* ========================================
          CONTAINER
      ======================================== */}

      <div className="profil-container">
        {/* BACK */}

        <Link to="/" className="profil-back">
          ← Kembali ke Beranda
        </Link>

        {/* ========================================
            HEADING
        ======================================== */}

        <div className="profil-heading">
          <span className="profil-label">AKUN LAPORKITA</span>

          <h1>Profil Saya</h1>

          <p>Kelola informasi akun dan data profil kamu di Laporkita.</p>
        </div>

        {/* ========================================
            PROFILE CARD
        ======================================== */}

        <section className="profil-card">
          {/* PROFILE TOP */}

          <div className="profil-card-top">
            {/* ==================================
                AVATAR
            ================================== */}

            <div className="profil-avatar-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Foto profil"
                  className="profil-avatar-image"
                />
              ) : (
                <div className="profil-avatar">
                  {(username || "P").charAt(0).toUpperCase()}
                </div>
              )}

              {/* ==================================
                  HIDDEN FILE INPUT
              ================================== */}

              <input
                ref={fileInputRef}
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="profil-hidden-file"
              />

              {/* ==================================
                  CAMERA BUTTON
              ================================== */}

              {isEditing && (
                <div className="profil-photo-control">
                  <button
                    type="button"
                    className="profil-camera"
                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    aria-label="Kelola foto profil"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
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

                  {/* ==================================
                      PHOTO MENU
                  ================================== */}

                  {showPhotoMenu && (
                    <div className="profil-photo-menu">
                      <button
                        type="button"
                        className="profil-photo-menu-item"
                        onClick={handleChangePhoto}
                      >
                        <span className="profil-photo-menu-icon">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
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
                        </span>

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
                            <span className="profil-photo-menu-icon">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 7H19"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M9 7V5.5C9 5.22 9.22 5 9.5 5H14.5C14.78 5 15 5.22 15 5.5V7"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M7 7L7.8 18C7.86 18.84 8.56 19.5 9.4 19.5H14.6C15.44 19.5 16.14 18.84 16.2 18L17 7"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>

                            <span>Hapus foto</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ====================================
                USER INFO
            ==================================== */}

            <div className="profil-user-info">
              <h2>{username || "Pengguna"}</h2>

              <p>{email}</p>

              <span className="profil-status">
                <span className="profil-status-dot"></span>
                Akun aktif
              </span>
            </div>
          </div>

          {/* DIVIDER */}

          <div className="profil-divider"></div>

          {/* ========================================
              FORM
          ======================================== */}

          <form className="profil-form" onSubmit={handleSave}>
            <div className="profil-section-title">
              <div>
                <h3>Informasi akun</h3>

                <p>Informasi dasar yang digunakan pada akun Laporkita.</p>
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

            {/* ====================================
                NAMA
            ==================================== */}

            <div className="profil-field">
              <label htmlFor="username">Nama pengguna</label>

              <div className="profil-input-wrapper">
                <span className="profil-input-icon">◉</span>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Masukkan nama"
                />
              </div>
            </div>

            {/* ====================================
                EMAIL
            ==================================== */}

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

            {/* ====================================
                ACTION
            ==================================== */}

            {isEditing && (
              <div className="profil-actions">
                <button
                  type="button"
                  className="profil-cancel-button"
                  onClick={handleCancel}
                >
                  Batal
                </button>

                <button type="submit" className="profil-save-button">
                  Simpan Perubahan
                </button>
              </div>
            )}
          </form>
        </section>

        {/* ========================================
            LOGOUT
        ======================================== */}

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

      {/* ========================================
          LOGOUT MODAL
      ======================================== */}

      {showLogoutModal && (
        <div
          className="profil-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="profil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profil-modal-icon">↗</div>

            <h3>Keluar dari akun?</h3>

            <p>
              Kamu harus masuk kembali untuk mengakses fitur akun Laporkita.
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
