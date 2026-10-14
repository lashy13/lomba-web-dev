
/* global require, module, process */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

// ========================================
// REGISTER
// ========================================

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validasi input
    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua kolom wajib diisi.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 2 || cleanUsername.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2–100 karakter.",
      });
    }

    // Validasi format email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter.",
      });
    }

    // Periksa email yang sudah terdaftar
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Role mengikuti default yang ditentukan database
    const [result] = await db.query(
      `INSERT INTO users (username, email, password)
       VALUES (?, ?, ?)`,
      [cleanUsername, cleanEmail, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil.",
      user: {
        id: result.insertId,
        username: cleanUsername,
        email: cleanEmail,
        role: "user",
        profile_image: null,
        profileImage: null,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    console.error("REGISTER ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// ========================================
// LOGIN
// ========================================

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Ambil data pengguna beserta foto profil
    const [users] = await db.query(
      `SELECT
         id,
         username,
         email,
         password,
         role,
         profile_image
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const user = users[0];

    // Verifikasi password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    // Pastikan JWT_SECRET tersedia
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET belum diatur.");

      return res.status(500).json({
        success: false,
        message: "Konfigurasi server belum lengkap.",
      });
    }

    // Buat token autentikasi
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // Data pengguna yang dikirim ke frontend
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile_image: user.profile_image || null,
      profileImage: user.profile_image || null,
    };

    return res.status(200).json({
      success: true,
      message: "Login berhasil.",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// ========================================
// EXPORT CONTROLLER
// ========================================

module.exports = {
  register,
  login,
};
