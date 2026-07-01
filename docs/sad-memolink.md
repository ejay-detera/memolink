# Subagents Document (SAD)

**Project:** MemoLink AI
**Date:** 2026-07-01
**Version:** 0.1
**Owner:** [To be defined]
**Status:** Draft
**Last reconciled:** 2026-07-01
**PRD:** [docs/prd.md](docs/prd.md)
**SDD:** [sdd-memolink.md](sdd-memolink.md) · **Build Guide:** [build-memolink.md](build-memolink.md)

---

## 1. Purpose & Scope

MemoLink is a cross-platform mobile app built with React Native (Expo Router). Its architecture integrates offline-first caching, strict Row Level Security (RLS), and sensitive AI processing via Supabase Edge Functions. To ensure these complex guardrails are enforced on every feature PR, we utilize a specialized roster of subagents. 

These agents assist the **build and validation** phases. They are platform-agnostic and enforce the accessibility, offline reliability, and security rules defined in the SDD and Build manuals.

**Out of scope:** Subagents do not make product or design decisions — those live in the PRD/SDD. They *execute and enforce* within established boundaries.

---

## 2. Roster Design Rationale

Anti-sprawl rule: an agent earns a slot only if it's (1) spawned repeatedly, (2) protects the main agent's context, or (3) enforces a must-not-skip guardrail.

| Considered | Decision | Reason |
|------------|----------|--------|
| `expo-screen-builder` | **Kept** | Spawned for every new screen. Core build loop for generating React Native screens from UI primitives. |
| `mobile-a11y-auditor` | **Kept** | Guardrail: Seniors are the target persona. High contrast and Voice-Over compatibility are critical. |
| `offline-state-tester` | **Kept** | Guardrail: Validates React Query persistence so medication reminders trigger offline. |
| `rls-auditor` | **Kept** | Guardrail: Ensures strict data isolation between seniors and caregivers via Supabase RLS. |
| `edge-function-reviewer` | **Kept** | Guardrail: Secures Gemini API integrations in Edge Functions and prevents key leakage. |
| `figma-section-builder` | Rejected | Replaced by `expo-screen-builder` which is tailored for React Native / Expo instead of React DOM. |

---

## 3. The Roster

| Agent ID | Name | One-line job | Trigger |
|----------|------|--------------|---------|
| SAD-A1 | `expo-screen-builder` | Scaffolds React Native screens from designs using `src/components/ui` and NativeWind. | A DRI starts a new screen or feature component. |
| SAD-A2 | `mobile-a11y-auditor` | Checks touch targets, contrast ratios, and screen reader labels. | On any frontend component diff. |
| SAD-A3 | `offline-state-tester` | Validates that queries handle offline modes and mutations queue properly. | On React Query hook or state changes. |
| SAD-A4 | `rls-auditor` | Audits SQL migrations for correct RLS policies. | On any `supabase/migrations/` diff. |
| SAD-A5 | `edge-function-reviewer`| Audits Deno Edge Functions for Gemini RAG context bounds and secret safety. | On any `supabase/functions/` diff. |

---

### Agent Cards

#### SAD-A1 — expo-screen-builder
- **Purpose:** Scaffolds React Native screens from designs, strictly utilizing `src/components/ui` primitives and NativeWind for styling. 
- **Responsibilities:** Read layout specs, generate Expo Router files (`_layout.tsx`, `page.tsx`), and wire up NativeWind classes without using raw `<View>` or `<Text>` for standard styling.
- **Guardrails:** Never use hardcoded colors outside the Tailwind theme. Never bypass `src/components/ui`.

#### SAD-A2 — mobile-a11y-auditor
- **Purpose:** Keep the app strictly accessible for seniors.
- **Responsibilities:** Ensure interactive elements have min 48x48dp touch targets, check color contrast, and verify `accessibilityLabel` / `accessibilityRole` on custom components.
- **Guardrails:** Report-only (no auto-fixing). 

#### SAD-A3 — offline-state-tester
- **Purpose:** Prevent offline functionality regressions.
- **Responsibilities:** Statically analyzes React Query usage to ensure `staleTime`, `gcTime`, and offline persisters are configured correctly for critical queries like medications.

#### SAD-A4 — rls-auditor
- **Purpose:** Ensure strict data privacy between users.
- **Responsibilities:** Reviews `CREATE POLICY` statements to guarantee that seniors only access their own data, and caregivers only access mapped seniors.

#### SAD-A5 — edge-function-reviewer
- **Purpose:** Protect the Gemini API integration.
- **Responsibilities:** Audits Supabase Edge Function code to ensure Gemini API keys remain secure, prompt context is strictly bounded by RLS, and no secrets leak to the client payload.

---

## 4. Orchestration

- **Sequencing (Parallel Audit):** 
  1. `expo-screen-builder` (SAD-A1) scaffolds the React Native code.
  2. `mobile-a11y-auditor` (SAD-A2) and `offline-state-tester` (SAD-A3) review the frontend diff in parallel.
  3. `rls-auditor` (SAD-A4) and `edge-function-reviewer` (SAD-A5) validate any backend migrations or Edge Function changes in parallel.
- **Hand-off:** Findings are aggregated and returned to the main agent or DRI for resolution before the PR can be merged.

```text
section DRI ─▶ expo-screen-builder (A1)
                     │
                     ├─▶ mobile-a11y-auditor (A2) ─────┐
                     ├─▶ offline-state-tester (A3) ────┤ frontend findings
                     │                                 │
                     ├─▶ rls-auditor (A4) ─────────────┐
                     ├─▶ edge-function-reviewer (A5) ──┤ backend findings
                     ▼                                 ▼
              DRI resolves findings ──gate──▶ PR Merge / Release
```

---

## 5. Materialization

The cards above are canonical. Re-materialize whenever this SAD changes.
Treat generated files in IDE-specific formats (like `.claude/agents/` or `.cursor/rules/`) as build artifacts, not sources of truth.
