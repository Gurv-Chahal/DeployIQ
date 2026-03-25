import { auth } from "@/lib/auth";
import { db } from "@/server/db/client";
import { repositories, prReviews } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, ShieldAlert, Clock3 } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    const userId = Number(session?.user?.id);

    // Fetch user's repositories
    const repos = await db.query.repositories.findMany({
        where: eq(repositories.userId, userId),
        orderBy: [desc(repositories.createdAt)],
    });

    // Fetch recent reviews across all user repos
    const repoNames = repos.map((r) => r.repoFullName);
    const recentReviews =
        repoNames.length > 0
            ? await db.query.prReviews.findMany({
                  orderBy: [desc(prReviews.createdAt)],
                  limit: 10,
              })
            : [];

    // Filter reviews to only user's repos
    const userReviews = recentReviews.filter((r) =>
        repoNames.includes(r.repoFullName)
    );

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-stone-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Manage your repositories and view deployment risk reports.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/repos/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Repository
                    </Link>
                </Button>
            </div>

            {/* Repository list */}
            {repos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
                    <GitBranch className="mx-auto h-10 w-10 text-stone-400" />
                    <h2 className="mt-4 text-lg font-medium text-stone-900">
                        No repositories connected
                    </h2>
                    <p className="mt-2 text-sm text-stone-500">
                        Connect your first repository to start getting AI-powered
                        deployment risk analysis on every pull request.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard/repos/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Repository
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {repos.map((repo) => (
                        <Link
                            key={repo.id}
                            href={`/dashboard/repos/${repo.id}`}
                            className="group rounded-2xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
                                        <GitBranch className="h-5 w-5 text-stone-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-stone-900 group-hover:text-violet-600">
                                            {repo.repoFullName}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            {repo.indexingStatus === "ready"
                                                ? "Active"
                                                : repo.indexingStatus}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                        repo.isActive
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-stone-100 text-stone-500"
                                    }`}
                                >
                                    {repo.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Recent reviews */}
            {userReviews.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-stone-900">
                        Recent Reviews
                    </h2>
                    <div className="space-y-3">
                        {userReviews.map((review) => (
                            <div
                                key={review.id}
                                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4"
                            >
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                        review.riskScore >= 7
                                            ? "bg-red-100 text-red-600"
                                            : review.riskScore >= 4
                                              ? "bg-amber-100 text-amber-600"
                                              : "bg-emerald-100 text-emerald-600"
                                    }`}
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-stone-900">
                                        {review.prTitle}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        {review.repoFullName} #
                                        {review.prNumber}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-500">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {review.createdAt
                                        ? new Date(review.createdAt).toLocaleDateString()
                                        : ""}
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        review.riskScore >= 7
                                            ? "bg-red-100 text-red-700"
                                            : review.riskScore >= 4
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-emerald-100 text-emerald-700"
                                    }`}
                                >
                                    Risk: {review.riskScore}/10
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
