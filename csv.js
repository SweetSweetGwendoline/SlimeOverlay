// Read Unreal DataTable exports directly in the browser.
export function parseCSV(source) {
  source = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  const finishField = () => { row.push(field); field = ''; closed = false; };
  const finishRow = () => {
    finishField();
    if (row.some(value => value !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += char;
    } else if (char === ',') finishField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      finishRow();
    } else if (char === '"' && field === '' && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('Invalid CSV quoting. Export the DataTable as CSV again.');
      field += char;
    }
  }
  if (quoted) throw new Error('An opening CSV quote has no closing quote.');
  if (field !== '' || row.length || closed) finishRow();
  if (!rows.length) throw new Error('The CSV is empty: a DataTable header is required.');
  const headers = rows.shift();
  if (!['---', 'name', ''].includes(headers[0].toLowerCase())) {
    throw new Error('The first column must be the Unreal row name (---, Name, or an empty header).');
  }
  if (headers.length < 2 || headers.slice(1).some(value => !value.trim())) throw new Error('DataTable field names must not be empty.');
  if (new Set(headers.map(value => value.toLowerCase())).size !== headers.length) throw new Error('Duplicate column names.');
  const names = new Set();
  rows.forEach((values, index) => {
    if (values.length !== headers.length) throw new Error(`Record ${index + 1} has ${values.length} fields; expected ${headers.length}.`);
    const key = values[0].trim().toLowerCase();
    if (!key || key === 'none') throw new Error(`Record ${index + 1} needs a valid Unreal row name.`);
    if (names.has(key)) throw new Error(`Duplicate row name: ${values[0]}.`);
    names.add(key);
  });
  return { headers, rows };
}

export function compareValues(a, b) {
  if (a.trim() && b.trim() && Number.isFinite(Number(a)) && Number.isFinite(Number(b))) return Number(a) - Number(b);
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
