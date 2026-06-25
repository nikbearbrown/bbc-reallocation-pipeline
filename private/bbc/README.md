# private/bbc/ — fellow data lives here and is NEVER committed

This directory holds real fellow data: verified skill stacks, active engagements, hire-intent and conversion tracking, and submission history. **None of it is committed.** The repo's `.gitignore` ignores everything under `private/` except this README and the `*.example.json` files, which exist only to document the expected shape.

`npm run doctor` fails the build if any real (non-example) private file is ever git-tracked.

## Files this directory expects

| Real file (gitignored) | Example (committed) | Purpose |
|---|---|---|
| `fellow-skills-registry.json` | `fellow-skills-registry.example.json` | Verified stacks, public-work links, weekly hours, trajectory, domain credentials. |
| `active-engagements.json` | `active-engagements.example.json` | Current contracts and committed hours — drives the 20 hr/week cap and conflict checks. |
| `hire-intent-log.json` | `hire-intent-log.example.json` | Companies showing conversion signals; 90-day follow-up flags for the paid-interview loop. |
| `fellow-submission-log.json` | `fellow-submission-log.example.json` | Fellow-sourced submissions and outcomes; powers first-right-of-refusal. |

## Rules
- Use `fellow_id` (e.g. `F-001`), never real names, in anything that could be logged or echoed.
- Never copy or paraphrase private data into a tracked file (a recipe, a committed report, a log).
- Artifacts generated *from* private data are written back here, not into the public tree.
- The public, personal-data-free summary fellows read is `data/bbc/FELLOW_BRIEF.md`.

To start locally: copy an example to its real name and fill it in —
`cp fellow-skills-registry.example.json fellow-skills-registry.json`
