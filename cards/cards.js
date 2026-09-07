import { loadCSV, compareValues } from '../csv.js';
import { createImageCell, createTextCell, updateSortHeading } from '../table.js';

const DATA_URL = new URL('./cards.csv', import.meta.url);
const IMAGE_DIRECTORY_URL = new URL('./', import.meta.url);
const CARD_IMAGE_SIZE = { width: 128, height: 179 };

const getElement = (id) => document.getElementById(id);
let names = [];
let direction = 1;

function renderCards() {
    const fragment = document.createDocumentFragment();
    [...names].sort((a, b) => direction * compareValues(a, b)).forEach(name => {
        const row = document.createElement('tr');
        row.append(createImageCell(name, IMAGE_DIRECTORY_URL, CARD_IMAGE_SIZE), createTextCell(name));
        fragment.append(row);
    });
    getElement('cards-body').replaceChildren(fragment);
    updateSortHeading(getElement('cards-name-heading'), getElement('cards-sort-icon'), direction);
    getElement('cards-empty').hidden = names.length > 0;
    getElement('cards-empty').textContent = 'No cards have been added yet.';
    getElement('cards-count').textContent = `${names.length} cards`;
}

getElement('cards-sort').addEventListener('click', () => {
    direction *= -1;
    renderCards();
});

async function loadCards() {
    try {
        // Temporary name-only list until the real card DataTable export is available.
        const data = await loadCSV(DATA_URL, { allowNameOnly: true });
        names = data.rows.map(row => row[0]);
        renderCards();
        getElement('cards-sort').disabled = false;
    } catch (error) {
        getElement('cards-count').textContent = 'Unavailable';
        getElement('cards-empty').hidden = false;
        getElement('cards-empty').textContent = `The cards couldn’t be loaded. ${error.message}`;
    }
}

loadCards();
