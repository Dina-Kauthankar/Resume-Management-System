"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: number;
  recipient_user_id: number;
  type: string;
  title: string;
  message: string;
  reference_id: number | null;
  reference_type: string | null;
  is_read: number;
  created_at: string;
}

interface NotificationDropdownProps {
  userRole: "HR" | "CANDIDATE";
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({
  userRole,
}: NotificationDropdownProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // ============================================================
  // INITIAL FETCH + POLLING
  // ============================================================

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // CLOSE ON OUTSIDE CLICK
  // ============================================================

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: 1,
          }))
        );

        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NOTIFICATION CLICK
  // ============================================================

  const handleNotificationClick = async (
    notif: NotificationItem
  ) => {
    if (!notif.is_read) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, {
          method: "PATCH",
          credentials: "include",
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id
              ? {
                  ...n,
                  is_read: 1,
                }
              : n
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(
          "Failed to mark notification as read:",
          err
        );
      }
    }

    setIsOpen(false);

    if (
      (notif.reference_type === "APPLICATION" ||
        notif.type === "NEW_APPLICATION") &&
      notif.reference_id
    ) {
      if (userRole === "HR") {
        router.push(
          `/hr/application/${notif.reference_id}`
        );
      } else {
        router.push(
          `/candidate/application/${notif.reference_id}`
        );
      }
    } else if (notif.reference_type === "INTERVIEW") {
      if (userRole === "HR") {
        if (notif.reference_id) {
          router.push(
            `/hr/interview/${notif.reference_id}`
          );
        } else {
          router.push("/hr/interview");
        }
      } else {
        router.push("/candidate/interview");
      }
    } else if (
      notif.reference_type === "BATCH_ALLOCATION" ||
      notif.type === "BATCH_ALLOCATION_CONFIRMED"
    ) {
      if (userRole === "HR") {
        router.push("/hr/batch-allocation");
      }
    } else if (
      notif.reference_type === "JOB_ROLE_REQUEST" ||
      notif.type === "JOB_ROLE_REQUEST"
    ) {
      if (userRole === "HR") {
        router.push("/hr/job-change-requests");
      } else {
        router.push("/candidate/profile");
      }
    } else if (notif.reference_type === "JOB_ROLE") {
      router.push("/candidate/profile");
    }
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      {/* ========================================================
          NOTIFICATION BUTTON
          ======================================================== */}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative
          p-2
          rounded-full
          text-gray-600
          hover:text-gray-900
          hover:bg-gray-100
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500/20
          transition-colors
          shrink-0
        "
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-0.5
              -right-0.5
              flex
              items-center
              justify-center
              min-w-4.5
              h-4.5
              px-1
              text-[10px]
              font-bold
              text-white
              bg-red-600
              rounded-full
              border-2
              border-white
              shadow-sm
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ========================================================
          NOTIFICATION DROPDOWN
          
          RESPONSIVE BEHAVIOR:
          
          Mobile (<640px):
          - Almost full viewport width
          - Centered using left/right margins
          - No longer attached tightly to sidebar edge
          
          Tablet (640px - 767px):
          - Wider dropdown
          - Still constrained to viewport
          
          Desktop (768px+):
          - Original right-aligned dropdown behavior
          ======================================================== */}

      {isOpen && (
        <div
          className="
            fixed
            z-100
            bg-white
            rounded-xl
            shadow-2xl
            border
            border-gray-200
            overflow-hidden
            animate-in
            fade-in
            slide-in-from-top-2
            duration-150

            /* ------------------------------
               MOBILE
               ------------------------------ */
            top-16
            left-3
            right-3
            w-auto

            /* Keep dropdown inside viewport */
            max-h-[calc(100vh-80px)]

            /* ------------------------------
               SMALL TABLETS
               ------------------------------ */
            sm:top-17
            sm:left-auto
            sm:right-4
            sm:w-[min(420px,calc(100vw-32px))]

            /* ------------------------------
               DESKTOP
               ------------------------------ */
            md:absolute
            md:top-auto
            md:left-auto
            md:right-0
            md:mt-2
            md:w-96
            md:max-h-none
          "
        >
          {/* ======================================================
              HEADER
              ====================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              px-4
              py-3
              bg-gray-50
              border-b
              border-gray-200
              min-h-14
            "
          >
            {/* Title + unread count */}

            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 whitespace-nowrap">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <span
                  className="
                    px-2
                    py-0.5
                    text-xs
                    font-semibold
                    bg-indigo-100
                    text-indigo-700
                    rounded-full
                    whitespace-nowrap
                    shrink-0
                  "
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Mark all as read */}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="
                  text-xs
                  text-indigo-600
                  hover:text-indigo-800
                  font-medium
                  disabled:opacity-50
                  whitespace-nowrap
                  shrink-0
                  transition-colors
                "
              >
                {loading
                  ? "Marking..."
                  : "Mark all as read"}
              </button>
            )}
          </div>

          {/* ======================================================
              NOTIFICATION LIST
              ====================================================== */}

          <div
            className="
              overflow-y-auto
              divide-y
              divide-gray-100

              /* Mobile */
              max-h-[calc(100vh-136px)]

              /* Tablet */
              sm:max-h-[calc(100vh-144px)]

              /* Desktop */
              md:max-h-90

              overscroll-contain
            "
          >
            {notifications.length === 0 ? (
              /* ==================================================
                 EMPTY STATE
                 ================================================== */

              <div className="p-8 text-center">
                <div
                  className="
                    inline-flex
                    items-center
                    justify-center
                    w-10
                    h-10
                    rounded-full
                    bg-gray-100
                    text-gray-400
                    mb-2
                  "
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>

                <p className="text-sm font-medium text-gray-900">
                  No notifications yet
                </p>

                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  We&apos;ll notify you when important events
                  happen.
                </p>
              </div>
            ) : (
              /* ==================================================
                 NOTIFICATIONS
                 ================================================== */

              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(notif)
                  }
                  className={`
                    w-full
                    text-left
                    p-4
                    hover:bg-gray-50
                    active:bg-gray-100
                    transition-colors
                    flex
                    gap-3
                    items-start

                    ${
                      !notif.is_read
                        ? "bg-indigo-50/40"
                        : ""
                    }
                  `}
                >
                  {/* Unread indicator */}

                  <div
                    className={`
                      w-2
                      h-2
                      mt-1.5
                      rounded-full
                      shrink-0

                      ${
                        !notif.is_read
                          ? "bg-indigo-600"
                          : "bg-transparent"
                      }
                    `}
                  />

                  {/* Notification content */}

                  <div className="flex-1 min-w-0">
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-2
                      "
                    >
                      <p
                        className={`
                          text-xs
                          font-semibold
                          leading-relaxed
                          min-w-0
                          wrap-break-word

                          ${
                            !notif.is_read
                              ? "text-gray-900"
                              : "text-gray-700"
                          }
                        `}
                      >
                        {notif.title}
                      </p>

                      <span
                        className="
                          text-[11px]
                          text-gray-400
                          shrink-0
                          whitespace-nowrap
                        "
                      >
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p
                      className="
                        text-xs
                        text-gray-600
                        mt-1
                        line-clamp-2
                        leading-relaxed
                        whitespace-pre-line
                        wrap-break-word
                      "
                    >
                      {notif.message}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}