# AGENTS.md

Last updated: 2026-02-17
Owner: Product + Engineering

## Mission
Build an enterprise-grade estimation platform for trade contractors that is:
- Algorithm-tuned and continuously refinable
- Operationally manageable end-to-end
- Construction-tender readable and contract/invoice ready

## Product Vision
Deliver a full preconstruction workflow:
- Lead/customer intake
- Scope build and quantity takeoff
- Pricing and production-rate intelligence
- Estimate, proposal, tender, contract, and invoice generation
- Approval, revision history, and operational handoff

## Current Baseline (What Exists)
- Next.js + TypeScript + Firebase app with auth and per-user Firestore data
- Estimate editor with room/service modeling
- Core pricing calculation engine (labor/material/tax/discount/asbestos logic)
- Invoice and contract PDF generation routes

## Roadmap Overview

## Phase 0: Stabilize Foundation (Target: 2026-02-16 to 2026-03-15)
Goals:
- Make the current app reliable and shippable for controlled pilot use

Deliverables:
- Fix lint/type errors and strict typing gaps
- Resolve build/runtime issues and config deprecations
- Secret management hardening and environment cleanup
- Basic automated tests for calculation engine and critical flows
- Error handling and logging baseline

Exit criteria:
- `npm run lint` passes
- Build passes in CI
- No plaintext secrets in repo or local docs
- Core create/edit/save/duplicate/generate-pdf flow passes test checklist

## Phase 1: Domain Model v2 + Estimation Engine Hardening (Target: 2026-03-16 to 2026-05-15)
Goals:
- Improve estimation accuracy, explainability, and maintainability

Deliverables:
- Service catalog v2 (trade-specific assemblies, defaults, templates)
- Versioned pricing profiles (region/client/project-type)
- Formula transparency: per-line calculation trace and audit breakdown
- Calibration loop: planned vs actual feedback hooks
- Safe counter generation and concurrency correctness

Exit criteria:
- Every estimate total is reproducible from saved inputs + formula version
- Pricing profile changes are versioned and attributable
- Numbering is collision-safe under concurrent writes

## Phase 2: Tender/Proposal Readiness (Target: 2026-05-16 to 2026-07-31)
Goals:
- Produce contractor-grade and tender-readable output packages

Deliverables:
- Tender package builder (scope, exclusions, assumptions, alternates)
- Revisioned document sets (v1, v2, addenda)
- Branded templates per company/customer segment
- Compliance-ready clauses and jurisdiction-configurable legal text
- Export bundle: PDF + machine-readable summary

Exit criteria:
- One-click “Tender Pack” generation from approved estimate
- Revision diff and approval trail visible per document version

## Phase 3: Enterprise Platform Controls (Target: 2026-08-01 to 2026-10-31)
Goals:
- Multi-user, multi-role, multi-tenant operational maturity

Deliverables:
- Org/workspace model (companies, branches, teams)
- Role-based access control (Estimator, PM, Finance, Admin)
- Approval workflows and status gates
- Audit logs for estimate and pricing changes
- SLA-grade backup, recovery, and observability

Exit criteria:
- Tenant data isolation + role permissions validated
- All key business actions produce audit records

## Phase 4: Operations + Integrations (Target: 2026-11-01 to 2027-01-31)
Goals:
- Connect estimating to downstream operations and finance

Deliverables:
- CRM/accounting integrations
- Job costing handoff package to production teams
- Payment tracking and invoice lifecycle states
- KPI dashboard (win rate, margin, cycle time, variance)

Exit criteria:
- Estimate-to-invoice lifecycle is trackable in one system
- Core management KPIs available by branch/team/user

## Cross-Cutting Workstreams (All Phases)
- Security: least privilege, secret rotation, access reviews
- Data governance: schema/version migrations, retention policy
- UX quality: fast data entry, mobile-friendly field workflows
- Performance: large-estimate responsiveness and PDF generation reliability

## Tracking Format
Update this section weekly.

### Active Sprint
Dates: 2026-02-16 to 2026-02-28
Objective:
- Establish hardened estimate flow skeleton for safe scale-up.

In scope:
- [x] Centralized estimate workflow validation module
- [x] Transaction-safe estimate numbering in persistence flow
- [x] Hook-level status transition guard rails
- [x] Extract repository/service layer for estimates/customers/pricing hooks
- [x] Remove direct Firestore usage from UI hooks
- [x] Replace placeholder dashboard actions with workflow-backed actions
- [x] Add automated tests for validation and status transition paths
- [x] Build first-pass lead intake + leads-to-customers pipeline dashboard flow
- [x] Add shared dashboard UI style reference (tokens + guide)
- [x] Replace narrow-screen fallback tabs with full-screen hamburger menu overlay

Risks:
- Next.js SWC binary warnings still appear in this environment despite successful builds; keep monitoring CI parity.

Decisions:
- Keep hardening logic in domain module (`src/domain/estimate/workflow.ts`) and call it from UI + persistence layers.
- Introduce a first-pass leads pipeline dashboard (`Overview`, `Leads`, `Estimates`, `Customers`, `Operations`) backed by a lead repository/service/hook stack to prepare intake and nurture workflows.
- Standardize dashboard UI using `docs/dashboard-style-guide.md` + `src/components/dashboard/styleReference.ts` (buttons, spacing, radii, sidebar behavior, top banner behavior).
- Use a persistent left sidebar on desktop and a full-screen overlay menu on mobile/tablet for dashboard navigation and account actions.

### Backlog Snapshot
Now:
- [ ] Phase 0 lint/build stabilization
- [ ] Secret handling remediation
- [ ] Smoke test checklist for critical user path

Next:
- [ ] Formula audit trail structure
- [ ] Pricing profile versioning
- [ ] Tender package schema

Later:
- [ ] Full RBAC rollout
- [ ] Integrations
- [ ] Analytics and benchmarking

## Definition of Done (Enterprise Standard)
A feature is done only when:
- Functional acceptance criteria are met
- Test coverage is added or updated
- Security and permission impact is reviewed
- Observability/logging is in place
- Documentation (this file + technical docs) is updated
