#!/usr/bin/env node
// verify.js — conformance check (the machine half: P4).
// Parses every JSON file in the tree and checks that each recipe carries valid
// status frontmatter. Invalid JSON or a malformed recipe halts with exit 1 —
// it is not "done," it is not even gradeable. No external dependencies.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git']);
const STATUSES = ['DRAFT', 'SPECIFIED', 'RUNNABLE-SAMPLE', 'RUNNABLE-LIVE', 'VERIFIED'];

const failures = [];
let jsonCount = 0;
let recipeCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else checkFile(p);
  }
}

function checkFile(p) {
  const rel = path.relative(ROOT, p);
  if (p.endsWith('.json')) {
    jsonCount++;
    try {
      JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      failures.push(`invalid JSON: ${rel} — ${e.message}`);
    }
  }
  const inRecipes = rel.split(path.sep)[0] === 'recipes';
  if (inRecipes && p.endsWith('.md') && path.basename(p) !== 'README.md') {
    recipeCount++;
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/^---\s*[\s\S]*?\bstatus:\s*([A-Z-]+)/m);
    if (!m) {
      failures.push(`recipe missing status frontmatter: ${rel}`);
    } else if (!STATUSES.includes(m[1])) {
      failures.push(`recipe has invalid status "${m[1]}": ${rel}`);
    }
  }
}

walk(ROOT);
console.log(`verify: parsed ${jsonCount} JSON file(s), checked ${recipeCount} recipe(s).`);
if (failures.length) {
  console.error(`\nFAIL (${failures.length}):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('OK — conformance passed.');
