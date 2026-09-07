import { loadCSV, compareValues } from '../csv.js';
import { createImageCell, createTextCell, updateSortHeading } from '../table.js';

const DATA_URL = new URL('./outfits.csv', import.meta.url);
const IMAGE_DIRECTORY_URL = new URL('./', import.meta.url);
const OUTFIT_IMAGE_SIZE = { width: 128, height: 128 };
const DETAIL_IMAGE_SIZE = { width: 180, height: 180 };
const BASE_STAT_FIELDS = ['Defense', 'Damage', 'Support', 'CritRate', 'CritDamage', 'Speed', 'Penetration'];
const FALLBACK_IMAGE_URL = new URL('../favicon.svg', import.meta.url);

const getElement = (id) => document.getElementById(id);

let data = {
    headers: [],
    rows: [],
};

let sortColumn = 0;
let direction = 1;
const COLUMN_LABELS = {
    ItemType: 'Type',
    ItemClass: 'Class',
    CustomSlimeSkinName: 'Custom Skin',
    CritDamage: 'Crit Damage',
    Penetration: 'Penetration',
};

function getColumnLabel(header, index) {
    if (index === 0) {
        return 'Name';
    }
    return COLUMN_LABELS[header] ?? header.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}

function formatCellValue(value) {
    if (/^-?\d+\.\d+$/.test(value)) {
        return String(Number(value));
    }
    return value || '—';
}

const detailDialog = getElement('outfit-detail');

function openOutfitDetails(row) {
    getElement('outfit-detail-name').textContent = row[0];

    const image = document.createElement('img');
    image.width = DETAIL_IMAGE_SIZE.width;
    image.height = DETAIL_IMAGE_SIZE.height;
    image.alt = '';
    image.addEventListener('error', () => {
        image.src = FALLBACK_IMAGE_URL.href;
    }, { once: true });
    image.src = new URL(`${encodeURIComponent(row[0].toLowerCase())}.png`, IMAGE_DIRECTORY_URL).href;
    getElement('outfit-detail-image').replaceChildren(image);

    const stats = document.createDocumentFragment();
    for (const field of BASE_STAT_FIELDS) {
        const index = data.headers.indexOf(field);
        if (index === -1) continue;

        const stat = document.createElement('div');
        const name = document.createElement('dt');
        name.textContent = getColumnLabel(field, index);
        const value = document.createElement('dd');
        value.textContent = formatCellValue(row[index]);
        stat.append(name, value);
        stats.append(stat);
    }
    getElement('outfit-detail-stats').replaceChildren(stats);
    detailDialog.showModal();
}

getElement('outfit-detail-close').addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('close', () => {
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLElement && getElement('outfits').contains(focusedElement)) {
        focusedElement.blur();
    }
});
detailDialog.addEventListener('click', (event) => {
    const bounds = detailDialog.getBoundingClientRect();
    if (event.target === detailDialog && (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
    )) {
        detailDialog.close();
    }
});
window.addEventListener('hashchange', () => {
    if (detailDialog.open) detailDialog.close();
});

function renderOutfits() {
    const rows = [...data.rows].sort((left, right) => {
        const comparison = direction * compareValues(left[sortColumn], right[sortColumn]);
        return comparison || compareValues(left[0], right[0]);
    });
    getElement('table-head').querySelectorAll('th[data-column]').forEach(th => {
        const index = Number(th.dataset.column);
        updateSortHeading(th, th.querySelector('.sort-icon'), index === sortColumn ? direction : 0);
    });

    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'outfit-row';
        tr.setAttribute('aria-label', `${row[0]} — open outfit details`);
        tr.setAttribute('aria-haspopup', 'dialog');
        tr.setAttribute('aria-controls', 'outfit-detail');
        tr.append(createImageCell(row[0], IMAGE_DIRECTORY_URL, OUTFIT_IMAGE_SIZE));
        tr.append(createTextCell(row[0]));
        row.slice(1).forEach(value => {
            tr.append(createTextCell(formatCellValue(value)));
        });
        tr.addEventListener('click', () => openOutfitDetails(row));
        fragment.append(tr);
    });
    getElement('table-body').replaceChildren(fragment);
    getElement('empty-state').hidden = rows.length > 0;
}

function renderOutfitHeaders() {
    const tr = document.createElement('tr');
    const imageHeader = document.createElement('th');
    imageHeader.scope = 'col';
    imageHeader.className = 'outfit-image-heading';
    imageHeader.textContent = 'Image';
    tr.append(imageHeader);
    const columnWeights = {
        ItemType: 8,
        ItemClass: 5,
        CritRate: 9,
        CritDamage: 11,
        Speed: 7,
        Penetration: 11,
        CustomSlimeSkinName: 11
    };
    const weights = data.headers.map((header, index) => index === 0 ? 14 : columnWeights[header] || 8);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    data.headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.dataset.column = index;

        const fraction = weights[index] / totalWeight;
        th.style.width = `calc(${fraction * 100}% - ${fraction * 148}px)`;

        const button = document.createElement('button');
        button.type = 'button';

        const heading = document.createElement('span');
        heading.textContent = getColumnLabel(header, index);
        button.append(heading);
        button.title = index === 0 ? 'Sort by name' : `Sort by ${header.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}`;

        const icon = document.createElement('span');
        icon.className = 'sort-icon';
        icon.setAttribute('aria-hidden', 'true');

        button.append(icon);
        button.addEventListener('click', () => {
            direction = sortColumn === index ? -direction : -1;
            sortColumn = index;
            renderOutfits();
        });
        th.append(button);
        tr.append(th);
    });
    getElement('table-head').replaceChildren(tr);
}

async function loadOutfits() {
    try {
        data = await loadCSV(DATA_URL);

        const order = [0, ...['ItemType', 'ItemClass'].map(name => data.headers.indexOf(name)).filter(index => index > 0)];
        data.headers.forEach((header, index) => {
            if (header !== 'HasCust' && !order.includes(index)) {
                order.push(index);
            }
        });

        data = {
            headers: order.map(index => data.headers[index]),
            rows: data.rows.map(row => order.map(index => row[index]))
        };

        renderOutfitHeaders();
        getElement('total-count').textContent = `${data.rows.length} outfits`;
        renderOutfits();
    } catch (error) {
        getElement('total-count').textContent = 'Unavailable';
        getElement('empty-state').hidden = false;
        getElement('empty-title').textContent = 'The collection couldn’t be loaded';
        getElement('empty-description').textContent = `${error.message} Please try again later.`;
    }
}

loadOutfits();
