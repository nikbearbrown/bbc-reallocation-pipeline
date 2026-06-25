---
status: SPECIFIED
todos_open: 3
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC as Eval Supplier — Coordinated Team Track (Scale / Outlier / Mercor / LinkedIn)

## Purpose
Position BBC as a **coordinated, quality-guaranteed eval supplier** to Scale AI, Outlier, Mercor, and the LinkedIn AI labor marketplace — **not** as individual contractor placement. These platforms need verified domain experts delivering batch work (clinical annotation, legal evals, advanced coding traces, RLHF) with consistent quality. BBC's value is coordination + a sampled quality guarantee, which earns fellow cohorts priority-queue access and higher-value projects than individuals competing for one-off tasks. Use this mode when BBC can field a **domain-credentialed** cohort.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Stack + domain credentials. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Cohort availability. |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | `cognitive_pivot_score` + wages. |
| Domain credential map | **[TODO: DATA SOURCE]** | `data/eval-supplier/domain-credential-map.json` | Maps fellow credentials → platform project types — **does not exist yet**. |
| Outlier monitor | **[TODO: DEV]** | `scripts/eval-supplier/monitor-outlier.js` | Batch/team project monitor — **does not exist yet**. |
| Mercor monitor | **[TODO: DEV]** | `scripts/eval-supplier/monitor-mercor.js` | High-value project monitor — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| project | JSON | platform monitor **[TODO]** | Yes |
| cohort | list[fellow_id] | `fellow-skills-registry.json` + `active-engagements.json` | Yes |
| domain | enum | clinical / legal / financial / advanced-coding | Yes |

## Phase Gates
1. **GATE-1 Liveness** — project still accepting suppliers. Human capacity: [PA].
2. **GATE-2 Client quality** — platform/project is real and paying. Human capacity: [PF].
3. **GATE-3 Budget viability (TEAM ECONOMICS).** Individual eval rates run $23–$90/hr. BBC pursues a project **only if** the **domain premium applies (≥ $60/hr)** *OR* **batch size ≥ 3 fellows for ≥ 2 weeks** (enough scale to justify BBC's coordination overhead). Test: `rate ≥ 60 OR (cohort_size ≥ 3 AND weeks ≥ 2)`. Human capacity: [EI].
4. **GATE-4 Domain verification.** BBC may supply a domain **only if at least one fellow has verifiable domain credentials**: clinical (medical background), legal (law degree / paralegal), financial (CFA / finance degree), advanced coding (demonstrable production code). Test against `data/eval-supplier/domain-credential-map.json` **[TODO]**. Human capacity: [IJ].
5. **GATE-5 Quality guarantee (HUMAN GATE — BBC principal).** BBC **reviews a sample of fellow eval outputs before submitting the batch** to the platform. This sampled review *is* the guarantee that justifies BBC's spread. Test: logged sample-review decision. Human capacity: [EI].

## Steps
1. Ingest project from platform monitor **[TODO: DEV]**.
2. Match `domain` → credentialed fellows via `domain-credential-map.json` **[TODO]** (GATE-4).
3. Run GATE-1…GATE-3; assemble cohort.
4. Run a sample batch; **principal reviews sample (GATE-5)**.
5. Submit batch as BBC-coordinated team; log to combiner → `data/eval-supplier/candidates-[date].json`.

## Output Contract
Shared BBC format. Agent log: `logs/case-bbc-eval-supplier-[date].json` (fields as in Braintrust mode, plus `domain`, `cohort_size`, `weeks`, `domain_credential_verified: true/false`, `sample_review_passed: true/false`). Human report: `reports/case-bbc-eval-supplier-[date].md`, BBC principal, approval only.

## Stop Conditions
- Stop if no fellow in the cohort holds verifiable credentials for the project's domain — BBC does not supply uncredentialed eval labor.
- Stop if neither the rate premium nor the batch-scale condition holds (GATE-3) — coordination overhead would erase the margin.
- Stop before submitting any batch the principal has not sampled (GATE-5).
- Stop if the platform monitors don't exist and no project is provided.

## Worked Run
**Goal:** score the SOC codes for **clinical data annotator (29-9099)**, **legal support worker (23-2099)**, and **software QA engineer (15-1253)**; compare cognitive-demand scores.

Verified from `data/BLS/compact/soc_occupation_compact.csv`:

| SOC | Title | `cognitive_pivot_score` | hourly median | annual median | GATE-4 demand | GATE-3 rate (≥$60) |
|---|---|---|---|---|---|---|
| 15-1253 | Software QA Analysts & Testers | **3.582** | $49.33 | $102,610 | scored | **FAIL at median** |
| 29-9099 | Healthcare Practitioners, All Other (clinical annotator proxy) | **— (blank)** | $30.78 | $64,030 | **no score** | **FAIL** |
| 23-2099 | Legal Support Workers, All Other (legal eval proxy) | **— (blank)** | $33.06 | $68,760 | **no score** | **FAIL** |

**This is the most instructive run in the set, because everything fails honestly.**

**Verified vs. inferred.** Every cell above is read directly from the CSV. The two "All Other" catch-all SOC codes (29-9099, 23-2099) carry **no ability/skill columns at all**, so their `cognitive_pivot_score` is blank — the cognitive-pivot layer simply cannot score a catch-all occupation. And both sit at **~$31–33/hr median**, far under the $60/hr GATE-3 premium.

**What this means for the mode.** Taken at SOC median, none of the three would clear GATE-3 on the **rate-premium** path. The eval-supplier thesis therefore *depends* on the **batch path** (≥ 3 fellows, ≥ 2 weeks) — the rate premium alone won't carry clinical/legal annotation, whose SOC medians are low and whose cognitive-pivot scores are unmeasured. The domain premium that makes these worthwhile is **project-specific** (a clinical *expert* annotating at $70/hr is not the $30.78 SOC median) and must be read from the *project*, not inferred from the SOC.
**What went well.** The data cleanly exposes the trap: catch-all SOC codes give neither a cognitive score nor a defensible rate, so the mode correctly refuses to lean on SOC for clinical/legal evals.
**What it got wrong / next step.** GATE-4 as written points at SOC codes that can't be scored. Fix: GATE-4 should verify the **fellow's credential** (from `domain-credential-map.json`) and read the **project's offered rate**, *not* the SOC cognitive score, for catch-all domains. Add a flag that blocks using SOC median as a rate proxy whenever `cognitive_pivot_score` is blank.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Outlier monitor | `node scripts/eval-supplier/monitor-outlier.js` **[TODO]** |
| Mercor monitor | `node scripts/eval-supplier/monitor-mercor.js` **[TODO]** |
| Credential map | `data/eval-supplier/domain-credential-map.json` **[TODO]** |
| Candidate output | `data/eval-supplier/candidates-[date].json` |
