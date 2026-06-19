# A4 — Production Launch Readiness

Date: 2026-06-19
Scope: Production deployment, pilot QA, release operations

## Executive status

Blumark24 OS has completed:

- Phase 0 audit
- A1 Security & Tenant Isolation
- A2 Supabase Security Hardening
- A3 Professional Plan Management Engine

Current launch posture: **Pilot Ready**.

Target: controlled first 10 customers.

---

## A4 findings

### 1. Vercel production deployment confirmed

User-provided Vercel production evidence confirms:

- Production deployment URL: `blumark24-lpbmptehv-blumark24-os.vercel.app`
- Production status: `Ready`
- Production source branch: `main`
- Production commit: `b5e6821`
- Domains:
  - `app.blumark24.com`
  - `blumark24-os.vercel.app`
- Observability:
  - Edge Requests: `1.6K`
  - Function Invocations: `372`
  - Error Rate: `0%`
- Firewall: Active / all systems normal

Decision:

- The previous Vercel visibility blocker is cleared from the user dashboard evidence.
- The connected Vercel tool still cannot inspect this deployment directly, so final runtime log review must be done from the Vercel dashboard unless connector access is updated.

---

### 2. Required environment variables

From `.env.local.example`, the OS deployment requires:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Required before production smoke testing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

AI-related keys depend on enabled AI routes:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Security rule:

- Service role key must exist only in Vercel server-side environment variables.
- Never expose service role as `NEXT_PUBLIC_*`.

---

### 3. A3 production verification

The canonical plans were verified in Supabase Production after applying A3:

- `basic`: 299 SAR/month, dashboard/tasks/clients/employees/reports
- `growth`: 599 SAR/month, adds org/finance
- `advanced`: 999 SAR/month, adds strategy/automation
- `enterprise`: custom price, includes AI

A3 status: complete.

---

## A4 launch checklist

### Deployment

- [x] Import/deploy `blumark24/Blumark24-OS` into Vercel.
- [x] Confirm framework: Next.js.
- [x] Confirm production deployment status: Ready.
- [x] Confirm deployment URL.
- [x] Assign subdomain: `app.blumark24.com`.
- [ ] Confirm Node.js version >= 20 from Vercel project settings.
- [ ] Confirm required environment variables.
- [ ] Review Vercel build logs.
- [ ] Review Vercel runtime logs.

### Security smoke tests

- [ ] Owner can log in.
- [ ] Non-owner cannot access `/owner`.
- [ ] Tenant A cannot read Tenant B data.
- [ ] Tenant with Basic cannot access Growth/Advanced features.
- [ ] Service-role APIs require authenticated owner/manager token.
- [ ] Create user route enforces rate limits.

### Owner operations smoke tests

- [ ] Create organization.
- [ ] Provision tenant login.
- [ ] Activate subscription.
- [ ] Reset client password.
- [ ] Suspend organization.
- [ ] Reactivate organization.
- [ ] Confirm owner audit logs are written.

### Customer journey smoke tests

- [ ] Tenant login works.
- [ ] Dashboard loads without mock data.
- [ ] Tasks load.
- [ ] Clients load.
- [ ] Employees load according to plan.
- [ ] Finance visible only for eligible plans.
- [ ] Automation visible only for eligible plans.
- [ ] AI visible only for Enterprise.

### Release operations

- [ ] Pilot customer list prepared.
- [ ] Rollback plan documented.
- [ ] Support escalation path defined.
- [ ] Manual onboarding script prepared.
- [ ] Daily pilot monitoring checklist prepared.

---

## A4 decision gate

The product can move to controlled pilot when:

1. Required env vars are confirmed.
2. Production smoke tests pass.
3. Owner flow works end-to-end.
4. Customer flow works end-to-end.
5. Runtime logs stay clean after smoke testing.

Until then: **controlled pilot only, not broad public launch**.
