
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import "../styles/lupa-password.css";
import logo from "../assets/logo-laporkita.png";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://laporkita.lashy.blitz.cloud"
).replace(/\/+$/, "");

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

async function postAuth(path, body) {
  let response;

  try {
    response = await fetch(
      `${API_URL}/api/auth/forgot-password/${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server. Periksa koneksi internet kamu."
    );
  }

  const result = await response.json().catch(() => null);

  if (!result) {
    throw new Error("Respons server tidak valid.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message ||
        result.error ||
        "Permintaan gagal. Silakan coba kembali."
    );
  }

  return result;
}

function LupaPassword() {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [otpDigits, setOtpDigits] = useState(
    Array(OTP_LENGTH).fill("")
  );

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resetCompleted, setResetCompleted] = useState(false);

  const otpRefs = useRef([]);
  const redirectTimer = useRef(null);

  const otp = otpDigits.join("");

  // =========================
  // TIMER KIRIM ULANG
  // =========================

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = window.setTimeout(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  // =========================
  // CLEANUP REDIRECT
  // =========================

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        window.clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  // =========================
  // AUTO FOCUS OTP
  // =========================

  useEffect(() => {
    if (step !== 2) return;

    const timer = window.setTimeout(() => {
      const firstEmpty = otpDigits.findIndex(
        (digit) => digit === ""
      );

      const targetIndex =
        firstEmpty === -1 ? OTP_LENGTH - 1 : firstEmpty;

      otpRefs.current[targetIndex]?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [step]);

  // =========================
  // HELPER
  // =========================

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetOtp = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(""));
  };

  const focusOtp = (index) => {
    if (index < 0 || index >= OTP_LENGTH) return;

    otpRefs.current[index]?.focus();
  };

  // =========================
  // OTP INPUT
  // =========================

  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      setOtpDigits((prev) => {
        const updated = [...prev];
        updated[index] = "";
        return updated;
      });

      return;
    }

    setOtpDigits((prev) => {
      const updated = [...prev];

      cleanValue
        .slice(0, OTP_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          updated[index + offset] = digit;
        });

      return updated;
    });

    const nextIndex = Math.min(
      index + cleanValue.length,
      OTP_LENGTH - 1
    );

    focusOtp(nextIndex);
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (otpDigits[index]) {
        setOtpDigits((prev) => {
          const updated = [...prev];
          updated[index] = "";
          return updated;
        });
      } else if (index > 0) {
        setOtpDigits((prev) => {
          const updated = [...prev];
          updated[index - 1] = "";
          return updated;
        });

        focusOtp(index - 1);
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusOtp(index - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusOtp(index + 1);
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const updated = Array(OTP_LENGTH).fill("");

    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtpDigits(updated);

    focusOtp(
      Math.min(pasted.length, OTP_LENGTH - 1)
    );
  };

  // =========================
  // STEP 1: REQUEST OTP
  // =========================

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

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

      resetOtp();
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      setResendTimer(RESEND_SECONDS);
      setStep(2);

      setSuccess(
        result.message ||
          "Jika email terdaftar, kode verifikasi akan dikirim."
      );
    } catch (err) {
      setError(
        err.message || "Gagal mengirim kode verifikasi."
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================
  // STEP 2: VERIFY OTP
  // =========================

  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    if (isSending) return;

    clearMessages();

    if (!/^\d{6}$/.test(otp)) {
      setError("Masukkan 6 digit kode verifikasi.");
      return;
    }

    setIsSending(true);

    try {
      const result = await postAuth("verify", {
        email: email.trim().toLowerCase(),
        otp,
      });

      if (!result.resetToken) {
        throw new Error(
          "Token reset tidak diterima dari server."
        );
      }

      setResetToken(result.resetToken);
      setStep(3);

      setSuccess(
        "Kode berhasil diverifikasi. Silakan buat password baru."
      );
    } catch (err) {
      setError(
        err.message || "Kode verifikasi tidak valid."
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================
  // RESEND OTP
  // =========================

  const handleResendOtp = async () => {
    if (isSending || resendTimer > 0) return;

    clearMessages();
    setIsSending(true);

    try {
      const result = await postAuth("request", {
        email: email.trim().toLowerCase(),
      });

      resetOtp();
      setResetToken("");
      setResendTimer(RESEND_SECONDS);

      setSuccess(
        result.message ||
          "Permintaan kode verifikasi baru berhasil."
      );

      focusOtp(0);
    } catch (err) {
      setError(
        err.message || "Gagal mengirim ulang kode."
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================
  // STEP 3: RESET PASSWORD
  // =========================

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (isSending || resetCompleted) return;

    clearMessages();

    if (!newPassword || !confirmPassword) {
      setError("Lengkapi kedua kolom password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (newPassword.length > 72) {
      setError("Password maksimal 72 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (!resetToken) {
      setError(
        "Sesi reset tidak tersedia. Silakan verifikasi ulang."
      );
      setStep(1);
      return;
    }

    setIsSending(true);

    try {
      const result = await postAuth("reset", {
        email: email.trim().toLowerCase(),
        resetToken,
        password: newPassword,
      });

      setResetCompleted(true);
      setResetToken("");

      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        result.message ||
          "Password berhasil diperbarui."
      );

      redirectTimer.current = window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.message || "Gagal memperbarui password."
      );
    } finally {
      setIsSending(false);
    }
  };

  // =========================
  // BACK
  // =========================

  const handleBack = () => {
    if (isSending || resetCompleted) return;

    clearMessages();

    if (step === 3) {
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      resetOtp();
      setStep(2);
      return;
    }

    if (step === 2) {
      resetOtp();
      setResetToken("");
      setStep(1);
      return;
    }

    navigate("/login");
  };

  // =========================
  // DISPLAY DATA
  // =========================

  const stepInfo = {
    1: {
      label: "PEMULIHAN AKUN",
      title: "Lupa Password?",
      description:
        "Jangan khawatir. Masukkan email yang terdaftar untuk memulihkan akses akun LaporKita.",
      icon: Mail,
    },

    2: {
      label: "VERIFIKASI KEAMANAN",
      title: "Verifikasi Email",
      description:
        "Masukkan 6 digit kode verifikasi yang dikirim ke email kamu.",
      icon: ShieldCheck,
    },

    3: {
      label: "ATUR PASSWORD",
      title: "Password Baru",
      description:
        "Buat password baru untuk mengamankan akun LaporKita kamu.",
      icon: KeyRound,
    },
  };

  const currentStep = stepInfo[step];
  const StepIcon = currentStep.icon;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const passwordValid =
    newPassword.length >= 8 &&
    newPassword.length <= 72;

  const passwordReady =
    passwordValid &&
    passwordsMatch &&
    Boolean(resetToken);

  // =========================
  // RENDER
  // =========================

  return (
    <main className="forgot-password-page">
      {/* BACKGROUND */}

      <div
        className="forgot-password-background"
        aria-hidden="true"
      >
        <div className="forgot-password-orb forgot-password-orb-one" />
        <div className="forgot-password-orb forgot-password-orb-two" />
        <div className="forgot-password-orb forgot-password-orb-three" />
        <div className="forgot-password-grid" />
      </div>

      {/* CARD */}

      <section className="forgot-password-card">
        {/* LOGO */}

        <div className="forgot-password-logo">
          <img src={logo} alt="Logo LaporKita" />
          <div>
            <strong>LaporKita</strong>
            <span>Platform Pengaduan Publik</span>
          </div>
        </div>

        {/* ICON */}

        <div className="forgot-password-icon">
          <StepIcon size={28} strokeWidth={1.8} />
        </div>

        {/* HEADER */}

        <div className="forgot-password-header">
          <span className="forgot-password-label">
            {currentStep.label}
          </span>

          <h1>{currentStep.title}</h1>

          <p>{currentStep.description}</p>
        </div>

        {/* PROGRESS */}

        <div className="forgot-password-steps">
          {[
            { number: 1, label: "Email" },
            { number: 2, label: "Verifikasi" },
            { number: 3, label: "Password" },
          ].map((item, index) => (
            <div
              className="forgot-step-group"
              key={item.number}
            >
              <div
                className={`forgot-step ${
                  step === item.number ? "active" : ""
                } ${
                  step > item.number ? "completed" : ""
                }`}
              >
                <span className="forgot-step-number">
                  {step > item.number ? (
                    <Check size={15} />
                  ) : (
                    item.number
                  )}
                </span>

                <small>{item.label}</small>
              </div>

              {index < 2 && (
                <div
                  className={`forgot-step-line ${
                    step > item.number ? "completed" : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ALERT */}

        {error && (
          <div
            className="forgot-password-message error"
            role="alert"
          >
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            className="forgot-password-message success"
            role="status"
          >
            <CheckCircle2 size={18} />
            <p>{success}</p>
          </div>
        )}

        {/* =========================
            STEP 1 - EMAIL
            ========================= */}

        {step === 1 && (
          <form
            className="forgot-password-form"
            onSubmit={handleEmailSubmit}
          >
            <div className="forgot-form-group">
              <label htmlFor="forgot-email">
                Alamat Email
              </label>

              <div className="forgot-input-wrapper">
                <Mail
                  className="forgot-input-icon"
                  size={19}
                />

                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Masukkan email terdaftar"
                  autoComplete="email"
                  disabled={isSending}
                  autoFocus
                  required
                />
              </div>

              <small className="forgot-field-hint">
                Gunakan email yang terhubung dengan akun
                LaporKita.
              </small>
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <RefreshCw
                    size={18}
                    className="forgot-spinning"
                  />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Kode Verifikasi
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* =========================
            STEP 2 - OTP
            ========================= */}

        {step === 2 && (
          <form
            className="forgot-password-form"
            onSubmit={handleOtpSubmit}
          >
            <div className="forgot-otp-email">
              <Mail size={16} />
              <span>{email}</span>
            </div>

            <div className="forgot-form-group">
              <label
                className="forgot-otp-label"
                htmlFor="forgot-otp-0"
              >
                Kode Verifikasi
              </label>

              <div
                className="forgot-otp-container"
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    id={`forgot-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleOtpChange(
                        index,
                        event.target.value
                      )
                    }
                    onKeyDown={(event) =>
                      handleOtpKeyDown(index, event)
                    }
                    onFocus={(event) =>
                      event.target.select()
                    }
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    aria-label={`Digit OTP ${index + 1}`}
                    disabled={isSending}
                    className={`forgot-otp-box ${
                      digit ? "filled" : ""
                    }`}
                  />
                ))}
              </div>

              <p className="forgot-otp-helper">
                <ShieldCheck size={14} />
                Jangan bagikan kode kepada siapa pun.
              </p>
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={
                isSending || !/^\d{6}$/.test(otp)
              }
            >
              {isSending ? (
                <>
                  <RefreshCw
                    size={18}
                    className="forgot-spinning"
                  />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Verifikasi Kode
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="forgot-otp-resend">
              <p>Belum menerima kode?</p>

              {resendTimer > 0 ? (
                <div className="forgot-resend-timer">
                  <Clock3 size={15} />
                  Kirim ulang dalam {resendTimer} detik
                </div>
              ) : (
                <button
                  type="button"
                  className="forgot-resend-button"
                  onClick={handleResendOtp}
                  disabled={isSending}
                >
                  <RefreshCw size={15} />
                  Kirim Ulang Kode
                </button>
              )}
            </div>
          </form>
        )}

        {/* =========================
            STEP 3 - NEW PASSWORD
            ========================= */}

        {step === 3 && (
          <form
            className="forgot-password-form"
            onSubmit={handlePasswordSubmit}
          >
            <div className="forgot-form-group">
              <label htmlFor="new-password">
                Password Baru
              </label>

              <div className="forgot-input-wrapper">
                <LockKeyhole
                  className="forgot-input-icon"
                  size={19}
                />

                <input
                  id="new-password"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Masukkan password baru"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  disabled={isSending || resetCompleted}
                  autoFocus
                  required
                />

                <button
                  type="button"
                  className="forgot-password-toggle"
                  onClick={() =>
                    setShowNewPassword((prev) => !prev)
                  }
                  aria-label={
                    showNewPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <div
                className={`forgot-password-requirement ${
                  passwordValid ? "valid" : ""
                }`}
              >
                <CheckCircle2 size={14} />
                Gunakan 8–72 karakter.
              </div>
            </div>

            <div className="forgot-form-group">
              <label htmlFor="confirm-password">
                Konfirmasi Password
              </label>

              <div className="forgot-input-wrapper">
                <LockKeyhole
                  className="forgot-input-icon"
                  size={19}
                />

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  disabled={isSending || resetCompleted}
                  required
                />

                <button
                  type="button"
                  className="forgot-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div
                  className={`forgot-password-requirement ${
                    passwordsMatch ? "valid" : "invalid"
                  }`}
                >
                  {passwordsMatch ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}

                  {passwordsMatch
                    ? "Password sudah cocok."
                    : "Password belum cocok."}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={
                isSending ||
                !passwordReady ||
                resetCompleted
              }
            >
              {isSending ? (
                <>
                  <RefreshCw
                    size={18}
                    className="forgot-spinning"
                  />
                  Menyimpan...
                </>
              ) : resetCompleted ? (
                <>
                  <CheckCircle2 size={18} />
                  Password Berhasil Diubah
                </>
              ) : (
                <>
                  Simpan Password Baru
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {resetCompleted && (
              <p className="forgot-redirect-info">
                Mengarahkan ke halaman login...
              </p>
            )}
          </form>
        )}

        {/* BACK BUTTON */}

        {!resetCompleted && (
          <button
            type="button"
            className="forgot-back-button"
            onClick={handleBack}
            disabled={isSending}
          >
            <ArrowLeft size={17} />

            {step === 1
              ? "Kembali ke Login"
              : "Kembali"}
          </button>
        )}

        {/* FOOTER */}

        <div className="forgot-password-footer">
          <ShieldCheck size={15} />
          <span>
            LaporKita · Pelayanan Publik Digital
          </span>
        </div>
      </section>
    </main>
  );
}

export default LupaPassword;
