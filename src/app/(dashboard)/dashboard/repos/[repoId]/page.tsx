import { auth } from "@/lib/auth";
import { db } from "@/server/db/client";
import { repositories, prReviews } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Clock3, GitBranch } from "lucide-react";
import { RepoApiKeyCard } from "@/components/repo-api-key-card";

type Props = {
    params: Promise<{ repoId: string }>;
};

export default async function RepoDetailPage({ params }: Props) {
    const { repoId } = await params;
    const session = await auth();
    const userId = Number(session?.user?.id);

    const repo = await db.query.repositories.findFirst({
        where: and(
            eq(repositories.id, Number(repoId)),
            eq(repositories.userId, userId)
        ),
    });

    if (!repo) notFound();

    const reviews = await db.query.prReviews.findMany({
        where: eq(prReviews.repoFullName, repo.repoFullName),
        orderBy: [desc(prReviews.createdAt)],
        limit: 20,
    });

    return (
        <div className="space-y-8">
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
                        <GitBranch className="h-6 w-6 text-stone-600 dark:text-stone-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                            {repo.repoFullName}
                        </h1>
                        <div className="mt-1 flex items-center gap-3">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    repo.isActive
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                                }`}
                            >
                                {repo.isActive ? "Active" : "Inactive"}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                Connected{" "}
                                {repo.createdAt
                                    ? new Date(repo.createdAt).toLocaleDateString()
                                    : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Key Card */}
            <RepoApiKeyCard repoId={repo.id} apiKey={repo.apiKey} />

            {/* Reviews */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-stone-900 dark:text-stone-100">
                    Review History
                </h2>
                {reviews.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-900">
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                            No reviews yet. Open a pull request to trigger your
                            first DeployIQ analysis.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 dark:border-stone-800 dark:bg-stone-900"
                            >
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                        review.riskScore >= 7
                                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                            : review.riskScore >= 4
                                              ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    }`}
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                                        {review.prTitle}
                                    </p>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                        PR #{review.prNumber}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {review.createdAt
                                        ? new Date(review.createdAt).toLocaleDateString()
                                        : ""}
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        review.riskScore >= 7
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            : review.riskScore >= 4
                                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    }`}
                                >
                                    Risk: {review.riskScore}/10
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
