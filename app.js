import { parseCSV, compareValues } from './csv.js';

const $ = id => document.getElementById(id);
const sections = {
  outfits: 'Outfits',
  achievements: 'Achievements',
  commands: 'Commands',
};
function navigate() {
  const section = Object.hasOwn(sections, location.hash.slice(1)) ? location.hash.slice(1) : 'outfits';
  const title = sections[section];
  document.title = `${title} · Slime Overlay Wiki`;
  $('crumb').textContent = $('page-title').textContent = title;
  $('outfits').hidden = section !== 'outfits';
  $('placeholder').hidden = section === 'outfits';
  $('placeholder-description').textContent = section === 'achievements'
    ? 'Achievement details will live here once they’re available. Check back for goals and unlock requirements.'
    : 'The command reference is on its way. Check back for chat commands and how to use them.';
  document.querySelectorAll('[data-section]').forEach(link => {
    if (link.dataset.section === section) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', navigate);
navigate();

let data = { headers: [], rows: [] }, sortColumn = 0, direction = 1;
const shortLabels = { ItemType: 'Type', ItemClass: 'Class', HasCust: 'Custom skin?', CustomSlimeSkinName: 'Skin name', CritDamage: 'Crit dmg', Penetration: 'Pen.' };
const label = (header, index) => index === 0 ? 'Outfit' : shortLabels[header] || header.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
const displayValue = value => /^-?\d+\.\d+$/.test(value) ? String(Number(value)) : value || '—';
function render() {
  const rows = [...data.rows].sort((a, b) => direction * compareValues(a[sortColumn], b[sortColumn]) || compareValues(a[0], b[0]));
  $('table-head').querySelectorAll('th').forEach((th, index) => {
    th.setAttribute('aria-sort', index === sortColumn ? direction === 1 ? 'ascending' : 'descending' : 'none');
    th.querySelector('.sort-icon').textContent = index === sortColumn ? direction === 1 ? '↑' : '↓' : '↕';
  });
  const fragment = document.createDocumentFragment();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(value => { const td = document.createElement('td'); td.textContent = displayValue(value); tr.append(td); });
    fragment.append(tr);
  });
  $('table-body').replaceChildren(fragment);
  $('empty-state').hidden = rows.length > 0;
}
async function load() {
  try {
    const response = await fetch('./outfits/outfits.csv', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load the collection (HTTP ${response.status}).`);
    data = parseCSV(await response.text());
    // Put the main categories beside the name; preserve all exported fields.
    const order = [0, ...['ItemType', 'ItemClass'].map(name => data.headers.indexOf(name)).filter(index => index > 0)];
    data.headers.forEach((_, index) => { if (!order.includes(index)) order.push(index); });
    data = { headers: order.map(index => data.headers[index]), rows: data.rows.map(row => order.map(index => row[index])) };
    const tr = document.createElement('tr');
    data.headers.forEach((header, index) => {
      const th = document.createElement('th'); th.scope = 'col';
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label(header, index);
      button.title = index === 0 ? 'Sort by outfit' : `Sort by ${header.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}`;
      const icon = document.createElement('span'); icon.className = 'sort-icon'; icon.setAttribute('aria-hidden', 'true'); button.append(icon);
      button.addEventListener('click', () => { direction = sortColumn === index ? -direction : 1; sortColumn = index; render(); });
      th.append(button); tr.append(th);
    });
    $('table-head').replaceChildren(tr);
    $('total-count').textContent = `${data.rows.length} outfits`;
    render();
  } catch (error) {
    $('total-count').textContent = 'Unavailable';
    $('empty-state').hidden = false;
    $('empty-title').textContent = 'The collection couldn’t be loaded';
    $('empty-description').textContent = `${error.message} Please try again later.`;
  }
}
load();
