"use client";

import React, { useEffect, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
};


export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  tone = "primary",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const confirmClasses =
    tone === "danger"
      ? "bg-error text-on-error hover:brightness-95"
      : "bg-primary text-on-primary hover:brightness-95";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={() => {
        if (!loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="w-full max-w-md rounded-[2rem] border border-outline-variant/20 bg-white p-6 shadow-[0_28px_90px_rgba(0,0,0,0.22)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
          <span className="material-symbols-outlined">delete</span>
        </div>
        <h2 id="confirm-modal-title" className="font-headline text-2xl font-black text-primary">
          {title}
        </h2>
        <p id="confirm-modal-message" className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          {message}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-2xl border border-outline-variant/40 bg-white px-5 py-3 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-2xl px-5 py-3 text-sm font-bold shadow-lg transition disabled:cursor-wait disabled:opacity-70 ${confirmClasses}`}
          >
            {loading ? "Removing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

