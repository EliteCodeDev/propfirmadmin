"use client";

import React, { useEffect, useMemo, useState } from "react";

export interface BasicUser {
  userID?: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isConfirmed?: boolean;
  isBlocked?: boolean;
  isVerified?: boolean;
  phone?: string | null;
}

export interface EditUserModalProps {
  open: boolean;
  user: BasicUser | null;
  onClose: () => void;
  onSubmit: (values: Partial<BasicUser>, userId: string) => Promise<void> | void;
  title?: string;
  submitLabel?: string;
}

export default function EditUserModal({ open, user, onClose, onSubmit, title = "Edit User", submitLabel = "Save" }: EditUserModalProps) {
  const userId = useMemo(() => String(user?.userID ?? user?.id ?? ""), [user]);

  const [values, setValues] = useState<Partial<BasicUser>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setValues({
        username: user.username ?? "",
        email: user.email ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? "",
        isConfirmed: Boolean(user.isConfirmed),
        isBlocked: Boolean(user.isBlocked),
        isVerified: Boolean(user.isVerified),
      });
      setError(null);
    }
  }, [user]);

  if (!open) return null;

  const update = <K extends keyof BasicUser>(k: K, v: BasicUser[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleSubmit = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values, userId);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save changes";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={values.username ?? ""}
              onChange={(e) => update("username", e.target.value)}
              placeholder="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={values.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={values.firstName ?? ""}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={values.lastName ?? ""}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Last name"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              value={values.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600"
                checked={Boolean(values.isConfirmed)}
                onChange={(e) => update("isConfirmed", e.target.checked)}
              />
              Confirmed
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600"
                checked={Boolean(values.isBlocked)}
                onChange={(e) => update("isBlocked", e.target.checked)}
              />
              Blocked
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="rounded border-gray-300 dark:border-gray-600"
                checked={Boolean(values.isVerified)}
                onChange={(e) => update("isVerified", e.target.checked)}
              />
              Verified
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button className="px-3 py-2 text-sm rounded-lg border" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
