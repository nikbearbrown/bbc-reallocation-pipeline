#!/usr/bin/env node
// score.js — cognitive-pivot lookup (the GATE-4 feed, stub form).
// Looks up a SOC code's cognitive_pivot_score from a bundled VERIFIED sample.
// This is a lookup over real BLS values — NOT the full Bayesian role scorer.
// A blank (null) score is reported as a gap; it is never inferred. No deps.
//
//   npm run score -- 15-1252 15-1221 [--threshold 3.5]

const fs = require('fs');
const path = require('path');

const SAMPLE = path.join(__dirname, '..', 'data', 'bbc', 'soc-cognitive-pivot-sample.json');

const ti = process.argv.indexOf('--threshold');
const THRESHOLD = ti > -1 ? Number(process.argv[ti + 1]) : 3.5;
const codes = process.argv.slice(2).filter((a) => /^\d{2}-\d{4}$/.test(a));

let data;
try {
  data = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
} catch (e) {
  console.error(`score: cannot read ${path.relative(process.cwd(), SAMPLE)} — ${e.message}`);
  process.exit(1);
}
const rows = data.rows || {};

if (!codes.length) {
  console.log('usage: npm run score -- <SOC-code> [<SOC-code> ...] [--threshold N]');
  console.log(`sample SOC codes: ${Object.keys(rows).join(', ')}`);
  process.exit(0);
}

console.log(`cognitive-pivot lookup  (threshold ${THRESHOLD}; source: ${data._provenance && data._provenance.source})`);
let anyFail = false;
for (const c of codes) {
  const r = rows[c];
  if (!r) {
    console.log(`  ${c}: NOT IN SAMPLE — add the row or run the full scorer`);
    continue;
  }
  const cps = r.cognitive_pivot_score;
  if (cps == null) {
    console.log(`  ${c}  ${r.title}: score BLANK — GATE-4 CANNOT SCORE (gap, not a fail)`);
    continue;
  }
  const verdict = cps >= THRESHOLD ? 'PASS' : 'FAIL';
  if (verdict === 'FAIL') anyFail = true;
  console.log(`  ${c}  ${r.title}: ${cps}  (median $${r.hourly_median}/hr)  -> ${verdict}`);
}
process.exit(0); // lookup is informational; gating happens in the recipe/combiner
void anyFail;
