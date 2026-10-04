import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/home.css";
import "../styles/home-sections.css";
import "../styles/about.css";
function getStoredUser() {
  const rawUser = localStorage.getItem("user");

  try {
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const updateAuth = () => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      );

      setUser(getStoredUser());
    };

    window.addEventListener("userUpdated", updateAuth);
    window.addEventListener("storage", updateAuth);

    return () => {
      window.removeEventListener("userUpdated", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  const username =
    user?.username ||
    user?.name ||
    "Pengguna";

  const reportPath = isLoggedIn
    ? "/buat-laporan"
    : "/login";

  return (
    <main className="home">

      <Navbar />

      {/* ========================================
          BACKGROUND
      ======================================== */}

      <div className="home-background">

        <div className="background-orb background-orb-one"></div>

        <div className="background-orb background-orb-two"></div>

        <div className="background-grid"></div>

      </div>


      {/* ========================================
          HERO
      ======================================== */}

      <section className="hero">

        <div className="hero-container">

          {/* LEFT */}

          <div className="hero-content">

            {isLoggedIn && (
              <div className="hero-user-greeting">

                <span className="hero-user-dot"></span>

                <span>
                  Halo, <strong>{username}</strong>
                </span>

              </div>
            )}


            <div className="hero-badge">

              <span className="badge-icon">
                ✦
              </span>

              <span>
                PLATFORM PELAPORAN PUBLIK
              </span>

            </div>


            <h1>

              Lihat masalahnya.
              <br />

              <span>
                Laporkan.
              </span>

              <br />

              Bersama, kita peduli.

            </h1>


            <p className="hero-description">

              Setiap lingkungan memiliki masalah yang perlu
              diperhatikan. Mulai dari jalan yang rusak,
              fasilitas umum yang tidak layak, lampu jalan
              yang mati, hingga berbagai permasalahan lain
              yang ada di sekitar kita.

            </p>


            <p className="hero-description second">

              <strong>Laporkita</strong> hadir sebagai wadah
              bagi masyarakat untuk menyampaikan permasalahan
              tersebut dengan cara yang lebih mudah, terarah,
              dan dapat dipantau.

            </p>


            <div className="hero-actions">

              <Link
                to={reportPath}
                className="hero-primary"
              >

                <span>
                  Buat Laporan
                </span>

                <span className="button-arrow">
                  →
                </span>

              </Link>


              <a
                href="#tentang-laporkita"
                className="hero-secondary"
              >
                Kenali Laporkita
              </a>

            </div>


            <div className="hero-bottom-info">

              <div className="info-item">

                <div className="info-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Mudah
                  </strong>

                  <span>
                    untuk digunakan
                  </span>

                </div>

              </div>


              <div className="info-divider"></div>


              <div className="info-item">

                <div className="info-icon">
                  ↗
                </div>

                <div>

                  <strong>
                    Terarah
                  </strong>

                  <span>
                    dalam menyampaikan
                  </span>

                </div>

              </div>


              <div className="info-divider"></div>


              <div className="info-item">

                <div className="info-icon">
                  ◉
                </div>

                <div>

                  <strong>
                    Terpantau
                  </strong>

                  <span>
                    perkembangannya
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* RIGHT */}

          <div className="hero-visual">

            <div className="visual-glow"></div>

            <div className="visual-circle circle-one"></div>

            <div className="visual-circle circle-two"></div>

            <div className="visual-circle circle-three"></div>


            <div className="civic-illustration">

              {/* CITY */}

              <div className="city">

                <div className="building building-a">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="building building-b">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="building building-c">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>


              {/* GROUND */}

              <div className="ground">

                <div className="road-line road-line-a"></div>

                <div className="road-line road-line-b"></div>


                <div className="tree tree-one">

                  <div className="tree-top"></div>

                  <div className="tree-trunk"></div>

                </div>


                <div className="tree tree-two">

                  <div className="tree-top"></div>

                  <div className="tree-trunk"></div>

                </div>

              </div>


              {/* DEVICE */}

              <div className="device">

                <div className="device-glow"></div>

                <div className="device-frame">

                  <div className="device-top">

                    <span></span>
                    <span></span>
                    <span></span>

                  </div>


                  <div className="device-screen">

                    <div className="screen-header">

                      <div className="screen-logo">
                        L
                      </div>

                      <div className="screen-title">
                        Laporkita
                      </div>

                    </div>


                    <div className="screen-content">

                      <div className="screen-line line-long"></div>

                      <div className="screen-line line-medium"></div>


                      <div className="screen-card">

                        <div className="screen-card-icon">
                          +
                        </div>

                        <div>

                          <span>
                            Laporkan
                          </span>

                          <small>
                            Masalah di sekitarmu
                          </small>

                        </div>

                      </div>


                      <div className="screen-card small">

                        <div className="screen-card-icon">
                          ✓
                        </div>

                        <div>

                          <span>
                            Pantau
                          </span>

                          <small>
                            Perkembangan laporan
                          </small>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* FLOATING CARD */}

              <div className="visual-card visual-card-top">

                <div className="visual-card-icon">
                  !
                </div>

                <div>

                  <strong>
                    Temukan masalah
                  </strong>

                  <span>
                    di lingkunganmu
                  </span>

                </div>

              </div>


              <div className="visual-card visual-card-bottom">

                <div className="visual-card-icon blue">
                  ✓
                </div>

                <div>

                  <strong>
                    Sampaikan laporan
                  </strong>

                  <span>
                    untuk perubahan
                  </span>

                </div>

              </div>


              {/* CONNECTION */}

              <div className="connection connection-one"></div>

              <div className="connection connection-two"></div>

              <div className="connection connection-three"></div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          STATISTIK
      ======================================== */}

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
              Setiap laporan yang disampaikan menjadi bagian
              dari upaya bersama untuk membuat lingkungan
              menjadi lebih baik.
            </p>

          </div>


          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon">
                ◉
              </div>

              <div className="stat-value">
                1.2K+
              </div>

              <div className="stat-title">
                Laporan Masuk
              </div>

              <div className="stat-description">
                Laporan yang telah disampaikan masyarakat
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ↗
              </div>

              <div className="stat-value">
                780+
              </div>

              <div className="stat-title">
                Ditindaklanjuti
              </div>

              <div className="stat-description">
                Laporan yang sedang dalam proses penanganan
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>

              <div className="stat-value">
                560+
              </div>

              <div className="stat-title">
                Selesai
              </div>

              <div className="stat-description">
                Laporan yang telah mendapatkan penyelesaian
              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                ★
              </div>

              <div className="stat-value">
                98%
              </div>

              <div className="stat-title">
                Kepuasan
              </div>

              <div className="stat-description">
                Pengalaman pengguna dalam menggunakan layanan
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          CARA KERJA
      ======================================== */}

      <section className="how-section">

        <div className="how-container">

          <div className="how-header">

            <span className="section-label">
              CARA KERJA
            </span>

            <h2>
              Melaporkan masalah
              <span> jadi lebih mudah.</span>
            </h2>

            <p>
              Tidak perlu bingung harus mulai dari mana.
              Laporkita membantu menghubungkan laporan
              masyarakat dengan proses yang lebih terarah.
            </p>

          </div>


          <div className="how-grid">

            <div className="how-card">

              <div className="how-number">
                01
              </div>

              <div className="how-icon">
                +
              </div>

              <h3>
                Temukan Masalah
              </h3>

              <p>
                Temukan permasalahan publik di sekitar
                yang membutuhkan perhatian.
              </p>

            </div>


            <div className="how-connector">
              →
            </div>


            <div className="how-card">

              <div className="how-number">
                02
              </div>

              <div className="how-icon">
                ↑
              </div>

              <h3>
                Buat Laporan
              </h3>

              <p>
                Sampaikan laporan dengan informasi,
                lokasi, deskripsi, dan bukti pendukung.
              </p>

            </div>


            <div className="how-connector">
              →
            </div>


            <div className="how-card">

              <div className="how-number">
                03
              </div>

              <div className="how-icon">
                ◉
              </div>

              <h3>
                Pantau Proses
              </h3>

              <p>
                Pantau perkembangan laporan mulai dari
                diterima hingga selesai ditangani.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================
          KATEGORI
      ======================================== */}

      <section className="category-section">

        <div className="category-container">

          <div className="category-header">

            <div>

              <span className="section-label">
                KATEGORI LAPORAN
              </span>

              <h2>
                Laporkan berbagai
                <span> masalah publik.</span>
              </h2>

            </div>

            <p>
              Pilih kategori yang sesuai agar laporan
              lebih mudah dipahami dan ditindaklanjuti.
            </p>

          </div>


          <div className="category-grid">

            <Link
              to="/laporan?category=infrastruktur"
              className="category-card"
            >

              <div className="category-icon">
                ⌂
              </div>

              <div className="category-content">

                <h3>
                  Infrastruktur
                </h3>

                <p>
                  Jalan rusak, jembatan, trotoar,
                  drainase, dan fasilitas lainnya.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>


            <Link
              to="/laporan?category=fasilitas"
              className="category-card"
            >

              <div className="category-icon">
                ▣
              </div>

              <div className="category-content">

                <h3>
                  Fasilitas Umum
                </h3>

                <p>
                  Taman, halte, tempat umum,
                  dan fasilitas masyarakat.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>


            <Link
              to="/laporan?category=lingkungan"
              className="category-card"
            >

              <div className="category-icon">
                ♧
              </div>

              <div className="category-content">

                <h3>
                  Lingkungan
                </h3>

                <p>
                  Sampah, kebersihan, banjir,
                  dan permasalahan lingkungan.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>


            <Link
              to="/laporan?category=penerangan"
              className="category-card"
            >

              <div className="category-icon">
                ✦
              </div>

              <div className="category-content">

                <h3>
                  Penerangan
                </h3>

                <p>
                  Lampu jalan mati dan berbagai
                  permasalahan penerangan publik.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>


            <Link
              to="/laporan?category=keamanan"
              className="category-card"
            >

              <div className="category-icon">
                ◈
              </div>

              <div className="category-content">

                <h3>
                  Keamanan
                </h3>

                <p>
                  Kondisi fasilitas atau lingkungan
                  yang membutuhkan perhatian keamanan.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>


            <Link
              to="/laporan?category=lainnya"
              className="category-card"
            >

              <div className="category-icon">
                ⋯
              </div>

              <div className="category-content">

                <h3>
                  Lainnya
                </h3>

                <p>
                  Berbagai permasalahan publik lainnya
                  yang perlu disampaikan.
                </p>

              </div>

              <span className="category-arrow">
                →
              </span>

            </Link>

          </div>


          <div className="category-footer">

            <Link
              to="/laporan"
              className="category-all-button"
            >
              Lihat Semua Laporan
              <span>
                →
              </span>
            </Link>

          </div>

        </div>

      </section>


      {/* ========================================
          LAPORAN TERBARU
      ======================================== */}

      <section className="latest-section">

        <div className="latest-container">

          <div className="latest-header">

            <div>

              <span className="section-label">
                LAPORAN TERBARU
              </span>

              <h2>
                Lihat laporan
                <span> di sekitar kita.</span>
              </h2>

            </div>

            <Link
              to="/laporan"
              className="latest-see-all"
            >
              Lihat semua
              <span>
                →
              </span>
            </Link>

          </div>


          <div className="latest-grid">

            <Link
              to="/laporan/1"
              className="latest-card"
            >

              <div className="latest-card-image">

                <div className="latest-placeholder">
                  Infrastruktur
                </div>

                <span className="latest-status process">
                  Diproses
                </span>

              </div>

              <div className="latest-card-content">

                <div className="latest-category">
                  INFRASTRUKTUR
                </div>

                <h3>
                  Jalan berlubang di sekitar jalan utama
                </h3>

                <p>
                  Terdapat beberapa bagian jalan yang
                  mengalami kerusakan dan mengganggu
                  pengguna jalan.
                </p>

                <div className="latest-meta">

                  <span>
                    ◉ Kecamatan Kota
                  </span>

                  <span>
                    2 jam lalu
                  </span>

                </div>

              </div>

            </Link>


            <Link
              to="/laporan/2"
              className="latest-card"
            >

              <div className="latest-card-image">

                <div className="latest-placeholder">
                  Penerangan
                </div>

                <span className="latest-status review">
                  Ditinjau
                </span>

              </div>

              <div className="latest-card-content">

                <div className="latest-category">
                  PENERANGAN
                </div>

                <h3>
                  Lampu penerangan jalan tidak menyala
                </h3>

                <p>
                  Lampu jalan di area pemukiman tidak
                  menyala pada malam hari.
                </p>

                <div className="latest-meta">

                  <span>
                    ◉ Kelurahan Maju
                  </span>

                  <span>
                    5 jam lalu
                  </span>

                </div>

              </div>

            </Link>


            <Link
              to="/laporan/3"
              className="latest-card"
            >

              <div className="latest-card-image">

                <div className="latest-placeholder">
                  Lingkungan
                </div>

                <span className="latest-status done">
                  Selesai
                </span>

              </div>

              <div className="latest-card-content">

                <div className="latest-category">
                  LINGKUNGAN
                </div>

                <h3>
                  Penumpukan sampah di area fasilitas umum
                </h3>

                <p>
                  Tumpukan sampah ditemukan di sekitar
                  fasilitas umum dan membutuhkan penanganan.
                </p>

                <div className="latest-meta">

                  <span>
                    ◉ Kecamatan Selatan
                  </span>

                  <span>
                    1 hari lalu
                  </span>

                </div>

              </div>

            </Link>

          </div>

        </div>

      </section>


      {/* ========================================
          TENTANG LAPORKITA
      ======================================== */}

      <section
        id="tentang-laporkita"
        className="about-laporkita"
      >

        <div className="about-container">

          <div className="about-header">

            <span className="about-label">
              TENTANG LAPORKITA
            </span>

            <h2>
              Satu laporan,
              <br />

              <span>
                satu langkah menuju perubahan.
              </span>
            </h2>

            <p>
              Laporkita hadir untuk menghubungkan masyarakat
              dengan proses pelayanan publik yang lebih terbuka,
              terarah, dan mudah dipantau.
            </p>

          </div>


          <div className="about-grid">

            <article className="about-card">

              <div className="about-card-number">
                01
              </div>

              <div className="about-card-content">

                <span className="about-card-label">
                  MASALAH
                </span>

                <h3>
                  Masalah di sekitar sering tidak terdengar.
                </h3>

                <p>
                  Kerusakan jalan, fasilitas umum,
                  lingkungan, dan berbagai persoalan publik
                  membutuhkan tempat pelaporan yang mudah
                  diakses masyarakat.
                </p>

              </div>

            </article>


            <article className="about-card about-card-highlight">

              <div className="about-card-number">
                02
              </div>

              <div className="about-card-content">

                <span className="about-card-label">
                  SOLUSI
                </span>

                <h3>
                  Laporkita membuat pelaporan lebih sederhana.
                </h3>

                <p>
                  Masyarakat dapat menyampaikan laporan
                  secara digital lengkap dengan informasi,
                  lokasi, dan bukti pendukung.
                </p>

              </div>

            </article>


            <article className="about-card">

              <div className="about-card-number">
                03
              </div>

              <div className="about-card-content">

                <span className="about-card-label">
                  DAMPAK
                </span>

                <h3>
                  Laporan tidak berhenti setelah dikirim.
                </h3>

                <p>
                  Setiap laporan dapat dipantau
                  perkembangannya sehingga masyarakat
                  mengetahui proses penanganan laporan.
                </p>

              </div>

            </article>

          </div>


          <div className="about-bottom">

            <div className="about-bottom-icon">
              LK
            </div>

            <div className="about-bottom-text">

              <strong>
                Dari masyarakat, untuk perubahan yang nyata.
              </strong>

              <span>
                Bersama membangun pelayanan publik yang
                lebih responsif dan transparan.
              </span>

            </div>

            <Link
              to={reportPath}
              className="about-button"
            >

              <span>
                Buat Laporan
              </span>

              <span className="about-button-arrow">
                →
              </span>

            </Link>

          </div>

        </div>

      </section>


      {/* ========================================
          FINAL CTA
      ======================================== */}

      <section className="final-cta">

        <div className="final-cta-glow"></div>

        <div className="final-cta-content">

          <span className="section-label">
            SUARAKAN PERUBAHAN
          </span>

          <h2>
            Ada masalah di sekitarmu?
            <br />
            <span>
              Jangan hanya diam.
            </span>
          </h2>

          <p>
            Sampaikan laporanmu melalui Laporkita dan
            ikut menjadi bagian dari perubahan pelayanan
            publik yang lebih baik.
          </p>

          <Link
            to={reportPath}
            className="final-cta-button"
          >

            <span>
              Buat Laporan Sekarang
            </span>

            <span>
              →
            </span>

          </Link>

        </div>

      </section>


      {/* ========================================
          FOOTER
      ======================================== */}

      <footer className="home-footer">

        <div className="footer-container">

          <div className="footer-brand">

            <div className="footer-logo">
              L
            </div>

            <div>

              <strong>
                Laporkita
              </strong>

              <span>
                Pelayanan Publik Digital
              </span>

            </div>

          </div>


          <div className="footer-links">

            <Link to="/">
              Beranda
            </Link>

            <Link to="/laporan">
              Laporan
            </Link>

            <Link to={reportPath}>
              Buat Laporan
            </Link>

            {!isLoggedIn && (
              <Link to="/login">
                Masuk
              </Link>
            )}

          </div>


          <div className="footer-copy">

            © {new Date().getFullYear()} Laporkita

          </div>

        </div>

      </footer>

    </main>
  );
}

export default Home;