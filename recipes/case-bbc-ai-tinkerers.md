---
status: SPECIFIED
todos_open: 2
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC on AI Tinkerers — Community + Warm-Intro Sourcing

## Purpose
Monitor the AI Tinkerers job board and warm-intro network for opportunities matching a BBC fellow. This is the **highest hire-intent channel of all** — buyers are technical founders and builders working *alongside* contractors. BBC is positioned here not as a vendor but as a **community member whose fellows are active builders**. Use this mode only where BBC or Humanitarians AI already has a visible presence in the relevant city chapter; cold outreach from an unknown entity violates community norms and burns the channel.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Confirm fellow is a credible *builder*, not just a contractor. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Confirm available hours. |
| Hire-intent log | file (private) | `private/bbc/hire-intent-log.json` | Log event contacts here. |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | `cognitive_pivot_score` for GATE-4. |
| City chapters | **[TODO: DATA SOURCE]** | `data/ai-tinkerers/city-chapters.json` | Active chapters with BBC presence flagged — **does not exist yet**. |
| Listings | **[TODO: DEV]** | `scripts/ai-tinkerers/fetch-listings.js` | AI Tinkerers job-board scraper — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| listing | JSON | scraper **[TODO]** or fellow-pasted URL | Yes |
| city | string | resolved against `city-chapters.json` **[TODO]** | Yes |
| fellow_id | string | `fellow-skills-registry.json` | Yes |

## Phase Gates
1. **GATE-0 Community presence (HUMAN GATE — BBC principal).** BBC or Humanitarians AI must have a visible presence in the listing's city chapter before bidding. Test: `city` flagged present in `data/ai-tinkerers/city-chapters.json`. **If no presence, reject — this is a hard community-norm stop, not a vote.** Human capacity: [EI].
2. **GATE-1 Liveness** — posting still open. Human capacity: [PA].
3. **GATE-2 Client quality** — founder/company is real and building. Human capacity: [PF].
4. **GATE-3 Budget viability** — listings show $110K–$500K+ annualized. BBC gate: **hourly equivalent ≥ $50/hr**. Human capacity: [EI].
5. **GATE-4 Cognitive pivot** — SOC `cognitive_pivot_score` ≥ 3.5. Human capacity: [IJ].
6. **GATE-5 Fellow match** — 2+ verified skills, hours available. Human capacity: [TO].
7. **GATE-6 Hire-intent** — **3+ signals expected here, not 1** (buyers build alongside contractors; intent is the channel's whole point). Test: ≥ 3 of {recent raise, named full-time req for same role, founder-authored post, "looking to hire," event contact logged}. Human capacity: [PF].

## Steps
1. Resolve city → chapter presence (GATE-0). Labor: AI surfaces, human clears.
2. Fetch / ingest listing. Script: `scripts/ai-tinkerers/fetch-listings.js` **[TODO: DEV]**.
3. Map skills → SOC; run GATE-1…GATE-6.
4. **Warm-intro tracking:** when a fellow attends an AI Tinkerers event, log company contacts to `private/bbc/hire-intent-log.json` (counts toward GATE-6 next pass).
5. Emit candidate to combiner → `data/ai-tinkerers/candidates-[date].json`.

## Output Contract
Shared BBC format. Agent log: `logs/case-bbc-ai-tinkerers-[date].json` (fields as in the Braintrust mode, plus `community_presence: true/false`, `hire_intent_signals[]`). Human report: `reports/case-bbc-ai-tinkerers-[date].md` for BBC principal, approval only.

## Stop Conditions
- Stop (reject) if there is no BBC/Humanitarians AI presence in the chapter — regardless of fit. Cold outreach is prohibited.
- Stop if hire-intent signals < 3.
- Stop if the scraper and a fellow-pasted URL are both absent.
- Stop before any external write/outreach unless approval is logged.

## Worked Run
**Goal:** pull 3 current AI Tinkerers listings, run a liveness check on each, score the SOC codes, paste output.

**Honest status — partially blocked.** The scraper (`scripts/ai-tinkerers/fetch-listings.js`) and a Browser liveness checker are **not built in this repo**, and I have **no live AI Tinkerers URLs** at write time. Fabricating three listings and "liveness=live" results would violate the prime directive. So the listing-fetch and liveness portions are **[TODO: RUN]**.

What **can** be verified now is the SOC cognitive-pivot signal for the role types this channel typically carries (AI engineer, applied scientist, ML infra). Verified from `data/BLS/compact/soc_occupation_compact.csv`:

| SOC | Title | `cognitive_pivot_score` | hourly median | GATE-4 (≥3.5) |
|---|---|---|---|---|
| 15-1221 | Computer & Information Research Scientists (AI Engineer alt-title) | 4.516 | $67.74 | PASS |
| 15-1252 | Software Developers | 3.834 | $63.98 | PASS |
| 15-1299.08 | Computer Systems Engineers/Architects (Cloud/Platform) | 4.027 | $52.39 | PASS |

**Verified vs. inferred.** Verified: the three cognitive scores and wages. Inferred / not yet run: listing liveness, community-presence flags (no `city-chapters.json` yet), hire-intent counts.
**What went well.** The role types this channel attracts score high on cognitive pivot — they're squarely in the "AI can't yet do this reliably" band, which is the thesis.
**What it got wrong / missed.** GATE-0 (community presence) is the binding constraint here and is entirely unverifiable until `data/ai-tinkerers/city-chapters.json` exists — so the mode currently cannot legitimately clear *any* candidate. **Next step:** build `city-chapters.json` first (cheap, high leverage), then the scraper.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Fetch listings | `node scripts/ai-tinkerers/fetch-listings.js` **[TODO]** |
| Chapters data | `data/ai-tinkerers/city-chapters.json` **[TODO]** |
| Candidate output | `data/ai-tinkerers/candidates-[date].json` |
| Agent log / report | `logs/…` · `reports/…` |
