
/* global process, require, module */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/database");

// ========================================
// IMPORT ROUTES
// ========================================

const authRoutes = require("./routes/authRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { verifyToken } = require("./middleware/authMiddleware");

// ========================================
// INITIALIZE EXPRESS
// ========================================

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const BACKEND_VERSION = "delete-report-v2";

console.log(`LAPORKITA_BACKEND_VERSION: ${BACKEND_VERSION}`);

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);

      return callback(
        new Error("Origin tidak diizinkan oleh CORS.")
      );
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ========================================
// BODY PARSER
// ========================================

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// ROOT ENDPOINT
// ========================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "LaporKita API berhasil berjalan.",
    version: BACKEND_VERSION,
  });
});

// ========================================
// SERVER HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server aktif.",
    version: BACKEND_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// DATABASE HEALTH CHECK
// ========================================

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    return res.status(200).json({
      success: true,
      message: "Database berhasil terhubung.",
      data: rows,
    });
  } catch (error) {
    console.error("DATABASE ERROR:", {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Database gagal terhubung.",
    });
  }
});

// ========================================
// AUTHENTICATION ROUTES
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// PASSWORD RESET / OTP ROUTES
// ========================================

app.use("/api/auth/forgot-password", passwordResetRoutes);

// ========================================
// CURRENT USER
// ========================================

app.get("/api/auth/me", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token valid.",
    user: req.user,
  });
});

// ========================================
// CATEGORY ROUTES
// ========================================

app.use("/api/categories", categoryRoutes);

// ========================================
// REPORT ROUTES
// ========================================

// Mendaftarkan GET, POST, PATCH, dan DELETE laporan.
// Pastikan reportRoutes mengekspor router Express yang benar.
app.use("/api/reports", reportRoutes);

// ========================================
// NOTIFICATION ROUTES
// ========================================

app.use("/api/notifications", notificationRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  console.warn("ENDPOINT NOT FOUND:", {
    method: req.method,
    url: req.originalUrl,
    version: BACKEND_VERSION,
  });

  return res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
    version: BACKEND_VERSION,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("API ERROR:", {
    method: req.method,
    url: req.originalUrl,
    code: error.code || "",
    message: error.message,
  });

  if (error.message === "Origin tidak diizinkan oleh CORS.") {
    return res.status(403).json({
      success: false,
      message: "Origin tidak diizinkan.",
    });
  }

  const status =
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 600
      ? error.status
      : 500;

  return res.status(status).json({
    success: false,
    message:
      status === 400
        ? "Format permintaan tidak valid."
        : "Terjadi kesalahan pada server.",
  });
});

// ========================================
// START SERVER
// ========================================

if (require.main === module) {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("------------------------------------");
    console.log("LaporKita API berhasil dijalankan.");
    console.log(`Port: ${PORT}`);
    console.log(`Backend version: ${BACKEND_VERSION}`);
    console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    console.log("------------------------------------");
  });

  server.on("error", (error) => {
    console.error("SERVER ERROR:", error.message);

    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} sedang digunakan.`);
    }
  });
}

// ========================================
// UNEXPECTED ASYNC ERRORS
// ========================================

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

module.exports = app;
