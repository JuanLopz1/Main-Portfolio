import { loadPyodide } from '/assets/pyodide/pyodide.mjs';

let engine;

async function loadEngine() {
  const [python, response] = await Promise.all([
    loadPyodide({ indexURL: new URL('/assets/pyodide/', self.location.href).href }),
    fetch(new URL('./amt-rules.py', self.location.href)),
  ]);
  if (!response.ok) throw new Error('Address rules could not be loaded.');
  python.runPython(await response.text());
  return python;
}

self.onmessage = async ({ data: rows }) => {
  try {
    engine ??= loadEngine();
    const python = await engine;
    python.globals.set('amt_input_json', JSON.stringify(rows));
    try {
      self.postMessage({ reviews: JSON.parse(python.runPython('review_batch(amt_input_json)')) });
    } finally {
      python.globals.delete('amt_input_json');
    }
  } catch {
    self.postMessage({ error: 'The local address rules could not finish. Try running the validation again.' });
  }
};
