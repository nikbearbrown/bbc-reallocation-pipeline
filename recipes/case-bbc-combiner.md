---
status: SPECIFIED
todos_open: 2
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC Combiner — The Only Mode Nik Sees

## Purpose
The combiner runs **silently** after all six platform modes complete, synthesizes their candidate outputs, applies the **interrupt threshold**, and produces `BBC_DAILY_BRIEF` for the daily Cowork conversation. Its job is to protect Nik's attention: surface only what clears every gate without his input, and always show how much was filtered so he can trust the system is running. This is the one mode with a human reader by design — everything upstream is plumbing.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Platform candidates | dir(s) | `data/{braintrust,ai-tinkerers,latent-space,yc-networks,eval-supplier,upwork}/candidates-[date].json` | All six platform modes' outputs. |
| Fellow intake candidates | file | `logs/case-bbc-fellow-intake-[date].json` | Fellow-sourced approvals. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Fellow conflict check. |
| Hire-intent log | file (private) | `private/bbc/hire-intent-log.json` | Hire-intent signal counts. |
| Form D funding | dir | `data/80-days-to-stay/` | Cross-channel company matching. |
| Brief generator | **[TODO: DEV]** | `scripts/combiner/generate-brief.js` | Aggregate, apply threshold, write JSON + md — **stub only** (`npm run brief`). |
| Dedup matcher | **[TODO: DEV]** | `scripts/combiner/dedup-companies.js` | Fuzzy company-name match across channels + Form D — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| candidate_sets | list[JSON] | all platform + intake outputs for the date | Yes |
| date | string | run date | Yes |

## Phase Gates / Interrupt Threshold
The combiner does not re-run platform gates; it applies the **interrupt threshold** — **all** must clear for an opportunity to surface to Nik:

- **BBC net hourly ≥ $15/hr** (the margin that covers oversight, platform cost, reputation risk).
- **Fellow match unambiguous** — 2+ verified skills AND hours available.
- **Scope defined** — a named deliverable, not "help us with AI."
- **≥ 1 hire-intent signal.**
- **Nik's time required: approval only** — if a candidate needs Nik to do research or chase scope, it does not surface.

Two pre-surface checks:
1. **Fellow conflict check.** Before surfacing, confirm the matched fellow is not already committed to conflicting hours in `active-engagements.json`. A conflict drops the candidate.
2. **Deduplication / cross-channel bonus.** If the same company appears across channels (e.g. an Upwork posting + a Form D match + an AI Tinkerers listing), that convergence is a **STRONG SIGNAL** — flag it explicitly. Fuzzy match via `dedup-companies.js` **[TODO: DEV]**.

## Steps
1. Load all candidate sets for `date`.
2. Dedup companies across channels + Form D (`dedup-companies.js` **[TODO]**); attach `STRONG SIGNAL` where 2+ channels converge.
3. Fellow conflict check against `active-engagements.json`.
4. Apply the interrupt threshold; drop anything that fails.
5. Write the agent log and the human brief (`generate-brief.js` **[TODO]**, wired to `npm run brief`).

## Output Contract
- **Agent log:** `data/bbc/daily-brief-[date].json` — `{ date, evaluated, filtered, surfaced[], strong_signals[], fellow_conflicts_dropped[], generated_at }`. Fellow names **redacted** in logs.
- **Human brief:** `data/bbc/daily-brief-[date].md` — **this is what Cowork reads.** Per opportunity: **3 sentences max** — platform, role, BBC net rate, fellow name, hire-intent signal count, one-line scope — then `say "tell me more" or "pass"`. Always lead with a **noise summary** (`N evaluated, M filtered`). Fellow-sourced items labeled as such; cross-channel convergence flagged `STRONG SIGNAL`.

## Stop Conditions
- Surface **nothing** rather than surface something that needs Nik to do more than approve.
- Drop any candidate whose fellow has a scheduling conflict — never present an opportunity the fellow can't take.
- If `generate-brief.js` / `dedup-companies.js` don't exist, the combiner cannot run end-to-end — say so; do not hand-wave a brief as if generated.
- Never write a fellow's real name into the JSON log (redact); names appear only in the human `.md` brief Nik reads.

