import { parseCSV, compareValues } from './csv.js';

const $ = id => document.getElementById(id);
const sections = {
  outfits: 'Outfits',
  cards: 'Cards',
  achievements: 'Achievements',
  commands: 'Commands',
};
function navigate() {
  const section = Object.hasOwn(sections, location.hash.slice(1)) ? location.hash.slice(1) : 'outfits';
  const title = sections[section] || '';
  document.title = title ? `${title} · Slime Overlay Wiki` : 'Slime Overlay Wiki';
  $('breadcrumb').hidden = !section;
  $('section-intro').hidden = !section;
  $('crumb').textContent = $('page-title').textContent = title;
  $('outfits').hidden = section !== 'outfits';
  const descriptions = {
    cards: 'Card details will live here once they’re available.',
    achievements: 'Achievement details will live here once they’re available.',
    commands: 'The command reference is on its way.',
  };
  $('placeholder').hidden = !Object.hasOwn(descriptions, section);
  $('placeholder-description').textContent = descriptions[section] || '';
  document.querySelectorAll('[data-section]').forEach(link => {
    if (link.dataset.section === section) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('hashchange', navigate);
navigate();

let data = { headers: [], rows: [] }, sortColumn = 0, direction = 1;
const shortLabels = { ItemType: 'Type', ItemClass: 'Class', CustomSlimeSkinName: 'Custom Skin', CritDamage: 'Crit Damage', Penetration: 'Penetration' };
const label = (header, index) => index === 0 ? 'Name' : shortLabels[header] || header.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
const displayValue = value => /^-?\d+\.\d+$/.test(value) ? String(Number(value)) : value || '—';
function render() {
  const rows = [...data.rows].sort((a, b) => direction * compareValues(a[sortColumn], b[sortColumn]) || compareValues(a[0], b[0]));
  $('table-head').querySelectorAll('th[data-column]').forEach(th => {
    const index = Number(th.dataset.column);
    th.setAttribute('aria-sort', index === sortColumn ? direction === 1 ? 'ascending' : 'descending' : 'none');
    th.querySelector('.sort-icon').textContent = index === sortColumn ? direction === 1 ? '↑' : '↓' : '↕';
  });
  const fragment = document.createDocumentFragment();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    const imageCell = document.createElement('td');
    imageCell.className = 'outfit-image-cell';
    const image = document.createElement('img');
    image.className = 'outfit-image';
    image.alt = '';
    image.width = 128;
    image.height = 128;
    image.loading = 'lazy';
    image.addEventListener('error', () => { image.src = './favicon.svg'; }, { once: true });
    image.src = `./outfits/${encodeURIComponent(row[0].toLowerCase())}.png`;
    imageCell.append(image);
    tr.append(imageCell);
    row.forEach(value => {
      const td = document.createElement('td');
      td.textContent = displayValue(value);
      tr.append(td);
    });
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
    // Put the main categories beside the name; the skin name replaces the custom flag in the UI.
    const order = [0, ...['ItemType', 'ItemClass'].map(name => data.headers.indexOf(name)).filter(index => index > 0)];
    data.headers.forEach((header, index) => { if (header !== 'HasCust' && !order.includes(index)) order.push(index); });
    data = { headers: order.map(index => data.headers[index]), rows: data.rows.map(row => order.map(index => row[index])) };
    const tr = document.createElement('tr');
    const imageHeader = document.createElement('th');
    imageHeader.scope = 'col';
    imageHeader.className = 'outfit-image-heading';
    imageHeader.textContent = 'Image';
    tr.append(imageHeader);
    const columnWeights = { ItemType: 8, ItemClass: 5, CritRate: 9, CritDamage: 11, Speed: 7, Penetration: 11, CustomSlimeSkinName: 11 };
    const weights = data.headers.map((header, index) => index === 0 ? 14 : columnWeights[header] || 8);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    data.headers.forEach((header, index) => {
      const th = document.createElement('th'); th.scope = 'col';
      th.dataset.column = index;
      const fraction = weights[index] / totalWeight;
      th.style.width = `calc(${fraction * 100}% - ${fraction * 148}px)`;
      const button = document.createElement('button'); button.type = 'button';
      const heading = document.createElement('span'); heading.textContent = label(header, index); button.append(heading);
      button.title = index === 0 ? 'Sort by name' : `Sort by ${header.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}`;
      const icon = document.createElement('span'); icon.className = 'sort-icon'; icon.setAttribute('aria-hidden', 'true'); button.append(icon);
      button.addEventListener('click', () => { direction = sortColumn === index ? -direction : -1; sortColumn = index; render(); });
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
