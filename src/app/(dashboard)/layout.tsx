import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Top nav */}
            <header className="border-b border-stone-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-950 text-xs font-semibold text-stone-50">
                            DI
                        </div>
                        <span className="text-sm font-semibold text-stone-900">
                            DeployIQ
                        </span>
                    </Link>

                    <DashboardNav
                        userName={session.user.name ?? session.user.email ?? "User"}
                        userEmail={session.user.email ?? ""}
                    />
                </div>
            </header>

            {/* Main content */}
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </div>
    );
}
