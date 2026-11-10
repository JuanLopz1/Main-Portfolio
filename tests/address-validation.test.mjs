import assert from 'node:assert/strict';
import test from 'node:test';
import { columns, makeReport, makeValidator, maxRows, readCsv, sampleCsv, statuses } from '../public/scripts/address-validation.mjs';

const header = columns.join(',');

test('synthetic sample includes every advertised classification', () => {
  const rows = readCsv(sampleCsv());
  assert.equal(rows.length, 96);
  const results = rows.map(makeValidator());
  assert.deepEqual(new Set(results.map(row => row.status)), new Set(statuses));
  assert.equal(results[3].status, 'Duplicate');
  assert.equal(results[4].status, 'Invalid format');
});

test('accepts BOM, quoted delimiters, escaped quotes and multiline fields', () => {
  assert.deepEqual(readCsv(`\uFEFF${header}\r\nS1,"Example, ""Unit 2""\nAnnex",Sample City,NORTH,DEMO-001\r\n`), [
    ['S1', 'Example, "Unit 2"\nAnnex', 'Sample City', 'NORTH', 'DEMO-001'],
  ]);
});

test('rejects malformed headers, empty datasets, bad quoting and oversized row sets', () => {
  assert.throws(() => readCsv('street,city\nExample,Sample'), /header/);
  assert.throws(() => readCsv(`${header}\n\n`), /no records/);
  assert.throws(() => readCsv(`${header}\nS1,"Example`), /closing quote/);
  assert.throws(() => readCsv(`${header}\nS1,"Example"oops`), /quoting/);
  assert.throws(() => readCsv(`${header}\n${'S1,Example,Sample,NORTH,DEMO-001\n'.repeat(maxRows + 1)}`), /accepts up to/);
});

test('classifies inconsistent columns and guards spreadsheet formulas in reports', () => {
  const records = readCsv(`${header}\nS1,Example,Sample,NORTH,DEMO-001,extra\n=SUM(1),Second,Sample,NORTH,DEMO-002`);
  const results = records.map(makeValidator());
  assert.equal(results[0].status, 'Invalid format');
  assert.equal(results[1].status, 'Ready');
  assert.match(makeReport(results), /"'=SUM\(1\)"/);
});
