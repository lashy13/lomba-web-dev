import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profil from "./pages/Profil";
import BuatLaporan from "./pages/BuatLaporan";
import Laporan from "./pages/Laporan";
import DetailLaporan from "./pages/DetailLaporan";
import LaporanSaya from "./pages/LaporanSaya";
import Notifikasi from "./pages/Notifikasi";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================================
            HOME
        ======================================== */}

        <Route
          path="/"
          element={<Home />}
        />


        {/* ========================================
            AUTH USER
        ======================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ========================================
            PROFIL
        ======================================== */}

        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          }
        />


        {/* ========================================
            LAPORAN SAYA
        ======================================== */}

        <Route
          path="/laporan-saya"
          element={
            <ProtectedRoute>
              <LaporanSaya />
            </ProtectedRoute>
          }
        />


        {/* ========================================
            NOTIFIKASI
        ======================================== */}

        <Route
          path="/notifikasi"
          element={
            <ProtectedRoute>
              <Notifikasi />
            </ProtectedRoute>
          }
        />


        {/* ========================================
            BUAT LAPORAN
        ======================================== */}

        <Route
          path="/buat-laporan"
          element={
            <ProtectedRoute>
              <BuatLaporan />
            </ProtectedRoute>
          }
        />


        {/* ========================================
            SEMUA LAPORAN
        ======================================== */}

        <Route
          path="/laporan"
          element={<Laporan />}
        />


        {/* ========================================
            DETAIL LAPORAN
        ======================================== */}

        <Route
          path="/laporan/:id"
          element={<DetailLaporan />}
        />


        {/* ========================================
            ADMIN LOGIN
        ======================================== */}

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />


        {/* ========================================
            ADMIN DASHBOARD
        ======================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;