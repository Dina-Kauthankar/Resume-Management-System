"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface CompanySettings {
  id: number;
  company_name: string;
  company_logo: string | null;
  recruitment_email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  contact_message: string | null;
  office_hours: string | null;
  brand_color: string;
  allowed_formats: string;
  max_file_size_mb: number;
}

interface NotificationPreferences {
  notify_new_applications: number | boolean;
  notify_interviews: number | boolean;
  notify_selections: number | boolean;
  notify_batch_allocations: number | boolean;
}

type TabType = "profile" | "appearance" | "notifications" | "recruitment";

const PRESET_BRAND_COLORS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Amber", hex: "#d97706" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "Slate", hex: "#475569" },
];

export default function HRSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [loading, setLoading] = useState(true);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Company Profile State
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [recruitmentEmail, setRecruitmentEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [officeHours, setOfficeHours] = useState("");

  // Logo Upload State
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Appearance State
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [brandColor, setBrandColor] = useState("#4f46e5");

  // Notifications State
  const [notifyNewApplications, setNotifyNewApplications] = useState(true);
  const [notifyInterviews, setNotifyInterviews] = useState(true);
  const [notifySelections, setNotifySelections] = useState(true);
  const [notifyBatchAllocations, setNotifyBatchAllocations] = useState(true);

  // Recruitment Settings State
  const [allowedPdf, setAllowedPdf] = useState(true);
  const [allowedDocx, setAllowedDocx] = useState(true);
  const [allowedTex, setAllowedTex] = useState(true);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(5);

  // Helper to apply theme to document root
  const applyThemeMode = useCallback((mode: "light" | "dark" | "system") => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Theme Switch Handler
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyThemeMode(newTheme);

    // Notify shell and other windows
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { theme: newTheme } }));
    toast.success(`Theme switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode.`);
  };

  // Load Settings on Mount
  useEffect(() => {
    // 1. Initialize theme immediately
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | "system") || "system";
    setTheme(savedTheme);
    applyThemeMode(savedTheme);

    // 2. Listen to system preference changes if in system mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const current = (localStorage.getItem("theme") as "light" | "dark" | "system") || "system";
      if (current === "system") {
        applyThemeMode("system");
      }
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // 3. Load backend settings
    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/hr/settings", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load HR settings.");
        }

        const settings: CompanySettings = data.settings;
        const notifPrefs: NotificationPreferences = data.notificationPreferences;

        // Populate Company Profile
        if (settings) {
          setCompanyName(settings.company_name || "");
          setCompanyLogo(settings.company_logo || null);
          setRecruitmentEmail(settings.recruitment_email || "");
          setPhone(settings.phone || "");
          setAddress(settings.address || "");
          setWebsite(settings.website || "");
          setContactMessage(settings.contact_message || "");
          setOfficeHours(settings.office_hours || "Mon - Fri, 9:00 AM - 6:00 PM");

          // Populate Appearance
          const activeBrandColor = settings.brand_color || "#4f46e5";
          setBrandColor(activeBrandColor);
          document.documentElement.style.setProperty("--brand-primary", activeBrandColor);

          // Populate Recruitment Settings
          const formats = (settings.allowed_formats || "pdf,docx,tex").toLowerCase();
          setAllowedPdf(formats.includes("pdf"));
          setAllowedDocx(formats.includes("docx"));
          setAllowedTex(formats.includes("tex"));
          setMaxFileSizeMb(settings.max_file_size_mb || 5);
        }

        // Populate Notifications
        if (notifPrefs) {
          setNotifyNewApplications(Boolean(notifPrefs.notify_new_applications));
          setNotifyInterviews(Boolean(notifPrefs.notify_interviews));
          setNotifySelections(Boolean(notifPrefs.notify_selections));
          setNotifyBatchAllocations(Boolean(notifPrefs.notify_batch_allocations));
        }
      } catch (err: any) {
        console.error("Error loading settings:", err);
        setErrorMsg(err.message || "Failed to retrieve settings.");
        toast.error(err.message || "Failed to retrieve settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [applyThemeMode]);

  // Logo File Selection Handler
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (PNG, JPG, WEBP, SVG).");
      toast.error("Please select an image file (PNG, JPG, WEBP, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Logo image must be smaller than 2 MB.");
      toast.error("Logo image must be smaller than 2 MB.");
      return;
    }

    setSelectedLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setErrorMsg(null);
  };

  // Upload Logo Action
  const handleUploadLogo = async () => {
    if (!selectedLogoFile) {
      setErrorMsg("Please choose an image file first.");
      toast.error("Please choose an image file first.");
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append("logo", selectedLogoFile);

      const res = await fetch("/api/hr/settings/logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo.");
      }

      setCompanyLogo(data.logoUrl);
      setSelectedLogoFile(null);
      setLogoPreview(null);
      const msg = "Company logo uploaded and updated successfully!";
      setSuccessMsg(msg);
      toast.success(msg);

      // Notify layout shell to update logo
      window.dispatchEvent(
        new CustomEvent("rms-settings-updated", {
          detail: { company_logo: data.logoUrl },
        })
      );
    } catch (err: any) {
      console.error("Logo upload error:", err);
      const msg = err.message || "Failed to upload company logo.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save Company Profile Action
  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!companyName.trim()) {
      const msg = "Company name is required.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    try {
      setSavingSection("profile");

      const payload = {
        companyProfile: {
          companyName: companyName.trim(),
          recruitmentEmail: recruitmentEmail.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          website: website.trim() || null,
          contactMessage: contactMessage.trim() || null,
          officeHours: officeHours.trim() || null,
        },
      };

      const res = await fetch("/api/hr/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save company profile.");
      }

      // Update state from persisted API response
      if (data.settings) {
        const s: CompanySettings = data.settings;
        setCompanyName(s.company_name || "");
        setCompanyLogo(s.company_logo || null);
        setRecruitmentEmail(s.recruitment_email || "");
        setPhone(s.phone || "");
        setAddress(s.address || "");
        setWebsite(s.website || "");
        setContactMessage(s.contact_message || "");
        setOfficeHours(s.office_hours || "Mon - Fri, 9:00 AM - 6:00 PM");

        window.dispatchEvent(
          new CustomEvent("rms-settings-updated", {
            detail: s,
          })
        );
      }

      const msg = "Company profile updated successfully!";
      setSuccessMsg(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error("Save company profile error:", err);
      const msg = err.message || "Failed to save company profile.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Appearance Action
  const handleSaveAppearance = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSavingSection("appearance");

      const payload = {
        appearance: {
          brandColor: brandColor.trim(),
        },
      };

      const res = await fetch("/api/hr/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save appearance settings.");
      }

      if (data.settings) {
        const activeBrandColor = data.settings.brand_color || brandColor;
        setBrandColor(activeBrandColor);
        document.documentElement.style.setProperty("--brand-primary", activeBrandColor);

        window.dispatchEvent(
          new CustomEvent("rms-settings-updated", {
            detail: data.settings,
          })
        );
      }

      const msg = "Appearance and company brand color saved successfully!";
      setSuccessMsg(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error("Save appearance error:", err);
      const msg = err.message || "Failed to save appearance.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Notification Preferences Action
  const handleSaveNotifications = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSavingSection("notifications");

      const payload = {
        notificationPreferences: {
          notifyNewApplications: notifyNewApplications ? 1 : 0,
          notifyInterviews: notifyInterviews ? 1 : 0,
          notifySelections: notifySelections ? 1 : 0,
          notifyBatchAllocations: notifyBatchAllocations ? 1 : 0,
        },
      };

      const res = await fetch("/api/hr/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save notification preferences.");
      }

      if (data.notificationPreferences) {
        const np: NotificationPreferences = data.notificationPreferences;
        setNotifyNewApplications(Boolean(np.notify_new_applications));
        setNotifyInterviews(Boolean(np.notify_interviews));
        setNotifySelections(Boolean(np.notify_selections));
        setNotifyBatchAllocations(Boolean(np.notify_batch_allocations));
      }

      const msg = "In-App notification preferences saved successfully!";
      setSuccessMsg(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error("Save notification preferences error:", err);
      const msg = err.message || "Failed to save notification preferences.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Recruitment Settings Action
  const handleSaveRecruitment = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const formats: string[] = [];
    if (allowedPdf) formats.push("pdf");
    if (allowedDocx) formats.push("docx");
    if (allowedTex) formats.push("tex");

    if (formats.length === 0) {
      const msg = "Please select at least one allowed resume file format.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    try {
      setSavingSection("recruitment");

      const payload = {
        recruitment: {
          allowedFormats: formats,
          maxFileSizeMb: Number(maxFileSizeMb),
        },
      };

      const res = await fetch("/api/hr/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save recruitment settings.");
      }

      if (data.settings) {
        const returnedFormats = (data.settings.allowed_formats || "pdf,docx,tex").toLowerCase();
        setAllowedPdf(returnedFormats.includes("pdf"));
        setAllowedDocx(returnedFormats.includes("docx"));
        setAllowedTex(returnedFormats.includes("tex"));
        setMaxFileSizeMb(data.settings.max_file_size_mb || 5);
      }

      const msg = "Recruitment upload settings saved successfully!";
      setSuccessMsg(msg);
      toast.success(msg);
    } catch (err: any) {
      console.error("Save recruitment error:", err);
      const msg = err.message || "Failed to save recruitment settings.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-12 bg-gray-200 rounded-xl w-full" />
        <div className="h-96 bg-gray-200 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          HR Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage company profile, portal appearance, recruitment parameters, and in-app notification preferences.
        </p>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-medium">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in duration-200 shadow-2xs">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-medium">{successMsg}</div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => { setActiveTab("profile"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            activeTab === "profile"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Company Profile
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("appearance"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            activeTab === "appearance"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4 5 5 0 015-5c1.105 0 2 .895 2 2a2 2 0 002 2c1.105 0 2 .895 2 2a4 4 0 01-4 4H7zM17 3a4 4 0 014 4 5 5 0 01-5 5c-1.105 0-2-.895-2-2a2 2 0 00-2-2c-1.105 0-2-.895-2-2a4 4 0 014-4h3z" />
          </svg>
          Appearance
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("notifications"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            activeTab === "notifications"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab("recruitment"); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            activeTab === "recruitment"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Recruitment
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. COMPANY PROFILE TAB */}
      {/* ======================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Logo Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <h2 className="text-base font-bold text-gray-900">Company Logo</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload a brand logo used in the portal navigation and recruitment headers. Max size: 2 MB.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-6">
              {/* Preview */}
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center p-2 overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                ) : companyLogo ? (
                  <img src={companyLogo} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400 font-medium">No Logo</span>
                )}
              </div>

              {/* Upload controls */}
              <div className="space-y-3 flex-1">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoSelect}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Choose New File...
                  </button>

                  {selectedLogoFile && (
                    <button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {uploadingLogo ? "Uploading..." : "Upload & Save Logo"}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-400">
                  {selectedLogoFile
                    ? `Selected: ${selectedLogoFile.name} (${(selectedLogoFile.size / 1024).toFixed(1)} KB)`
                    : "Supported formats: PNG, JPG, JPEG, WEBP, SVG."}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveCompanyProfile} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Organization Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                General company contact information and recruitment portal identity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Demerge Systems India"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recruitment Email
                </label>
                <input
                  type="email"
                  value={recruitmentEmail}
                  onChange={(e) => setRecruitmentEmail(e.target.value)}
                  placeholder="recruitment@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://demergesystems.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Office Hours
                </label>
                <input
                  type="text"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="Mon - Fri, 9:00 AM - 6:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Office Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Headquarters address, City, State, ZIP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Message (Displayed on candidate inquiries & footer)
                </label>
                <textarea
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="e.g. We are thrilled to review your application. Our recruitment team typically responds within 3-5 business days."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSection === "profile"}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingSection === "profile" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Company Profile"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. APPEARANCE TAB */}
      {/* ======================================================== */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          {/* Theme Selector */}
          

          {/* Company Brand Color */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">Company Brand Color</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Define the primary company branding color used across HR portal accents, sidebar badges, and buttons.
              </p>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Preset Brand Palettes
              </label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_BRAND_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setBrandColor(c.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      brandColor.toLowerCase() === c.hex.toLowerCase()
                        ? "border-gray-900 bg-gray-50 shadow-2xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
                  aria-label="Color picker"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    HEX Color Code
                  </label>
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#4f46e5"
                    className="w-32 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-gray-900"
                  />
                </div>
              </div>

              {/* Preview Button */}
              <div className="sm:ml-auto">
                <button
                  type="button"
                  style={{ backgroundColor: brandColor }}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-sm transition-transform active:scale-95"
                >
                  Brand Accent Preview
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAppearance}
                disabled={savingSection === "appearance"}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingSection === "appearance" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Appearance Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NOTIFICATIONS TAB (IN-APP) */}
      {/* ======================================================== */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* In-App Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-start gap-3 shadow-2xs">
            <svg className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="leading-relaxed">
              <p className="font-semibold text-indigo-950">In-App Notification Preferences</p>
              <p className="text-indigo-700 mt-0.5">
                These settings configure your live in-app notifications appearing under the HR header bell icon (🔔).
                No recruitment emails are sent to ensure privacy and focus.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-2xs">
            {/* 1. New Applications */}
            <div className="p-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">New Applications</h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                  Receive an immediate in-app notification when a candidate submits an application for an active project.
                  Clicking the notification directs you straight to the application evaluation page.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={notifyNewApplications}
                  onChange={(e) => setNotifyNewApplications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* 2. Interview Notifications */}
            <div className="p-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Interview Notifications</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                  Receive in-app alerts whenever an interview is scheduled, rescheduled, updated, or cancelled in the system.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={notifyInterviews}
                  onChange={(e) => setNotifyInterviews(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* 3. Selection Notifications */}
            <div className="p-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Selection Notifications</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                  Receive in-app notifications whenever a candidate has been selected for a project or role.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={notifySelections}
                  onChange={(e) => setNotifySelections(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* 4. Batch Allocation Notifications */}
            <div className="p-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Batch Allocation Notifications</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                  Receive in-app notifications when a batch intern team allocation is successfully confirmed and finalized.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={notifyBatchAllocations}
                  onChange={(e) => setNotifyBatchAllocations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveNotifications}
              disabled={savingSection === "notifications"}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {savingSection === "notifications" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. RECRUITMENT TAB */}
      {/* ======================================================== */}
      {activeTab === "recruitment" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Resume Upload Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure acceptable candidate resume file types and maximum upload limits enforced server-side.
              </p>
            </div>

            {/* Allowed Formats */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Allowed File Formats
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* PDF */}
                <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  allowedPdf ? "border-indigo-600 bg-indigo-50/30" : "border-gray-200 bg-white"
                }`}>
                  <input
                    type="checkbox"
                    checked={allowedPdf}
                    onChange={(e) => setAllowedPdf(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">PDF (.pdf)</p>
                    <p className="text-[11px] text-gray-500">Standard document format</p>
                  </div>
                </label>

                {/* DOCX */}
                <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  allowedDocx ? "border-indigo-600 bg-indigo-50/30" : "border-gray-200 bg-white"
                }`}>
                  <input
                    type="checkbox"
                    checked={allowedDocx}
                    onChange={(e) => setAllowedDocx(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">DOCX (.docx)</p>
                    <p className="text-[11px] text-gray-500">Microsoft Word documents</p>
                  </div>
                </label>

                {/* TEX */}
                <label className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  allowedTex ? "border-indigo-600 bg-indigo-50/30" : "border-gray-200 bg-white"
                }`}>
                  <input
                    type="checkbox"
                    checked={allowedTex}
                    onChange={(e) => setAllowedTex(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">LaTeX (.tex)</p>
                    <p className="text-[11px] text-gray-500">Plain text LaTeX resumes</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Maximum File Size */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Maximum Resume File Size
                </label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {maxFileSizeMb} MB
                </span>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={maxFileSizeMb}
                  onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxFileSizeMb}
                  onChange={(e) => setMaxFileSizeMb(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="w-20 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-center text-gray-900"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Recommended limit: 5 MB. Candidates uploading files larger than this threshold will receive an informative error.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveRecruitment}
                disabled={savingSection === "recruitment"}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {savingSection === "recruitment" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Recruitment Settings"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
