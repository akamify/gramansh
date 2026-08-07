"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  fetchAdminTestimonials,
  updateAdminTestimonial,
  type AdminTestimonial,
} from "@/app/lib/apiClient";

type FormState = {
  quote: string;
  name: string;
  role: string;
  order: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  quote: "",
  name: "",
  role: "",
  order: "0",
  isActive: true,
};

const HOMEPAGE_PUBLIC_CACHE_KEY = "gramansh_homepage_public_cache_v1";
const TESTIMONIALS_STORAGE_KEY = "sr_testimonials";

function clearPublicTestimonialCaches() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(HOMEPAGE_PUBLIC_CACHE_KEY);
  window.localStorage.removeItem(TESTIMONIALS_STORAGE_KEY);
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Live" : "Hidden"}
    </span>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[12px] border border-slate-200 bg-white p-4"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
            <div className="grid flex-1 gap-3">
              <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-8/12 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 flex gap-2">
                <div className="h-7 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-7 w-20 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonial | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const hiddenCount = Math.max(0, items.length - activeCount);

  const load = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      setError("");

      const rows = await fetchAdminTestimonials();
      setItems(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load testimonials.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!modalOpen && !deleteTarget) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (saving || deletingId) return;

      setModalOpen(false);
      setDeleteTarget(null);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, deleteTarget, saving, deletingId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const startEdit = (item: AdminTestimonial) => {
    setEditingId(item.id);
    setForm({
      quote: item.quote || "",
      name: item.name || "",
      role: item.role || "",
      order: String(item.order ?? 0),
      isActive: Boolean(item.isActive),
    });
    setError("");
    setMessage("");
    setModalOpen(true);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quote = form.quote.trim();
    const name = form.name.trim();

    if (!quote || !name) {
      setError("Quote and customer name are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        quote,
        name,
        role: form.role.trim(),
        order: Number(form.order || 0),
        isActive: form.isActive,
      };

      if (editingId) {
        await updateAdminTestimonial(editingId, payload);
        setMessage("Testimonial updated successfully.");
      } else {
        await createAdminTestimonial(payload);
        setMessage("Testimonial created successfully.");
      }

      clearPublicTestimonialCaches();
      await load();

      setModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deletingId) return;

    try {
      setDeletingId(deleteTarget.id);
      setError("");
      setMessage("");

      await deleteAdminTestimonial(deleteTarget.id);
      clearPublicTestimonialCaches();

      setMessage("Testimonial removed successfully.");

      if (editingId === deleteTarget.id) {
        resetForm();
        setModalOpen(false);
      }

      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 p-4 text-slate-900 md:p-6">
      <header className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Content Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
              Testimonials
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Create, update and manage homepage customer testimonials. Active
              testimonials appear publicly in display order.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load("refresh")}
              disabled={loading || refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                strokeWidth={2.6}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-slate-950 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.8} />
              Add testimonial
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[12px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold text-slate-500">Total records</p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {items.length}
            </p>
          </div>

          <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">Live records</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">
              {activeCount}
            </p>
          </div>

          <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-500">Hidden records</p>
            <p className="mt-1 text-2xl font-black text-slate-700">
              {hiddenCount}
            </p>
          </div>
        </div>
      </header>

      {(error || message) && (
        <div className="grid gap-3">
          {error ? (
            <div className="flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <span>{error}</span>
            </div>
          ) : null}

          {message ? (
            <div className="flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}
        </div>
      )}

      <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            <h2 className="text-sm font-black text-slate-950">
              Testimonial list
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Sorted and displayed according to API response.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-400">
            {loading ? "Loading records..." : `${items.length} records found`}
          </div>
        </div>

        <div className="p-4 md:p-5">
          {loading ? (
            <TestimonialsSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <p className="text-sm font-black text-slate-700">
                No testimonials found
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Create your first customer testimonial for the homepage.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={2.8} />
                Add testimonial
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className={`group rounded-[12px] border bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/60 ${
                    editingId === item.id
                      ? "border-slate-950 ring-2 ring-slate-950/10"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-base font-black text-slate-700">
                        {item.name?.trim().charAt(0).toUpperCase() || "?"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black text-slate-950">
                            {item.name || "Unnamed customer"}
                          </h3>

                          <StatusPill active={item.isActive} />

                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">
                            Order {item.order}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                          {item.role || "Client"}
                        </p>

                        <p className="mt-3 line-clamp-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                          “{item.quote}”
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white active:scale-[0.98]"
                      >
                        <Edit3 size={14} strokeWidth={2.6} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={deletingId === item.id}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[9px] border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} strokeWidth={2.6} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <form
            onSubmit={onSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="modal-card w-full max-w-2xl overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {editingId ? "Update testimonial" : "Create testimonial"}
                </p>

                <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                  {editingId ? "Edit customer story" : "New customer story"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="grid h-9 w-9 place-items-center rounded-[9px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={18} strokeWidth={2.6} />
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-4 overflow-y-auto px-5 py-5">
              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">
                  Quote <span className="text-red-500">*</span>
                </span>

                <textarea
                  value={form.quote}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quote: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Write the customer experience here..."
                  className="min-h-[130px] resize-none rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                  required
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-500">
                    Customer name <span className="text-red-500">*</span>
                  </span>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="John Doe"
                    className="h-11 rounded-[12px] border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-500">
                    Designation / Role
                  </span>

                  <input
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    placeholder="CEO, TechCorp"
                    className="h-11 rounded-[12px] border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-end">
                <label className="grid gap-2">
                  <span className="text-xs font-black text-slate-500">
                    Display order
                  </span>

                  <input
                    type="number"
                    value={form.order}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order: event.target.value,
                      }))
                    }
                    className="h-11 rounded-[12px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                  />
                </label>

                <label className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-slate-300 bg-white px-4 transition hover:border-slate-400">
                  <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                    {form.isActive ? (
                      <Eye size={16} strokeWidth={2.5} />
                    ) : (
                      <EyeOff size={16} strokeWidth={2.5} />
                    )}
                    Active on homepage
                  </span>

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="sr-only"
                  />

                  <span
                    className={`relative h-6 w-11 rounded-full transition ${
                      form.isActive ? "bg-slate-950" : "bg-slate-300"
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        form.isActive ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  <>
                    <Edit3 size={16} strokeWidth={2.6} />
                    Update testimonial
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.8} />
                    Create testimonial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!deletingId) setDeleteTarget(null);
          }}
        >
          <div
            className="modal-card w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} strokeWidth={2.6} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Delete testimonial?
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  This will permanently delete testimonial from{" "}
                  <b className="text-slate-800">
                    {deleteTarget.name || "this customer"}
                  </b>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} strokeWidth={2.6} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .modal-card {
          animation: modalIn 180ms ease-out;
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-card,
          .modal-card * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
