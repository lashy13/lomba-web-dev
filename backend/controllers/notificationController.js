/* global module, require */

const db = require("../config/database");

// ========================================
// GET NOTIFICATIONS
// ========================================

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [notifications] = await db.query(
      `SELECT
        id,
        user_id,
        report_id,
        title,
        message,
        type,
        note,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC`,
      [userId],
    );

    const unreadCount = notifications.filter(
      (notification) => Number(notification.is_read) === 0,
    ).length;

    return res.status(200).json({
      success: true,
      total: notifications.length,
      unread: unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil notifikasi.",
    });
  }
}

// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

async function markNotificationRead(req, res) {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    if (
      !Number.isSafeInteger(notificationId) ||
      notificationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ID notifikasi tidak valid.",
      });
    }

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `SELECT id
         FROM notifications
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [notificationId, userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notifikasi berhasil ditandai sudah dibaca.",
    });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui notifikasi.",
    });
  }
}

// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

async function markAllNotificationsRead(req, res) {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [req.user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Semua notifikasi sudah dibaca.",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui semua notifikasi.",
    });
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};