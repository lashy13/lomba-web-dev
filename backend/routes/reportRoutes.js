
/* global require, module */

const express = require("express");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

const {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  getPrivateReportById,
  getReportTimeline,
  updateReportStatus,
  getReportStats,
  getAdminReports,
} = require("../controllers/reportController");

const router = express.Router();

// ========================================
// GET SEMUA LAPORAN PUBLIK
// ========================================
router.get("/", getReports);

// ========================================
// GET LAPORAN MILIK PENGGUNA
// ========================================
router.get("/my-reports", verifyToken, getMyReports);

// ========================================
// ADMIN: GET STATISTIK LAPORAN
// ========================================
router.get(
  "/admin/stats",
  verifyToken,
  verifyAdmin,
  getReportStats
);

// ========================================
// ADMIN: GET SEMUA LAPORAN
// ========================================
router.get(
  "/admin/reports",
  verifyToken,
  verifyAdmin,
  getAdminReports
);

// ========================================
// ADMIN: UPDATE STATUS LAPORAN
// ========================================
router.patch(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  updateReportStatus
);

// ========================================
// GET RIWAYAT STATUS LAPORAN
// ========================================
router.get("/:id/timeline", getReportTimeline);

// ========================================
// GET DETAIL PRIVAT LAPORAN
// Hanya pemilik laporan atau admin
// ========================================
router.get(
  "/:id/private",
  verifyToken,
  getPrivateReportById
);

// ========================================
// GET DETAIL PUBLIK LAPORAN
// ========================================
router.get("/:id", getReportById);

// ========================================
// CREATE REPORT
// ========================================
router.post("/", verifyToken, createReport);

module.exports = router;