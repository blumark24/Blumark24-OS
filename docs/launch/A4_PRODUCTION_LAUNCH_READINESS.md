# A4 — Production Launch Readiness

Date: 2026-06-19
Scope: Production deployment, pilot QA, release operations

## Executive status

Blumark24 OS has completed:

- Phase 0 audit
- A1 Security & Tenant Isolation
- A2 Supabase Security Hardening
- A3 Professional Plan Management Engine

Current launch posture: **Pilot Ready, not Public Launch Ready**.

Target: controlled first 10 customers.

---

## A4 findings

### 1. Vercel project visibility blocker

The connected Vercel team currently exposes only:

- `blumark24-website`

The OS repository/project is not visible as a Vercel project under the connected team.

Impact:

- Production domain cannot be verified from the connected Vercel context.
- Build/deployment logs cannot be inspected from the connected Vercel context.
- Runtime logs cannot be monitored from the connected Vercel context.

Decision:

- Treat this as an A4 launch blocker.
- OS must be imported/deployed as a separate Vercel project or the correct Vercel team/account must be connected.

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

- [ ] Import `blumark24/Blumark24-OS` into Vercel as a dedicated project.
- [ ] Confirm framework: Next.js.
- [ ] Confirm Node.js version >= 20.
- [ ] Add required environment variables.
- [ ] Run production build.
- [ ] Confirm deployment URL.
- [ ] Assign subdomain, recommended: `app.blumark24.com`.

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

The product can move to pilot when:

1. OS project appears in Vercel.
2. Production deployment build succeeds.
3. Required env vars are configured.
4. Smoke tests pass.
5. Domain routing is confirmed.

Until then: **do not onboard public customers**. Controlled internal testing is acceptable.
