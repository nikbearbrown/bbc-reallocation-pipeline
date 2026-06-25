#!/usr/bin/env node
// generate-brief.js — the combiner (stub). Aggregates per-platform candidate
// files, applies the interrupt threshold, and writes BBC_DAILY_BRIEF as JSON
// (agent log, fellow names redacted) + markdown (what Cowork reads). With no
// candidate files present it still runs and writes an honest "0 evaluated"
// brief — so the noise summary always proves the system ran. No dependencies.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'data');
const OUTDIR = path.join(DATA, 'bbc');
const date = new Date().toISOString().slice(0, 10);

const channels = ['braintrust', 'ai-tinkerers', 'latent-space', 'yc-networks', 'eval-supplier', 'upwork'];

let candidates = [];
for (const ch of channels) {
  const dir = path.join(DATA, ch);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!/^candidates-.*\.json$/.test(f)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const arr = Array.isArray(raw) ? raw : (raw.candidates || []);
      arr.forEach((c) => candidates.push({ ...c, channel: ch }));
    } catch (e) {
      console.error(`skip unreadable ${ch}/${f}: ${e.message}`);
    }
  }
}

// Interrupt threshold — ALL must clear (SNICKERDOODLE.md).
const clears = (c) =>
  Number(c.bbc_net_hourly) >= 15 &&
  c.fellow_match_unambiguous === true &&
  !!c.scope &&
  Number(c.hire_intent_count) >= 1 &&
  c.nik_action === 'approval-only';

const evaluated = candidates.length;
const surfaced = candidates.filter(clears);
const filtered = evaluated - surfaced.length;

const redact = (c) => {
  const { fellow_name, ...rest } = c;
  return rest;
};

fs.mkdirSync(OUTDIR, { recursive: true });

const jsonOut = {
  date,
  evaluated,
  filtered,
  surfaced: surfaced.map(redact),
  strong_signals: [],
  generated_at: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUTDIR, `daily-brief-${date}.json`), JSON.stringify(jsonOut, null, 2));

let md = `# BBC_DAILY_BRIEF — ${date}\n`;
md += `**${evaluated} evaluated, ${filtered} filtered.** ${surfaced.length} cleared the interrupt threshold.\n\n`;
if (!surfaced.length) {
  md += `_Nothing cleared today. The system is running; ${evaluated} opportunit${evaluated === 1 ? 'y' : 'ies'} evaluated._\n`;
} else {
  surfaced.forEach((c, i) => {
    const tag = c.fellow_sourced ? `[fellow-sourced: ${c.submitting_fellow_id || '?'}] ` : '';
    md += `${i + 1}. ${tag}${c.channel} — ${c.role || 'role'} (SOC ${c.soc_code || '?'}). `;
    md += `BBC net ~$${c.bbc_net_hourly}/hr; fellow ${c.fellow_name || '(redacted)'}; `;
    md += `${c.hire_intent_count} hire-intent signal(s). Scope: ${c.scope}. `;
    md += `-> say "tell me more" or "pass"\n`;
  });
}
fs.writeFileSync(path.join(OUTDIR, `daily-brief-${date}.md`), md);

console.log(`brief: ${evaluated} evaluated, ${filtered} filtered, ${surfaced.length} surfaced.`);
console.log(`wrote data/bbc/daily-brief-${date}.json and data/bbc/daily-brief-${date}.md`);
