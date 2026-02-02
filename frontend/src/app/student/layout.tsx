"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (role && role !== "student") {
            router.push("/login");
        }
    }, [router]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#0f172a] pt-[72px]">
                {children}
            </div>
        </>
    );
}
