import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  ListChecks,
  ShieldAlert,
  Waypoints,
  Zap,
  Eye,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const metrics = [
  { label: "Blast Radius", value: "9", unit: "touchpoints", icon: Waypoints },
  { label: "Missing Checks", value: "3", unit: "high-value gaps", icon: ListChecks },
  { label: "Risk Score", value: "High", unit: "confidence 92%", icon: ShieldAlert },
];

const capabilities = [
  {
    title: "System-Aware Analysis",
    description:
      "Maps every change against affected services, shared contracts, downstream consumers, and data stores — not just the diff.",
    icon: Waypoints,
    accent: "bg-sky-500/10 text-sky-600",
  },
  {
    title: "Evidence-Backed Risk Scoring",
    description:
      "Ties risk calls to test coverage, past incidents, deploy history, and known weak spots. No vague summaries.",
    icon: BarChart3,
    accent: "bg-orange-500/10 text-orange-600",
  },
  {
    title: "Actionable Rollout Plans",
    description:
      "Generates release sequencing, feature flag strategies, canary plans, watchpoints, and rollback guidance.",
    icon: ShieldAlert,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Gap Detection",
    description:
      "Surfaces missing migration rehearsals, untested rollback paths, partial integration coverage, and skipped preflight checks.",
    icon: Eye,
    accent: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "Incident Memory",
    description:
      "Cross-references changes with historical incidents so the same failure patterns don't ship twice.",
    icon: Database,
    accent: "bg-rose-500/10 text-rose-600",
  },
  {
    title: "Fast Feedback Loop",
    description:
      "Reports generate in seconds on PR merge or commit push — integrated into your existing CI/CD pipeline.",
    icon: Zap,
    accent: "bg-amber-500/10 text-amber-600",
  },
];

const workflowSteps = [
  {
    step: "Ingest",
    detail: "PR, commit range, or release bundle enters the pipeline with full repo and service metadata.",
    icon: GitBranch,
  },
  {
    step: "Map",
    detail: "Trace affected services, dependencies, data stores, consumers, and prior instability zones.",
    icon: Database,
  },
  {
    step: "Score",
    detail: "Generate a structured report: severity, confidence, blast radius, missing checks, rollout plan.",
    icon: Activity,
  },
  {
    step: "Ship",
    detail: "Deploy with staged release guidance, alert watchpoints, and rollback context — not blind.",
    icon: Clock3,
  },
];

