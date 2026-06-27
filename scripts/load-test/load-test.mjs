#!/usr/bin/env node

const DEFAULT_DURATION = 30;
const DEFAULT_VUS = 5;
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_MAX_ERROR_RATE = 0.01;
const DEFAULT_MAX_P95_MS = 1500;

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

// Statuses we consider acceptable for a scenario route. 2xx is always ok.
// 401 is allowed only when a route is auth-required and no bearer was provided
// (auth-required routes are skipped before fetch in that case, so 401 should
// never actually appear in results — but we leave the door open via the
// LOAD_TEST_ALLOWED_STATUSES env).
const DEFAULT_ALLOWED_NON_2XX = new Set();

function argValue(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function parseStatusList(raw) {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0 && n < 600),
  );
}

function readConfig() {
  const scenario = argValue("scenario") || process.env.LOAD_TEST_SCENARIO || "health";
  const durationSeconds = Number(argValue("duration") || process.env.LOAD_TEST_DURATION || DEFAULT_DURATION);
  const vus = Number(argValue("vus") || process.env.LOAD_TEST_VUS || DEFAULT_VUS);
  const baseUrl = (argValue("base-url") || process.env.LOAD_TEST_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const bearerToken = process.env.LOAD_TEST_BEARER_TOKEN || "";
  const dryRun = process.argv.includes("--dry-run") || process.env.LOAD_TEST_DRY_RUN === "1";
  const maxErrorRate = Number(
    argValue("max-error-rate") || process.env.LOAD_TEST_MAX_ERROR_RATE || DEFAULT_MAX_ERROR_RATE,
  );
  const maxP95Ms = Number(argValue("max-p95-ms") || process.env.LOAD_TEST_MAX_P95_MS || DEFAULT_MAX_P95_MS);
  const allowedNon2xx = parseStatusList(
    argValue("allowed-statuses") || process.env.LOAD_TEST_ALLOWED_STATUSES || "",
  );
  for (const s of DEFAULT_ALLOWED_NON_2XX) allowedNon2xx.add(s);

  if (!SCENARIOS[scenario]) {
    throw new Error(`Unknown scenario "${scenario}". Expected one of: ${Object.keys(SCENARIOS).join(", ")}`);
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("LOAD_TEST_DURATION must be a positive number of seconds");
  }
  if (!Number.isFinite(vus) || vus <= 0) {
    throw new Error("LOAD_TEST_VUS must be a positive number");
  }
  if (!Number.isFinite(maxErrorRate) || maxErrorRate < 0 || maxErrorRate > 1) {
    throw new Error("LOAD_TEST_MAX_ERROR_RATE must be between 0 and 1");
  }
  if (!Number.isFinite(maxP95Ms) || maxP95Ms <= 0) {
    throw new Error("LOAD_TEST_MAX_P95_MS must be a positive number of milliseconds");
  }

  return {
    scenario,
    durationSeconds,
    vus,
    baseUrl,
    bearerToken,
    dryRun,
    maxErrorRate,
    maxP95Ms,
    allowedNon2xx,
  };
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function isSuccessStatus(status, allowedNon2xx) {
  if (status >= 200 && status < 300) return true;
  if (allowedNon2xx.has(status)) return true;
  return false;
}

function summarize(results, allowedNon2xx) {
  const latencies = results.map((result) => result.durationMs);
  const total = results.length;
  const failures = results.filter(
    (result) => result.error || !isSuccessStatus(result.status, allowedNon2xx),
  ).length;
  const rateLimited = results.filter((result) => result.status === 429).length;
  const byStatus = results.reduce((acc, result) => {
    const key = result.error ? "error" : String(result.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const unexpectedStatuses = Object.keys(byStatus).filter((key) => {
    if (key === "error") return true;
    const status = Number(key);
    return !isSuccessStatus(status, allowedNon2xx);
  });

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
    unexpectedStatuses,
  };
}

function evaluateThresholds(summary, config) {
  const failures = [];

  if (summary.total === 0) {
    failures.push("no requests were executed (every route skipped or workers never ran)");
  }
  if (summary.errorRate > config.maxErrorRate) {
    failures.push(
      `errorRate ${summary.errorRate.toFixed(4)} exceeds LOAD_TEST_MAX_ERROR_RATE ${config.maxErrorRate}`,
    );
  }
  if (summary.p95 > config.maxP95Ms) {
    failures.push(`p95 ${summary.p95}ms exceeds LOAD_TEST_MAX_P95_MS ${config.maxP95Ms}ms`);
  }
  if (summary.unexpectedStatuses.length > 0) {
    failures.push(`unexpected statuses observed: ${summary.unexpectedStatuses.join(", ")}`);
  }

  return failures;
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
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          config: {
            ...config,
            bearerToken: Boolean(config.bearerToken),
            allowedNon2xx: [...config.allowedNon2xx],
          },
          routes,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        event: "load_test_start",
        scenario: config.scenario,
        baseUrl: config.baseUrl,
        durationSeconds: config.durationSeconds,
        vus: config.vus,
        routes,
        hasBearerToken: Boolean(config.bearerToken),
        thresholds: {
          maxErrorRate: config.maxErrorRate,
          maxP95Ms: config.maxP95Ms,
          allowedNon2xx: [...config.allowedNon2xx],
        },
      },
      null,
      2,
    ),
  );

  const results = [];
  const until = Date.now() + config.durationSeconds * 1000;
  const workers = Array.from({ length: config.vus }, () => runWorker(config, until, results));
  await Promise.all(workers);

  const summary = summarize(results, config.allowedNon2xx);
  const failures = evaluateThresholds(summary, config);
  const passed = failures.length === 0;

  console.log(
    JSON.stringify(
      {
        event: "load_test_complete",
        scenario: config.scenario,
        summary,
        thresholds: {
          maxErrorRate: config.maxErrorRate,
          maxP95Ms: config.maxP95Ms,
          allowedNon2xx: [...config.allowedNon2xx],
        },
        result: passed ? "PASS" : "FAIL",
        failures,
      },
      null,
      2,
    ),
  );

  if (passed) {
    console.log(
      `PASS — scenario=${config.scenario} total=${summary.total} errorRate=${summary.errorRate.toFixed(
        4,
      )} p95=${summary.p95}ms`,
    );
  } else {
    console.error(`FAIL — scenario=${config.scenario}`);
    for (const reason of failures) console.error(`  - ${reason}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
