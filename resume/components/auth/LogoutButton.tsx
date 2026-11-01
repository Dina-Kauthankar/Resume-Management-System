"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        if (isLoggingOut) {
            return;
        }

        try {
            setIsLoggingOut(true);

            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            setIsLoggingOut(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full p-3 rounded-md text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
    );
}