# RB-PMIS Build & Implementation Tracker

## Phase A: Release Blockers

- [x] **A1: Build fix** — Remove `</create_file>` marker from deadlines/page.tsx
- [ ] **A2: Commit untracked migrations** — git add + commit 20260728000012 & 00013
- [ ] **A3: Storage bucket migration** — Create migration for evidence bucket + RLS policies
- [ ] **A4: CI workflow** — Create `.github/workflows/ci.yml` (lint, build)
- [ ] **A5: Evidence link RLS fix** — Restrict write access on evidence link tables
- [ ] **A6: Status transition enforcement** — DB triggers for valid workflow transitions
- [ ] **A7: Self-approval prevention** — DB policies preventing self-approval/verification
- [ ] **A8: Route-level authorization** — Middleware/check for role-based route access
- [ ] **A9: Server action role audit** — Add role checks to all server actions

## Phase B: Automated Data Validation

- [ ] **B1: Validation rules migration** — DB-level required field enforcement, date range checks
- [ ] **B2: Auto data-quality issue creation** — Trigger-based issue detection
- [ ] **B3: Data quality issue enhancement** — Ownership, corrective action, due date fields

## Phase C: Dashboard Compliance Metrics

- [ ] **C1: Data freshness** — Timestamp + stale-data warnings on dashboards
- [ ] **C2: Evidence-completeness rate** — For completed activities
- [ ] **C3: On-time reporting compliance** — 95% measure calculation
- [ ] **C4: Workplan coverage** — By department and planning cycle
- [ ] **C5: Data-quality error-rate metric** — With configurable threshold

## Phase D: Reporting Gaps

- [ ] **D1: Report generation from records** — Auto-populate reports from workplan/activity/indicator/evidence
- [ ] **D2: Report export scoping** — Proper scope by department, period, indicators
- [ ] **D3: Report workflow fix** — Enforce draft→submitted→reviewed→verified→approved/rejected
- [ ] **D4: Rejection reasons** — Require rejection comments, return to editable state

## Phase E: Review & Reflection Workflows

- [ ] **E1: Weekly review meeting module** — Migration + UI (schedule, agenda, attendance, decisions, follow-ups)
- [ ] **E2: Monthly reflection module** — Migration + UI (prompts, results, adaptive actions, linked evidence)

## Phase F: Knowledge & Search

- [ ] **F1: Full-text knowledge search** — Search across title, content, tags, category, department
- [ ] **F2: Knowledge filtering** — By category, department, period, tags
- [ ] **F3: Knowledge item enhancements** — Editing, version history, approval status, archival

## Phase G: Verification

- [ ] **G1: Build verification** — Run `npm run build` and confirm success
- [ ] **G2: Lint verification** — Run `npm run lint` and fix issues

