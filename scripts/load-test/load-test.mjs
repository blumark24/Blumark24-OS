#!/usr/bin/env node

const DEFAULT_DURATION = 30;
const DEFAULT_VUS = 5;
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

const SCENARIOS = {
  health: {
    routes: [{ method: "GET", path: "/api/health", auth: false }],
  },
  "dashboard-summary": {
    routes: [{ method: "GET", path: "/api/tenant/dashboard-summary", auth: true }],
  },
  smoke: {
    routes: [
      { method: "GET", path: "/api/health", auth: false },
      { method: "GET", path: "/api/health?deep=1", auth: false },
      { method: "GET", path: "/api/tenant/dashboard-summary", auth: true, optionalAuth: true },
    ],
  },
};

function argValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function readConfig() {
  const scenario = argValue("scenario") || process.env.LOAD_TEST_SCENARIO || "health";
  const durationSeconds = Number(argValue("duration") || process.env.LOAD_TEST_DURATION || DEFAULT_DURATION);
  const vus = Number(argValue("vus") || process.env.LOAD_TEST_VUS || DEFAULT_VUS);
  const baseUrl = (argValue("base-url") || process.env.LOAD_TEST_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const bearerToken = process.env.LOAD_TEST_BEARER_TOKEN || "";
  const dryRun = process.argv.includes("--dry-run") || process.env.LOAD_TEST_DRY_RUN === "1";

  if (!SCENARIOS[scenario]) {
    throw new Error(`Unknown scenario "${scenario}". Expected one of: ${Object.keys(SCENARIOS).join(", ")}`);
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("LOAD_TEST_DURATION must be a positive number of seconds");
  }
  if (!Number.isFinite(vus) || vus <= 0) {
    throw new Error("LOAD_TEST_VUS must be a positive number");
  }

  return { scenario, durationSeconds, vus, baseUrl, bearerToken, dryRun };
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(results) {
  const latencies = results.map((result) => result.durationMs);
  const total = results.length;
  const failures = results.filter((result) => result.error || result.status >= 500).length;
  const rateLimited = results.filter((result) => result.status === 429).length;
  const byStatus = results.reduce((acc, result) => {
    const key = result.error ? "error" : String(result.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    failures,
    errorRate: total ? failures / total : 0,
    rateLimited,
    rateLimitedRate: total ? rateLimited / total : 0,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    byStatus,
  };
}

async function requestRoute(baseUrl, route, bearerToken) {
  if (route.auth && !bearerToken) {
    if (route.optionalAuth) {
      return { status: 0, durationMs: 0, skipped: true, path: route.path };
    }
    throw new Error(`Scenario route ${route.path} requires LOAD_TEST_BEARER_TOKEN`);
  }

  const started = Date.now();
  try {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: {
        "user-agent": "blumark24-load-test/1.0",
        ...(route.auth ? { authorization: `Bearer ${bearerToken}` } : {}),
      },
      cache: "no-store",
    });
    await response.arrayBuffer();
    return {
      path: route.path,
      status: response.status,
      durationMs: Date.now() - started,
      skipped: false,
    };
  } catch (error) {
    return {
      path: route.path,
      status: 0,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      skipped: false,
    };
  }
}

async function runWorker(config, until, results) {
  const routes = SCENARIOS[config.scenario].routes;
  let index = 0;

  while (Date.now() < until) {
    const route = routes[index % routes.length];
    const result = await requestRoute(config.baseUrl, route, config.bearerToken);
    if (!result.skipped) results.push(result);
    index++;
  }
}

async function main() {
  const config = readConfig();
  const routes = SCENARIOS[config.scenario].routes.map((route) => ({
    method: route.method,
    path: route.path,
    auth: route.auth,
  }));

  if (config.dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, config: { ...config, bearerToken: Boolean(config.bearerToken) }, routes }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    event: "load_test_start",
    scenario: config.scenario,
    baseUrl: config.baseUrl,
    durationSeconds: config.durationSeconds,
    vus: config.vus,
    routes,
    hasBearerToken: Boolean(config.bearerToken),
  }, null, 2));

  const results = [];
  const until = Date.now() + config.durationSeconds * 1000;
  const workers = Array.from({ length: config.vus }, () => runWorker(config, until, results));
  await Promise.all(workers);

  console.log(JSON.stringify({
    event: "load_test_complete",
    scenario: config.scenario,
    summary: summarize(results),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
