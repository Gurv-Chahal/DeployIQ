import { auth } from "@/lib/auth";
import { db } from "@/server/db/client";
import { prReviews, repositories } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ShieldAlert,
    Waypoints,
    Brain,
    ListChecks,
    Clock3,
    Search,
    GitPullRequest,
} from "lucide-react";

type Props = {
    params: Promise<{ reviewId: string }>;
};

function getRiskColor(score: number) {
    if (score >= 9) return { border: "border-red-400/30", bg: "bg-red-500/10", text: "text-red-300", label: "text-red-100" };
    if (score >= 7) return { border: "border-orange-400/30", bg: "bg-orange-500/10", text: "text-orange-300", label: "text-orange-100" };
    if (score >= 4) return { border: "border-amber-400/30", bg: "bg-amber-500/10", text: "text-amber-300", label: "text-amber-100" };
    return { border: "border-emerald-400/30", bg: "bg-emerald-500/10", text: "text-emerald-300", label: "text-emerald-100" };
}

function getStepColor(index: number) {
    const colors = [
        { bg: "bg-orange-500/10", label: "text-orange-300", title: "text-orange-50", detail: "text-orange-300/60" },
        { bg: "bg-sky-500/10", label: "text-sky-300", title: "text-sky-50", detail: "text-sky-300/60" },
        { bg: "bg-emerald-500/10", label: "text-emerald-300", title: "text-emerald-50", detail: "text-emerald-300/60" },
        { bg: "bg-violet-500/10", label: "text-violet-300", title: "text-violet-50", detail: "text-violet-300/60" },
        { bg: "bg-rose-500/10", label: "text-rose-300", title: "text-rose-50", detail: "text-rose-300/60" },
    ];
    return colors[index % colors.length];
}

