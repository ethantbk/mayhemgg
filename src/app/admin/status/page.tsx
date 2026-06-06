import type { Metadata } from "next";
import { headers } from "next/headers";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, RadioTower, RefreshCw, ShieldAlert } from "lucide-react";
import { currentPatch } from "@/lib/patchConfig";
import type { RefreshHealthReport, RefreshStatusReport } from "@/server/refresh";
import type { DbIngestionJob, DbIngestionRun, JsonValue } from "@/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Admin Status",
  description: "Hidden MayhemGG data pipeline status dashboard.",
  robots: {
    index: false,
    follow: false
  }
};

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

type StatusApiResponse = RefreshStatusReport & {
  ok: boolean;
};

function getRefreshSecret() {
  return process.env.INGESTION_CRON_SECRET ?? process.env.CRON_SECRET ?? process.env.RIOT_VERIFY_SECRET;
}

async function getBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    return `${protocol}://${host}`;
  }

  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function fetchRefreshEndpoint<T>(path: string): Promise<ApiResult<T>> {
  const secret = getRefreshSecret();
  const response = await fetch(`${await getBaseUrl()}${path}`, {
    cache: "no-store",
    headers: secret
      ? {
          authorization: `Bearer ${secret}`
        }
      : undefined
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const body = await response.json();
      message = typeof body?.error === "string" ? body.error : message;
    } catch {
      // Keep the status-derived message when the body is not JSON.
    }

    return {
      ok: false,
      error: message,
      status: response.status
    };
  }

  return {
    ok: true,
    data: await response.json()
  };
}

