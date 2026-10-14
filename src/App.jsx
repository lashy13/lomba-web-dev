import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================================
            HALAMAN PUBLIK
        ======================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/lupa-password"
          element={<LupaPassword />}
        />

        <Route
          path="/laporan"
          element={<Laporan />}
        />

        <Route
          path="/laporan/:id"
          element={<DetailLaporan />}
        />

        {/* ========================================
            HALAMAN PENGGUNA
        ======================================== */}

        <Route
          element={<ProtectedRoute />}
        >
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

        {/* ========================================
            HALAMAN ADMIN
        ======================================== */}

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route
          element={<AdminRoute />}
        >
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        {/* ========================================
            HALAMAN TIDAK DITEMUKAN
        ======================================== */}

        <Route
          path="*"
          element={
            <div style={{ textAlign: "center", padding: "100px 20px" }}>
              <h1>404</h1>
              <h2>Halaman Tidak Ditemukan</h2>
              <p>Halaman yang kamu cari tidak tersedia.</p>
              <a href="/">Kembali ke Beranda</a>
            </div>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;