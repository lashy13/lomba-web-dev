/* global require, module, process  */

const { Resend } = require("resend");

async function sendOTP(email, otp) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM belum dikonfigurasi");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [email],
    subject: "Kode OTP Reset Password - LaporKita",
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px">
        <h2 style="color:#2563eb">LaporKita</h2>

        <p>Kami menerima permintaan reset password akun kamu.</p>

        <p>Gunakan kode OTP berikut:</p>

        <h1 style="
          color:#2563eb;
          letter-spacing:8px;
          font-size:32px;
        ">
          ${otp}
        </h1>

        <p>Jangan bagikan kode ini kepada siapa pun.</p>

        <p>Jika kamu tidak meminta reset password,
        abaikan email ini.</p>
      </div>
    `,
  });

  if (error) {
    console.error("EMAIL ERROR:", error);
    throw new Error("Gagal mengirim email OTP");
  }

  return data;
}

module.exports = { sendOTP };