import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth";
import HRLayoutShell from "@/components/navigation/HRLayoutShell";

export default async function HRLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const session = await getAuthSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "HR") {
        redirect("/login");
    }

    return (
        <HRLayoutShell
            user={{
                fullName: session.fullName,
                email: session.email,
                role: "HR",
            }}
        >
            {children}
        </HRLayoutShell>
    );
}