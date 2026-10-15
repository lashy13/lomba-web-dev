/* global require, module  */
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
  deleteReport,
} = require("../controllers/reportController");

const router = express.Router();

// GET semua laporan publik
router.get("/", getReports);

// GET laporan milik pengguna yang sedang login
router.get("/my-reports", verifyToken, getMyReports);

// ADMIN: statistik laporan
router.get(
  "/admin/stats",
  verifyToken,
  verifyAdmin,
  getReportStats
);

// ADMIN: semua laporan
router.get(
  "/admin/reports",
  verifyToken,
  verifyAdmin,
  getAdminReports
);

// ADMIN: memperbarui status laporan
router.patch(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  updateReportStatus
);

// DELETE laporan
// Pemilik hanya boleh menghapus laporan berstatus Menunggu.
// Admin dapat menghapus laporan dengan status apa pun.
router.delete("/:id", verifyToken, (req, res, next) => {
  console.log("[DELETE REPORT] Route terpanggil:", req.params.id);
  next();
}, deleteReport);

// GET riwayat status laporan
router.get("/:id/timeline", getReportTimeline);

// GET detail privat laporan
router.get(
  "/:id/private",
  verifyToken,
  getPrivateReportById
);

// GET detail publik laporan
router.get("/:id", getReportById);

// CREATE laporan
router.post("/", verifyToken, createReport);

module.exports = router;
