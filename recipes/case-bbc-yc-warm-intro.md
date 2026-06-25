---
status: SPECIFIED
todos_open: 2
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC on YC / Warm-Intro Networks — Maximum Hire-Intent Sourcing

## Purpose
Monitor YC Work at a Startup, the Pear VC talent network, and Contra VC Networks for opportunities matching a BBC fellow. This is the channel where the **paid-interview thesis is most explicit**: venture-backed technical founders, maximum hire-intent, pre-trust via peer referral. BBC is positioned as a **trusted delivery partner with a zero-friction conversion policy** — if the fellow performs, the startup hires them directly and BBC takes nothing on conversion. Use only where BBC has a referral path into the network; cold applications convert poorly.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Stack + trajectory. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Available hours. |
| Hire-intent log | file (private) | `private/bbc/hire-intent-log.json` | Conversion tracking, 90-day flags. |
| Form D funding | dir | `data/80-days-to-stay/` | Funding runway check (GATE-6). |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | `cognitive_pivot_score`. |
| Network connections | **[TODO: DATA SOURCE]** | `private/bbc/bbc-network-connections.json` | BBC's warm-intro paths into YC/VC networks — **private, does not exist yet**. |
| YC WaaS listings | **[TODO: DEV]** | `scripts/yc/fetch-waat-listings.js` | Scraper for contract/fractional roles — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| listing | JSON | scraper **[TODO]** or fellow-pasted URL | Yes |
| company_name | string | from listing; cross-referenced to Form D | Yes |
| fellow_id | string | `fellow-skills-registry.json` | Yes |

## Phase Gates
1. **GATE-0 Network presence (HUMAN GATE — BBC principal).** BBC must have a referral path into the network for this company. Test: a connection exists in `private/bbc/bbc-network-connections.json`. **No warm path → reject (or downgrade to "cold, low-priority" and do not surface).** Human capacity: [EI].
2. **GATE-1 Liveness** — posting still open. Human capacity: [PA].
3. **GATE-2 Client quality** — venture-backed, real company. Human capacity: [PF].
4. **GATE-3 Budget viability** — YC postings show $10K–$100K+ contract budgets. BBC gate: **implied hourly ≥ $40/hr**. Human capacity: [EI].
5. **GATE-4 Cognitive pivot** — SOC `cognitive_pivot_score` ≥ 3.5. Human capacity: [IJ].
6. **GATE-5 Fellow match** — 2+ verified skills, hours available. Human capacity: [TO].
7. **GATE-6 Funding runway (hire-intent proxy).** YC/VC postings carry *implicit* hire-intent; the real question is whether the company can pay and convert. Test: Form D shows **≥ $500K raised, ≤ 18 months ago** in `data/80-days-to-stay/`. Human capacity: [PF].

## Steps
1. Resolve network path (GATE-0). Human clears.
2. Ingest listing (`scripts/yc/fetch-waat-listings.js` **[TODO: DEV]**).
3. Cross-reference `company_name` against `data/80-days-to-stay/` Form D data (GATE-6).
4. Map skills → SOC; run remaining gates.
5. **Conversion tracking:** on placement, append to `private/bbc/hire-intent-log.json` with a **90-day follow-up flag** — did the startup convert the fellow? This closes the paid-interview loop.
6. Emit candidate to combiner → `data/yc-networks/candidates-[date].json`.

## Output Contract
Shared BBC format. Agent log: `logs/case-bbc-yc-warm-intro-[date].json` (fields as in Braintrust mode, plus `warm_path: true/false`, `form_d_raise_usd`, `form_d_age_months`, `conversion_followup_due`). Human report: `reports/case-bbc-yc-warm-intro-[date].md`, BBC principal, approval only.

## Stop Conditions
- Stop (do not surface) if there is no warm path — the channel's value is the warm intro; cold applications waste fellow effort.
- Stop if Form D shows no qualifying raise (or raise > 18 months old / < $500K) — funding-dry "ghost" startups fail GATE-6.
- Stop if the scraper and a fellow-pasted URL are both absent.
- Stop before any outreach without logged approval.

## Worked Run
**Goal:** pull 3 current YC Work at a Startup listings and cross-reference the company names against `data/80-days-to-stay/` Form D data; paste output.

**Honest status — partially blocked.** `scripts/yc/fetch-waat-listings.js` is **not built** and I have **no live YC listings** at write time; inventing three company names and "matched/not-matched" Form D results would fabricate the exact evidence GATE-6 depends on. So the listing-pull and live Form D cross-reference are **[TODO: RUN]**.

What is verifiable now is the **structure** of GATE-6 against the real local funding corpus. `data/80-days-to-stay/` is present (with `80-days-csv`, daily folders, and `data/`), so the cross-reference is *runnable once a real company list exists*: for each `company_name`, fuzzy-match against the Form D records and read raise amount + filing date, then test `raise ≥ $500K AND age ≤ 18 months`.

And the cognitive-pivot signal for the role types YC contract roles carry (full-stack, ML, founding-engineer) is verifiable from `data/BLS/compact/soc_occupation_compact.csv`:

| SOC | Title | `cognitive_pivot_score` | hourly median | GATE-4 (≥3.5) |
|---|---|---|---|---|
| 15-1252 | Software Developers | 3.834 | $63.98 | PASS |
| 15-1221 | Computer & Information Research Scientists | 4.516 | $67.74 | PASS |
| 15-1299.08 | Computer Systems Engineers/Architects | 4.027 | $52.39 | PASS |

**Verified vs. inferred.** Verified: the SOC scores/wages, and that the Form D corpus exists locally to support GATE-6. Inferred / not run: the three live listings, their liveness, and the actual Form D matches.
**What went well.** GATE-3's $40/hr floor is easy to clear — all three role types sit well above it — so on this channel the *binding* gates are GATE-0 (warm path) and GATE-6 (funding), exactly as the thesis predicts.
**What it missed / next step.** Without `bbc-network-connections.json`, GATE-0 cannot be evaluated, so no candidate can legitimately surface yet. Build that private file and the WaaS scraper, then re-run the Form D cross-reference for real.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Fetch listings | `node scripts/yc/fetch-waat-listings.js` **[TODO]** |
| Network paths | `private/bbc/bbc-network-connections.json` **[TODO]** |
| Form D corpus | `data/80-days-to-stay/` |
| Candidate output | `data/yc-networks/candidates-[date].json` |
