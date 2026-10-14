/* global require, module, process */

const nodemailer = require("nodemailer");

if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
) {
    console.warn("Konfigurasi SMTP belum lengkap.");
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendPasswordResetOtp(email, otp) {
    try {
        return await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Kode Pemulihan Password LaporKita",
            text: [
                "Halo,",
                "",
                `Kode OTP pemulihan password LaporKita kamu adalah: ${otp}`,
                "",
                "Kode ini berlaku selama 5 menit.",
                "Jangan bagikan kode ini kepada siapa pun.",
                "Jika kamu tidak meminta pemulihan password, abaikan email ini.",
            ].join("\n"),
        });
    } catch (error) {
        console.error("MAILER ERROR MESSAGE:", error.message);
        console.error("MAILER ERROR CODE:", error.code);
        console.error("MAILER ERROR COMMAND:", error.command);
        throw error;
    }
}

module.exports = {
    sendPasswordResetOtp,
};