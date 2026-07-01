# Project Build Guide

**Project:** MemoLink AI
**Date:** 2026-07-01
**Version:** 0.1
**Owner:** [To be defined]
**Status:** Draft
**Last reconciled:** 2026-07-01
**PRD:** [docs/prd.md](docs/prd.md) · **SDD:** [sdd-memolink.md](sdd-memolink.md)

---

> **What this is:** the operating manual for whoever **builds** MemoLink — human or AI agent, on any IDE. The other docs say *what* and *how* to design; this says *how we actually work in this repo*: read order, the exact pinned stack and its current conventions, golden-path patterns to copy, and the guardrails. **It is the canonical source; it materializes to the project-root `AGENTS.md`.** Edit *this* file, then re-materialize — never hand-edit the root copies as the source of truth.

---

## 1. How to Build From These Docs

The documentation suite is the source of truth. Read in this order before writing code:

1. **[PRD](docs/prd.md)** — what to build and why (features, user stories, personas).
2. **[SDD](sdd-memolink.md)** — architecture (Expo Router, Supabase, Edge Functions, Offline Caching).
3. **This guide** — stack conventions, patterns, guardrails.

> **Doc status note:** the suite is currently **Draft** (pre-implementation). Treat each doc as the best-available source. When reality diverges from a doc, don't silently code around it — flag it and open a Change Record.

---

## 2. Subagents

This project's specialist build agents are defined to ensure accessibility, security, and offline reliability. Spawn them during the build and QA process.

- `mobile-a11y-auditor`: Ensures large touch targets, high contrast (NativeWind), and Voice-Over/TalkBack compatibility for senior accessibility.
- `offline-state-tester`: Validates React Query persistence and offline UI states, ensuring medication reminders trigger without internet.
- `rls-auditor`: Validates Supabase Row Level Security (RLS) policies to ensure data isolation.

---

## 3. Stack Currency & Deprecations

> **The rule that prevents stale code:** do **not** rely on training memory for the conventions of fast-moving frameworks. Before writing framework code, verify against the official docs for the pinned version below.

### Pinned stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript `^5` |
| Framework | Expo / React Native (Expo Router) |
| UI runtime | React 19 |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| State/Cache | TanStack React Query (`@tanstack/react-query`) |
| Backend/Auth | Supabase (PostgreSQL, Edge Functions, Auth) |
| AI | Gemini API (via Edge Functions only) |

### Deprecations & convention changes

| ❌ Stale / deprecated | ✅ Current convention (this repo) |
|----------------------|-----------------------------------|
| Direct `fetch` for state | `useQuery` via custom hooks with offline persisters |
| Hardcoding UI colors | Use semantic Tailwind tokens configured in NativeWind |
| Storing API keys in client `.env` | Keep Gemini keys strictly inside Supabase Edge Functions |
| Raw `<View>`/`<Text>` for standard styling | Import primitives from `src/components/ui/` |

---

## 4. Golden-Path Patterns

> These show *this repo's* canonical shapes.

### Styling & UI Primitives

```tsx
// ❌ WRONG: Do not use raw components for standard UI
import { View, Text } from "react-native";
export function Card() { return <View className="p-4"><Text>Hello</Text></View>; }

// ✅ CORRECT: Import from our styled UI primitives
import { Card, Typography } from "@/components/ui";
export function CustomCard() { 
  return <Card><Typography variant="body">Hello</Typography></Card>; 
}
```

*Why this shape:* All UI primitives must be imported from `src/components/ui/` (styled with NativeWind) to ensure absolute consistency across the app. 

### Data Fetching & Offline Caching

```tsx
import { useQuery } from "@tanstack/react-query";
// Assume local sqlite/async-storage is configured at the queryClient provider level

export function useMedications(userId: string) {
  return useQuery({
    queryKey: ["medications", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    // Required for offline-first data:
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
```

*Why this shape:* We use custom hooks wrapping React Query. The persister (e.g., `expo-sqlite`) is configured globally so that these queries can load from cache instantly when the device is offline.

---

## 5. Conventions & Guardrails

**Repo layout:** 
- `src/app/` (Expo Router routes)
- `src/components/ui/` (Core design system primitives)
- `src/hooks/` (React Query wrappers and business logic)
- `supabase/functions/` (Edge functions for Gemini integration)

**Always:**
- Check **Stitch project `784450950873993686`** for other UI guardrails, layout specifications, and detailed styling parameters.
- Handle loading and error states for all `useQuery` hooks.
- Configure offline persisters for critical queries (medications, appointments).
- Ensure Voice-Over labels are present for any interactive custom component.

**Never:**
- Never commit `.env` files.
- The client strictly uses the Supabase Anon Key. **Gemini API keys must live exclusively in Supabase Edge Functions.** Never call the Gemini API directly from the React Native client.
- Never use raw React Native core components directly for styling standard elements; always use the `src/components/ui/` wrappers.

---

## 6. Materialization

| Target | File | Notes |
|--------|------|-------|
| **Canonical** | `build-memolink.md` | **edit here** |
| All agents / IDEs | `AGENTS.md` (project root) | materialized build rules; auto-read |

Re-materialize whenever this guide changes. Treat the root copies as build artifacts, not sources of truth.
