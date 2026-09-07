const FALLBACK_IMAGE_URL = new URL('./favicon.svg', import.meta.url);

/** Build a thumbnail beside a table's name column. */
export function createImageCell(name, directoryUrl, { width, height }) {
    const cell = document.createElement('td');
    cell.className = 'outfit-image-cell';

    const image = document.createElement('img');
    image.className = 'outfit-image';
    image.alt = '';
    image.width = width;
    image.height = height;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
        image.src = FALLBACK_IMAGE_URL.href;
    }, { once: true });
    image.src = new URL(`${encodeURIComponent(name.toLowerCase())}.png`, directoryUrl).href;

    cell.append(image);
    return cell;
}

export function createTextCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value;
    return cell;
}

/** Keep the visible arrow and screen-reader sort state in sync. */
export function updateSortHeading(heading, icon, direction) {
    const sortOrder = direction === 0 ? 'none' : direction === 1 ? 'ascending' : 'descending';
    heading.setAttribute('aria-sort', sortOrder);
    icon.textContent = direction === 0 ? '↕' : direction === 1 ? '↑' : '↓';
}