const comparisonRows = [
  { feature: "Analyzes full system context", deployiq: true, prBot: false },
  { feature: "Maps blast radius across services", deployiq: true, prBot: false },
  { feature: "References past incidents", deployiq: true, prBot: false },
  { feature: "Structured risk reports", deployiq: true, prBot: false },
  { feature: "Rollout sequencing & guidance", deployiq: true, prBot: false },
  { feature: "Missing check detection", deployiq: true, prBot: false },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-950">
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-orange-200/60 blur-3xl" />
        <div className="absolute right-0 top-20 h-[28rem] w-[28rem] rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/2 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-950/10">
              DI
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-stone-900">DeployIQ</p>
              <p className="text-xs text-stone-500">Deployment risk intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex">
            <a href="#capabilities" className="transition-colors hover:text-stone-950">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-stone-950">How It Works</a>
            <a href="#report-preview" className="transition-colors hover:text-stone-950">Report Preview</a>
          </nav>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="#report-preview">
              See a Report
              <ArrowRight className="size-3.5" />
            </a>
          </Button>
        </header>

        {/* Hero */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 sm:px-8 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-4 py-1.5 text-xs font-medium tracking-[0.14em] text-stone-600 uppercase backdrop-blur">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Full-system deployment analysis
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.15]">
              Know the risk before you ship,
              <br className="hidden sm:block" />
              <span className="text-stone-500">not after the incident.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              DeployIQ analyzes code changes in full system context — using test
              coverage, past incidents, and change history — to surface blast
              radius, missing checks, and safer rollout guidance.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <a href="#report-preview">
                  Explore a Report
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-stone-300 bg-white/60 px-6 text-base text-stone-900 hover:bg-white"
              >
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
          </div>

          {/* Metric pills */}
          <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 shadow-sm backdrop-blur"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-stone-50">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-stone-950">{m.value}</p>
                    <p className="text-xs text-stone-500">{m.unit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Capabilities */}
        <section id="capabilities" className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Capabilities</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Everything a diff review misses.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
              DeployIQ goes beyond line-by-line commentary to analyze the full
              blast radius of every change across your system.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <article
                  key={cap.title}
                  className="group rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${cap.accent}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-950">{cap.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{cap.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="rounded-[2rem] border border-stone-200 bg-white/75 p-8 shadow-sm backdrop-blur sm:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">How It Works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                From merge to risk report in seconds.
              </h2>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-0 sm:grid-cols-4">
              {workflowSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative flex flex-col items-center text-center">
                    {/* Connector line */}
                    {index < workflowSteps.length - 1 && (
                      <div className="absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] bg-stone-300 sm:block" />
                    )}
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-stone-50 shadow-lg shadow-stone-950/10">
                      <Icon className="size-6" />
                    </div>
                    <p className="mt-4 text-xs font-medium tracking-[0.14em] text-stone-400 uppercase">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-950">{item.step}</h3>
                    <p className="mt-2 max-w-48 text-sm leading-6 text-stone-600">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Report Preview */}
        <section id="report-preview" className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Report Preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              A real report, not a wall of comments.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-600">
              Every deployment gets a structured risk report with affected surface,
              evidence trail, and an actionable release plan.
            </p>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl">
            <div className="absolute inset-x-10 -top-6 h-40 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 p-6 text-stone-50 shadow-2xl shadow-stone-950/20 sm:p-8">
              {/* Report header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">
                    Deployment Risk Report
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Payments Retry Refactor</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-stone-400">
                    Backend change touching retry orchestration, webhook delivery,
                    and ledger reconciliation across 4 services.
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-right">
                  <p className="text-xs font-medium tracking-[0.16em] text-orange-300 uppercase">Risk</p>
                  <p className="mt-1 text-3xl font-semibold text-orange-100">High</p>
                  <p className="text-xs text-orange-300/70">92% confidence</p>
                </div>
              </div>

              {/* Report body */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {/* Affected Surface */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                    <Waypoints className="size-4 text-sky-300" />
                    Affected Surface
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-stone-300">
                    {[
                      { name: "checkout-api", type: "direct" },
                      { name: "billing-ui", type: "consumer" },
                      { name: "ledger-worker", type: "async path" },
                      { name: "postgres / retries table", type: "stateful" },
                    ].map((s) => (
                      <li key={s.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5">
                        <span className="font-mono text-xs">{s.name}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-stone-500">{s.type}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Evidence */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                    <ListChecks className="size-4 text-emerald-300" />
                    Evidence Summary
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-stone-300">
                    <div className="rounded-2xl bg-white/5 px-3 py-3">
                      <p className="font-medium text-stone-100">Tests cover the happy path only</p>
                      <p className="mt-1 text-stone-400">
                        Integration coverage exists for retry creation, but not
                        delayed reprocessing or rollback.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-3">
                      <p className="font-medium text-stone-100">Similar incident in January</p>
                      <p className="mt-1 text-stone-400">
                        Prior retry queue regression caused duplicate webhook
                        dispatch under load.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Release Plan */}
                <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:col-span-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                    <ShieldAlert className="size-4 text-orange-300" />
                    Recommended Release Plan
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-orange-500/10 px-4 py-4">
                      <p className="text-xs font-medium tracking-[0.14em] text-orange-300 uppercase">Step 1</p>
                      <p className="mt-2 font-medium text-orange-50">Flag the new retry path</p>
                      <p className="mt-1 text-xs text-orange-300/60">Ship behind a feature flag</p>
                    </div>
                    <div className="rounded-2xl bg-sky-500/10 px-4 py-4">
                      <p className="text-xs font-medium tracking-[0.14em] text-sky-300 uppercase">Step 2</p>
                      <p className="mt-2 font-medium text-sky-50">Canary background workers</p>
                      <p className="mt-1 text-xs text-sky-300/60">Roll out worker path first</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 px-4 py-4">
                      <p className="text-xs font-medium tracking-[0.14em] text-emerald-300 uppercase">Step 3</p>
                      <p className="mt-2 font-medium text-emerald-50">Monitor and promote</p>
                      <p className="mt-1 text-xs text-emerald-300/60">Watch queue depth + webhook retries</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Why DeployIQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Risk intelligence, not code commentary.
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-3xl border border-stone-200 bg-white/70 shadow-sm backdrop-blur">
            <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-0 border-b border-stone-200 bg-stone-100/80 px-6 py-3 text-xs font-medium tracking-[0.12em] text-stone-500 uppercase">
              <span>Capability</span>
              <span className="text-center">DeployIQ</span>
              <span className="text-center">PR Bots</span>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_5rem_5rem] items-center gap-0 px-6 py-3.5 text-sm ${
                  i < comparisonRows.length - 1 ? "border-b border-stone-100" : ""
                }`}
              >
                <span className="text-stone-700">{row.feature}</span>
                <span className="flex justify-center">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                </span>
                <span className="flex justify-center text-stone-300">—</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="rounded-[2rem] border border-stone-800 bg-stone-950 px-8 py-16 text-center text-stone-50 sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Stop shipping blind.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-stone-400">
              Get structured deployment risk reports with blast radius mapping,
              evidence-backed scoring, and release guidance for every change.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-6 text-base text-stone-950 hover:bg-stone-200"
              >
                <a href="#report-preview">
                  See the Report
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-stone-200 px-6 py-10 text-sm text-stone-500 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-950 text-xs font-semibold text-stone-50">
              DI
            </div>
            <span className="font-medium text-stone-700">DeployIQ</span>
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <GitBranch className="size-4" />
            <span>Deployment risk intelligence — not a PR review bot.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