## Worked Run
**Goal:** construct a sample multi-platform scenario with 3 postings from different channels, score each SOC, (attempt) liveness on each URL, and produce a sample `BBC_DAILY_BRIEF` in the combiner's output format.

**Honesty note.** I have **no live postings or URLs**, so the three opportunities below are **illustrative (clearly labeled)** — I am *not* claiming they are real or live. Every **SOC cognitive-pivot number is real**, pulled from `data/BLS/compact/soc_occupation_compact.csv`; liveness is marked `[TODO: RUN]` because no checker/URL exists. This is exactly the verified-vs-inferred split the brief itself must respect.

Real SOC signals used:

| SOC | Title | `cognitive_pivot_score` | hourly median |
|---|---|---|---|
| 15-1221 | Computer & Information Research Scientists | 4.516 | $67.74 |
| 15-1252 | Software Developers | 3.834 | $63.98 |
| 15-1253 | Software QA Analysts & Testers | 3.582 | $49.33 |

Sample `data/bbc/daily-brief-[date].md` (format demonstration — opportunities illustrative, SOC numbers real):

```
# BBC_DAILY_BRIEF — 2026-06-25
**41 evaluated, 38 filtered.** 3 cleared the interrupt threshold. ~10 min of approvals.

1. [STRONG SIGNAL · 2 channels] Braintrust + Form D — Senior ML Engineer (SOC 15-1221,
   cognitive-pivot 4.516). BBC net ~$18/hr; fellow A.K. (LangGraph, vLLM — 14 hrs free);
   3 hire-intent signals (recent raise, named FT req, founder post).
   Scope: build a RAG eval harness, 6 wks. → say "tell me more" or "pass"

2. [fellow-sourced: F-019 from YC] YC WaaS — Founding Engineer (SOC 15-1252, 3.834).
   BBC net ~$16/hr; fellow F-019 (React/Python — 12 hrs free); 1 hire-intent signal
   (Form D $1.2M, 7 mo ago). Scope: ship onboarding flow, 4 wks. → "tell me more" / "pass"

3. AI Tinkerers (NYC chapter, BBC present) — QA Automation (SOC 15-1253, 3.582).
   BBC net ~$15/hr; fellow R.P. (Playwright, CI — 20 hrs free); 3 hire-intent signals.
   Scope: end-to-end test suite, 3 wks. → "tell me more" or "pass"

(liveness on all three: [TODO: RUN — no checker/live URL])
```

**Verified vs. inferred.** Verified: the three cognitive-pivot scores and wages, the brief format, the interrupt-threshold logic, the noise-summary and STRONG-SIGNAL conventions. Inferred / illustrative: the postings, fellow names, hire-intent counts, and BBC net rates (these would come from real candidate JSON). Not run: liveness on all three.
**What went well.** The format does what it must — three scannable yes/no lines, a noise summary that earns trust, and a STRONG-SIGNAL flag that turns cross-channel convergence into a one-glance decision. QA's 3.582 sits lowest (closest to the cognitive-pivot floor), which is honestly the kind of role Nik might "pass" on — the brief surfaces it but doesn't oversell it.
**What it missed / next step.** Without `dedup-companies.js`, the STRONG-SIGNAL flag is asserted, not computed — that script is the highest-value build because cross-channel convergence is the system's best signal. Build `dedup-companies.js` and wire `generate-brief.js` to `npm run brief`, then run against real candidate JSON.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Generate brief | `npm run brief` → `scripts/combiner/generate-brief.js` **[TODO]** |
| Dedup companies | `node scripts/combiner/dedup-companies.js` **[TODO]** |
| Agent log | `data/bbc/daily-brief-[date].json` |
| Human brief (Cowork reads this) | `data/bbc/daily-brief-[date].md` |
