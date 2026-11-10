import { makeReport, makeValidator, maxBytes, readCsv, sampleCsv, statuses } from './address-validation.mjs';

const $ = id => document.getElementById(id);
const sampleButton = $('load-sample');
const fileButton = $('choose-file');
const fileInput = $('csv-file');
const runButton = $('run-validation');
const resetButton = $('reset-demo');
const reportButton = $('download-report');
const filter = $('result-filter');
const progress = $('demo-progress');
const alert = $('demo-error');
const status = $('demo-status');
const rows = $('result-rows');
const resultsPanel = $('results-panel');
const inputSummary = $('input-summary');
const progressLabel = $('progress-label');
const resultCount = $('result-count');
const counters = [...document.querySelectorAll('[data-result-status]')];
const number = new Intl.NumberFormat('en-CA');
let input = [];
let results = [];

function syncControls(busy = false) {
  sampleButton.disabled = busy;
  fileButton.disabled = busy;
  runButton.disabled = busy || !input.length;
  resetButton.disabled = busy || !input.length;
  reportButton.disabled = busy || !results.length;
  filter.disabled = busy || !results.length;
  resultsPanel.setAttribute('aria-busy', String(busy));
}

function renderResults() {
  const matches = results.filter(row => !filter.value || row.status === filter.value);
  const fragment = document.createDocumentFragment();
  for (const { number: rowNumber, fields, status: rowStatus, detail } of matches.slice(0, 8)) {
    const tr = document.createElement('tr');
    for (const text of [fields[0] || `Row ${rowNumber}`, fields[1] || '—', rowStatus, detail]) {
      const cell = document.createElement('td');
      cell.textContent = text;
      if (text === rowStatus) cell.className = `result-kind result-${statuses.indexOf(rowStatus)}`;
      tr.append(cell);
    }
    fragment.append(tr);
  }
  rows.replaceChildren(fragment);
  if (!matches.length) {
    const cell = rows.insertRow().insertCell();
    cell.colSpan = 4;
    cell.textContent = results.length ? 'No records match this status.' : 'Results will appear here after validation.';
  }
  resultCount.textContent = results.length ? `Showing ${number.format(Math.min(matches.length, 8))} of ${number.format(matches.length)} matching records` : 'Preview';
}

function clearResults() {
  results = [];
  progress.value = 0;
  progress.max = 1;
  filter.value = '';
  progressLabel.textContent = '0% complete';
  for (const counter of counters) counter.textContent = '0';
  renderResults();
}

function stage(text, name) {
  const records = readCsv(text);
  input = records;
  clearResults();
  inputSummary.textContent = `${name} · ${number.format(records.length)} records`;
  status.textContent = 'CSV loaded. Run validation to classify the records.';
  syncControls();
}

function showError(message) {
  alert.textContent = message;
  alert.hidden = !message;
}

function reset() {
  input = [];
  clearResults();
  inputSummary.textContent = 'No CSV loaded';
  status.textContent = 'Load the sample or choose a synthetic CSV to get started.';
  showError('');
  syncControls();
}

sampleButton.addEventListener('click', () => {
  showError('');
  stage(sampleCsv(), 'Synthetic sample');
});

fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const [file] = fileInput.files;
  fileInput.value = '';
  if (!file) return;
  reset();
  syncControls(true);
  try {
    if (!/\.csv$/i.test(file.name)) throw new Error('Choose a .csv file.');
    if (file.size > maxBytes) throw new Error('Choose a CSV smaller than 1 MB.');
    stage(await file.text(), file.name);
  } catch (error) {
    showError(error.message);
  } finally {
    syncControls();
  }
});

runButton.addEventListener('click', async () => {
  clearResults();
  showError('');
  syncControls(true);
  status.textContent = 'Checking fields, formats and duplicates…';
  progress.max = input.length;
  const validate = makeValidator();
  const counts = Object.fromEntries(statuses.map(label => [label, 0]));
  const batchSize = Math.max(12, Math.ceil(input.length / 12));

  for (let index = 0; index < input.length; index += batchSize) {
    await new Promise(resolve => setTimeout(resolve, 24));
    const end = Math.min(index + batchSize, input.length);
    for (let offset = index; offset < end; offset += 1) {
      const row = validate(input[offset], offset);
      counts[row.status] += 1;
      results.push(row);
    }
    progress.value = end;
    progressLabel.textContent = `${Math.round(end / input.length * 100)}% complete`;
  }

  for (const counter of counters) counter.textContent = number.format(counts[counter.dataset.resultStatus]);
  renderResults();
  syncControls();
  status.textContent = `Validation complete. ${number.format(results.length)} records checked. The full report is ready to download.`;
});

filter.addEventListener('change', renderResults);
resetButton.addEventListener('click', () => {
  reset();
  sampleButton.focus();
});
reportButton.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([makeReport(results)], { type: 'text/csv;charset=utf-8' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'address-validation-report.csv';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
});
