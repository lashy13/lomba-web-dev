
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lupa-password.css";
import logo from "../assets/logo-laporkita.png";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function postAuth(path, body) {
  const response = await fetch(
    `${API_URL}/api/auth/forgot-password/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Respons server tidak valid.");
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Permintaan gagal. Silakan coba kembali.",
    );
  }

  return result;
}

function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C2.5 12 6 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 18 18.5 12 18.5C6 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.5 5.8C11 5.6 11.5 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 20.2 14.4 18 16.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7.2C3.7 9.1 2.5 12 2.5 12C2.5 12 6 18.5 12 18.5C13.4 18.5 14.7 18.2 15.8 17.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 7L12 13L21 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L19 6V11C19 15.5 16.1 19.1 12 21C7.9 19.1 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LupaPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSending, setIsSending] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Silakan masukkan email terlebih dahulu.");
      return;
    }

    setIsSending(true);

    try {
      const result = await postAuth("request", {
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(2);
      setSuccess(result.message || "Kode OTP berhasil dikirim.");
    } catch (err) {
      setError(err.message || "Gagal mengirim kode OTP.");
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    clearMessages();

    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Kode verifikasi harus terdiri dari 6 angka.");
      return;
    }

    setIsSending(true);

    try {
      const result = await postAuth("verify", {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (!result.resetToken) {
        throw new Error("Token reset tidak diterima dari server.");
      }

      setResetToken(result.resetToken);
      setStep(3);
      setSuccess("Email berhasil diverifikasi. Buat password baru.");
    } catch (err) {
      setError(err.message || "Verifikasi OTP gagal.");
    } finally {
      setIsSending(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;

    clearMessages();

    const password = newPassword;
    const confirmation = confirmPassword;

    if (!password || !confirmation) {
      setError("Silakan lengkapi kedua kolom password.");
      return;
    }

    if (password.length < 8) {
      setError("Password harus memiliki minimal 8 karakter.");
      return;
    }

    if (password.length > 72) {
      setError("Password tidak boleh lebih dari 72 karakter.");
      return;
    }

    if (password !== confirmation) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    if (!resetToken) {
      setError("Sesi reset tidak tersedia. Silakan minta OTP baru.");
      setStep(1);
      return;
    }

    setIsSending(true);

    try {
      const result = await postAuth("reset", {
        email: email.trim().toLowerCase(),
        resetToken,
        password,
      });

      setSuccess(
        result.message || "Password berhasil diperbarui. Silakan login.",
      );

      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || "Gagal memperbarui password.");
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (isSending) return;

    clearMessages();

    if (step === 3) {
      setResetToken("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep(2);
      return;
    }

    if (step === 2) {
      setOtp("");
      setResetToken("");
      setStep(1);
      return;
    }

    navigate("/login");
  };

  const handleResendOtp = async () => {
    if (isSending) return;

    clearMessages();
    setIsSending(true);
    setOtp("");
    setResetToken("");

    try {
      const result = await postAuth("request", {
        email: email.trim().toLowerCase(),
      });

      setSuccess(result.message || "OTP baru berhasil dikirim.");
    } catch (err) {
      setError(err.message || "Gagal meminta OTP baru.");
    } finally {
      setIsSending(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return "Lupa password?";
    if (step === 2) return "Verifikasi email";
    return "Buat password baru";
  };

  const getDescription = () => {
    if (step === 1) {
      return "Masukkan email akun LaporKita untuk memulai pemulihan password.";
    }

    if (step === 2) {
      return `Masukkan kode verifikasi yang dikirim ke ${email}.`;
    }

    return `Buat password baru untuk akun ${email}.`;
  };

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const passwordReady =
    newPassword.length >= 8 &&
    newPassword.length <= 72 &&
    passwordsMatch &&
    Boolean(resetToken);

  return (
    <main className="forgot-password-page">
      <div className="forgot-password-background">
        <div className="forgot-password-orb forgot-password-orb-one" />
        <div className="forgot-password-orb forgot-password-orb-two" />
        <div className="forgot-password-grid" />
      </div>

      <section className="forgot-password-card">
        <div className="forgot-password-logo">
          <img src={logo} alt="Logo LaporKita" />
        </div>

        <div className="forgot-password-icon">
          {step === 1 && <MailIcon />}
          {step === 2 && <ShieldIcon />}
          {step === 3 && <LockIcon />}
        </div>

        <div className="forgot-password-header">
          <span className="forgot-password-label">LAPORKITA ACCOUNT</span>
          <h1>{getTitle()}</h1>
          <p>{getDescription()}</p>
        </div>

        <div className="forgot-password-steps">
          <div className={`forgot-step ${step >= 1 ? "active" : ""}`}>
            <span>1</span>
            <small>Email</small>
          </div>

          <div className="forgot-step-line" />

          <div className={`forgot-step ${step >= 2 ? "active" : ""}`}>
            <span>2</span>
            <small>Verifikasi</small>
          </div>

          <div className="forgot-step-line" />

          <div className={`forgot-step ${step >= 3 ? "active" : ""}`}>
            <span>3</span>
            <small>Password</small>
          </div>
        </div>

        {error && (
          <div className="forgot-password-message error" role="alert">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="forgot-password-message success" role="status">
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleEmailSubmit}>
            <div className="forgot-form-group">
              <label htmlFor="forgot-email">Email</label>

              <div className="forgot-input-wrapper">
                <span className="forgot-input-icon">@</span>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email terdaftar"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={isSending}
            >
              <span>
                {isSending ? "Mengirim permintaan..." : "Kirim kode verifikasi"}
              </span>
              <span>→</span>
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="forgot-password-form" onSubmit={handleOtpSubmit}>
            <div className="forgot-form-group">
              <label htmlFor="forgot-otp">Kode verifikasi</label>

              <div className="forgot-input-wrapper">
                <span className="forgot-input-icon">#</span>
                <input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Masukkan 6 digit kode"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={isSending}
            >
              <span>{isSending ? "Memverifikasi..." : "Verifikasi kode"}</span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="forgot-resend-button"
              onClick={handleResendOtp}
              disabled={isSending}
            >
              {isSending ? "Memproses..." : "Kirim ulang kode"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            className="forgot-password-form"
            onSubmit={handlePasswordSubmit}
          >
            <div className="forgot-form-group">
              <label htmlFor="new-password">Password baru</label>

              <div className="forgot-input-wrapper">
                <span className="forgot-input-icon">
                  <LockIcon />
                </span>

                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Masukkan password baru"
                  autoComplete="new-password"
                  autoFocus
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  className="forgot-password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  <EyeIcon visible={showNewPassword} />
                </button>
              </div>
            </div>

            <div className="forgot-form-group">
              <label htmlFor="confirm-password">Konfirmasi password</label>

              <div className="forgot-input-wrapper">
                <span className="forgot-input-icon">
                  <LockIcon />
                </span>

                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />

                <button
                  type="button"
                  className="forgot-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <small
                  style={{
                    color: passwordsMatch ? "#15803d" : "#dc2626",
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {passwordsMatch
                    ? "Konfirmasi password cocok."
                    : "Konfirmasi password belum cocok."}
                </small>
              )}
            </div>

            <div className="forgot-password-hint">
              Password harus terdiri dari 8–72 karakter.
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={isSending}
            >
              <span>
                {isSending ? "Menyimpan password..." : "Simpan password"}
              </span>
              <span>✓</span>
            </button>

            {!passwordReady && (
              <small className="forgot-password-hint">
                Pastikan kedua password sama dan minimal 8 karakter.
              </small>
            )}
          </form>
        )}

        <button
          type="button"
          className="forgot-back-button"
          onClick={handleBack}
          disabled={isSending}
        >
          <span>←</span>
          <span>{step === 1 ? "Kembali ke Login" : "Kembali"}</span>
        </button>

        <div className="forgot-password-footer">
          LaporKita · Pelayanan publik digital
        </div>
      </section>
    </main>
  );
}

export default LupaPassword;
