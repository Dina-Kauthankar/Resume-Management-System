"use client";

import { useEffect, useState } from "react";

interface HRProfile {
  id: number;
  fullName: string;
  email: string;
  role: "HR";
  companyAddress: string | null;
  createdAt: string;
}

export default function HRProfilePage() {
  const [profile, setProfile] = useState<HRProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/hr/profile", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load HR profile.");
        }

        const prof = data.profile as HRProfile;
        setProfile(prof);
        setFullName(prof.fullName || "");
        setEmail(prof.email || "");
        setCompanyAddress(prof.companyAddress || "");
      } catch (err) {
        console.error("Load HR profile error:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSaving(true);
      const payload: {
        fullName: string;
        email: string;
        companyAddress: string;
        password?: string;
      } = {
        fullName: fullName.trim(),
        email: email.trim(),
        companyAddress: companyAddress.trim(),
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch("/api/hr/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      if (data.profile) {
        setProfile(data.profile);
      }
      setPassword("");
      setSuccessMessage("HR profile and company address updated successfully!");
    } catch (err) {
      console.error("Update HR profile error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-gray-900">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 text-gray-900">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Company & Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your recruitment administrator account and official company address.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-600/20">
            {fullName.charAt(0).toUpperCase() || "H"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{fullName || "HR Administrator"}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Change Password <span className="text-gray-400 font-normal lowercase">(leave blank to keep current)</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 sm:w-1/2"
            />
          </div>

          {/* <div className="pt-2 border-t border-gray-100">
            <label htmlFor="companyAddress" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Company Physical Address
            </label>
            <textarea
              id="companyAddress"
              rows={4}
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Building name, Floor/Suite, Street, City, State, ZIP code..."
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              This address will automatically populate as the default interview location whenever you schedule an <strong>Offline Interview</strong>.
            </p>
          </div> */}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
            >
              {saving ? "Saving Changes..." : "Save Profile & Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
