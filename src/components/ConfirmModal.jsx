import { useEffect, useRef } from "react";
import { LogOut, X } from "lucide-react";
import "../styles/confirm-modal.css";

function ConfirmModal({
  isOpen,
  title = "Yakin ingin keluar?",
  message = "Kamu harus login kembali untuk mengakses akunmu.",
  confirmText = "Ya, Keluar",
  cancelText = "Batal",
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    cancelButtonRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.();
        }
      }}
    >
      <div
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <button
          type="button"
          className="confirm-close"
          onClick={onCancel}
          aria-label="Tutup dialog"
        >
          <X size={19} />
        </button>

        <div className="confirm-icon">
          <LogOut size={28} />
        </div>

        <h2 id="confirm-title">{title}</h2>

        <p id="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="confirm-submit"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;