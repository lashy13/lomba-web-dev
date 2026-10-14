/* global module, require */

const express = require("express");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

const router = express.Router();

// Semua endpoint membutuhkan token valid.
router.use(verifyToken);

router.get("/", getNotifications);

// Letakkan route khusus sebelum route dengan parameter ID.
router.patch("/read-all", markAllNotificationsRead);

router.patch("/:id/read", markNotificationRead);

module.exports = router;