# OS-PACKAGES-STRATEGY-LOCK-1

**Status:** LOCKED — do not modify without owner approval  
**Scope:** Subscription package model for Blumark24-OS  
**Last updated:** 2026-06-10

---

## Package Tiers

### BASIC
| Field | Value |
|---|---|
| Slug | `basic` |
| Base price | 299 SAR / month |
| Launch offer | 149 SAR / month (first 6 months) |
| Max users | 5 |
| Arabic label | أساسي |

**Included features:** Dashboard, Clients (CRM), Tasks, Employees (basic), Settings, Basic Reports  
**Excluded:** Virtual Office, Org structure, Finance, Automation, Strategy

---

### GROWTH
| Field | Value |
|---|---|
| Slug | `growth` |
| Base price | 599 SAR / month |
| Launch offer | 299 SAR / month (first 6 months) |
| Max users | 15 |
| Arabic label | نمو |

**Included features:** All BASIC features + Org structure, Departments, Basic Finance, Operational Reports  
**Virtual Office:** Teaser/preview only — not fully unlocked  
**Excluded:** Executive Virtual Office (full), Automation, Strategy

---

### ADVANCED
| Field | Value |
|---|---|
| Slug | `advanced` |
| Base price | 999 SAR / month |
| Launch offer | 499 SAR / month (first 6 months) |
| Max users | 40 |
| Arabic label | متقدم |

**Included features:** All GROWTH features + Executive Virtual Office (8 operational offices + Board office), Visual Presence, Advanced Reports, Automation, Strategy  
**Virtual Office:** Fully unlocked — Executive VO, 8 operational offices, Board office

---

### ENTERPRISE
| Field | Value |
|---|---|
| Slug | `enterprise` |
| Base price | Starts from 1,999 SAR / month |
| Launch offer | Custom contract |
| Max users | Unlimited (custom) |
| Arabic label | مؤسسي |

**Included features:** All ADVANCED features + Multi-organization, White-label (optional), SLA, Integrations, Training, Dedicated support  
**Pricing:** Custom contract — no fixed price in code

---

## Launch Discount — Founding Customers Offer

| Field | Value |
|---|---|
| Discount | 50% off base price |
| Eligibility | First 100 organizations |
| Duration | 6 months from subscription start |
| Applies to | BASIC, GROWTH, ADVANCED (not ENTERPRISE — custom contract) |
| Code representation | Coupon/discount layer — **not** hardcoded into base plan prices |

After 6 months, subscription automatically reverts to the full base price.  
The launch offer prices in the table above are display values only; base prices are the canonical values stored in `plans.price_monthly`.

---

## Feature Access Matrix

| Feature | BASIC | GROWTH | ADVANCED | ENTERPRISE |
|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ |
| Clients (CRM) | ✓ | ✓ | ✓ | ✓ |
| Employees (basic) | ✓ | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | ✓ | ✓ |
| Basic Reports | ✓ | ✓ | ✓ | ✓ |
| Org Structure | — | ✓ | ✓ | ✓ |
| Departments | — | ✓ | ✓ | ✓ |
| Basic Finance | — | ✓ | ✓ | ✓ |
| Operational Reports | — | ✓ | ✓ | ✓ |
| Virtual Office (teaser) | — | teaser | ✓ (full) | ✓ (full) |
| Executive Virtual Office | — | — | ✓ | ✓ |
| Advanced Reports | — | — | ✓ | ✓ |
| Automation | — | — | ✓ | ✓ |
| Strategy | — | — | ✓ | ✓ |
| Multi-org / White-label | — | — | — | optional |
| SLA / Dedicated support | — | — | — | ✓ |

---

## Implementation Constraints

- **No checkout** — do not implement payment flow from this spec
- **No payment provider code** — no Stripe/Moyasar/etc.
- **No migrations** — price/plan data changes go through the owner panel DB, not code migrations
- **No RLS/schema/Auth changes**
- **Discount model** — launch offer must be implemented as a coupon/discount layer in the future, never hardcoded into `base_price` fields
- **Enterprise price** — `null` in code; displayed as "يبدأ من 1,999 ر.س" or "تواصل معنا"
- **PlanSlug** type in code: `"basic" | "growth" | "advanced" | "enterprise"`
