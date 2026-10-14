/* global require, process, module*/

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { sendPasswordResetOtp } = require("../config/mailer");

const OTP_EXPIRY_MINUTES = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function hashValue(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

function isValidEmail(email) {
    return (
        typeof email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

function genericResponse(res) {
    return res.status(200).json({
        success: true,
        message:
            "Jika email terdaftar, instruksi pemulihan akan dikirim ke email tersebut.",
    });
}

// ========================================
// 1. MEMINTA OTP
// ========================================

async function requestOtp(req, res) {
    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Masukkan alamat email yang valid.",
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        if (!process.env.PASSWORD_RESET_SECRET) {
            console.error(
                "PASSWORD RESET ERROR: PASSWORD_RESET_SECRET belum dikonfigurasi."
            );

            return res.status(500).json({
                success: false,
                message: "Fitur pemulihan password belum dikonfigurasi.",
            });
        }

        connection = await db.getConnection();

        const [users] = await connection.query(
            "SELECT id, email FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        // Tidak mengungkap apakah email terdaftar.
        if (users.length === 0) {
            return genericResponse(res);
        }

        const user = users[0];
        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);

        await connection.beginTransaction();
        transactionStarted = true;

        // Menghapus permintaan OTP sebelumnya untuk pengguna ini.
        await connection.query(
            "DELETE FROM password_resets WHERE user_id = ?",
            [user.id]
        );

        // Membuat permintaan OTP baru dengan masa berlaku 5 menit.
        await connection.query(
            `INSERT INTO password_resets
                (user_id, otp_hash, expires_at, attempts)
             VALUES (
                ?, ?,
                DATE_ADD(NOW(), INTERVAL ? MINUTE),
                0
             )`,
            [user.id, otpHash, OTP_EXPIRY_MINUTES]
        );

        await connection.commit();
        transactionStarted = false;

        // Mengirim OTP melalui email.
        try {
            await sendPasswordResetOtp(user.email, otp);
        } catch (emailError) {
            console.error("PASSWORD RESET EMAIL ERROR:");
            console.error("Message:", emailError?.message || emailError);
            console.error("Code:", emailError?.code || "Tidak tersedia");
            console.error(
                "Command:",
                emailError?.command || "Tidak tersedia"
            );
            console.error(
                "Response:",
                emailError?.response || "Tidak tersedia"
            );

            // Menghapus OTP yang gagal dikirim.
            await connection.query(
                "DELETE FROM password_resets WHERE user_id = ?",
                [user.id]
            );

            return res.status(503).json({
                success: false,
                message:
                    "Email OTP gagal dikirim. Silakan periksa konfigurasi email atau coba kembali nanti.",
            });
        }

        return genericResponse(res);
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "REQUEST OTP ROLLBACK ERROR:",
                    rollbackError.message
                );
            }
        }

        console.error("REQUEST OTP ERROR:", error?.message || error);
        console.error("REQUEST OTP CODE:", error?.code || "Tidak tersedia");

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ========================================
// 2. VERIFIKASI OTP
// ========================================

async function verifyOtp(req, res) {
    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    const otp =
        typeof req.body.otp === "string"
            ? req.body.otp.trim()
            : "";

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "Email atau kode OTP tidak valid.",
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [rows] = await connection.query(
            `SELECT
                pr.id,
                pr.user_id,
                pr.otp_hash,
                pr.attempts,
                pr.expires_at,
                pr.verified_at
             FROM password_resets pr
             JOIN users u ON u.id = pr.user_id
             WHERE u.email = ?
             ORDER BY pr.id DESC
             LIMIT 1
             FOR UPDATE`,
            [email]
        );

        if (rows.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "OTP tidak valid atau sudah kedaluwarsa.",
            });
        }

        const reset = rows[0];

        // Membandingkan waktu menggunakan jam MySQL agar konsisten
        // dengan waktu yang digunakan saat membuat OTP.
        const [expiryRows] = await connection.query(
            "SELECT expires_at > NOW() AS is_valid FROM password_resets WHERE id = ?",
            [reset.id]
        );

        const otpNotExpired =
            expiryRows.length > 0 &&
            Boolean(expiryRows[0].is_valid);

        if (
            reset.verified_at ||
            reset.attempts >= MAX_OTP_ATTEMPTS ||
            !otpNotExpired
        ) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "OTP tidak valid atau sudah kedaluwarsa.",
            });
        }

        const isValid = await bcrypt.compare(otp, reset.otp_hash);

        if (!isValid) {
            await connection.query(
                `UPDATE password_resets
                 SET attempts = attempts + 1
                 WHERE id = ?`,
                [reset.id]
            );

            await connection.commit();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "OTP tidak valid atau sudah kedaluwarsa.",
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = hashValue(resetToken);

        await connection.query(
            `UPDATE password_resets
             SET verified_at = NOW(),
                 reset_token_hash = ?,
                 reset_token_expires_at =
                    DATE_ADD(NOW(), INTERVAL ? MINUTE)
             WHERE id = ?`,
            [
                resetTokenHash,
                RESET_TOKEN_EXPIRY_MINUTES,
                reset.id,
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message: "OTP berhasil diverifikasi.",
            resetToken,
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "VERIFY OTP ROLLBACK ERROR:",
                    rollbackError.message
                );
            }
        }

        console.error("VERIFY OTP ERROR:", error?.message || error);
        console.error("VERIFY OTP CODE:", error?.code || "Tidak tersedia");

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// ========================================
// 3. RESET PASSWORD
// ========================================

async function resetPassword(req, res) {
    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    const resetToken =
        typeof req.body.resetToken === "string"
            ? req.body.resetToken
            : "";

    const password =
        typeof req.body.password === "string"
            ? req.body.password
            : "";

    if (
        !isValidEmail(email) ||
        !/^[a-f0-9]{64}$/.test(resetToken) ||
        password.length < 8 ||
        password.length > 72
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Data tidak valid. Password harus terdiri dari 8–72 karakter.",
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        const [rows] = await connection.query(
            `SELECT
                pr.id,
                pr.user_id
             FROM password_resets pr
             JOIN users u ON u.id = pr.user_id
             WHERE u.email = ?
               AND pr.reset_token_hash = ?
               AND pr.verified_at IS NOT NULL
               AND pr.reset_token_expires_at > NOW()
             ORDER BY pr.id DESC
             LIMIT 1
             FOR UPDATE`,
            [email, hashValue(resetToken)]
        );

        if (rows.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "Sesi reset password tidak valid atau sudah kedaluwarsa. Silakan ulangi proses.",
            });
        }

        const reset = rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, reset.user_id]
        );

        // Token hanya bisa digunakan sekali.
        await connection.query(
            "DELETE FROM password_resets WHERE user_id = ?",
            [reset.user_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            success: true,
            message:
                "Password berhasil diperbarui. Silakan login menggunakan password baru.",
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "RESET PASSWORD ROLLBACK ERROR:",
                    rollbackError.message
                );
            }
        }

        console.error("RESET PASSWORD ERROR:", error?.message || error);
        console.error("RESET PASSWORD CODE:", error?.code || "Tidak tersedia");

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada server.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    requestOtp,
    verifyOtp,
    resetPassword,
};