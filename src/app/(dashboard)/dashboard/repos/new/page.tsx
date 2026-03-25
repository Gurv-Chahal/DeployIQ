"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Copy,
    GitBranch,
    Loader2,
    Search,
} from "lucide-react";
import Link from "next/link";

type GitHubRepo = {
    full_name: string;
    name: string;
    owner: { login: string };
    private: boolean;
    description: string | null;
};

type Step = "select" | "configure" | "verify";

export default function AddRepoPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("select");
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [repoId, setRepoId] = useState<number | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [setupVerified, setSetupVerified] = useState(false);

    // Try to load repos on mount — if GitHub is already linked
    useEffect(() => {
        fetchRepos();
    }, []);

    async function fetchRepos() {
        setLoading(true);
        try {
            const res = await fetch("/api/github/repos");
            if (res.ok) {
                const data = await res.json();
                setRepos(data.repos ?? []);
                setStep("select");
            }
        } catch {
            // keep on select step
        } finally {
            setLoading(false);
        }
    }

    async function connectRepo() {
        if (!selectedRepo) return;
        setLoading(true);
        try {
            const res = await fetch("/api/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoFullName: selectedRepo }),
            });
            const data = await res.json();
            if (data.ok) {
                setApiKey(data.apiKey);
                setRepoId(data.repoId);
                setStep("configure");
            }
        } finally {
            setLoading(false);
        }
    }

    async function checkSetup() {
        if (!repoId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/repos/${repoId}/setup-status`);
            const data = await res.json();
            setSetupVerified(data.workflowExists ?? false);
            setStep("verify");
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard(text: string, key: string) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    const filteredRepos = repos.filter((r) =>
        r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const workflowYaml = `name: DeployIQ Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  deploy-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Extract PR diff
        id: diff
        env:
          GH_TOKEN: \${{ github.token }}
        run: |
          PR_NUMBER=\${{ github.event.pull_request.number }}
          gh pr diff "$PR_NUMBER" > /tmp/pr.diff
          gh pr view "$PR_NUMBER" --json files --jq '.files[].path' > /tmp/changed-files.txt

      - name: Call DeployIQ Review API
        id: review
        env:
          DEPLOYIQ_API_URL: \${{ secrets.DEPLOYIQ_API_URL }}
          DEPLOYIQ_API_KEY: \${{ secrets.DEPLOYIQ_API_KEY }}
          PR_TITLE: \${{ github.event.pull_request.title }}
          PR_BODY: \${{ github.event.pull_request.body }}
          PR_NUMBER: \${{ github.event.pull_request.number }}
          PR_BASE: \${{ github.event.pull_request.base.ref }}
          PR_HEAD: \${{ github.event.pull_request.head.ref }}
          REPO_FULL_NAME: \${{ github.repository }}
        run: |
          CHANGED_FILES=$(jq -R -s 'split("\\n") | map(select(. != ""))' /tmp/changed-files.txt)
          PAYLOAD=$(jq -n \\
            --arg repoFullName "$REPO_FULL_NAME" \\
            --argjson prNumber "$PR_NUMBER" \\
            --arg prTitle "$PR_TITLE" \\
            --arg prBody "$PR_BODY" \\
            --rawfile diff /tmp/pr.diff \\
            --argjson changedFiles "$CHANGED_FILES" \\
            --arg baseBranch "$PR_BASE" \\
            --arg headBranch "$PR_HEAD" \\
            '{ repoFullName: $repoFullName, prNumber: $prNumber, prTitle: $prTitle, prBody: $prBody, diff: $diff, changedFiles: $changedFiles, baseBranch: $baseBranch, headBranch: $headBranch }')
          RESPONSE=$(curl -s -w "\\n%{http_code}" \\
            -X POST "\${DEPLOYIQ_API_URL}/api/review" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${DEPLOYIQ_API_KEY}" \\
            -d "$PAYLOAD")
          HTTP_CODE=$(echo "$RESPONSE" | tail -1)
          BODY=$(echo "$RESPONSE" | sed '$d')
          if [ "$HTTP_CODE" != "200" ]; then
            echo "API returned HTTP $HTTP_CODE"
            echo "$BODY"
            exit 1
          fi
          echo "$BODY" | jq -r '.review.reviewBody' > /tmp/review-body.md

      - name: Post review as PR comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const reviewBody = fs.readFileSync('/tmp/review-body.md', 'utf8');
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: reviewBody
            });`;

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            {/* Back button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            <div>
                <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                    Add Repository
                </h1>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Connect a GitHub repository to enable AI-powered deployment
                    risk analysis.
                </p>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2">
                {(["select", "configure", "verify"] as Step[]).map(
                    (s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                                    step === s
                                        ? "bg-violet-600 text-white"
                                        : ["select", "configure", "verify"].indexOf(step) > i
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                          : "bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
                                }`}
                            >
                                {["select", "configure", "verify"].indexOf(step) > i ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < 2 && (
                                <div className="h-px w-8 bg-stone-200 dark:bg-stone-700 sm:w-16" />
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Step 2: Select repository */}
            {step === "select" && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                    <h2 className="mb-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                        Select a repository
                    </h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-violet-600 dark:focus:ring-violet-900/30"
                        />
                    </div>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                        {filteredRepos.map((repo) => (
                            <button
                                key={repo.full_name}
                                onClick={() => setSelectedRepo(repo.full_name)}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                                    selectedRepo === repo.full_name
                                        ? "bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-700"
                                        : "hover:bg-stone-50 dark:hover:bg-stone-800"
                                }`}
                            >
                                <GitBranch className="h-4 w-4 shrink-0 text-stone-400" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                                        {repo.full_name}
                                    </p>
                                    {repo.description && (
                                        <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                                            {repo.description}
                                        </p>
                                    )}
                                </div>
                                {repo.private && (
                                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                                        Private
                                    </span>
                                )}
                            </button>
                        ))}
                        {filteredRepos.length === 0 && (
                            <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                                No repositories found.
                            </p>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={connectRepo}
                            disabled={!selectedRepo || loading}
                        >
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Configure */}
            {step === "configure" && apiKey && (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
                        <h2 className="mb-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                            Configure GitHub Actions
                        </h2>
                        <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                            Follow these steps to enable DeployIQ on{" "}
                            <strong>{selectedRepo}</strong>:
                        </p>

                        {/* Step A: Add secrets */}
                        <div className="mb-6 rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                            <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                                1. Add repository secrets
                            </h3>
                            <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
                                Go to your repo &rarr; Settings &rarr; Secrets
                                and variables &rarr; Actions &rarr; New
                                repository secret
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-stone-200 dark:bg-stone-900 dark:border-stone-700">
                                    <code className="flex-1 text-xs">
                                        <span className="text-stone-500 dark:text-stone-400">
                                            DEPLOYIQ_API_KEY=
                                        </span>
                                        <span className="text-stone-900 dark:text-stone-100">
                                            {apiKey}
                                        </span>
                                    </code>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(apiKey, "apiKey")
                                        }
                                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                    >
                                        {copied === "apiKey" ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-stone-200 dark:bg-stone-900 dark:border-stone-700">
                                    <code className="flex-1 text-xs">
                                        <span className="text-stone-500 dark:text-stone-400">
                                            DEPLOYIQ_API_URL=
                                        </span>
                                        <span className="text-stone-900 dark:text-stone-100">
                                            {typeof window !== "undefined"
                                                ? window.location.origin
                                                : ""}
                                        </span>
                                    </code>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(
                                                typeof window !== "undefined"
                                                    ? window.location.origin
                                                    : "",
                                                "apiUrl"
                                            )
                                        }
                                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                                    >
                                        {copied === "apiUrl" ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Step B: Add workflow */}
                        <div className="rounded-xl bg-stone-50 p-4 dark:bg-stone-800">
                            <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                                2. Add the workflow file
                            </h3>
                            <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
                                Create{" "}
                                <code className="rounded bg-stone-200 px-1 dark:bg-stone-700">
                                    .github/workflows/deployiq-review.yml
                                </code>{" "}
                                in your repository with this content:
                            </p>
                            <div className="relative">
                                <pre className="max-h-60 overflow-auto rounded-lg bg-stone-900 p-4 text-xs text-stone-100">
                                    {workflowYaml}
                                </pre>
                                <button
                                    onClick={() =>
                                        copyToClipboard(
                                            workflowYaml,
                                            "workflow"
                                        )
                                    }
                                    className="absolute right-2 top-2 rounded-md bg-stone-700 p-1.5 text-stone-300 hover:bg-stone-600"
                                >
                                    {copied === "workflow" ? (
                                        <Check className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={checkSetup} disabled={loading}>
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Verify Setup
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 4: Verify */}
            {step === "verify" && (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
                    {setupVerified ? (
                        <>
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                                Setup complete!
                            </h2>
                            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                                DeployIQ is now active on{" "}
                                <strong>{selectedRepo}</strong>. Open a pull
                                request to see your first risk report.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 className="mt-4 text-lg font-medium text-stone-900 dark:text-stone-100">
                                Workflow not detected yet
                            </h2>
                            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                                Make sure you&apos;ve committed the workflow
                                file to the main branch. You can skip this step
                                and verify later.
                            </p>
                        </>
                    )}
                    <div className="mt-6 flex justify-center gap-3">
                        {!setupVerified && (
                            <Button
                                variant="outline"
                                onClick={checkSetup}
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Check Again
                            </Button>
                        )}
                        <Button
                            onClick={() =>
                                router.push(
                                    repoId
                                        ? `/dashboard/repos/${repoId}`
                                        : "/dashboard"
                                )
                            }
                        >
                            Go to{" "}
                            {setupVerified ? "Repository" : "Dashboard"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Clock({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
