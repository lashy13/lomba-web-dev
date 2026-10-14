
/* global require, module, process */

const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ========================================
// VERIFIKASI TOKEN DAN STATUS PENGGUNA
// ========================================

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Silakan login terlebih dahulu.",
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum diatur.");

      return res.status(500).json({
        success: false,
        message: "Konfigurasi server belum lengkap.",
      });
    }

    // Verifikasi token JWT.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Token tidak memiliki identitas pengguna yang valid.",
      });
    }

    // Ambil data terbaru, termasuk foto profil.
    const [users] = await db.query(
      `SELECT
         id,
         username,
         email,
         role,
         profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Akun tidak ditemukan atau sudah tidak aktif.",
      });
    }

    const user = users[0];

    // Validasi role.
    if (!["user", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Role akun tidak valid.",
      });
    }

    // Kirim data terbaru dari database.
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile_image: user.profile_image || null,
      profileImage: user.profile_image || null,
    };

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah kedaluwarsa.",
      });
    }

    console.error("AUTH MIDDLEWARE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// ========================================
// PEMERIKSAAN ROLE ADMIN
// ========================================

function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Silakan login terlebih dahulu.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Khusus administrator.",
    });
  }

  return next();
}

// ========================================
// EXPORT MIDDLEWARE
// ========================================

module.exports = {
  verifyToken,
  verifyAdmin,
};
