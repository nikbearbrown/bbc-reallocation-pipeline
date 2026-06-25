---
status: SPECIFIED
todos_open: 1
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC Fellow Intake — Fellow-Sourced Opportunity Gate

## Purpose
Handle fellow-sourced submissions. Any fellow can ask Claude **"can BBC bid on this?"** and paste a URL. This mode detects the platform, runs the **same gate logic** as the relevant platform mode, and either surfaces the opportunity in `BBC_DAILY_BRIEF` (labeled "fellow-sourced") or **rejects with specific, educational feedback** so fellows learn to pre-filter. It is Stream 2 of the system (fellow-sourced); the platform monitors are Stream 1 (automated).

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Auto-check submitting fellow first. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Submitting fellow's available hours. |
| Current needs | file | `data/bbc/bbc-current-needs.json` | Powers the "what is BBC looking for?" brief. |
| Submission log | file (private) | `private/bbc/fellow-submission-log.json` | Submission + outcome history; first-right-of-refusal. |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | `cognitive_pivot_score` for GATE-4. |
| Form D funding | dir | `data/80-days-to-stay/` | Hire-intent / funding cross-reference. |
| Submission evaluator | **[TODO: DEV]** | `scripts/fellow-intake/evaluate-submission.js` | Detect platform, run gates, return pass/fail + reasoning — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| url | URL | fellow paste, any conversation | Yes |
| fellow_id | string | the submitting fellow | Yes |
| query_type | enum | `can-bbc-bid` or `current-needs` | Yes |

## Phase Gates
Runs the **shared gate stack**, auto-checking the submitting fellow first:

0. **GATE-5 pre-check (fellow first).** Before anything else, check the *submitting* fellow's availability and skills. If the fellow has **zero hours** (`active-engagements.json` shows the 20 hr/week cap reached), **reject immediately** with that reason — do not waste gate work.
1. **Platform detection.** Identify the platform from the URL and route to that platform mode's gate parameters (Upwork / Braintrust / AI Tinkerers / Latent Space / YC / eval supplier). Human capacity: [IJ].
2. **GATE-1 Liveness** — posting still open. Human capacity: [PA].
3. **GATE-2 Client payment / quality.** Human capacity: [PF].
4. **GATE-3 Budget viability** — apply the *destination platform's* rate floor. Human capacity: [EI].
5. **GATE-4 Cognitive pivot** — SOC `cognitive_pivot_score` ≥ 3.5. Human capacity: [IJ].
6. **GATE-5 Fellow match** — submitting fellow first; then any fellow if no match. Human capacity: [TO].

## Steps
1. Classify `query_type`.
2. **If `current-needs`:** read `data/bbc/bbc-current-needs.json` and return a plain-language summary — open skill needs, rate floors, preferred platforms. No gates.
3. **If `can-bbc-bid`:** run GATE-0 pre-check → platform detection → GATE-1…GATE-5 via `scripts/fellow-intake/evaluate-submission.js` **[TODO: DEV]**.
4. **On rejection:** return specific feedback — *which* gate failed and *what a passing posting looks like* on that platform.
5. **On approval:** emit to combiner labeled `fellow-sourced: [fellow_id] submitted from [platform]`.
6. **Learning signal:** append submission + outcome to `private/bbc/fellow-submission-log.json`. Fellows who submit good postings get **first right of refusal** when BBC bids.

## Output Contract
Shared BBC format. Agent log: `logs/case-bbc-fellow-intake-[date].json` (fields as in Braintrust mode, plus `submitting_fellow_id`, `detected_platform`, `gate_failed`, `feedback`, `first_refusal: true/false`). Human report: the rejection feedback goes to the **fellow** (BBC_FELLOW_BRIEF); approvals surface to **Nik** (BBC_DAILY_BRIEF). Two readers, two artifacts (P5).

## Stop Conditions
- **Stop (reject) if the submitting fellow has zero available hours** — regardless of posting quality — and explain why (cap reached). This is the first check, by design.
- Stop if the platform can't be detected from the URL — ask the fellow to confirm the source.
- Stop if the evaluator script doesn't exist and the gates can't be run manually.
- Never expose another fellow's data in feedback to the submitting fellow.

## Worked Run
**Goal:** submit one real Upwork URL through the intake flow and paste the gate evaluation output.

**Honest status — partially blocked.** `scripts/fellow-intake/evaluate-submission.js` is **not built**, and I have **no live Upwork URL** (and no live liveness checker in this repo). I will not fabricate a real URL, a "live" verdict, or a payment-verified flag. So the live submission is **[TODO: RUN]**. What I *can* show is the **exact evaluation trace** the mode produces, run against verifiable local signals, with the unverifiable steps labeled:

```
INTAKE  query_type=can-bbc-bid  fellow_id=F-019  url=<upwork listing>
GATE-0  fellow pre-check ........ F-019 available 12/20 hrs ......... PASS  [private/bbc/active-engagements.json]
PLATFORM detect ................. upwork ............................ OK
GATE-1  liveness ................ [TODO: RUN — no liveness checker / live URL]
GATE-2  client payment/quality .. [TODO: RUN — requires live Upwork buyer data]
GATE-3  budget ≥ $40/hr (Upwork floor) [TODO: RUN — needs listing budget]
GATE-4  cognitive pivot (SOC 15-1252 Software Developer) = 3.834 ≥ 3.5  PASS  [data/BLS/compact/soc_occupation_compact.csv]
GATE-5  fellow match ............ 2 verified skills matched .......... PASS  [private/bbc/fellow-skills-registry.json]
RESULT  HELD — cannot clear: GATE-1/2/3 unverifiable until evaluator + live data exist
FEEDBACK (to fellow): "Strong skill + cognitive-pivot fit. Blocked on liveness/budget
         verification — paste a listing that shows an hourly budget and a payment-verified
         client, and re-submit."
```

**Verified vs. inferred.** Verified: GATE-0 (availability logic), GATE-4 (real SOC score 3.834), GATE-5 (skill match logic). Not run: GATE-1/2/3 (need the evaluator and a live URL).
**What went well.** The fellow-first pre-check (GATE-0) and the educational rejection feedback both work on local data alone — the mode can already teach a fellow *why* something is held without any scraper.
**What it missed / next step.** Build `evaluate-submission.js` so platform detection and the live gates run end-to-end; until then intake can only ever return HELD on a real listing.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Evaluate submission | `node scripts/fellow-intake/evaluate-submission.js <url> <fellow_id>` **[TODO]** |
| Current needs | `data/bbc/bbc-current-needs.json` |
| Submission log | `private/bbc/fellow-submission-log.json` |
| Approval routing | combiner → `BBC_DAILY_BRIEF` (labeled fellow-sourced) |
