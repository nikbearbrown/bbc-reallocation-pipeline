---
status: SPECIFIED
todos_open: 1
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC on Braintrust — Enterprise AI Contract Sourcing

## Purpose
Monitor Braintrust for AI/ML contract opportunities that match a current BBC fellow and clear the BBC interrupt threshold. Braintrust is a higher-signal, lower-noise channel than Upwork: enterprise buyers (Series A–C), VPs of Engineering and CTOs, average project ≈ $81K over ≈ 8 months. BBC is positioned here as **senior, supervised talent with a quality guarantee** — not an individual freelancer underbidding on rate. Use this mode when a fellow has a senior-credible stack and at least 8 weeks of runway available.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Confirm the matched fellow's stack and trajectory are current. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Confirm available hours and no conflicting commitment. |
| Hire-intent log | file (private) | `private/bbc/hire-intent-log.json` | Confirm prior signals on this buyer, if any. |
| Skill→SOC crosswalk | file | `data/bbc/platform-soc-crosswalk.json` | Confirm the role's skill tags map to a defensible SOC code. |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | Source of the `cognitive_pivot_score` used in GATE-4. |
| Client quality scores | file (gitignored) | `data/bbc/client-quality-scores.json` | Running scores on known buyers. |
| Form D funding | dir | `data/80-days-to-stay/` | Cross-reference buyer name for funding recency/amount. |
| Braintrust listings | **[TODO: DEV]** | `scripts/braintrust/fetch-listings.js` | Braintrust API or scraper for active AI/ML roles — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| listing | JSON | `scripts/braintrust/fetch-listings.js` output **[TODO]**, or a fellow-pasted URL | Yes |
| fellow_id | string | matched against `fellow-skills-registry.json` | Yes |
| run_mode | enum | `sample` (no network) or `live` (approved) | Yes |

## Phase Gates
Liveness and budget are **gates, not votes** — a multiplier of zero kills the candidate no matter how strong the fit.

1. **GATE-1 Liveness** — posting is still open. Test: liveness check returns `live`. Human capacity: [PA]. *(Liveness script not yet built for Braintrust — see Stop Conditions.)*
2. **GATE-2 Client quality** — buyer is a real, paying enterprise. Test: Braintrust verified-payment flag present AND buyer not flagged in `client-quality-scores.json`. Human capacity: [PF].
3. **GATE-3 Budget viability** — Braintrust senior roles list $50–$150/hr. BBC gate: **client rate implies ≥ $40/hr BBC billing** after the 15% client-side platform fee (fellow-side fee 0%). Test: `client_hourly × 0.85 ≥ 40`. Human capacity: [EI].
4. **GATE-4 Cognitive pivot** — role's SOC `cognitive_pivot_score` ≥ threshold (≥ 3.5, senior AI work). Source: `data/BLS/compact/soc_occupation_compact.csv`. Human capacity: [IJ].
5. **GATE-5 Fellow match** — 2+ verified skills AND **≥ 8 weeks availability** (Braintrust skews to long engagements). Test against `fellow-skills-registry.json` + `active-engagements.json`. Human capacity: [TO].
6. **Hire-intent** — Form D cross-reference still applies even for sophisticated buyers: company raised recently (signals budget + growth hiring). Test: name match in `data/80-days-to-stay/` with a dated raise. Human capacity: [PF].

## Steps
1. Fetch / ingest listing. Labor: AI. Script: `scripts/braintrust/fetch-listings.js` **[TODO: DEV]**. Out → `data/braintrust/`.
2. Map skill tags → SOC via `data/bbc/platform-soc-crosswalk.json`. Labor: AI. Out → `data/braintrust/`.
3. Run GATE-1…GATE-6. Labor: AI with human gate. Out → per-platform candidate JSON.
4. Compute BBC net math (see Output). Labor: AI. Out → candidate JSON.
5. Emit candidate to the combiner. Labor: AI. Out → `data/braintrust/candidates-[date].json`.

## Output Contract
Shared across all BBC platform modes.

### Agent log (feeds the combiner → BBC_DAILY_BRIEF)
File: `logs/case-bbc-braintrust-[date].json`
Fields: `workflow, run_id, mode, listings_seen, listings_filtered, candidates[], gate_results, bbc_net_hourly, fellow_id, hire_intent_count, soc_code, cognitive_pivot_score, source_paths, generated_at`.

### Human report
File: `reports/case-bbc-braintrust-[date].md`
Reader: BBC principal (Nik), approval only.
Sections: run summary, candidates that cleared all gates, BBC net rate per candidate, fellow match, hire-intent signals, filtered count, verified-vs-inferred split.

## Stop Conditions
- Stop if estimated engagement exceeds the **20 hr/week fellow cap** — the mode must either **split the scope across two fellows** (and say so explicitly) or **reject**. It must never silently overcommit a fellow.
- Stop if `scripts/braintrust/fetch-listings.js` does not exist and no fellow-pasted URL is provided — there is nothing verified to gate.
- Stop before any live network call or external write unless the approval gate is logged.
- Stop if the SOC `cognitive_pivot_score` is blank for the mapped code — report the gap; do not infer a score.

## Worked Run
**Goal:** score the SOC codes for the top 3 Braintrust AI role categories and show the cognitive-pivot signal that feeds GATE-4.

Top-3 categories mapped to SOC: **Data Scientist (15-2051)**, **Software Developer / AI Engineer (15-1252)**, **Computer & Information Research Scientist (15-1221)**.

Verified output pulled from `data/BLS/compact/soc_occupation_compact.csv` (the role-quality feed; `npm run score` combines this signal — it does not compute it):

| SOC | Title | `cognitive_pivot_score` | hourly median | annual median | GATE-4 (≥3.5) |
|---|---|---|---|---|---|
| 15-1221 | Computer & Information Research Scientists | **4.516** | $67.74 | $140,910 | PASS |
| 15-1252 | Software Developers | **3.834** | $63.98 | $133,080 | PASS |
| 15-2051 | Data Scientists (aggregate row) | **— (blank)** | $54.13 | $112,590 | **CANNOT SCORE** |

**Verified vs. inferred.** Verified (from the CSV): all wage figures and the 15-1221 and 15-1252 cognitive scores. **Gap:** the aggregate `15-2051.00` row carries no ability/skill columns, so its `cognitive_pivot_score` is blank — GATE-4 cannot be evaluated from the aggregate. Honest handling: fall back to a detail occupation (`15-2051.01` Business Intelligence Analysts = 3.903; `15-2051.02` Clinical Data Managers = 3.738) **only if** the listing's actual work matches that detail title, and label the substitution. Do not assign Data Scientists a score the table doesn't contain.

**What went well.** Two of three categories clear GATE-4 cleanly on verified data, and a $63–68/hr client median comfortably clears GATE-3 (`× 0.85 ≥ $40`).
**What it got wrong / missed.** The headline SOC for this channel (Data Scientist) is exactly the one with a missing score — the mode's most common case is its weakest. **Next step:** add a crosswalk rule that resolves 15-2051 to the best-matching detail occupation by listing keywords, and log every such substitution.

**Not yet executed:** live `fetch-listings.js` run and GATE-1 liveness on a real Braintrust URL — script **[TODO: DEV]**; no live listing available at write time.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Fetch listings | `node scripts/braintrust/fetch-listings.js` **[TODO]** |
| Score signal (combiner) | `npm run score -- <roles.json>` |
| Candidate output | `data/braintrust/candidates-[date].json` |
| Agent log | `logs/case-bbc-braintrust-[date].json` |
| Human report | `reports/case-bbc-braintrust-[date].md` |
