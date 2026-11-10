export const columns = ['record_id', 'street', 'locality', 'region', 'postal_code'];
export const statuses = ['Ready', 'Missing fields', 'Duplicate', 'Invalid format'];
export const reviewStatuses = [...statuses, 'Needs Review', 'Special Case'];
export const maxRows = 5000;
export const maxBytes = 1024 * 1024;
const regions = new Set(['NORTH', 'SOUTH', 'WEST']);
const provinces = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']);
const canadianPostal = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ][ -]?\d[ABCEGHJ-NPRSTVWXYZ]\d$/i;

function hasSupportedPostal(region, postal) {
  const code = region.toUpperCase();
  if (regions.has(code)) return /^DEMO-\d{3}$/i.test(postal);
  if (provinces.has(code)) return canadianPostal.test(postal);
  return /^[A-Z]{2,3}$/.test(code) && /^[A-Z\d][A-Z\d -]{2,11}$/i.test(postal);
}

export function readCsv(text) {
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closed = false;

  function finishField() {
    row.push(field.trim());
    field = '';
    closed = false;
  }

  function finishRow() {
    finishField();
    if (row.length > 1 || row[0]) records.push(row);
    row = [];
    if (records.length > maxRows + 1) throw new Error(`The demo accepts up to ${maxRows.toLocaleString('en-CA')} records.`);
  }

  const csv = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character !== '"') field += character;
      else if (csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = false;
        closed = true;
      }
    } else if (character === ',') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      finishRow();
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
    } else if (character === '"' && !field && !closed) {
      quoted = true;
    } else if (closed || character === '"') {
      throw new Error('Check the CSV quoting. Wrap fields with commas or line breaks in double quotes.');
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('A quoted field is missing its closing quote.');
  if (row.length || field || closed) finishRow();

  const header = records.shift();
  if (!header || header.length !== columns.length || header.some((value, index) => value !== columns[index])) {
    throw new Error(`Use the sample’s header: ${columns.join(', ')}.`);
  }
  if (!records.length) throw new Error('The CSV has a header but no records.');
  return records;
}

export function makeValidator() {
  const addresses = new Set();
  const ids = new Set();

  return function validate(fields, index) {
    const row = { number: index + 1, fields: columns.map((_, position) => fields[position] ?? '') };
    function result(status, detail) { return { ...row, status, detail }; }

    if (fields.length !== columns.length) return result('Invalid format', 'Expected five columns');
    const missing = columns.filter((_, position) => !fields[position]);
    if (missing.length) return result('Missing fields', `Missing ${missing.join(', ')}`);

    const [id, street, locality, region, postalCode] = fields;
    if (fields.some(value => value.length > 512)) {
      return result('Invalid format', 'Fields are limited to 512 characters');
    }
    if (!hasSupportedPostal(region, postalCode)) {
      return result('Invalid format', 'Postal code does not match the supplied region');
    }

    const normalizedId = id.toLowerCase();
    const address = JSON.stringify([street, locality, region, postalCode].map(value => value.toLowerCase().replace(/\s+/g, ' ')));
    if (ids.has(normalizedId) || addresses.has(address)) return result('Duplicate', 'Record ID or address already appeared');
    ids.add(normalizedId);
    addresses.add(address);
    return result('Ready', 'Passed the local checks');
  };
}

function csvCell(value) {
  const text = String(value);
  const guarded = /^[\s\uFEFF]*[=+@\-\t\r\n]/u.test(text) ? `'${text}` : text;
  return `"${guarded.replaceAll('"', '""')}"`;
}

export function makeReport(results) {
  const lines = [['row_number', ...columns, 'normalized_street', 'address_kind', 'address_region', 'status', 'detail']];
  for (const { number, fields, review, status, detail } of results) {
    lines.push([number, ...fields, review?.normalized ?? '', review?.kind ?? '', review?.region ?? '', status, detail]);
  }
  return lines.map(line => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function sampleCsv() {
  const lines = [columns];
  for (let number = 1; number <= 96; number += 1) {
    const duplicate = number % 13 === 4;
    const addressNumber = duplicate ? number - 1 : number;
    const examples = { 6: 'PO Box 70 STN Demo', 7: '42 Example Road RR 3', 8: '5-100 Example Avenue', 9: 'Example Avenue' };
    lines.push([
      `S-${String(number).padStart(3, '0')}`, examples[addressNumber] ?? `${addressNumber} Example Avenue`,
      number % 11 === 2 ? '' : 'Sample City', 'NORTH',
      number % 17 === 5 ? 'DEMO-XX' : `DEMO-${String(addressNumber).padStart(3, '0')}`,
    ]);
  }
  return lines.map(line => line.join(',')).join('\r\n') + '\r\n';
}
