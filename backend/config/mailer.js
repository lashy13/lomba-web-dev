
/* global require, module, process */

const { Resend } = require("resend");

async function sendPasswordResetOtp(email, otp) {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY belum dikonfigurasi.");
        }

        if (!process.env.EMAIL_FROM) {
            throw new Error("EMAIL_FROM belum dikonfigurasi.");
        }

        if (!email || !otp) {
            throw new Error("Email penerima dan OTP wajib diisi.");
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const safeOtp = String(otp)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [email],
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

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 24px;
                    color: #1e293b;
                ">
                    <h2 style="color: #2563eb;">LaporKita</h2>

                    <p>Halo,</p>

                    <p>
                        Kamu meminta kode OTP untuk memulihkan
                        password akun LaporKita.
                    </p>

                    <div style="
                        background: #eff6ff;
                        padding: 20px;
                        text-align: center;
                        border-radius: 12px;
                    ">
                        <p>Kode OTP kamu:</p>

                        <h1 style="
                            color: #2563eb;
                            letter-spacing: 8px;
                            font-size: 32px;
                        ">${safeOtp}</h1>

                        <p>Kode berlaku selama 5 menit.</p>
                    </div>

                    <p>
                        Jangan bagikan kode ini kepada siapa pun.
                    </p>

                    <p>
                        Jika kamu tidak meminta pemulihan password,
                        abaikan email ini.
                    </p>

                    <hr />

                    <small>
                        Email otomatis dari LaporKita.
                    </small>
                </div>
            `,
        });

        if (error) {
            console.error("RESEND EMAIL ERROR:", error);
            throw new Error("Gagal mengirim email OTP.");
        }

        console.log("Email OTP berhasil diterima oleh layanan Resend.");

        return data;
    } catch (error) {
        console.error("PASSWORD RESET EMAIL ERROR:", error.message);
        throw error;
    }
}

module.exports = {
    sendPasswordResetOtp,
};
