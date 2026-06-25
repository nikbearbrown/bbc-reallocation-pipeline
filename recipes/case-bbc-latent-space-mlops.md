---
status: SPECIFIED
todos_open: 2
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# BBC on Latent Space / MLOps Community — Deep-Stack Practitioner Sourcing

## Purpose
Monitor the Latent Space Discord and MLOps Community Slack job channels for opportunities matching a **deep-stack** BBC fellow. This is the highest-sophistication channel: practitioners hiring practitioners, $15K–$100K budgets. BBC can only credibly represent a fellow here if that fellow has **demonstrated public credibility** — a GitHub repo with a real RAG/agent build, or a HuggingFace contribution. Generic "AI developer" fellows do not belong in this channel and bidding them damages BBC's standing.

## Source Inventory

| Source Node | Type | Path / Command | Human Check |
|---|---|---|---|
| Fellow skills registry | file (private) | `private/bbc/fellow-skills-registry.json` | Must include verifiable public-work links. |
| Active engagements | file (private) | `private/bbc/active-engagements.json` | Available hours. |
| Role-quality feed | file | `data/BLS/compact/soc_occupation_compact.csv` | `cognitive_pivot_score` for GATE-4. |
| Discord monitor | **[TODO: DEV]** | `scripts/latent-space/monitor-discord.js` | #jobs / #opportunities monitor — **does not exist yet**. |
| Slack monitor | **[TODO: DEV]** | `scripts/mlops/monitor-slack.js` | MLOps Community #jobs monitor — **does not exist yet**. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| posting | JSON | channel monitor **[TODO]** or fellow-pasted link | Yes |
| fellow_id | string | `fellow-skills-registry.json` | Yes |
| public_work_url | URL | fellow's GitHub/HuggingFace, verified | Yes |

## Phase Gates
1. **GATE-0 Credibility (HUMAN GATE — BBC principal).** Fellow must have **verifiable public work** — a GitHub repo with a real RAG or agent build, or a HuggingFace contribution — before BBC represents them here. Test: principal confirms `public_work_url` resolves to substantive, fellow-authored work. **No public work → reject, regardless of claimed skills.** Human capacity: [EI].
2. **GATE-1 Liveness** — posting still open. Human capacity: [PA].
3. **GATE-2 Client quality** — practitioner/company is real. Human capacity: [PF].
4. **GATE-3 Budget viability** — roles reach $170K–$325K annualized. BBC gate: **implied rate ≥ $60/hr**. Human capacity: [EI].
5. **GATE-4 Cognitive pivot** — SOC `cognitive_pivot_score` ≥ 3.5. Human capacity: [IJ].
6. **GATE-5 Fellow match (DEEP STACK ONLY)** — skills must include the channel's real vocabulary: LangGraph, vLLM, distributed training, eval harnesses, MLOps infra. A generic "AI developer" tag fails this gate. Human capacity: [TO].

## Steps
1. Verify fellow public work (GATE-0). Human clears.
2. Ingest posting from channel monitor **[TODO: DEV]** or fellow link.
3. Map skills → SOC; run GATE-1…GATE-5.
4. Emit candidate to combiner → `data/latent-space/candidates-[date].json`.

## Output Contract
Shared BBC format. Agent log: `logs/case-bbc-latent-space-mlops-[date].json` (fields as in Braintrust mode, plus `public_work_verified: true/false`, `deep_stack_match: true/false`). Human report: `reports/case-bbc-latent-space-mlops-[date].md`, BBC principal, approval only.

## Stop Conditions
- **Stop (reject) if the fellow has no verifiable public work — even on a perfect skill match.** This is the channel's binding rule.
- Stop if the skill match is generic rather than deep-stack.
- Stop if neither channel monitor exists and no fellow link is provided.
- Stop before joining/posting in any channel without logged approval (community-norm risk).

## Worked Run
**Goal:** run the cognitive-pivot signal against **SOC 15-2051 (Data Scientists)** and **15-1252 (Software Developers)** at senior level, paste output.

Verified from `data/BLS/compact/soc_occupation_compact.csv`:

| SOC | Title | `cognitive_pivot_score` | hourly median | annual median | GATE-4 (≥3.5) |
|---|---|---|---|---|---|
| 15-1252 | Software Developers | **3.834** | $63.98 | $133,080 | PASS |
| 15-2051 | Data Scientists (aggregate) | **— (blank)** | $54.13 | $112,590 | **CANNOT SCORE** |
| 15-2051.02 | Clinical Data Managers (detail, if applicable) | 3.738 | $54.13 | $112,590 | PASS |
| 15-1221 | Computer & Information Research Scientists (senior ML/Research) | 4.516 | $67.74 | $140,910 | PASS |

**Verified vs. inferred.** Verified: every number above is a cell in the CSV. The `15-2051.00` aggregate row is blank for cognitive pivot — same gap as the Braintrust mode. For a *senior* deep-stack posting, the honest mapping is usually **15-1221** (Computer & Information Research Scientists — its alternate titles literally include "AI Engineer" and "Applied Scientist"), which scores **4.516** and clears comfortably.
**Wage check vs. GATE-3.** 15-1221 median $67.74/hr clears the **≥ $60/hr** gate; 15-1252 at $63.98 also clears. 15-2051's $54.13 would **fail** GATE-3 at median — a real signal that "Data Scientist" titles in this channel must pay above their SOC median to be worth BBC's involvement.
**What went well.** The senior-research mapping (15-1221) is both high cognitive-pivot and above the rate floor — exactly the fellow this channel rewards.
**What it missed / next step.** GATE-0 credibility is unverifiable from data alone — it depends on a human reading the fellow's GitHub. The mode should require the `public_work_url` to be stored (verified) in `fellow-skills-registry.json` so GATE-0 has a record to cite. **Not yet run:** live channel monitors and liveness — scripts **[TODO: DEV]**.

## Snickerdoodle
| Item | Command / Path |
|---|---|
| Discord monitor | `node scripts/latent-space/monitor-discord.js` **[TODO]** |
| Slack monitor | `node scripts/mlops/monitor-slack.js` **[TODO]** |
| Score signal | `npm run score -- <roles.json>` |
| Candidate output | `data/latent-space/candidates-[date].json` |
