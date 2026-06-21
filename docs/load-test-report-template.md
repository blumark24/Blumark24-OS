# Load Test Report Template

## Test Metadata

- Test date:
- Tester:
- Commit SHA:
- Pull request:
- Environment:
- Base URL:
- Scenario:
- Tool:
- Production test approved: Yes/No

## Test Configuration

- VUs:
- Duration:
- Ramp-up:
- Target routes:
- Bearer token source: staging only / not used
- Tenant count represented:
- Dataset shape:

## Results

| Metric | Result | Target | Pass/Fail |
| --- | --- | --- | --- |
| Total requests |  |  |  |
| p50 latency |  |  |  |
| p95 latency |  |  |  |
| p99 latency |  |  |  |
| Error rate |  | < 1% |  |
| 5xx rate |  | < 1% |  |
| 429 rate |  | Explained by limits only |  |
| Timeout rate |  | < 1% |  |

## Supabase Observations

- CPU:
- Connections:
- API latency:
- Slow queries:
- Auth errors:
- Realtime pressure:
- Advisor notes:

## Vercel Observations

- Function duration:
- Function errors:
- Memory:
- Timeouts:
- Cold starts:
- Deployment/log notes:

## Tenant Isolation Checks

- Sampled tenant responses:
- Cross-tenant leakage observed: Yes/No
- Notes:

## Bottlenecks

- Primary bottleneck:
- Secondary bottleneck:
- Evidence:
- Request ids:

## Go / No-Go Decision

- Decision:
- Reason:
- Required fixes before next level:

## Next Actions

- Action:
- Owner:
- Priority:
- Target phase:
