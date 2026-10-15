/* global require, module, Buffer, process */

const express = require("express");
const multer = require("multer");
const { Readable } = require("stream");

const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const db = require("../config/database");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      const error = new Error(
        "Foto harus berformat JPG, PNG, atau WebP."
      );

      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function isValidImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng = buffer
    .subarray(0, 8)
    .equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    );

  const isWebp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

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

        if (
          !result ||
          !result.secure_url ||
          !result.public_id ||
          !result.secure_url.startsWith("https://res.cloudinary.com/")
        ) {
          return reject(
            new Error("URL foto Cloudinary tidak valid.")
          );
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

function getCloudinaryPublicId(imageUrl) {
  try {
    if (typeof imageUrl !== "string") {
      return null;
    }

    const url = new URL(imageUrl);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com"
    ) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) {
      return null;
    }

    let fileParts = parts.slice(uploadIndex + 1);

    // Hapus versi aset jika ada, misalnya v1234567890.
    if (
      fileParts.length > 1 &&
      /^v\d+$/.test(fileParts[0])
    ) {
      fileParts = fileParts.slice(1);
    }

    if (fileParts.length === 0) {
      return null;
    }

    const lastIndex = fileParts.length - 1;

    fileParts[lastIndex] = fileParts[lastIndex].replace(
      /\.[^.]+$/,
      ""
    );

    const publicId = fileParts.join("/");

    if (!publicId.startsWith("laporkita/profiles/")) {
      return null;
    }

    return publicId;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImage(imageUrl) {
  const publicId = getCloudinaryPublicId(imageUrl);

  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (
    result.result !== "ok" &&
    result.result !== "not found"
  ) {
    throw new Error("Gagal menghapus foto dari Cloudinary.");
  }
}

// ==================================================
// REGISTER DAN LOGIN
// ==================================================

router.post("/register", register);
router.post("/login", login);

// ==================================================
// MENGAMBIL PROFIL
// ==================================================

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, email, role, profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
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

// ==================================================
// MEMPERBARUI PROFIL
// ==================================================

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
      const [existing] = await db.query(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [req.user.id]
      );

      if (existing.length === 0) {
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

// ==================================================
// UPLOAD FOTO PROFIL KE CLOUDINARY
// POST /api/auth/profile/photo
// ==================================================

router.post(
  "/profile/photo",
  verifyToken,
  (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (!error) {
        return next();
      }

      console.error("MULTER UPLOAD ERROR:", error.message);

      const status =
        error.code === "LIMIT_FILE_SIZE" || error.status === 400
          ? 400
          : 500;

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
    let uploadedPublicId = null;
    let databaseUpdated = false;

    try {
      console.log("UPLOAD ROUTE: CLOUDINARY VERSION");

      if (!isCloudinaryConfigured()) {
        console.error("CLOUDINARY CONFIGURATION MISSING");

        return res.status(500).json({
          success: false,
          message: "Cloudinary belum dikonfigurasi pada server.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Pilih foto terlebih dahulu.",
        });
      }

      if (!isValidImage(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message: "Isi file bukan gambar yang valid.",
        });
      }

      const [users] = await db.query(
        `SELECT id, profile_image
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
      }

      const oldImage = users[0].profile_image;

      // 1. Upload ke Cloudinary.
      const result = await uploadToCloudinary(
        req.file.buffer,
        req.user.id
      );

      uploadedPublicId = result.public_id;

      console.log("CLOUDINARY UPLOAD SUCCESS:", result.public_id);

      // 2. Simpan URL Cloudinary, bukan /uploads/... ke SQL.
      const [updateResult] = await db.query(
        "UPDATE users SET profile_image = ? WHERE id = ?",
        [result.secure_url, req.user.id]
      );

      if (updateResult.affectedRows === 0) {
        const [checkUser] = await db.query(
          "SELECT id FROM users WHERE id = ? LIMIT 1",
          [req.user.id]
        );

        if (checkUser.length === 0) {
          throw new Error("Pengguna tidak ditemukan di database.");
        }
      }

      databaseUpdated = true;

      // 3. Hapus foto lama hanya jika foto itu berada di Cloudinary.
      if (
        oldImage &&
        oldImage !== result.secure_url &&
        getCloudinaryPublicId(oldImage)
      ) {
        try {
          await deleteCloudinaryImage(oldImage);
        } catch (cleanupError) {
          console.error(
            "GAGAL MENGHAPUS FOTO CLOUDINARY LAMA:",
            cleanupError.message
          );
        }
      }

      // 4. Kirim URL yang sama dengan yang disimpan di SQL.
      return res.status(200).json({
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

      // Jika penyimpanan SQL gagal, bersihkan foto baru.
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

// ==================================================
// MENGHAPUS FOTO PROFIL
// DELETE /api/auth/profile/photo
// ==================================================

router.delete("/profile/photo", verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, profile_image
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const oldImage = users[0].profile_image;

    await db.query(
      "UPDATE users SET profile_image = NULL WHERE id = ?",
      [req.user.id]
    );

    if (oldImage && getCloudinaryPublicId(oldImage)) {
      try {
        await deleteCloudinaryImage(oldImage);
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
      profileImage: null,
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