import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth";
import CandidateLayoutShell from "@/components/navigation/CandidateLayoutShell";

export default async function CandidateLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const session = await getAuthSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "CANDIDATE") {
        redirect("/login");
    }

    return (
        <CandidateLayoutShell
            user={{
                fullName: session.fullName,
                email: session.email,
                role: "CANDIDATE",
            }}
        >
            {children}
        </CandidateLayoutShell>
    );
}