function isRecord(value: JsonValue | undefined): value is { [key: string]: JsonValue } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readNumber(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getRunMatchesProcessed(run: DbIngestionRun) {
  if (!isRecord(run.metadata)) return 0;

  const matchIngestion = run.metadata.matchIngestion;

  if (isRecord(matchIngestion)) {
    return readNumber(matchIngestion.matchesPersisted) || readNumber(matchIngestion.matchesAttempted);
  }

  return readNumber(run.metadata.matchesPersisted) || readNumber(run.metadata.matchesAttempted);
}

function getLastRefreshTime(runs: DbIngestionRun[]) {
  const refreshRun = runs.find((run) => run.source === "aggregation-pipeline" || run.source.includes("refresh"));
  return refreshRun?.finishedAt ?? refreshRun?.startedAt ?? null;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatRelativeStatus(job: DbIngestionJob) {
  return job.errorMessage ?? `${job.jobType} ${job.status}`;
}

function statusClass(status: string) {
  if (status === "succeeded") return "border-volt/20 bg-volt/[0.08] text-volt";
  if (status === "running" || status === "queued") return "border-frost/20 bg-frost/[0.08] text-frost";
  if (status === "rate_limited") return "border-ember/20 bg-ember/[0.08] text-ember";
  return "border-red-400/20 bg-red-400/[0.08] text-red-200";
}

function StatPanel({
  label,
  value,
  detail,
  icon: Icon,
  tone = "text-white"
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: string;
}) {
  return (
    <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function JobRow({ job }: { job: DbIngestionJob }) {
  return (
    <div className="grid gap-3 border-t border-white/10 px-4 py-4 text-sm first:border-t-0 md:grid-cols-[1.4fr_0.8fr_1fr] md:items-center">
      <div>
        <p className="font-bold text-white">{job.jobType}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{job.jobId}</p>
      </div>
      <span className={`w-fit rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusClass(job.status)}`}>
        {job.status.replace("_", " ")}
      </span>
      <p className="text-slate-400 md:text-right">{formatDateTime(job.finishedAt ?? job.startedAt ?? job.updatedAt)}</p>
    </div>
  );
}

export default async function AdminStatusPage() {
  const [healthResult, statusResult] = await Promise.all([
    fetchRefreshEndpoint<RefreshHealthReport>("/api/refresh/health"),
    fetchRefreshEndpoint<StatusApiResponse>("/api/refresh/status?limit=25")
  ]);
  const health = healthResult.ok ? healthResult.data : null;
  const status = statusResult.ok ? statusResult.data : null;
  const patch = health?.patch ?? status?.patch ?? null;
  const recentJobs = status?.recentJobs ?? health?.recentJobs ?? [];
  const recentRuns = status?.recentRuns ?? health?.recentRuns ?? [];
  const runningJobs = status?.runningJobs ?? health?.runningJobs ?? [];
  const failedJobs = recentJobs.filter((job) => ["retryable_failed", "rate_limited", "permanently_failed"].includes(job.status)).slice(0, 6);
  const totalMatchesProcessed = recentRuns.reduce((sum, run) => sum + getRunMatchesProcessed(run), 0);
  const lastRefreshTime = getLastRefreshTime(recentRuns);
  const cronConfigured = Boolean(process.env.INGESTION_CRON_SECRET || process.env.CRON_SECRET);
  const apiError = !healthResult.ok ? healthResult.error : !statusResult.ok ? statusResult.error : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="premium-border overflow-hidden rounded-lg bg-abyss/[0.82] shadow-card">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-frost">Hidden Admin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Pipeline Status</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Internal monitor for Riot ingestion, aggregation, cron refreshes, and live data readiness.
              </p>
            </div>
            <div className={`inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm font-black ${health?.ok ? "border-volt/20 bg-volt/[0.08] text-volt" : "border-ember/20 bg-ember/[0.08] text-ember"}`}>
              {health?.ok ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <ShieldAlert className="h-4 w-4" aria-hidden="true" />}
              {health?.ok ? "Healthy" : "Needs Attention"}
            </div>
          </div>
          {apiError ? (
            <div className="mt-5 rounded-md border border-ember/25 bg-ember/[0.08] p-4 text-sm text-ember">
              {apiError}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
          <StatPanel
            label="Current Patch"
            value={patch?.version ?? currentPatch.version}
            detail={patch ? `Patch status: ${patch.status}` : "Using configured frontend patch fallback."}
            icon={Database}
            tone="text-frost"
          />
          <StatPanel
            label="Last Refresh"
            value={lastRefreshTime ? formatDateTime(lastRefreshTime) : "Never"}
            detail="Most recent aggregation pipeline or refresh run."
            icon={Clock3}
            tone="text-volt"
          />
          <StatPanel
            label="Matches Processed"
            value={totalMatchesProcessed.toLocaleString()}
            detail="Recent refresh runs reported by the status endpoint."
            icon={Activity}
            tone="text-frost"
          />
          <StatPanel
            label="Cron Config"
            value={cronConfigured ? "Configured" : "Missing"}
            detail={cronConfigured ? "A cron secret is available for protected refresh calls." : "Set INGESTION_CRON_SECRET before production use."}
            icon={RefreshCw}
            tone={cronConfigured ? "text-volt" : "text-ember"}
          />
        </div>

        <div className="grid gap-5 p-5 pt-0 sm:p-7 sm:pt-0 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="premium-border rounded-lg bg-panel/[0.58]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
              <div>
                <h2 className="text-lg font-black text-white">Ingestion Jobs</h2>
                <p className="mt-1 text-sm text-slate-500">{runningJobs.length} running, {recentJobs.length} recent</p>
              </div>
              <RadioTower className="h-5 w-5 text-frost" aria-hidden="true" />
            </div>
            {recentJobs.length ? recentJobs.slice(0, 8).map((job) => <JobRow key={job.id} job={job} />) : (
              <p className="px-4 py-6 text-sm text-slate-400">No ingestion jobs reported yet.</p>
            )}
          </section>

          <section className="premium-border rounded-lg bg-panel/[0.58]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
              <div>
                <h2 className="text-lg font-black text-white">Recent Failures</h2>
                <p className="mt-1 text-sm text-slate-500">Retry, rate-limit, and permanent failures</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-ember" aria-hidden="true" />
            </div>
            {failedJobs.length ? failedJobs.map((job) => (
              <div key={job.id} className="border-t border-white/10 px-4 py-4 first:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-bold text-white">{job.jobType}</p>
                  <span className={`rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusClass(job.status)}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{formatRelativeStatus(job)}</p>
              </div>
            )) : (
              <p className="px-4 py-6 text-sm text-slate-400">No recent failed jobs.</p>
            )}
          </section>
        </div>

        <div className="grid gap-5 border-t border-white/10 p-5 sm:p-7 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current Data Source</p>
            <p className="mt-3 text-lg font-black text-white">{currentPatch.dataSourceLabel}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Riot Config</p>
            <p className="mt-3 text-lg font-black text-white">{health?.checks.riotConfigured ? "Configured" : "Missing"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pipeline State</p>
            <p className="mt-3 text-lg font-black text-white">{health?.checks.pipelineRunning ? "Running" : "Idle"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
