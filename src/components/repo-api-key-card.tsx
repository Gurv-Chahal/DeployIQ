"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";

export function RepoApiKeyCard({
    repoId,
    apiKey: initialApiKey,
}: {
    repoId: number;
    apiKey: string;
}) {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);

    function copyKey() {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function regenerateKey() {
        if (!confirm("Are you sure? The old API key will stop working immediately.")) return;
        setRegenerating(true);
        try {
            const res = await fetch(`/api/repos/${repoId}/api-key`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.ok) {
                setApiKey(data.apiKey);
                setVisible(true);
            }
        } finally {
            setRegenerating(false);
        }
    }

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">
                API Key
            </h3>
            <p className="mb-4 text-xs text-stone-500">
                Use this key as the <code className="rounded bg-stone-100 px-1">DEPLOYIQ_API_KEY</code> secret in your GitHub repository.
            </p>
            <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-mono">
                    {visible ? apiKey : maskedKey}
                </code>
                <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)}>
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={copyKey}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={regenerateKey} disabled={regenerating}>
                    {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
