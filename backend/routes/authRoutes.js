
/* global require, module, __dirname, Buffer*/

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  register,
  login,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");
const db = require("../config/database");

const router = express.Router();

// ========================================
// FOLDER PENYIMPANAN FOTO
// ========================================

const uploadDir = path.join(__dirname, "..", "uploads", "profiles");

fs.mkdirSync(uploadDir, { recursive: true });

// ========================================
// KONFIGURASI MULTER
// ========================================

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionByMime[file.mimetype];

    if (!extension) {
      return callback(new Error("Format foto tidak didukung."));
    }

    callback(
      null,
      `profile-${req.user.id}-${Date.now()}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Foto harus berformat JPG, PNG, atau WebP.")
      );
    }

    callback(null, true);
  },
});

// ========================================
// REGISTER DAN LOGIN
// ========================================

router.post("/register", register);
router.post("/login", login);

// ========================================
// GET PROFIL
// GET /api/auth/profile
// ========================================

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, role, profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil profil.",
    });
  }
});

// ========================================
// UPDATE NAMA
// PATCH /api/auth/profile
// ========================================

router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (username.length < 2 || username.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2–100 karakter.",
      });
    }

    await db.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [username, req.user.id]
    );

    const [rows] = await db.query(
      `SELECT id, username, email, role, profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      user: rows[0],
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui profil.",
    });
  }
});

// ========================================
// UPLOAD FOTO
// POST /api/auth/profile/photo
// ========================================

router.post(
  "/profile/photo",
  verifyToken,
  (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (!error) return next();

      const status = error instanceof multer.MulterError ? 400 : 400;

      return res.status(status).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Ukuran foto maksimal 2 MB."
            : error.message || "Foto gagal diunggah.",
      });
    });
  },
  async (req, res) => {
    let newFilePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Pilih foto terlebih dahulu.",
        });
      }

      newFilePath = req.file.path;

      // Verifikasi tanda file berdasarkan magic bytes.
      // Jangan hanya mengandalkan MIME type dari browser.
      const fileHandle = await fs.promises.open(req.file.path, "r");

      let signature;

      try {
        signature = Buffer.alloc(12);
        await fileHandle.read(signature, 0, 12, 0);
      } finally {
        await fileHandle.close();
      }

      const isJpeg =
        signature[0] === 0xff &&
        signature[1] === 0xd8 &&
        signature[2] === 0xff;

      const isPng =
        signature.subarray(0, 8).equals(
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47,
            0x0d, 0x0a, 0x1a, 0x0a,
          ])
        );

      const isWebp =
        signature.toString("ascii", 0, 4) === "RIFF" &&
        signature.toString("ascii", 8, 12) === "WEBP";

      if (!isJpeg && !isPng && !isWebp) {
        await fs.promises.unlink(req.file.path).catch(() => {});

        return res.status(400).json({
          success: false,
          message: "Isi file bukan gambar JPG, PNG, atau WebP yang valid.",
        });
      }

      const profileImage = `/uploads/profiles/${req.file.filename}`;

      const [oldRows] = await db.query(
        "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
        [req.user.id]
      );

      if (!oldRows.length) {
        await fs.promises.unlink(req.file.path).catch(() => {});

        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
      }

      await db.query(
        "UPDATE users SET profile_image = ? WHERE id = ?",
        [profileImage, req.user.id]
      );

      // Hapus foto lama hanya jika berada di folder upload aplikasi.
      const oldImage = oldRows[0].profile_image;

      if (
        oldImage &&
        oldImage.startsWith("/uploads/profiles/")
      ) {
        const oldFilename = path.basename(oldImage);
        const oldPath = path.join(uploadDir, oldFilename);

        if (oldFilename !== req.file.filename) {
          await fs.promises.unlink(oldPath).catch(() => {});
        }
      }

      return res.json({
        success: true,
        message: "Foto profil berhasil disimpan.",
        profileImage,
        user: {
          id: req.user.id,
          profile_image: profileImage,
        },
      });
    } catch (error) {
      console.error("UPLOAD PHOTO ERROR:", error.message);

      if (newFilePath) {
        await fs.promises.unlink(newFilePath).catch(() => {});
      }

      return res.status(500).json({
        success: false,
        message: "Foto gagal disimpan ke server.",
      });
    }
  }
);

// ========================================
// HAPUS FOTO
// DELETE /api/auth/profile/photo
// ========================================

router.delete("/profile/photo", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const image = rows[0].profile_image;

    await db.query(
      "UPDATE users SET profile_image = NULL WHERE id = ?",
      [req.user.id]
    );

    if (image && image.startsWith("/uploads/profiles/")) {
      const filename = path.basename(image);
      const imagePath = path.join(uploadDir, filename);

      await fs.promises.unlink(imagePath).catch((error) => {
        console.error("GAGAL MENGHAPUS FILE LAMA:", error.message);
      });
    }

    return res.json({
      success: true,
      message: "Foto profil berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE PHOTO ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Foto gagal dihapus.",
    });
  }
});

module.exports = router;
