// Parse-gate: validasi file .js/.jsx dengan @babel/parser (plugins jsx).
// Dipakai untuk membuktikan komponen baru benar-benar BISA DI-PARSE (bukan cuma "kelihatan benar").
// Usage: node scripts/parse-check.mjs <file...>
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/parse-check.mjs <file...>');
  process.exit(2);
}

let bad = 0;
for (const f of files) {
  try {
    parse(readFileSync(f, 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator', 'importMeta'],
      errorRecovery: false,
    });
    console.log(`OK   ${f}`);
  } catch (e) {
    bad++;
    console.log(`FAIL ${f}: ${e.message}`);
  }
}
console.log(`\n${files.length - bad}/${files.length} parse OK`);
process.exit(bad ? 1 : 0);