export default async function ReportDetailPage({ params }: Props) {
    const { reviewId } = await params;
    const session = await auth();
    const userId = Number(session?.user?.id);

    const review = await db.query.prReviews.findFirst({
        where: eq(prReviews.id, Number(reviewId)),
    });

    if (!review) notFound();

    // Verify the user owns this review's repository
    if (review.repositoryId) {
        const repo = await db.query.repositories.findFirst({
            where: and(
                eq(repositories.id, review.repositoryId),
                eq(repositories.userId, userId)
            ),
        });
        if (!repo) notFound();
    }

    const riskColor = getRiskColor(review.riskScore);
    const reviewData = review.reviewData;
    const context = review.retrievedContext;
    const riskLevel = review.riskLevel ?? (
        review.riskScore >= 9 ? "Critical" :
        review.riskScore >= 7 ? "High" :
        review.riskScore >= 4 ? "Medium" : "Low"
    );

    // Calculate confidence based on available context
    const codeMatches = context?.relevantCode?.length ?? 0;
    const reviewMatches = context?.pastReviews?.length ?? 0;
    const confidence = Math.min(98, 70 + codeMatches * 2 + reviewMatches * 3);

    return (
        <div className="space-y-6">
            <Link
                href={review.repositoryId ? `/dashboard/repos/${review.repositoryId}` : "/dashboard"}
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Repository
            </Link>

            {/* Report card */}
            <div className="overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 p-6 text-stone-50 shadow-2xl sm:p-8">
                {/* Report header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">
                            Deployment Risk Report
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold">{review.prTitle}</h1>
                        {review.prBody && (
                            <p className="mt-2 max-w-lg text-sm leading-6 text-stone-400">
                                {review.prBody}
                            </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                                <GitPullRequest className="size-3" />
                                {review.repoFullName} #{review.prNumber}
                            </span>
                            {codeMatches > 0 && (
                                <>
                                    <span className="text-stone-700">·</span>
                                    <span className="flex items-center gap-1">
                                        <Search className="size-3" /> {codeMatches} code sections analyzed
                                    </span>
                                </>
                            )}
                            {reviewMatches > 0 && (
                                <>
                                    <span className="text-stone-700">·</span>
                                    <span className="flex items-center gap-1">
                                        <Clock3 className="size-3" /> {reviewMatches} past reviews matched
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`shrink-0 rounded-2xl border ${riskColor.border} ${riskColor.bg} px-4 py-3 text-right`}>
                        <p className={`text-xs font-medium tracking-[0.16em] uppercase ${riskColor.text}`}>Risk</p>
                        <p className={`mt-1 text-3xl font-semibold ${riskColor.label}`}>{review.riskScore} / 10</p>
                        <p className={`text-xs ${riskColor.text} opacity-70`}>{riskLevel} · {confidence}% confidence</p>
                    </div>
                </div>

                {/* Report body grid */}
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {/* Blast Radius */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                            <Waypoints className="size-4 text-sky-300" />
                            Blast Radius
                        </div>
                        {reviewData?.blastRadius ? (
                            <>
                                <ul className="mt-4 space-y-2 text-sm text-stone-300">
                                    {reviewData.blastRadius.servicesAffected.map((service) => (
                                        <li key={service} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5">
                                            <span className="font-mono text-xs">{service}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-3 text-xs text-stone-500">
                                    {reviewData.blastRadius.filesAffected} files affected
                                </p>
                            </>
                        ) : (
                            <p className="mt-4 text-sm text-stone-500">No blast radius data available.</p>
                        )}
                    </section>

                    {/* System Context */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                            <Brain className="size-4 text-violet-300" />
                            System Context
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-stone-300">
                            {context?.relevantCode && context.relevantCode.length > 0 ? (
                                context.relevantCode.slice(0, 3).map((chunk, i) => (
                                    <div key={i} className="rounded-2xl bg-white/5 px-3 py-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-stone-100">Codebase Match</p>
                                            <span className="text-xs text-violet-400">
                                                {chunk.score?.toFixed(2)} relevance
                                            </span>
                                        </div>
                                        <p className="mt-1 font-mono text-xs text-stone-500">{chunk.filePath}</p>
                                        <p className="mt-1 line-clamp-2 text-stone-400">
                                            {chunk.content.slice(0, 150)}...
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-stone-500">No codebase context retrieved.</p>
                            )}

                            {context?.pastReviews && context.pastReviews.length > 0 && (
                                context.pastReviews.slice(0, 2).map((pr, i) => (
                                    <div key={`pr-${i}`} className="rounded-2xl bg-white/5 px-3 py-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-stone-100">Past Review Match</p>
                                            <span className="text-xs text-violet-400">{pr.prTitle}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-stone-400">
                                            {pr.content.slice(0, 200)}...
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Evidence Summary */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                            <ListChecks className="size-4 text-emerald-300" />
                            Evidence Summary
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-stone-300">
                            {reviewData?.codeObservations && reviewData.codeObservations.length > 0 ? (
                                reviewData.codeObservations.map((obs, i) => (
                                    <div key={i} className="rounded-2xl bg-white/5 px-3 py-3">
                                        <p className="font-medium text-stone-100">{obs}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-stone-500">No code observations recorded.</p>
                            )}

                            {review.riskFactors && review.riskFactors.length > 0 && (
                                <div className="rounded-2xl bg-white/5 px-3 py-3">
                                    <p className="mb-2 font-medium text-stone-100">Risk Factors</p>
                                    <ul className="space-y-1">
                                        {review.riskFactors.map((factor, i) => (
                                            <li key={i} className="flex items-start gap-2 text-stone-400">
                                                <ShieldAlert className="mt-0.5 size-3 shrink-0 text-orange-400" />
                                                {factor}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Rollout Guidance */}
                    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                            <ShieldAlert className="size-4 text-orange-300" />
                            Rollout Guidance
                        </div>
                        <div className="mt-4 space-y-3">
                            {reviewData?.deploymentRecommendations && reviewData.deploymentRecommendations.length > 0 ? (
                                reviewData.deploymentRecommendations.map((rec, i) => {
                                    const color = getStepColor(i);
                                    return (
                                        <div key={i} className={`rounded-2xl ${color.bg} px-4 py-3`}>
                                            <p className={`text-xs font-medium tracking-[0.14em] uppercase ${color.label}`}>
                                                Step {i + 1}
                                            </p>
                                            <p className={`mt-1 font-medium ${color.title}`}>{rec}</p>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-stone-500">No deployment recommendations available.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Timestamp */}
                <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-stone-500">
                    <Clock3 className="size-3" />
                    Report generated {review.createdAt ? new Date(review.createdAt).toLocaleString() : ""}
                </div>
            </div>
        </div>
    );
}
