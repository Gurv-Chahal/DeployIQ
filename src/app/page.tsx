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
} from "lucide-react";

import { Button } from "@/components/ui/button";

const signalCards = [
  {
    title: "Blast Radius",
    value: "9 downstream touchpoints",
    description:
        "Checkout API, billing UI, ledger sync, fraud rules, webhook consumers, and shared schemas.",
    icon: Waypoints,
  },
  {
    title: "Missing Checks",
    value: "3 high-value gaps",
    description:
        "No migration rehearsal, partial integration coverage, and no rollback verification on payment retries.",
    icon: ListChecks,
  },
  {
    title: "Release Guidance",
    value: "Phased rollout recommended",
    description:
        "Ship behind a flag, canary the worker path first, and hold DB changes until the retry queue is drained.",
    icon: ShieldAlert,
  },
];

const reportSections = [
  {
    title: "System Context",
    description:
        "Show the touched services, dependencies, shared contracts, and ownership chain around a change.",
  },
  {
    title: "Evidence Trail",
    description:
        "Tie every risk call to tests, incidents, deploy history, and historical weak spots instead of vague summaries.",
  },
  {
    title: "Rollout Plan",
    description:
        "Turn analysis into action with rollout sequencing, watchpoints, rollback notes, and missing preflight checks.",
  },
];

const workflowSteps = [
  {
    step: "Ingest the change",
    detail:
        "PR, commit range, or release bundle enters the analysis pipeline with repository and service metadata.",
    icon: GitBranch,
  },
  {
    step: "Map the affected system",
    detail:
        "Trace related services, dependencies, data stores, consumers, and areas with prior instability.",
    icon: Database,
  },
  {
    step: "Score and explain risk",
    detail:
        "Generate a structured report with severity, confidence, blast radius, missing checks, and rollout guidance.",
    icon: Activity,
  },
  {
    step: "Ship with guardrails",
    detail:
        "Use staged release recommendations, alert watchpoints, and rollback context instead of shipping blind.",
    icon: Clock3,
  },
];

