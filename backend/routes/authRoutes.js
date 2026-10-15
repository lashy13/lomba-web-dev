/* global require, module, Buffer */

const express = require("express");
const multer = require("multer");
const { Readable } = require("stream");

const {
  register,
  login,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");
const db = require("../config/database");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ========================================
// KONFIGURASI MULTER
// Foto disimpan sementara di memori server.
// Penyimpanan permanen dilakukan oleh Cloudinary.
// ========================================

const upload = multer({
  storage: multer.memoryStorage(),

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
// VALIDASI ISI FILE GAMBAR
// ========================================

function isValidImage(buffer) {
  if (!buffer || buffer.length < 12) {
    return false;
  }

  // JPEG
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // PNG
  const isPng = buffer
    .subarray(0, 8)
    .equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    );

  // WebP
  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

// ========================================
// MEMBANTU MENGAMBIL PUBLIC ID CLOUDINARY
// ========================================

function getCloudinaryPublicId(imageUrl) {
  try {
    const url = new URL(imageUrl);

    if (url.hostname !== "res.cloudinary.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    let fileParts = parts.slice(uploadIndex + 1);

    // Hapus versi gambar, misalnya v123456789.
    if (
      fileParts.length > 1 &&
      /^v\d+$/.test(fileParts[0])
    ) {
      fileParts = fileParts.slice(1);
    }

    if (!fileParts.length) {
      return null;
    }

    // Hilangkan ekstensi file, misalnya .png atau .jpg.
    const lastIndex = fileParts.length - 1;

    fileParts[lastIndex] = fileParts[lastIndex].replace(
      /\.[^.]+$/,
      ""
    );

    const publicId = fileParts.join("/");

    // Pastikan hanya gambar profil milik aplikasi
    // yang boleh dihapus melalui fungsi ini.
    if (!publicId.startsWith("laporkita/profiles/")) {
      return null;
    }

    return publicId;
  } catch (error) {
    console.error("GAGAL MEMBACA URL GAMBAR:", error.message);
    return null;
  }
}

// ========================================
// MENGHAPUS FOTO CLOUDINARY
// ========================================

async function deleteCloudinaryImage(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("https://res.cloudinary.com/")
  ) {
    return;
  }

  const publicId = getCloudinaryPublicId(imageUrl);

  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Cloudinary gagal menghapus foto lama.");
  }
}

// ========================================
// UPLOAD FOTO KE CLOUDINARY
// ========================================

function uploadToCloudinary(buffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "laporkita/profiles",
        public_id: `profile-${userId}-${Date.now()}`,
        overwrite: false,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url || !result.public_id) {
          return reject(
            new Error("Cloudinary tidak mengembalikan hasil upload yang valid.")
          );
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

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

    const [result] = await db.query(
      "UPDATE users SET username = ? WHERE id = ?",
      [username, req.user.id]
    );

    if (result.affectedRows === 0) {
      const [users] = await db.query(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [req.user.id]
      );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
      }
    }

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
// UPLOAD FOTO PROFIL
// POST /api/auth/profile/photo
// ========================================

router.post(
  "/profile/photo",
  verifyToken,
  (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (!error) {
        return next();
      }

      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Ukuran foto maksimal 2 MB."
            : error.message || "Foto gagal diunggah.",
      });
    });
  },
  async (req, res) => {
    let uploadedPublicId = null;
    let databaseUpdated = false;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Pilih foto terlebih dahulu.",
        });
      }

      // Validasi isi gambar.
      if (!isValidImage(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message:
            "Isi file bukan gambar JPG, PNG, atau WebP yang valid.",
        });
      }

      // Ambil profil dan foto lama.
      const [users] = await db.query(
        `SELECT id, profile_image
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
      }

      const oldImage = users[0].profile_image;

      // Unggah foto ke Cloudinary.
      const result = await uploadToCloudinary(
        req.file.buffer,
        req.user.id
      );

      uploadedPublicId = result.public_id;

      // Simpan URL Cloudinary ke database.
      await db.query(
        "UPDATE users SET profile_image = ? WHERE id = ?",
        [result.secure_url, req.user.id]
      );

      databaseUpdated = true;

      // Hapus foto lama setelah URL foto baru berhasil disimpan.
      if (
        oldImage &&
        oldImage !== result.secure_url &&
        oldImage.startsWith("https://res.cloudinary.com/")
      ) {
        try {
          await deleteCloudinaryImage(oldImage);
        } catch (cleanupError) {
          console.error(
            "GAGAL MENGHAPUS FOTO LAMA:",
            cleanupError.message
          );
        }
      }

      return res.json({
        success: true,
        message: "Foto profil berhasil disimpan.",
        profileImage: result.secure_url,
        user: {
          id: req.user.id,
          profile_image: result.secure_url,
        },
      });
    } catch (error) {
      console.error("UPLOAD PHOTO ERROR:", error.message);

      // Bersihkan foto baru jika upload berhasil,
      // tetapi penyimpanan URL ke database gagal.
      if (uploadedPublicId && !databaseUpdated) {
        try {
          await cloudinary.uploader.destroy(uploadedPublicId, {
            resource_type: "image",
          });
        } catch (cleanupError) {
          console.error(
            "GAGAL MEMBERSIHKAN FOTO BARU:",
            cleanupError.message
          );
        }
      }

      return res.status(500).json({
        success: false,
        message: "Foto gagal disimpan. Silakan coba lagi.",
      });
    }
  }
);

// ========================================
// HAPUS FOTO PROFIL
// DELETE /api/auth/profile/photo
// ========================================

router.delete("/profile/photo", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, profile_image
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

    const image = rows[0].profile_image;

    // Hapus URL dari database terlebih dahulu.
    await db.query(
      "UPDATE users SET profile_image = NULL WHERE id = ?",
      [req.user.id]
    );

    // Hapus file dari Cloudinary jika foto berasal dari sana.
    if (
      image &&
      image.startsWith("https://res.cloudinary.com/")
    ) {
      try {
        await deleteCloudinaryImage(image);
      } catch (cleanupError) {
        console.error(
          "GAGAL MENGHAPUS FOTO CLOUDINARY:",
          cleanupError.message
        );
      }
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