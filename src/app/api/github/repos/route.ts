import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const { user, error } = await requireAuth();
    if (error) return error;

    if (!user.githubAccessToken) {
        return NextResponse.json(
            { ok: false, error: "GitHub not connected. Please link your GitHub account first." },
            { status: 400 }
        );
    }

    try {
        const token = decrypt(user.githubAccessToken);

        const res = await fetch(
            "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            }
        );

        if (!res.ok) {
            const body = await res.text();
            console.error("GitHub API error:", res.status, body);
            return NextResponse.json(
                { ok: false, error: "Failed to fetch repositories from GitHub" },
                { status: 502 }
            );
        }

        const repos = await res.json();

        // Return a slim list
        const slim = repos.map(
            (r: {
                full_name: string;
                name: string;
                owner: { login: string };
                private: boolean;
                description: string | null;
            }) => ({
                full_name: r.full_name,
                name: r.name,
                owner: { login: r.owner.login },
                private: r.private,
                description: r.description,
            })
        );

        return NextResponse.json({ ok: true, repos: slim });
    } catch (err) {
        console.error("Failed to list GitHub repos:", err);
        return NextResponse.json(
            { ok: false, error: "Failed to fetch GitHub repositories" },
            { status: 500 }
        );
    }
}