export default function Home() {
  return (
      <main className="relative min-h-screen overflow-hidden bg-stone-50 text-stone-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-orange-200/70 blur-3xl" />
          <div className="absolute right-0 top-20 h-[28rem] w-[28rem] rounded-full bg-sky-200/70 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />
        </div>

        <div className="relative">
          <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-stone-50 shadow-lg shadow-stone-950/10">
                DI
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-stone-900">
                  DeployIQ
                </p>
                <p className="text-xs text-stone-600">
                  Deployment risk intelligence
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-2 text-xs text-stone-600 backdrop-blur md:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Structured reports over chat-style output
            </div>
          </header>

          <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-10">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium tracking-[0.16em] text-stone-600 uppercase backdrop-blur">
                Full-system deployment analysis
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl lg:text-6xl">
                Shipping changes with a risk report, not a PR review bot.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
                DeployIQ analyzes a code change in system context using test
                coverage, past incidents, and change history to surface blast
                radius, missing checks, and safer rollout guidance.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-5">
                  <a href="#report-preview">
                    Explore Report Preview
                    <ArrowRight className="size-4" />
                  </a>
                </Button>

                <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-11 border-stone-300 bg-white/60 px-5 text-stone-900 hover:bg-white"
                >
                  <a href="#workflow">See Release Workflow</a>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {signalCards.map((card) => {
                  const Icon = card.icon;

                  return (
                      <article
                          key={card.title}
                          className="rounded-3xl border border-stone-200 bg-white/70 p-4 shadow-sm backdrop-blur"
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-950 text-stone-50">
                          <Icon className="size-5" />
                        </div>
                        <p className="text-sm font-medium text-stone-600">
                          {card.title}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-stone-950">
                          {card.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          {card.description}
                        </p>
                      </article>
                  );
                })}
              </div>
            </div>

            <div
                id="report-preview"
                className="relative lg:pl-4"
            >
              <div className="absolute inset-x-10 top-6 h-40 rounded-full bg-orange-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-stone-800 bg-stone-950 p-5 text-stone-50 shadow-2xl shadow-stone-950/20">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-medium tracking-[0.18em] text-stone-400 uppercase">
                      Deployment Risk Report
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Payments Retry Refactor
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-stone-400">
                      Analyzing a backend change touching retry orchestration,
                      webhook delivery, and ledger reconciliation behavior.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-right">
                    <p className="text-xs font-medium tracking-[0.16em] text-orange-200 uppercase">
                      Risk
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-orange-100">
                      High
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                      <Waypoints className="size-4 text-sky-300" />
                      Affected Surface
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-stone-300">
                      <li className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                        <span>checkout-api</span>
                        <span className="text-stone-500">direct</span>
                      </li>
                      <li className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                        <span>billing-ui</span>
                        <span className="text-stone-500">consumer</span>
                      </li>
                      <li className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                        <span>ledger-worker</span>
                        <span className="text-stone-500">async path</span>
                      </li>
                      <li className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                        <span>postgres / retries table</span>
                        <span className="text-stone-500">stateful</span>
                      </li>
                    </ul>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                      <ListChecks className="size-4 text-emerald-300" />
                      Evidence Summary
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-stone-300">
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <p className="font-medium text-stone-100">
                          Tests cover the happy path
                        </p>
                        <p className="mt-1 text-stone-400">
                          Integration coverage exists for retry creation, but not
                          delayed reprocessing or rollback.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <p className="font-medium text-stone-100">
                          Similar incident in January
                        </p>
                        <p className="mt-1 text-stone-400">
                          Prior retry queue regression caused duplicate webhook
                          dispatch under load.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-300">
                      <ShieldAlert className="size-4 text-orange-300" />
                      Recommended Release Plan
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-orange-500/10 px-3 py-3">
                        <p className="text-xs font-medium tracking-[0.14em] text-orange-200 uppercase">
                          Step 1
                        </p>
                        <p className="mt-2 font-medium text-orange-50">
                          Flag the new retry path
                        </p>
                      </div>
                      <div className="rounded-2xl bg-sky-500/10 px-3 py-3">
                        <p className="text-xs font-medium tracking-[0.14em] text-sky-200 uppercase">
                          Step 2
                        </p>
                        <p className="mt-2 font-medium text-sky-50">
                          Canary background workers
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-500/10 px-3 py-3">
                        <p className="text-xs font-medium tracking-[0.14em] text-emerald-200 uppercase">
                          Step 3
                        </p>
                        <p className="mt-2 font-medium text-emerald-50">
                          Watch queue depth + webhook retries
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="rounded-[2rem] border border-stone-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="max-w-3xl">
                <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">
                  Product Direction
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                  Built for release confidence, not generic review commentary.
                </h2>
                <p className="mt-4 text-base leading-7 text-stone-600 sm:text-lg">
                  The homepage frames DeployIQ as a structured risk-analysis
                  platform: affected systems, evidence-backed risk calls, missing
                  checks, and rollout guidance.
                </p>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {reportSections.map((section) => (
                    <article
                        key={section.title}
                        className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
                    >
                      <p className="text-lg font-semibold text-stone-950">
                        {section.title}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-stone-600">
                        {section.description}
                      </p>
                    </article>
                ))}
              </div>
            </div>
          </section>

          <section
              id="workflow"
              className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 lg:py-12"
          >
            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-6 text-stone-50 sm:p-8">
                <p className="text-sm font-medium tracking-[0.16em] text-stone-400 uppercase">
                  Release Workflow
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Start with UI and mocked reports. Wire the engine later.
                </h2>
                <p className="mt-4 text-base leading-7 text-stone-300">
                  This keeps you moving without blocking on integrations. Build
                  the report surfaces first, then connect test coverage, incident
                  history, and system maps behind the same layout.
                </p>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-emerald-300" />
                    <p className="font-medium text-stone-100">
                      Good first milestone
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-400">
                    Land a believable dashboard and report detail view with typed
                    mock data, then add real ingestion and scoring behind it.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {workflowSteps.map((item, index) => {
                  const Icon = item.icon;

                  return (
                      <article
                          key={item.step}
                          className="rounded-[1.75rem] border border-stone-200 bg-white/75 p-5 shadow-sm backdrop-blur"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-stone-50">
                            <Icon className="size-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium tracking-[0.16em] text-stone-500 uppercase">
                              Step {index + 1}
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-stone-950">
                              {item.step}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-stone-600">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </article>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-stone-500 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <p>DeployIQ focuses on risk, blast radius, missing checks, and rollout guidance.</p>
            <div className="flex items-center gap-2 text-stone-700">
              <GitBranch className="size-4" />
              <span>Not a PR review bot</span>
            </div>
          </footer>
        </div>
      </main>
  );
}
