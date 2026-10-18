
/* global require, module, process */

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetOtp(email, otp) {
    try {
        // Validasi konfigurasi
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY belum dikonfigurasi.");
        }

        if (!process.env.EMAIL_FROM) {
            throw new Error("EMAIL_FROM belum dikonfigurasi.");
        }

        // Validasi data
        if (typeof email !== "string" || !email.trim()) {
            throw new Error("Email penerima wajib diisi.");
        }

        if (otp === undefined || otp === null || String(otp).length === 0) {
            throw new Error("Kode OTP wajib diisi.");
        }

        // Amankan OTP untuk ditampilkan dalam HTML
        const safeOtp = String(otp)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [email.trim()],
            subject: "Kode Pemulihan Password LaporKita",

            text: [
                "Halo,",
                "",
                "Kamu meminta kode OTP untuk memulihkan password akun LaporKita.",
                "",
                `Kode OTP kamu: ${otp}`,
                "",
                "Kode ini berlaku selama 5 menit.",
                "Jangan bagikan kode ini kepada siapa pun.",
                "Jika kamu tidak meminta pemulihan password, abaikan email ini.",
            ].join("\n"),

            html: `
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Kode Pemulihan Password LaporKita</title>
                </head>
                <body style="
                    margin: 0;
                    padding: 24px;
                    background: #f1f5f9;
                    font-family: Arial, sans-serif;
                    color: #1e293b;
                ">
                    <div style="
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 28px;
                        background: #ffffff;
                        border: 1px solid #dbeafe;
                        border-radius: 16px;
                    ">
                        <h2 style="
                            margin-top: 0;
                            color: #2563eb;
                        ">LaporKita</h2>

                        <p>Halo,</p>

                        <p>
                            Kamu meminta kode OTP untuk memulihkan
                            password akun LaporKita.
                        </p>

                        <div style="
                            padding: 24px 12px;
                            background: #eff6ff;
                            text-align: center;
                            border-radius: 12px;
                        ">
                            <p style="margin-top: 0;">
                                Kode OTP kamu:
                            </p>

                            <h1 style="
                                margin: 16px 0;
                                color: #2563eb;
                                letter-spacing: 8px;
                                font-size: 32px;
                            ">${safeOtp}</h1>

                            <p style="margin-bottom: 0;">
                                Kode berlaku selama 5 menit.
                            </p>
                        </div>

                        <p>
                            Jangan bagikan kode ini kepada siapa pun.
                        </p>

                        <p>
                            Jika kamu tidak meminta pemulihan password,
                            abaikan email ini.
                        </p>

                        <hr style="
                            margin: 24px 0;
                            border: 0;
                            border-top: 1px solid #e2e8f0;
                        ">

                        <small style="color: #64748b;">
                            Email otomatis dari LaporKita.
                        </small>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            // Catat detail error di server untuk debugging.
            // Jangan tampilkan detail internal kepada pengguna.
            console.error("RESEND EMAIL ERROR:", {
                name: error.name,
                message: error.message,
                statusCode: error.statusCode,
            });

            throw new Error("Gagal mengirim email OTP melalui Resend.");
        }

        console.log("Permintaan email OTP berhasil diterima Resend.", {
            emailId: data?.id,
        });

        return data;
    } catch (error) {
        console.error("PASSWORD RESET EMAIL ERROR:", error.message);
        throw error;
    }
}

module.exports = {
    sendPasswordResetOtp,
};
