#!/usr/bin/env node
// doctor.js — privacy enforcement (the machine half of the data-privacy rule).
// Fails if any private path is git-tracked. Scaffolding is exempt: a README and
// any *.example.* file are documentation, not data. No external dependencies.

const { execSync } = require('child_process');

let tracked;
try {
  tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
} catch (e) {
  console.log('doctor: not a git repo (or git unavailable) — skipping tracked-file check.');
  process.exit(0);
}

const isPrivate = (f) =>
  f.startsWith('private/') ||
  f === '.env' ||
  f.endsWith('.local') ||
  f === 'data/bbc/client-quality-scores.json';

const isExempt = (f) =>
  f.endsWith('/README.md') || f.includes('.example.');

const violations = tracked.filter((f) => isPrivate(f) && !isExempt(f));

console.log(`doctor: scanned ${tracked.length} tracked file(s).`);
if (violations.length) {
  console.error(`\nFAIL — private data is git-tracked (${violations.length}):`);
  for (const v of violations) console.error('  - ' + v);
  console.error('\nUntrack with:  git rm --cached <path>   then confirm it matches .gitignore');
  process.exit(1);
}
console.log('OK — no private data tracked.');
