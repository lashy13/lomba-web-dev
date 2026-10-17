import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// ========================================
// HALAMAN PUBLIK
// ========================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LupaPassword from "./pages/LupaPassword";
import Laporan from "./pages/Laporan";
import DetailLaporan from "./pages/DetailLaporan";

// ========================================
// HALAMAN PENGGUNA
// ========================================

import Profil from "./pages/Profil";
import BuatLaporan from "./pages/BuatLaporan";
import LaporanSaya from "./pages/LaporanSaya";
import Notifikasi from "./pages/Notifikasi";

// ========================================
// HALAMAN ADMIN
// ========================================

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// ========================================
// ROUTE PROTECTION
// ========================================

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// ========================================
// CSS HALAMAN 404
// ========================================

import "./styles/not-found.css";

// ========================================
// HALAMAN 404
// ========================================

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>

        <h1>Halaman Tidak Ditemukan</h1>

        <p>
          Maaf, halaman yang kamu cari tidak tersedia
          atau mungkin sudah dipindahkan.
        </p>

        <Link to="/" className="not-found-button">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}

// ========================================
// APP
// ========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================
            HALAMAN PUBLIK
        ================================= */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/lupa-password"
          element={<LupaPassword />}
        />

        {/* ================================
            DAFTAR LAPORAN
        ================================= */}

        <Route
          path="/laporan"
          element={<Laporan />}
        />

        {/* ================================
            DETAIL LAPORAN
        ================================= */}

        <Route
          path="/detail-laporan/:id"
          element={<DetailLaporan />}
        />

        {/* Alias untuk URL detail laporan lama */}

        <Route
          path="/laporan/:id"
          element={<DetailLaporan />}
        />

        {/* ================================
            HALAMAN PENGGUNA
            MEMERLUKAN LOGIN
        ================================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            path="/profil"
            element={<Profil />}
          />

          <Route
            path="/buat-laporan"
            element={<BuatLaporan />}
          />

          <Route
            path="/laporan-saya"
            element={<LaporanSaya />}
          />

          <Route
            path="/notifikasi"
            element={<Notifikasi />}
          />
        </Route>

        {/* ================================
            LOGIN ADMIN
        ================================= */}

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        {/* ================================
            DASHBOARD ADMIN
            MEMERLUKAN AKSES ADMIN
        ================================= */}

        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        {/* ================================
            HALAMAN 404
        ================================= */}

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;